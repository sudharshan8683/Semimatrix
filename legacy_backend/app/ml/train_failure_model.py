import os
import json
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.ml.features import get_failure_feature_pipeline

def train_failure_model():
    data_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "failure_data.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "failure_data.csv")
    df = pd.read_csv(data_path)
    
    # Sort by some proxy for time if available, otherwise just use standard split (we didn't generate explicit timestamps, but rows are chronological)
    train_size = int(len(df) * 0.8)
    train_df = df.iloc[:train_size]
    test_df = df.iloc[train_size:]
    
    preprocessor, feature_names = get_failure_feature_pipeline()
    
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', GradientBoostingClassifier(n_estimators=100, random_state=42))
    ])
    
    y_train = train_df['failure_within_7_days']
    y_test = test_df['failure_within_7_days']
    
    print("Training Failure Prediction Model...")
    model.fit(train_df, y_train)
    
    preds = model.predict(test_df)
    probs = model.predict_proba(test_df)[:, 1]
    
    metrics = {
        "accuracy": float(accuracy_score(y_test, preds)),
        "precision": float(precision_score(y_test, preds)),
        "recall": float(recall_score(y_test, preds)),
        "f1": float(f1_score(y_test, preds)),
        "roc_auc": float(roc_auc_score(y_test, probs))
    }
    print("Failure Model Metrics:", metrics)
    
    artifacts_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)
    
    joblib.dump(model, os.path.join(artifacts_dir, "failure_model.joblib"))
    
    with open(os.path.join(artifacts_dir, "failure_features.json"), "w") as f:
        json.dump(feature_names, f)
        
    return metrics

if __name__ == "__main__":
    train_failure_model()
