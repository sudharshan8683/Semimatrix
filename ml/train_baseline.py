from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import TimeSeriesSplit

# ----------------------------------------------------------------------
# Settings
# ----------------------------------------------------------------------
ML_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = ML_DIR / "processed"
RESULTS_DIR = ML_DIR / "results"

N_SPLITS = 5          # number of time-ordered folds
THRESHOLD = 0.5       # probability above which we predict label +1
RANDOM_STATE = 42     # makes results repeatable

pd.set_option("display.width", 200)
pd.set_option("display.max_columns", 20)


def section(title):
    """Print a clear heading so each part of the output is easy to find."""
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


# ----------------------------------------------------------------------
# 1. Load processed training data
# ----------------------------------------------------------------------
section("1. LOADING PROCESSED TRAINING DATA")

X_train = pd.read_csv(PROCESSED_DIR / "X_train.csv")
y_train_df = pd.read_csv(PROCESSED_DIR / "y_train.csv")

if len(X_train) != len(y_train_df):
    raise ValueError("X_train and y_train have different numbers of rows.")

# Models want numbers 0/1. We call the RARE label (+1) the "positive class"
# = 1, and the common label (-1) = 0. This is only a naming choice for the
# maths; we are not claiming what +1 / -1 mean physically.
y_train = (y_train_df["label"] == 1).astype(int).to_numpy()

print(f"X_train shape: {X_train.shape}")
print(f"Rows with label +1: {y_train.sum()} of {len(y_train)} "
      f"({y_train.mean() * 100:.2f}%)")
print("Test set is NOT loaded in this step.")

# ----------------------------------------------------------------------
# 2. Define the models
# ----------------------------------------------------------------------
section("2. MODELS")

# class_weight="balanced" tells the model that mistakes on the rare label
# count MORE, so it does not simply ignore it.
models = {
    "Dummy (always -1)": DummyClassifier(strategy="most_frequent"),
    "LogisticRegression": LogisticRegression(
        C=0.1, class_weight="balanced", max_iter=2000,
        random_state=RANDOM_STATE),
    "RandomForest": RandomForestClassifier(
        n_estimators=300, min_samples_leaf=3,
        class_weight="balanced_subsample",
        random_state=RANDOM_STATE, n_jobs=-1),
}
for name in models:
    print(f"  - {name}")

# ----------------------------------------------------------------------
# 3. Time-ordered cross-validation
# ----------------------------------------------------------------------
section("3. TIME-ORDERED CROSS-VALIDATION (training set only)")

tscv = TimeSeriesSplit(n_splits=N_SPLITS)
rows = []

for name, model in models.items():
    for fold, (tr_idx, va_idx) in enumerate(tscv.split(X_train), start=1):
        y_tr, y_va = y_train[tr_idx], y_train[va_idx]

        # Some early folds might contain only one label; skip those safely.
        if len(np.unique(y_tr)) < 2:
            print(f"[{name}] fold {fold}: skipped (train part has one label)")
            continue

        m = clone(model)
        m.fit(X_train.iloc[tr_idx], y_tr)
        proba = m.predict_proba(X_train.iloc[va_idx])[:, 1]
        pred = (proba >= THRESHOLD).astype(int)

        has_pos = y_va.sum() > 0
        tp = int(((pred == 1) & (y_va == 1)).sum())
        fp = int(((pred == 1) & (y_va == 0)).sum())
        fn = int(((pred == 0) & (y_va == 1)).sum())
        tn = int(((pred == 0) & (y_va == 0)).sum())

        rows.append({
            "model": name,
            "fold": fold,
            "val_rows": len(y_va),
            "val_positives": int(y_va.sum()),
            "accuracy": accuracy_score(y_va, pred),
            "precision": precision_score(y_va, pred, zero_division=0),
            "recall": recall_score(y_va, pred, zero_division=0),
            "f1": f1_score(y_va, pred, zero_division=0),
            "pr_auc": average_precision_score(y_va, proba) if has_pos else np.nan,
            "roc_auc": roc_auc_score(y_va, proba) if has_pos else np.nan,
            "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        })
    print(f"Finished: {name}")

results = pd.DataFrame(rows)

section("3b. RESULTS PER FOLD")
metric_cols = ["accuracy", "precision", "recall", "f1", "pr_auc", "roc_auc"]
print(results[["model", "fold", "val_rows", "val_positives"] + metric_cols]
      .round(3).to_string(index=False))

# ----------------------------------------------------------------------
# 4. Summary across folds
# ----------------------------------------------------------------------
section("4. SUMMARY (average over folds)")

summary = results.groupby("model")[metric_cols].mean().round(3)
print(summary.to_string())

print("\nReference: a model with NO skill gets pr_auc about equal to the")
print(f"share of +1 rows = {y_train.mean():.3f}. Real models should beat this.")

section("4b. CONFUSION COUNTS (summed over all folds)")
print("tp = +1 correctly caught | fn = +1 missed")
print("fp = false alarms        | tn = -1 correctly passed\n")
conf = results.groupby("model")[["tp", "fn", "fp", "tn"]].sum()
print(conf.to_string())

# ----------------------------------------------------------------------
# 5. Save results
# ----------------------------------------------------------------------
section("5. SAVING RESULTS")
RESULTS_DIR.mkdir(exist_ok=True)
results.to_csv(RESULTS_DIR / "baseline_cv_results.csv", index=False)
print(f"Saved: {RESULTS_DIR / 'baseline_cv_results.csv'}")

section("METRIC GUIDE")
print("precision : of the rows flagged +1, how many really were +1")
print("recall    : of all real +1 rows, how many we caught")
print("f1        : balance of precision and recall")
print("pr_auc    : quality of the ranking (best metric for rare labels)")
print("roc_auc   : another ranking quality score (0.5 = no skill)")
print("accuracy  : IGNORE for now - 'always -1' already scores ~93%")
print("\nThe test set was NOT used. No model was saved.")
