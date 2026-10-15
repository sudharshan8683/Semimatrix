import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import joblib
import pandas as pd
import numpy as np

# Resolve path to project root ml/ directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ML_DIR = PROJECT_ROOT / "ml"
PROCESSED_DIR = ML_DIR / "processed"
MODELS_DIR = ML_DIR / "models"
PREP_PATH = PROCESSED_DIR / "preprocessor.joblib"
MODEL_PATH = MODELS_DIR / "final_model.joblib"

_pipeline: Optional[Dict[str, Any]] = None
_load_error: Optional[str] = None

def load_secom_pipeline() -> Dict[str, Any]:
    """
    Load the imputer+scaler (from ml/processed/preprocessor.joblib)
    and the trained model bundle (from ml/models/final_model.joblib).
    Reuses the exact structure and logic from ml/predict.py.
    """
    if not PREP_PATH.exists():
        raise FileNotFoundError(
            f"Missing {PREP_PATH}. Run ml/preprocess.py first."
        )
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Missing {MODEL_PATH}. Run ml/final_evaluate.py first."
        )

    prep = joblib.load(PREP_PATH)
    bundle = joblib.load(MODEL_PATH)

    return {
        "imputer": prep["imputer"],
        "scaler": prep["scaler"],
        "kept_features": prep["kept_features"],        # 440 cols in order
        "dropped_features": prep["dropped_features"],  # 150 cols dropped in cleaning
        "model": bundle["model"],
        "selected_features": bundle["selected_features"],  # top-50 features
    }

def init_secom_pipeline() -> None:
    """
    Loads model and preprocessor once at application startup.
    Catches errors gracefully so server startup is not blocked if artifacts
    are missing or need training.
    """
    global _pipeline, _load_error
    try:
        _pipeline = load_secom_pipeline()
        _load_error = None
        print(f"[SECOM] Pipeline loaded successfully from {ML_DIR}")
    except Exception as e:
        _pipeline = None
        _load_error = str(e)
        print(f"[SECOM] Warning: Pipeline could not be loaded at startup: {e}")

def get_secom_pipeline() -> Dict[str, Any]:
    """
    Returns the loaded pipeline singleton or attempts re-load if previously failed.
    Raises FileNotFoundError or RuntimeError if artifacts remain unavailable.
    """
    global _pipeline, _load_error
    if _pipeline is None:
        try:
            _pipeline = load_secom_pipeline()
            _load_error = None
        except Exception as e:
            _load_error = str(e)
            raise RuntimeError(f"SECOM ML pipeline unavailable: {_load_error}")
    return _pipeline

def predict_secom_rows(
    pipeline: Dict[str, Any],
    raw_rows: List[List[Optional[float]]],
    threshold: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Predict defect probability and flagging for raw SECOM sensor rows.
    
    raw_rows: List of lists containing exactly 590 sensor readings per row.
              Values can be None/NaN.
    threshold: Cutoff probability for flagging defect risk (default: 0.5).
               NOTE: Lower thresholds (e.g. 0.2 - 0.3) catch more real failures
               at the cost of more false alarms, per earlier model evaluation.
    """
    expected_raw_cols = len(pipeline["kept_features"]) + len(pipeline["dropped_features"])
    
    # Convert input to DataFrame
    raw_df = pd.DataFrame(raw_rows)
    
    if raw_df.shape[1] != expected_raw_cols:
        raise ValueError(
            f"Expected {expected_raw_cols} raw feature columns, "
            f"got {raw_df.shape[1]}. Each row must have the same number "
            f"and order of sensor readings as the original secom.data file."
        )

    # Replicate exact step order from ml/predict.py
    raw_df = raw_df.copy()
    raw_df.columns = [f"feature_{i}" for i in range(raw_df.shape[1])]

    # 1. Keep only columns decided in cleaning
    kept = pipeline["kept_features"]
    missing_expected = [c for c in kept if c not in raw_df.columns]
    if missing_expected:
        raise ValueError(f"Input is missing expected columns: {missing_expected[:5]}...")
    X = raw_df[kept]

    # 2. Impute missing values with learned medians
    X_filled = pd.DataFrame(
        pipeline["imputer"].transform(X), columns=kept, index=X.index
    )

    # 3. Scale using learned mean/std
    X_scaled = pd.DataFrame(
        pipeline["scaler"].transform(X_filled), columns=kept, index=X.index
    )

    # 4. Filter to top-k selected features
    X_final = X_scaled[pipeline["selected_features"]]

    # 5. Predict probabilities
    probs = pipeline["model"].predict_proba(X_final)[:, 1]

    results = []
    for idx, prob in enumerate(probs):
        p = float(prob)
        results.append({
            "row_index": idx,
            "probability": round(p, 4),
            "flagged": bool(p >= threshold)
        })

    return results
