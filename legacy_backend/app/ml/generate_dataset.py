import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

# Ensure data directory exists
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)

def generate_failure_dataset(n_rows=40000):
    np.random.seed(42)
    # 24 machines
    machines = [f"M-{i:02d}" for i in range(1, 25)]
    process_types = ["ETCH", "DEPOSITION", "LITHOGRAPHY", "INSPECTION"]
    
    data = []
    # Simulating days
    for _ in range(n_rows // len(machines)):
        for m in machines:
            ptype = process_types[int(m[-2:]) % len(process_types)]
            age_months = np.random.uniform(3, 36)
            d = np.random.uniform(0, 1) # latent degradation
            
            nominal_vib = 5.0 if ptype == "ETCH" else 2.0
            nominal_temp = 300.0 if ptype == "ETCH" else 50.0
            nominal_press = 2.0
            rated_cycle = 60.0
            
            vibration = nominal_vib + 3.5 * d + 0.05 * age_months + np.random.normal(0, 0.2)
            temperature = nominal_temp + 6 * (d ** 2) + np.random.normal(0, 1.5)
            error_count = np.random.poisson(0.4 + 6 * d)
            cycle_time = rated_cycle * (1 + 0.18 * d) + np.random.normal(0, 1)
            pressure = nominal_press + (0.5 * d) + np.random.normal(0, 0.05)
            
            z_vib = (vibration - nominal_vib) / 1.0
            z_temp = (temperature - nominal_temp) / 5.0
            hours_since_maintenance_norm = d * 2.0
            prior_failures = np.random.poisson(d)
            age_norm = age_months / 36.0
            
            logit = 4.2*d + 0.9*z_vib + 0.6*z_temp + 0.5*hours_since_maintenance_norm + 0.4*prior_failures + 0.3*age_norm - 3.1
            prob = 1 / (1 + np.exp(-logit))
            failure_within_7_days = int(np.random.rand() < prob)
            
            data.append({
                "machine_id": m,
                "process_type": ptype,
                "age_months": age_months,
                "vibration": vibration,
                "temperature": temperature,
                "error_count": error_count,
                "cycle_time": cycle_time,
                "pressure": pressure,
                "hours_since_maintenance_norm": hours_since_maintenance_norm,
                "prior_failures": prior_failures,
                "failure_within_7_days": failure_within_7_days
            })
            
    df = pd.DataFrame(data)
    df.to_csv(os.path.join(DATA_DIR, "failure_data.csv"), index=False)
    print(f"Generated failure dataset: {len(df)} rows. Positive class ratio: {df['failure_within_7_days'].mean():.3f}")

def generate_defect_dataset(n_rows=50000):
    np.random.seed(42)
    stages = ["Wafer Preparation", "Cleaning", "Deposition", "Photolithography", "Etching", "Ion Implantation", "Metallization", "Inspection", "Testing"]
    
    data = []
    for _ in range(n_rows):
        stage = random.choice(stages)
        temp_dev = np.abs(np.random.normal(0, 2))
        press_dev = np.abs(np.random.normal(0, 0.1))
        dur_dev = np.abs(np.random.normal(0, 5))
        health = np.random.uniform(50, 100)
        utilization = np.random.uniform(50, 100)
        
        stage_risk = 2.0 if stage in ["Photolithography", "Etching"] else 0.5
        
        logit = 0.5 * temp_dev + 5.0 * press_dev + 0.1 * dur_dev - 0.05 * health + 0.02 * utilization + stage_risk - 3.0
        prob = 1 / (1 + np.exp(-logit))
        defect = int(np.random.rand() < prob)
        
        data.append({
            "stage": stage,
            "temp_deviation": temp_dev,
            "pressure_deviation": press_dev,
            "duration_deviation": dur_dev,
            "machine_health": health,
            "utilization": utilization,
            "defect": defect
        })
        
    df = pd.DataFrame(data)
    df.to_csv(os.path.join(DATA_DIR, "defect_data.csv"), index=False)
    print(f"Generated defect dataset: {len(df)} rows. Defect rate: {df['defect'].mean():.3f}")

def generate_yield_dataset(n_rows=10000):
    np.random.seed(42)
    data = []
    for _ in range(n_rows):
        avg_health = np.random.uniform(60, 100)
        process_dev_count = np.random.poisson(3)
        defect_density = np.random.exponential(1.5)
        
        stage_loss = 0.5 * (100 - avg_health) * 0.1 + 0.8 * process_dev_count + 1.2 * defect_density
        batch_yield = max(0, min(100, 100 - stage_loss))
        
        data.append({
            "avg_health": avg_health,
            "process_dev_count": process_dev_count,
            "defect_density": defect_density,
            "batch_yield": batch_yield
        })
        
    df = pd.DataFrame(data)
    df.to_csv(os.path.join(DATA_DIR, "yield_data.csv"), index=False)
    print(f"Generated yield dataset: {len(df)} rows. Avg Yield: {df['batch_yield'].mean():.1f}%")

if __name__ == "__main__":
    generate_failure_dataset()
    generate_defect_dataset()
    generate_yield_dataset()
    print("Dataset generation complete.")
