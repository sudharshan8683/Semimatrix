import argparse
from pathlib import Path

import joblib
import pandas as pd

ML_DIR = Path(__file__).resolve().parent
PROCESSED_DIR = ML_DIR / "processed"
MODELS_DIR = ML_DIR / "models"

FLAG_THRESHOLD = 0.5   # probability at/above this -> flagged
                       # (Step 11 showed 0.5 catches almost nothing here;
                       # consider passing a lower --threshold, see below)


def load_pipeline():
    """Load the imputer+scaler (Step 6) and the trained model (Step 11)."""
    prep_path = PROCESSED_DIR / "preprocessor.joblib"
    model_path = MODELS_DIR / "final_model.joblib"

    if not prep_path.exists():
        raise FileNotFoundError(
            f"Missing {prep_path}. Run ml/preprocess.py (Step 6) first.")
    if not model_path.exists():
        raise FileNotFoundError(
            f"Missing {model_path}. Run ml/final_evaluate.py (Step 11) first.")

    prep = joblib.load(prep_path)
    bundle = joblib.load(model_path)

    return {
        "imputer": prep["imputer"],
        "scaler": prep["scaler"],
        "kept_features": prep["kept_features"],        # e.g. 440 cols, in order
        "dropped_features": prep["dropped_features"],   # e.g. 150 cols, dropped in Step 6
        "model": bundle["model"],
        "selected_features": bundle["selected_features"],  # the top-k subset
    }


def predict_rows(pipeline, raw_df):
    """
    raw_df: a DataFrame of raw sensor readings, one row per wafer/run,
            590 columns, in the SAME order as secom.data. Missing values
            can be NaN.

    Returns a DataFrame with one row per input row: probability and flag.
    """
    # The ORIGINAL raw row width, before Step 6 dropped anything
    # (e.g. 590 for the real secom.data). A new row must still arrive
    # with every original column, in the original order, even though
    # some of those columns get dropped in the next step.
    expected_raw_cols = len(pipeline["kept_features"]) + len(pipeline["dropped_features"])

    if raw_df.shape[1] != expected_raw_cols:
        raise ValueError(
            f"Expected {expected_raw_cols} raw feature columns, "
            f"got {raw_df.shape[1]}. Each row must have the same number "
            f"and order of sensor readings as the original secom.data file."
        )

    # Step 6 named the raw columns feature_0 ... feature_589 BEFORE
    # dropping any. Apply the exact same names here so column order lines
    # up with what the imputer/scaler were fitted on.
    raw_df = raw_df.copy()
    raw_df.columns = [f"feature_{i}" for i in range(raw_df.shape[1])]

    # 1. Keep only the columns Step 6 decided to keep (drop constants /
    #    high-missing columns), in the same order.
    kept = pipeline["kept_features"]
    missing_expected = [c for c in kept if c not in raw_df.columns]
    if missing_expected:
        raise ValueError(f"Input is missing expected columns: {missing_expected[:5]}...")
    X = raw_df[kept]

    # 2. Fill missing values using the medians learned in Step 6.
    X_filled = pd.DataFrame(
        pipeline["imputer"].transform(X), columns=kept, index=X.index)

    # 3. Scale using the mean/std learned in Step 6.
    X_scaled = pd.DataFrame(
        pipeline["scaler"].transform(X_filled), columns=kept, index=X.index)

    # 4. Keep only the feature subset the final model was trained on
    #    (Step 10/11's selection), in the same order.
    X_final = X_scaled[pipeline["selected_features"]]

    # 5. Predict.
    proba = pipeline["model"].predict_proba(X_final)[:, 1]

    return pd.DataFrame({
        "probability": proba,
        "flagged": proba >= FLAG_THRESHOLD,
    }, index=raw_df.index)


def main():
    parser = argparse.ArgumentParser(
        description="Predict on new raw SECOM-format sensor rows.")
    parser.add_argument(
        "--input", required=True,
        help="Path to a whitespace-separated file of raw rows "
             "(same format as ml/data/secom/secom.data).")
    parser.add_argument(
        "--threshold", type=float, default=FLAG_THRESHOLD,
        help=f"Probability cutoff for flagging (default {FLAG_THRESHOLD}). "
             f"Step 11 showed flagging the top 20%% by probability works "
             f"better than a fixed 0.5 cutoff for this data.")
    parser.add_argument(
        "--output", default=None,
        help="Optional path to save results as CSV.")
    args = parser.parse_args()

    print(f"Loading preprocessor + model...")
    pipeline = load_pipeline()
    n_raw = len(pipeline["kept_features"]) + len(pipeline["dropped_features"])
    print(f"  Raw input columns expected: {n_raw}")
    print(f"  Columns kept after Step 6 cleaning: {len(pipeline['kept_features'])}")
    print(f"  Final model uses: {len(pipeline['selected_features'])} features")

    print(f"\nReading raw rows from: {args.input}")
    raw_df = pd.read_csv(args.input, sep=r"\s+", header=None)
    print(f"  Loaded {raw_df.shape[0]} rows x {raw_df.shape[1]} columns")

    results = predict_rows(pipeline, raw_df)
    results["flagged"] = results["probability"] >= args.threshold

    print(f"\n{'=' * 70}\nPREDICTIONS (threshold = {args.threshold})\n{'=' * 70}")
    print(results.round(4).to_string())
    print(f"\nFlagged: {int(results['flagged'].sum())} of {len(results)} rows")

    if args.output:
        results.to_csv(args.output, index=True)
        print(f"\nSaved: {args.output}")


if __name__ == "__main__":
    main()
