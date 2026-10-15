"""
final_evaluate.py
------------------
STEP 11: Train the SELECTED setup on the full training set, then evaluate
it ONCE on the test set. This is the only step that touches the test set.

The setup (which features, whether to weight recent rows) was chosen in
Step 10 (select_final.py) using ONLY training data, and is loaded from
ml/results/selected_config.json - it is not re-decided here.

Run from the project root (C:\\Users\\asus\\Downloads\\Semi Fab):
    python ml\\final_evaluate.py
"""

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

ML_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = ML_DIR / "processed"
RESULTS_DIR = ML_DIR / "results"
MODELS_DIR = ML_DIR / "models"
RANDOM_STATE = 42
FLAG_TOP_PERCENT = 20   # matches a reasonable operating point from Step 10


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


# ----------------------------------------------------------------------
# 1. Load everything
# ----------------------------------------------------------------------
section("1. LOADING TRAIN + TEST DATA AND THE SELECTED CONFIG")

with open(RESULTS_DIR / "selected_config.json") as f:
    config = json.load(f)
print(f"Selected config (from Step 10): {config}")

X_train = pd.read_csv(PROCESSED_DIR / "X_train.csv")
X_test = pd.read_csv(PROCESSED_DIR / "X_test.csv")
y_train_df = pd.read_csv(PROCESSED_DIR / "y_train.csv")
y_test_df = pd.read_csv(PROCESSED_DIR / "y_test.csv")
y_train = (y_train_df["label"] == 1).astype(int).to_numpy()
y_test = (y_test_df["label"] == 1).astype(int).to_numpy()

print(f"X_train: {X_train.shape} | +1 rows: {y_train.sum()} "
      f"({y_train.mean() * 100:.2f}%)")
print(f"X_test:  {X_test.shape} | +1 rows: {y_test.sum()} "
      f"({y_test.mean() * 100:.2f}%)")
print("\nThe test set has few +1 rows, so treat exact numbers below as a")
print("rough estimate, not a precise measurement.")

# ----------------------------------------------------------------------
# 2. Select features (using TRAINING importances only)
# ----------------------------------------------------------------------
section("2. SELECTING FEATURES (ranked using TRAIN data only)")

n_features = config.get("n_features")
if n_features is None:
    cols = list(X_train.columns)
    print(f"Using all {len(cols)} features (no selection).")
else:
    ranker = RandomForestClassifier(
        n_estimators=200, min_samples_leaf=3,
        class_weight="balanced_subsample",
        random_state=RANDOM_STATE, n_jobs=-1).fit(X_train, y_train)
    importance = pd.Series(ranker.feature_importances_, index=X_train.columns)
    cols = list(importance.sort_values(ascending=False).index[:n_features])
    print(f"Using top {n_features} features (ranked on the full training set).")
    print("\nTop 10 of those:")
    print(importance[cols].head(10).round(4).to_string())

X_train_sel = X_train[cols]
X_test_sel = X_test[cols]

# ----------------------------------------------------------------------
# 3. Train the final model on ALL training data
# ----------------------------------------------------------------------
section("3. TRAINING THE FINAL MODEL")

weights = None
if config.get("recency_weights"):
    weights = np.linspace(0.2, 1.0, len(X_train_sel))
    print("Using recency weights: oldest rows weight 0.2, newest weight 1.0.")

model = RandomForestClassifier(
    n_estimators=300, min_samples_leaf=3,
    class_weight="balanced_subsample",
    random_state=RANDOM_STATE, n_jobs=-1)

if weights is None:
    model.fit(X_train_sel, y_train)
else:
    model.fit(X_train_sel, y_train, sample_weight=weights)

print(f"Trained RandomForestClassifier on {X_train_sel.shape[0]} rows, "
      f"{X_train_sel.shape[1]} features.")

# ----------------------------------------------------------------------
# 4. Evaluate ONCE on the test set
# ----------------------------------------------------------------------
section("4. TEST SET EVALUATION (this data was never used until now)")

