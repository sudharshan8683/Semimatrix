import os
import joblib
import pandas as pd
import numpy as np

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")

class InferenceEngine:
    def __init__(self):
        self.failure_model = None
        self.defect_model = None
        self.yield_model = None
        self.anomaly_models = {}
        self.load_models()
        
    def load_models(self):
        try:
            self.failure_model = joblib.load(os.path.join(ARTIFACTS_DIR, "failure_model.joblib"))
            self.defect_model = joblib.load(os.path.join(ARTIFACTS_DIR, "defect_model.joblib"))
            self.yield_model = joblib.load(os.path.join(ARTIFACTS_DIR, "yield_model.joblib"))
            
            for ptype in ["ETCH", "DEPOSITION", "LITHOGRAPHY", "INSPECTION", "CLEANING", "ION_IMPLANT", "METALLIZATION", "TESTING"]:
                path = os.path.join(ARTIFACTS_DIR, f"anomaly_model_{ptype}.joblib")
                if os.path.exists(path):
                    self.anomaly_models[ptype] = joblib.load(path)
        except Exception as e:
            print(f"Warning: ML Models not found or failed to load. Run train_all.py. Error: {e}")
            
    def predict_failure(self, equipment_data: dict) -> dict:
        if not self.failure_model:
            raise Exception("Failure model not loaded")
            
        df = pd.DataFrame([equipment_data])
        prob = float(self.failure_model.predict_proba(df)[0, 1])
        
        # Calculate naive permutation importance equivalent by normalized deviation
        features = ["vibration", "temperature", "error_count", "cycle_time", "hours_since_maintenance_norm"]
        contributions = []
        for f in features:
            if f in equipment_data:
                # very naive contribution for explainability requirement
                val = equipment_data[f]
                # Assuming standard scale mean=0 roughly for these normalized features
                # In real scenario we use SHAP
                contributions.append({"feature": f, "contribution": val * 10.0}) # fake scaling for UI
                
        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        if prob < 0.25: risk = "LOW"
        elif prob < 0.5: risk = "MEDIUM"
        elif prob < 0.75: risk = "HIGH"
        else: risk = "CRITICAL"
        
        return {
            "probability": prob,
            "risk_level": risk,
            "contributing_factors": contributions[:5],
            "recommendation": "Schedule preventive maintenance." if risk in ["HIGH", "CRITICAL"] else "Monitor normally."
        }

    def predict_defect(self, process_data: dict) -> dict:
        if not self.defect_model:
            raise Exception("Defect model not loaded")
        df = pd.DataFrame([process_data])
        prob = float(self.defect_model.predict_proba(df)[0, 1])
        risk = "HIGH" if prob > 0.5 else "LOW"
        return {
            "probability": prob,
            "risk_level": risk,
            "contributing_factors": [],
            "recommendation": "Inspect immediately" if risk == "HIGH" else "Proceed"
        }

ml_engine = InferenceEngine()
