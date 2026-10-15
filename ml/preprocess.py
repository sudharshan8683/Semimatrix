from pathlib import Path

import joblib
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

# ----------------------------------------------------------------------
# Settings (change these here if you want different behaviour)
# ----------------------------------------------------------------------
ML_DIR = Path(__file__).resolve().parent
DATA_DIR = ML_DIR / "data" / "secom"        # raw data (read only)
OUT_DIR = ML_DIR / "processed"              # new folder for cleaned data
FEATURES_FILE = DATA_DIR / "secom.data"
LABELS_FILE = DATA_DIR / "secom_labels.data"

TEST_FRACTION = 0.20       # newest 20% of rows go to the test set
MISSING_THRESHOLD = 40.0   # drop features missing MORE than this % (in TRAIN)


def section(title):
    """Print a clear heading so each part of the output is easy to find."""
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


# ----------------------------------------------------------------------
# 1. Load the raw data
# ----------------------------------------------------------------------
section("1. LOADING RAW DATA")

features = pd.read_csv(FEATURES_FILE, sep=r"\s+", header=None)
# We only give the columns neutral names. We do NOT claim to know what
# each sensor measures.
features.columns = [f"feature_{i}" for i in range(features.shape[1])]

labels = pd.read_csv(LABELS_FILE, sep=r"\s+", header=None)
if labels.shape[1] != 2:
    raise ValueError(
        f"Expected 2 columns in the labels file (label, timestamp) "
        f"but found {labels.shape[1]}."
    )
labels.columns = ["label", "timestamp"]

if len(features) != len(labels):
    raise ValueError(
        f"Row mismatch: features have {len(features)} rows, "
        f"labels have {len(labels)} rows."
    )

print(f"Features: {features.shape[0]} rows x {features.shape[1]} columns")
print(f"Labels:   {labels.shape[0]} rows x {labels.shape[1]} columns")

# ----------------------------------------------------------------------
# 2. Parse timestamps and sort by time
# ----------------------------------------------------------------------
section("2. SORTING ROWS BY TIME")

# Timestamps look like: 19/07/2008 11:55:00  (day/month/year)
labels["timestamp"] = pd.to_datetime(labels["timestamp"],
                                     format="%d/%m/%Y %H:%M:%S")

already_sorted = labels["timestamp"].is_monotonic_increasing
print(f"Rows already in time order in the file? {already_sorted}")
print(f"Earliest timestamp: {labels['timestamp'].min()}")
print(f"Latest timestamp:   {labels['timestamp'].max()}")

# Sort features and labels TOGETHER so each row keeps its own label.
# kind="stable" keeps the original order for rows with identical timestamps.
order = labels["timestamp"].argsort(kind="stable")
features = features.iloc[order].reset_index(drop=True)
labels = labels.iloc[order].reset_index(drop=True)
print("Rows are now sorted by time (features and labels sorted together).")

# ----------------------------------------------------------------------
# 3. Time-based train/test split
# ----------------------------------------------------------------------
section("3. TRAIN / TEST SPLIT (time-based)")

# Why split BEFORE cleaning? Anything we "learn" from the data (medians,
# means, which columns to drop) must come from the training rows only.
# If the test rows influence those choices, our test score would look
# better than it really is (this is called "data leakage").
n_rows = len(features)
split_at = int(n_rows * (1 - TEST_FRACTION))

X_train = features.iloc[:split_at].copy()
X_test = features.iloc[split_at:].copy()
y_train = labels.iloc[:split_at].copy()
y_test = labels.iloc[split_at:].copy()

print(f"Train rows: {len(X_train)}  "
      f"({y_train['timestamp'].min()} -> {y_train['timestamp'].max()})")
print(f"Test rows:  {len(X_test)}  "
      f"({y_test['timestamp'].min()} -> {y_test['timestamp'].max()})")

print("\nLabel counts in TRAIN:")
print(y_train["label"].value_counts().to_string())
print("\nLabel counts in TEST:")
print(y_test["label"].value_counts().to_string())
if y_test["label"].nunique() < 2:
    print("\nWARNING: the test set has only one label value. "
          "We may need a different split later.")

# ----------------------------------------------------------------------
# 4. Drop columns (decided from TRAIN only)
# ----------------------------------------------------------------------
section("4. DROPPING USELESS COLUMNS")

# 4a. Constant columns: only one distinct value -> nothing to learn from.
unique_counts = X_train.nunique(dropna=True)
constant_cols = list(unique_counts[unique_counts <= 1].index)
print(f"Constant columns (<= 1 unique value in TRAIN): {len(constant_cols)}")

