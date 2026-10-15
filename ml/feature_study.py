import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold, TimeSeriesSplit, cross_val_predict

warnings.filterwarnings("ignore")

ML_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = ML_DIR / "processed"
RESULTS_DIR = ML_DIR / "results"
RANDOM_STATE = 42

N_DRIFT_DROP = 30     # how many "time-revealing" features to drop
N_KEEP_TOP = 50       # how many top features to keep in the "top" variants

pd.set_option("display.width", 200)
pd.set_option("display.max_columns", 20)


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def small_forest(**kwargs):
    """A quicker Random Forest used for choosing features."""
    return RandomForestClassifier(
        n_estimators=200, min_samples_leaf=3,
        random_state=RANDOM_STATE, n_jobs=-1, **kwargs)


# ----------------------------------------------------------------------
# Load training data only
# ----------------------------------------------------------------------
section("LOADING TRAINING DATA (test set is NOT loaded)")
X = pd.read_csv(PROCESSED_DIR / "X_train.csv")
y_df = pd.read_csv(PROCESSED_DIR / "y_train.csv")
y = (y_df["label"] == 1).astype(int).to_numpy()
print(f"X_train: {X.shape} | +1 rows: {y.sum()} ({y.mean() * 100:.2f}%)")

# ----------------------------------------------------------------------
# 1. Adversarial check: can a model tell OLD rows from NEWER rows?
# ----------------------------------------------------------------------
section("1. CAN A MODEL TELL EARLY ROWS FROM LATE ROWS? (drift check)")
# Label the first half of the rows 0 ("early") and the second half 1 ("late").
# This ignores the real labels completely. If a model can easily separate
# early from late, then many features change over time.
half = len(X) // 2
is_late = np.r_[np.zeros(half), np.ones(len(X) - half)].astype(int)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
adv_proba = cross_val_predict(small_forest(), X, is_late, cv=skf,
                              method="predict_proba")[:, 1]
adv_auc = roc_auc_score(is_late, adv_proba)
print(f"Early-vs-late separation score (ROC-AUC): {adv_auc:.3f}")
print("  0.50 = cannot tell them apart (no drift)")
print("  0.70 = some drift | 0.90+ = very strong drift")

adv_model = small_forest().fit(X, is_late)
adv_imp = pd.Series(adv_model.feature_importances_, index=X.columns)
print("\nTop 15 features that reveal the time period:")
print(adv_imp.sort_values(ascending=False).head(15).round(4).to_string())
print("\n(We do NOT know what these features measure - we only see that")
print(" their behaviour differs between early and late rows.)")

# ----------------------------------------------------------------------
# 2. Feature-set variants, checked with time-ordered CV
# ----------------------------------------------------------------------
def drifting_columns(X_tr, n_drop):
    """Columns that best reveal early-vs-late WITHIN the given rows."""
    h = len(X_tr) // 2
    late = np.r_[np.zeros(h), np.ones(len(X_tr) - h)].astype(int)
    rf = small_forest().fit(X_tr, late)
    imp = pd.Series(rf.feature_importances_, index=X_tr.columns)
    return list(imp.sort_values(ascending=False).index[:n_drop])


def top_columns(X_tr, y_tr, k):
    """Columns the forest finds most useful for the +1 / -1 label."""
    rf = small_forest(class_weight="balanced_subsample").fit(X_tr, y_tr)
    imp = pd.Series(rf.feature_importances_, index=X_tr.columns)
    return list(imp.sort_values(ascending=False).index[:k])


def variant_all(X_tr, y_tr):
    return list(X_tr.columns), None


def variant_recency(X_tr, y_tr):
    # Newer training rows count up to 5x more than the oldest rows.
    return list(X_tr.columns), np.linspace(0.2, 1.0, len(X_tr))


def variant_drop_drift(X_tr, y_tr):
    drift = set(drifting_columns(X_tr, N_DRIFT_DROP))
    return [c for c in X_tr.columns if c not in drift], None


