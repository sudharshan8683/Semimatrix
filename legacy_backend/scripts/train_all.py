import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.generate_dataset import generate_failure_dataset, generate_defect_dataset, generate_yield_dataset
from app.ml.train_failure_model import train_failure_model
from app.ml.train_defect_model import train_defect_model
from app.ml.train_yield_model import train_yield_model
from app.ml.train_anomaly_model import train_anomaly_model
import json

def main():
    print("=== Step 1: Generating Datasets ===")
    generate_failure_dataset()
    generate_defect_dataset()
    generate_yield_dataset()
    
    print("\n=== Step 2: Training Models ===")
    metrics = {}
    
    metrics["failure"] = train_failure_model()
    metrics["defect"] = train_defect_model()
    metrics["yield"] = train_yield_model()
    train_anomaly_model()
    
    artifacts_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app", "ml", "artifacts")
    with open(os.path.join(artifacts_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)
        
    print("\nAll models trained successfully. Metrics saved to artifacts/metrics.json")

if __name__ == "__main__":
    main()
