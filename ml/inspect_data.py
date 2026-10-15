from pathlib import Path

import pandas as pd

# ----------------------------------------------------------------------
# Settings
# ----------------------------------------------------------------------
# Build file paths relative to THIS script's location, so the script works
# no matter which folder you run it from.
ML_DIR = Path(__file__).resolve().parent
DATA_DIR = ML_DIR / "data" / "secom"
FEATURES_FILE = DATA_DIR / "secom.data"
LABELS_FILE = DATA_DIR / "secom_labels.data"

# Show more rows/columns than pandas normally does, so output is not "...".
pd.set_option("display.width", 200)
pd.set_option("display.max_columns", 12)
pd.set_option("display.max_rows", 60)


def section(title):
    """Print a clear heading so each part of the output is easy to find."""
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


# ----------------------------------------------------------------------
# 1. Load the data
# ----------------------------------------------------------------------
section("1. LOADING FILES")

# The SECOM files are separated by spaces (not commas), so we use sep=r"\s+"
# (one or more whitespace characters). header=None because the files have
# no column names in the first row. Missing values are written as "NaN" in
# the file, which pandas recognises automatically.
features = pd.read_csv(FEATURES_FILE, sep=r"\s+", header=None)

# Labels file has 2 columns per row: the pass/fail label and a timestamp
# (written as: "dd/mm/yyyy hh:mm:ss"). Because the timestamp itself contains
# a space, whitespace splitting gives 3 pieces: label, date, time.
labels = pd.read_csv(LABELS_FILE, sep=r"\s+", header=None)

print(f"Features file: {FEATURES_FILE}")
print(f"Labels file:   {LABELS_FILE}")
print("Files loaded (originals are NOT modified).")

# ----------------------------------------------------------------------
# 2. Shapes and row-count check
# ----------------------------------------------------------------------
section("2. DATASET SHAPES  (rows, columns)")
print(f"Features shape: {features.shape}")
print(f"Labels shape:   {labels.shape}")

section("2b. DO THE ROW COUNTS MATCH?")
if features.shape[0] == labels.shape[0]:
    print(f"OK: both have {features.shape[0]} rows.")
else:
    print("WARNING: row counts do NOT match!")
    print(f"  Features rows: {features.shape[0]}")
    print(f"  Labels rows:   {labels.shape[0]}")

# Note: the label file has no header, so the columns are just numbered.
# We only look at what the data shows - we do not guess extra meaning.

# ----------------------------------------------------------------------
# 3. First and last rows
# ----------------------------------------------------------------------
section("3a. FIRST 5 ROWS - FEATURES")
print(features.head())

section("3b. LAST 5 ROWS - FEATURES")
print(features.tail())

section("3c. FIRST 5 ROWS - LABELS")
print(labels.head())

section("3d. LAST 5 ROWS - LABELS")
print(labels.tail())

# ----------------------------------------------------------------------
# 4. Missing values
# ----------------------------------------------------------------------
section("4a. TOTAL MISSING VALUES - FEATURES")
total_cells = features.shape[0] * features.shape[1]
total_missing = int(features.isna().sum().sum())
print(f"Missing cells: {total_missing} out of {total_cells} "
      f"({total_missing / total_cells * 100:.2f}%)")

section("4b. TOTAL MISSING VALUES - LABELS")
print(f"Missing cells in labels: {int(labels.isna().sum().sum())}")

# Missing count per feature column (column number = feature index, from 0).
missing_per_feature = features.isna().sum()
missing_pct_per_feature = features.isna().mean() * 100

section("4c. MISSING VALUES PER FEATURE (only features with >= 1 missing)")
only_missing = missing_per_feature[missing_per_feature > 0]
print(f"Features with at least one missing value: {len(only_missing)} "
      f"out of {features.shape[1]}")
print(f"Features with no missing values:          "
      f"{features.shape[1] - len(only_missing)}")
print()
print(only_missing.to_string())

section("4d. PERCENTAGE MISSING PER FEATURE (top 30, highest first)")
top_missing = missing_pct_per_feature.sort_values(ascending=False).head(30)
print(top_missing.round(2).to_string())

section("4e. HOW MANY FEATURES ARE MISSING MORE THAN X% OF VALUES?")
for threshold in [5, 10, 20, 30, 40, 50, 60, 70, 80, 90]:
    count = int((missing_pct_per_feature > threshold).sum())
    print(f"Features with more than {threshold:>2}% missing: {count}")

# ----------------------------------------------------------------------
# 5. Duplicates
# ----------------------------------------------------------------------
section("5. DUPLICATE ROWS")
print(f"Duplicate rows in features: {int(features.duplicated().sum())}")
print(f"Duplicate rows in labels:   {int(labels.duplicated().sum())}")

# ----------------------------------------------------------------------
# 6. Data types
# ----------------------------------------------------------------------
section("6a. DATA TYPES - FEATURES (count of columns per type)")
print(features.dtypes.value_counts().to_string())

section("6b. DATA TYPES - LABELS")
print(labels.dtypes.to_string())

# ----------------------------------------------------------------------
# 7. Statistical summary
# ----------------------------------------------------------------------
section("7a. BASIC STATISTICAL SUMMARY - FEATURES")
print("(count = non-missing values; std = spread; min/max = extremes)")
print(features.describe().T.round(4).to_string())

section("7b. BASIC STATISTICAL SUMMARY - LABELS")
print(labels.describe(include="all").to_string())

# ----------------------------------------------------------------------
# 8. Label distribution and unique values
# ----------------------------------------------------------------------
section("8a. LABEL DISTRIBUTION (first label column)")
counts = labels[0].value_counts(dropna=False)
percents = labels[0].value_counts(normalize=True, dropna=False) * 100
print(pd.DataFrame({"count": counts, "percent": percents.round(2)}).to_string())

section("8b. NUMBER OF UNIQUE VALUES PER LABEL COLUMN")
print(labels.nunique(dropna=False).to_string())

section("8c. UNIQUE VALUES PER FEATURE - SUMMARY")
unique_per_feature = features.nunique()
print(f"Features with only 1 unique value (constant): "
      f"{int((unique_per_feature == 1).sum())}")
print(f"Features with 0 non-missing values (all NaN):  "
      f"{int((unique_per_feature == 0).sum())}")

# ----------------------------------------------------------------------
section("INSPECTION COMPLETE - nothing was changed or saved")
print("Copy the whole terminal output and share it so we can decide next steps.")
