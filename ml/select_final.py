import json
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import TimeSeriesSplit

warnings.filterwarnings("ignore")

ML_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = ML_DIR / "processed"
RESULTS_DIR = ML_DIR / "results"

SEEDS = [0, 1, 2]
K_VALUES = [25, 50, 100]
FLAG_PERCENTS = [5, 10, 15, 20, 30, 40]   # "flag the top X% riskiest rows"

pd.set_option("display.width", 200)
pd.set_option("display.max_columns", 20)


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def rank_columns(X_tr, y_tr, seed):
    """All columns, ordered from most to least useful (training rows only)."""
    rf = RandomForestClassifier(
        n_estimators=200, min_samples_leaf=3,
        class_weight="balanced_subsample",
        random_state=seed, n_jobs=-1).fit(X_tr, y_tr)
    imp = pd.Series(rf.feature_importances_, index=X_tr.columns)
    return list(imp.sort_values(ascending=False).index)


def final_forest(seed):
    return RandomForestClassifier(
        n_estimators=300, min_samples_leaf=3,
        class_weight="balanced_subsample",
        random_state=seed, n_jobs=-1)


# ----------------------------------------------------------------------
# Load training data only
# ----------------------------------------------------------------------
section("LOADING TRAINING DATA (test set is NOT loaded)")
X = pd.read_csv(PROCESSED_DIR / "X_train.csv")
y_df = pd.read_csv(PROCESSED_DIR / "y_train.csv")
y = (y_df["label"] == 1).astype(int).to_numpy()
print(f"X_train: {X.shape} | +1 rows: {y.sum()} ({y.mean() * 100:.2f}%)")

# (name, number of features to keep or None for all, use recency weights?)
variants = (
    [("all features", None, False)]
    + [(f"top {k}", k, False) for k in K_VALUES]
    + [("top 50 + recent rows weighted more", 50, True)]
)

# ----------------------------------------------------------------------
# 1. Repeated time-ordered CV
# ----------------------------------------------------------------------
section("1. REPEATED TIME-ORDERED CV (Random Forest, 3 seeds x 5 folds)")
print("(this can take 5-15 minutes)")

tscv = TimeSeriesSplit(n_splits=5)
records = []
oof = {}      # variant -> {seed -> list of Series of predictions}

for seed in SEEDS:
    for fold, (tr, va) in enumerate(tscv.split(X), start=1):
        X_tr, y_tr = X.iloc[tr], y[tr]
        X_va, y_va = X.iloc[va], y[va]
        if y_va.sum() == 0 or len(np.unique(y_tr)) < 2:
            continue

        ranking = rank_columns(X_tr, y_tr, seed)   # decided from TRAIN only

        for vname, k, recency in variants:
            cols = list(X.columns) if k is None else ranking[:k]
            weights = np.linspace(0.2, 1.0, len(X_tr)) if recency else None

            rf = final_forest(seed)
            if weights is None:
                rf.fit(X_tr[cols], y_tr)
            else:
                rf.fit(X_tr[cols], y_tr, sample_weight=weights)
            proba = rf.predict_proba(X_va[cols])[:, 1]

            records.append({
                "variant": vname, "seed": seed, "fold": fold,
                "roc_auc": roc_auc_score(y_va, proba),
                "pr_auc": average_precision_score(y_va, proba),
            })
            oof.setdefault(vname, {}).setdefault(seed, []).append(
                pd.Series(proba, index=va))
    print(f"  done: seed {seed}")

res = pd.DataFrame(records)

