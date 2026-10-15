import os
import json
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.ml.features import get_yield_feature_pipeline

def train_yield_model():
    data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "yield_data.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "yield_data.csv")
    df = pd.read_csv(data_path)
    
    train_size = int(len(df) * 0.8)
    train_df = df.iloc[:train_size]
    test_df = df.iloc[train_size:]
    
    preprocessor, feature_names = get_yield_feature_pipeline()
    
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    y_train = train_df['batch_yield']
    y_test = test_df['batch_yield']
    
    print("Training Yield Prediction Model...")
    model.fit(train_df, y_train)
    
    preds = model.predict(test_df)
    
    metrics = {
        "rmse": float(mean_squared_error(y_test, preds, squared=False)),
        "mae": float(mean_absolute_error(y_test, preds)),
        "r2": float(r2_score(y_test, preds))
    }
    print("Yield Model Metrics:", metrics)
    
    artifacts_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)
    
    joblib.dump(model, os.path.join(artifacts_dir, "yield_model.joblib"))
    
    with open(os.path.join(artifacts_dir, "yield_features.json"), "w") as f:
        json.dump(feature_names, f)
        
    return metrics

if __name__ == "__main__":
    train_yield_model()
