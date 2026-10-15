import os
import json
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

def train_anomaly_model():
    data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "failure_data.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "failure_data.csv")
    df = pd.read_csv(data_path)
    
    # Train separate Isolation Forest per process type
    process_types = df['process_type'].unique()
    artifacts_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)
    
    features = ["vibration", "temperature", "pressure", "cycle_time"]
    
    models = {}
    for ptype in process_types:
        subset = df[df['process_type'] == ptype][features]
        
        model = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
            ('iforest', IsolationForest(n_estimators=100, contamination=0.05, random_state=42))
        ])
        
        print(f"Training Anomaly Model for {ptype}...")
        model.fit(subset)
        
        joblib.dump(model, os.path.join(artifacts_dir, f"anomaly_model_{ptype}.joblib"))
        models[ptype] = "trained"
        
    with open(os.path.join(artifacts_dir, "anomaly_features.json"), "w") as f:
        json.dump(features, f)
        
    print("Anomaly models trained for all process types.")
    return models

if __name__ == "__main__":
    train_anomaly_model()