# ----------------------------------------------------------------------
# 2. Summary and paired comparison with "all features"
# ----------------------------------------------------------------------
section("2. SUMMARY (mean +/- std over 15 seed-fold runs)")
base = res[res["variant"] == "all features"].set_index(["seed", "fold"])
rows = []
for vname, _, _ in variants:
    cur = res[res["variant"] == vname].set_index(["seed", "fold"])
    joined = cur.join(base, rsuffix="_base")
    n = len(joined)
    rows.append({
        "variant": vname,
        "roc_auc": f"{cur['roc_auc'].mean():.3f} +/- {cur['roc_auc'].std():.3f}",
        "pr_auc": f"{cur['pr_auc'].mean():.3f} +/- {cur['pr_auc'].std():.3f}",
        "beats 'all' (pr_auc)": (
            "-" if vname == "all features"
            else f"{int((joined['pr_auc'] > joined['pr_auc_base']).sum())}/{n}"),
        "beats 'all' (roc_auc)": (
            "-" if vname == "all features"
            else f"{int((joined['roc_auc'] > joined['roc_auc_base']).sum())}/{n}"),
        "_pr_mean": cur["pr_auc"].mean(),
    })
summary = pd.DataFrame(rows)
print(summary.drop(columns="_pr_mean").to_string(index=False))

# Average no-skill level over the validation folds
val_rate = np.mean([y[va].mean() for _, va in tscv.split(X)])
print(f"\nNo-skill reference: roc_auc = 0.500, pr_auc = {val_rate:.3f}")
print("'beats all' = in how many paired runs the variant scored higher than")
print("'all features' (same seed and fold). Near 15/15 is convincing;")
print("around 8/15 means no real difference.")

best_row = summary.loc[summary["_pr_mean"].idxmax()]
best_name = best_row["variant"]
best_spec = next(v for v in variants if v[0] == best_name)
print(f"\nHighest mean pr_auc: '{best_name}'")

# ----------------------------------------------------------------------
# 3. Flag-the-top-X% table for the best variant
# ----------------------------------------------------------------------
section(f"3. FLAGGING THE RISKIEST ROWS - variant: '{best_name}'")
# Each validation row appears once per seed; average its predictions.
pooled = pd.concat(
    [pd.concat(lst) for lst in oof[best_name].values()]
).groupby(level=0).mean()
y_pooled = y[pooled.index.to_numpy()]
base_rate = y_pooled.mean()
print(f"Rows in validation folds: {len(pooled)} | +1 rows: {int(y_pooled.sum())} "
      f"({base_rate * 100:.1f}%)")

tab = []
for pct in FLAG_PERCENTS:
    cutoff = np.percentile(pooled, 100 - pct)
    flagged = pooled >= cutoff
    tp = int((flagged & (y_pooled == 1)).sum())
    n_flag = int(flagged.sum())
    tab.append({
        "flag_top_%": pct,
        "prob_cutoff": round(float(cutoff), 3),
        "rows_flagged": n_flag,
        "caught_+1": tp,
        "precision": round(tp / n_flag, 3) if n_flag else 0.0,
        "recall": round(tp / y_pooled.sum(), 3),
        "lift_vs_random": round((tp / n_flag) / base_rate, 2) if n_flag else 0.0,
    })
print(pd.DataFrame(tab).to_string(index=False))
print("\nlift_vs_random = how many times better than flagging rows at random")
print("(1.0 = no better than random).")

# ----------------------------------------------------------------------
# Save
# ----------------------------------------------------------------------
section("4. SAVING")
RESULTS_DIR.mkdir(exist_ok=True)
res.to_csv(RESULTS_DIR / "select_final_results.csv", index=False)
pd.DataFrame(tab).to_csv(RESULTS_DIR / "flag_table.csv", index=False)
config = {
    "variant": best_name,
    "n_features": best_spec[1],          # null means "all features"
    "recency_weights": best_spec[2],
}
with open(RESULTS_DIR / "selected_config.json", "w") as f:
    json.dump(config, f, indent=2)
print("Saved: select_final_results.csv, flag_table.csv, selected_config.json")
print(f"Location: {RESULTS_DIR}")

section("HOW TO READ THIS")
print("A variant is only trustworthy if it beats 'all features' in MOST paired")
print("runs AND its lead is bigger than the +/- values.")
print("If nothing clearly wins, we keep the simplest setup and say honestly")
print("that these features carry weak forward-looking signal.")
print("\nThe test set was NOT used. No final model was saved.")