proba_test = model.predict_proba(X_test_sel)[:, 1]

print("\n--- At the default 0.5 cutoff ---")
pred_05 = (proba_test >= 0.5).astype(int)
tn, fp, fn, tp = confusion_matrix(y_test, pred_05, labels=[0, 1]).ravel()
print(f"Precision: {precision_score(y_test, pred_05, zero_division=0):.3f}")
print(f"Recall:    {recall_score(y_test, pred_05, zero_division=0):.3f}")
print(f"F1:        {f1_score(y_test, pred_05, zero_division=0):.3f}")
print(f"Confusion matrix: tp={tp} fn={fn} fp={fp} tn={tn}")

roc_auc = roc_auc_score(y_test, proba_test)
pr_auc = average_precision_score(y_test, proba_test)
print(f"\nROC-AUC: {roc_auc:.3f}  (0.500 = no skill)")
print(f"PR-AUC:  {pr_auc:.3f}  (no-skill reference = {y_test.mean():.3f})")

print(f"\n--- Flagging the riskiest {FLAG_TOP_PERCENT}% of test rows ---")
cutoff = np.percentile(proba_test, 100 - FLAG_TOP_PERCENT)
flagged = proba_test >= cutoff
n_flag = int(flagged.sum())
tp_flag = int((flagged & (y_test == 1)).sum())
precision_flag = tp_flag / n_flag if n_flag else 0.0
recall_flag = tp_flag / y_test.sum() if y_test.sum() else 0.0
lift = precision_flag / y_test.mean() if y_test.mean() else 0.0
print(f"Rows flagged: {n_flag} | +1 caught: {tp_flag} of {int(y_test.sum())}")
print(f"Precision: {precision_flag:.3f} | Recall: {recall_flag:.3f} | "
      f"Lift vs random: {lift:.2f}x")

# ----------------------------------------------------------------------
# 5. Compare with training-set CV estimate (sanity check)
# ----------------------------------------------------------------------
section("5. SANITY CHECK: TEST RESULT vs STEP 10 CV ESTIMATE")
print("If the test PR-AUC is wildly higher or lower than the Step 10")
print("cross-validation range, treat that as a signal to investigate,")
print("not as confirmation either way - the test set is small.")
print(f"This test set PR-AUC: {pr_auc:.3f}")

# ----------------------------------------------------------------------
# 6. Save the final model bundle
# ----------------------------------------------------------------------
section("6. SAVING THE FINAL MODEL")
MODELS_DIR.mkdir(exist_ok=True)

bundle = {
    "model": model,
    "selected_features": cols,
    "config": config,
    "random_state": RANDOM_STATE,
}
joblib.dump(bundle, MODELS_DIR / "final_model.joblib")

metrics = {
    "test_rows": int(len(y_test)),
    "test_positives": int(y_test.sum()),
    "roc_auc": round(float(roc_auc), 4),
    "pr_auc": round(float(pr_auc), 4),
    "precision_at_0.5": round(float(precision_score(y_test, pred_05, zero_division=0)), 4),
    "recall_at_0.5": round(float(recall_score(y_test, pred_05, zero_division=0)), 4),
    "confusion_at_0.5": {"tp": int(tp), "fn": int(fn), "fp": int(fp), "tn": int(tn)},
    f"flag_top_{FLAG_TOP_PERCENT}pct": {
        "rows_flagged": n_flag, "caught": tp_flag,
        "precision": round(precision_flag, 4), "recall": round(recall_flag, 4),
        "lift_vs_random": round(lift, 2),
    },
    "selected_features": cols,
}
with open(RESULTS_DIR / "final_test_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print(f"Saved: {MODELS_DIR / 'final_model.joblib'}")
print(f"Saved: {RESULTS_DIR / 'final_test_metrics.json'}")

section("DONE")
print("This model + the preprocessor.joblib from Step 6 (imputer + scaler)")
print("are everything ml/predict.py (Step 12) will need to score new rows.")