def variant_top(X_tr, y_tr):
    return top_columns(X_tr, y_tr, N_KEEP_TOP), None


def variant_drop_drift_then_top(X_tr, y_tr):
    drift = set(drifting_columns(X_tr, N_DRIFT_DROP))
    keep = [c for c in X_tr.columns if c not in drift]
    return top_columns(X_tr[keep], y_tr, N_KEEP_TOP), None


variants = {
    "all features": variant_all,
    "all + recent rows weighted more": variant_recency,
    f"drop {N_DRIFT_DROP} time-revealing": variant_drop_drift,
    f"top {N_KEEP_TOP} useful": variant_top,
    f"drop drift, then top {N_KEEP_TOP}": variant_drop_drift_then_top,
}

models = {
    "LogisticRegression": lambda: LogisticRegression(
        C=0.1, class_weight="balanced", max_iter=2000,
        random_state=RANDOM_STATE),
    "RandomForest": lambda: RandomForestClassifier(
        n_estimators=300, min_samples_leaf=3,
        class_weight="balanced_subsample",
        random_state=RANDOM_STATE, n_jobs=-1),
}

section("2. FEATURE-SET COMPARISON (time-ordered CV, 5 folds)")
print("(this can take several minutes)")

tscv = TimeSeriesSplit(n_splits=5)
rows = []
val_prevalences = []

for vname, vfunc in variants.items():
    for fold, (tr, va) in enumerate(tscv.split(X), start=1):
        X_tr, y_tr = X.iloc[tr], y[tr]
        X_va, y_va = X.iloc[va], y[va]
        if vname == "all features":
            val_prevalences.append(y_va.mean())
        if y_va.sum() == 0 or len(np.unique(y_tr)) < 2:
            continue

        cols, weights = vfunc(X_tr, y_tr)     # decided from TRAIN rows only

        for mname, factory in models.items():
            m = factory()
            if weights is None:
                m.fit(X_tr[cols], y_tr)
            else:
                m.fit(X_tr[cols], y_tr, sample_weight=weights)
            proba = m.predict_proba(X_va[cols])[:, 1]
            rows.append({
                "variant": vname, "model": mname, "fold": fold,
                "n_features": len(cols),
                "roc_auc": roc_auc_score(y_va, proba),
                "pr_auc": average_precision_score(y_va, proba),
            })
    print(f"  done: {vname}")

res = pd.DataFrame(rows)

# ----------------------------------------------------------------------
# 3. Summary
# ----------------------------------------------------------------------
section("3. SUMMARY (mean +/- std over folds)")
summary_rows = []
for (vname, mname), g in res.groupby(["variant", "model"], sort=False):
    summary_rows.append({
        "variant": vname,
        "model": mname,
        "features": int(g["n_features"].iloc[0]),
        "roc_auc": f"{g['roc_auc'].mean():.3f} +/- {g['roc_auc'].std():.3f}",
        "pr_auc": f"{g['pr_auc'].mean():.3f} +/- {g['pr_auc'].std():.3f}",
    })
print(pd.DataFrame(summary_rows).to_string(index=False))

noskill_pr = float(np.mean(val_prevalences))
print(f"\nNo-skill reference for these folds: roc_auc = 0.500, "
      f"pr_auc = {noskill_pr:.3f}")

RESULTS_DIR.mkdir(exist_ok=True)
res.to_csv(RESULTS_DIR / "feature_study_results.csv", index=False)
print(f"\nSaved: {RESULTS_DIR / 'feature_study_results.csv'}")

section("HOW TO READ THIS")
print("Compare every row with 'all features' for the SAME model.")
print("With only 5 folds and few +1 rows, a gain smaller than the +/- value")
print("is NOT reliable evidence. Look for large, consistent improvements.")
print("\nThe test set was NOT used. No model was saved.")