# 4b. Columns with too many missing values (among the non-constant ones).
missing_pct = X_train.isna().mean() * 100
high_missing_cols = [
    col for col in X_train.columns
    if missing_pct[col] > MISSING_THRESHOLD and col not in constant_cols
]
print(f"Columns missing more than {MISSING_THRESHOLD:.0f}% in TRAIN "
      f"(not already constant): {len(high_missing_cols)}")

# Keep a record of what was dropped and why.
report_rows = (
    [{"feature": c, "reason": "constant",
      "missing_pct_train": round(missing_pct[c], 2)} for c in constant_cols]
    + [{"feature": c, "reason": f"missing > {MISSING_THRESHOLD:.0f}%",
        "missing_pct_train": round(missing_pct[c], 2)}
       for c in high_missing_cols]
)
dropped_report = pd.DataFrame(report_rows,
                              columns=["feature", "reason", "missing_pct_train"])

drop_cols = constant_cols + high_missing_cols
X_train = X_train.drop(columns=drop_cols)
X_test = X_test.drop(columns=drop_cols)   # same columns removed from TEST

print(f"\nTotal dropped: {len(drop_cols)}")
print(f"Features kept: {X_train.shape[1]} (of {features.shape[1]})")

# ----------------------------------------------------------------------
# 5. Fill missing values
# ----------------------------------------------------------------------
section("5. FILLING MISSING VALUES (median)")

missing_before = int(X_train.isna().sum().sum())
print(f"Missing cells in TRAIN before filling: {missing_before}")
print(f"Missing cells in TEST  before filling: {int(X_test.isna().sum().sum())}")

# The median is used because it is less affected by extreme values than
# the mean (and this data has some extreme values).
# fit() learns each column's median from TRAIN.
# transform() fills the gaps using those TRAIN medians (also for TEST).
imputer = SimpleImputer(strategy="median")
imputer.fit(X_train)

X_train = pd.DataFrame(imputer.transform(X_train),
                       columns=X_train.columns, index=X_train.index)
X_test = pd.DataFrame(imputer.transform(X_test),
                      columns=X_test.columns, index=X_test.index)

print(f"Missing cells in TRAIN after filling:  {int(X_train.isna().sum().sum())}")
print(f"Missing cells in TEST  after filling:  {int(X_test.isna().sum().sum())}")

# ----------------------------------------------------------------------
# 6. Scale the columns
# ----------------------------------------------------------------------
section("6. SCALING (standardisation)")

# Columns have very different ranges (some ~0.001, some ~30000).
# StandardScaler rewrites each column so it has mean 0 and std 1
# (mean/std learned from TRAIN only). Many models need this.
scaler = StandardScaler()
scaler.fit(X_train)

X_train = pd.DataFrame(scaler.transform(X_train),
                       columns=X_train.columns, index=X_train.index)
X_test = pd.DataFrame(scaler.transform(X_test),
                      columns=X_test.columns, index=X_test.index)

print("TRAIN column means are now ~0 and stds ~1:")
print(f"  average of column means: {X_train.mean().mean():.6f}")
print(f"  average of column stds:  {X_train.std().mean():.6f}")
print("(TEST will not be exactly 0/1 - that is normal and expected.)")

# ----------------------------------------------------------------------
# 7. Save results to a NEW folder (raw data is untouched)
# ----------------------------------------------------------------------
section("7. SAVING PROCESSED FILES")

OUT_DIR.mkdir(exist_ok=True)

X_train.to_csv(OUT_DIR / "X_train.csv", index=False)
X_test.to_csv(OUT_DIR / "X_test.csv", index=False)
y_train.to_csv(OUT_DIR / "y_train.csv", index=False)
y_test.to_csv(OUT_DIR / "y_test.csv", index=False)
dropped_report.to_csv(OUT_DIR / "dropped_features.csv", index=False)

# Save the fitted imputer/scaler so new data can be processed the same way
# later (for example, when the backend needs to make predictions).
joblib.dump(
    {
        "imputer": imputer,
        "scaler": scaler,
        "kept_features": list(X_train.columns),
        "dropped_features": drop_cols,
    },
    OUT_DIR / "preprocessor.joblib",
)

print(f"Saved to: {OUT_DIR}")
for name in ["X_train.csv", "X_test.csv", "y_train.csv", "y_test.csv",
             "dropped_features.csv", "preprocessor.joblib"]:
    print(f"  - {name}")

# ----------------------------------------------------------------------
section("SUMMARY")
print(f"Final X_train shape: {X_train.shape}")
print(f"Final X_test shape:  {X_test.shape}")
print(f"Dropped: {len(constant_cols)} constant + "
      f"{len(high_missing_cols)} high-missing = {len(drop_cols)} columns")
print("Original files in ml/data/secom were NOT modified.")
print("No model was trained.")
