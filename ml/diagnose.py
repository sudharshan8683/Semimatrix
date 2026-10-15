import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import (
    RepeatedStratifiedKFold,
    TimeSeriesSplit,
    cross_validate,
)

warnings.filterwarnings("ignore")   # keep the terminal output readable

ML_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = ML_DIR / "processed"
RESULTS_DIR = ML_DIR / "results"
RANDOM_STATE = 42
CLIP_VALUE = 5.0     # fixed cap: values beyond +/-5 (scaled units) get capped

pd.set_option("display.width", 200)
pd.set_option("display.max_columns", 20)


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


# ----------------------------------------------------------------------
# Load training data only
# ----------------------------------------------------------------------
section("LOADING TRAINING DATA (test set is NOT loaded)")
X = pd.read_csv(PROCESSED_DIR / "X_train.csv")
y_df = pd.read_csv(PROCESSED_DIR / "y_train.csv")
y_df["timestamp"] = pd.to_datetime(y_df["timestamp"])
y = (y_df["label"] == 1).astype(int).to_numpy()
prevalence = y.mean()
print(f"X_train: {X.shape} | +1 rows: {y.sum()} ({prevalence * 100:.2f}%)")

# ----------------------------------------------------------------------
# 1. Drift: share of +1 rows over time
# ----------------------------------------------------------------------
section("1. SHARE OF +1 ROWS OVER TIME (training set, 6 time chunks)")
chunks = np.array_split(np.arange(len(y)), 6)
rows = []
for i, idx in enumerate(chunks, start=1):
    rows.append({
        "chunk": i,
        "from": y_df["timestamp"].iloc[idx[0]].date(),
        "to": y_df["timestamp"].iloc[idx[-1]].date(),
        "rows": len(idx),
        "positives": int(y[idx].sum()),
        "rate_%": round(y[idx].mean() * 100, 1),
    })
print(pd.DataFrame(rows).to_string(index=False))
print("\nIf the rate jumps around a lot, the process or labelling changes")
print("over time, which makes a fixed model harder to keep accurate.")

# ----------------------------------------------------------------------
# Helper to score a model under a cross-validation scheme
# ----------------------------------------------------------------------
def make_models():
    return {
        "LogisticRegression": LogisticRegression(
            C=0.1, class_weight="balanced", max_iter=2000,
            random_state=RANDOM_STATE),
        "RandomForest": RandomForestClassifier(
            n_estimators=300, min_samples_leaf=3,
            class_weight="balanced_subsample",
            random_state=RANDOM_STATE, n_jobs=-1),
    }


schemes = {
    "time-ordered (5 folds)": TimeSeriesSplit(n_splits=5),
    "shuffled (5 folds x 3)": RepeatedStratifiedKFold(
        n_splits=5, n_repeats=3, random_state=RANDOM_STATE),
}


def run_experiment(X_data, variant_name):
    out = []
    for scheme_name, cv in schemes.items():
        for model_name, model in make_models().items():
            res = cross_validate(
                model, X_data, y, cv=cv,
                scoring={"roc_auc": "roc_auc", "pr_auc": "average_precision"},
                error_score=np.nan)
            roc = res["test_roc_auc"]
            pr = res["test_pr_auc"]
            out.append({
                "variant": variant_name,
                "cv_scheme": scheme_name,
                "model": model_name,
                "roc_auc": f"{np.nanmean(roc):.3f} +/- {np.nanstd(roc):.3f}",
                "pr_auc": f"{np.nanmean(pr):.3f} +/- {np.nanstd(pr):.3f}",
                "roc_mean": np.nanmean(roc),
                "pr_mean": np.nanmean(pr),
            })
            print(f"  done: {variant_name} | {scheme_name} | {model_name}")
    return out


# ----------------------------------------------------------------------
# 2. Time-ordered vs shuffled CV (features as they are now)
# ----------------------------------------------------------------------
section("2. TIME-ORDERED vs SHUFFLED CROSS-VALIDATION (current features)")
print("(this can take a few minutes - Random Forest is the slow part)")
all_results = run_experiment(X, "as is")

# ----------------------------------------------------------------------
# 3. Outliers after scaling
# ----------------------------------------------------------------------
section("3. HOW EXTREME ARE THE VALUES? (after scaling)")
abs_x = X.abs()
total_cells = abs_x.size
print(f"Cells with |value| > 5 : {int((abs_x > 5).sum().sum())} "
      f"({(abs_x > 5).sum().sum() / total_cells * 100:.2f}%)")
print(f"Cells with |value| > 10: {int((abs_x > 10).sum().sum())} "
      f"({(abs_x > 10).sum().sum() / total_cells * 100:.2f}%)")
print(f"Columns with any |value| > 10: {int((abs_x.max() > 10).sum())} "
      f"of {X.shape[1]}")
print("\nTop 10 columns by largest |value|:")
print(abs_x.max().sort_values(ascending=False).head(10).round(1).to_string())
print("\n(In a normal bell-shaped column, values beyond 5 are almost never seen.)")

# ----------------------------------------------------------------------
# 4. Same experiment after capping extreme values
# ----------------------------------------------------------------------
section(f"4. SAME EXPERIMENT AFTER CAPPING VALUES TO +/-{CLIP_VALUE:g}")
print("Capping uses a fixed number, not learned from the data, so it")
print("cannot leak information from the validation rows.")
X_clipped = X.clip(-CLIP_VALUE, CLIP_VALUE)
all_results += run_experiment(X_clipped, f"capped +/-{CLIP_VALUE:g}")

# ----------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------
section("5. SUMMARY TABLE")
summary = pd.DataFrame(all_results)
print(summary[["variant", "cv_scheme", "model", "roc_auc", "pr_auc"]]
      .to_string(index=False))
print(f"\nNo-skill reference: roc_auc = 0.500, pr_auc = {prevalence:.3f}")

RESULTS_DIR.mkdir(exist_ok=True)
summary.drop(columns=["roc_mean", "pr_mean"]).to_csv(
    RESULTS_DIR / "diagnose_results.csv", index=False)
print(f"\nSaved: {RESULTS_DIR / 'diagnose_results.csv'}")

section("HOW TO READ THIS")
print("roc_auc near 0.50 and pr_auc near the reference  -> almost no signal")
print("shuffled clearly better than time-ordered         -> drift over time")
print("'capped' clearly better than 'as is'              -> outliers hurt")
print("Differences of a few hundredths are within noise (see the +/- values).")
print("\nThe test set was NOT used. No model was saved.")
