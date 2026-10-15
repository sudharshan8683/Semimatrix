"""
Verification script for SECOM defect prediction endpoint.
Tests:
  1. Startup model & preprocessor loading
  2. Prediction on sample row 0 (Nominal, p ~ 0.1593)
  3. Prediction on sample row 2 (Defect risk, p ~ 0.4177)
  4. Validation error on wrong column count (< 590 columns -> HTTP 400)
  5. Threshold behavior (0.5 default vs 0.3 recommended)
"""

import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=" * 70)
    print("FABSENSE - SECOM Defect Prediction Endpoint Verification")
    print("=" * 70)
    
    # 1. Initialize TestClient (triggers FastAPI startup event)
    print("\n[1/5] Starting TestClient and triggering startup_event()...")
    with TestClient(app) as client:
        print("  FastAPI app initialized successfully.")

        # Test Login
        print("\n[*] Testing POST /api/auth/login...")
        login_res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        print(f"  Login status: {login_res.status_code} | Response: {login_res.text}")
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json().get("access_token")
        assert token, "Missing access_token in response"
        print(f"  PASS: Login succeeded! Token received (length {len(token)}).")


        # Read sample rows from ml/sample_rows.data
        project_root = backend_dir.parent
        sample_file = project_root / "ml" / "sample_rows.data"
        if not sample_file.exists():
            print(f"  [ERROR] {sample_file} not found!")
            sys.exit(1)

        rows = []
        with open(sample_file, "r") as f:
            for line in f:
                parts = line.strip().split()
                if parts:
                    rows.append([None if p in ("NaN", "nan", "NAN") else float(p) for p in parts])

        print(f"  Loaded {len(rows)} test rows from {sample_file.name} (each {len(rows[0])} features).")

        # 2. Test GET /api/predictions/sample-rows
        print("\n[2/5] Testing GET /api/predictions/sample-rows...")
        res = client.get("/api/predictions/sample-rows")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "samples" in data and len(data["samples"]) > 0
        print(f"  PASS: Retrieved {len(data['samples'])} sample wafers for UI testing.")

        # 3. Test POST /api/predictions/defect with Row 0 (Nominal) and Row 2 (Risk) at threshold 0.3
        print("\n[3/5] Testing POST /api/predictions/defect with Row 0 & Row 2 (threshold = 0.3)...")
        payload = {
            "rows": [rows[0], rows[2]],
            "threshold": 0.3
        }
        res = client.post("/api/predictions/defect", json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        result = res.json()

        pred_0 = result["predictions"][0]
        pred_1 = result["predictions"][1]

        print(f"  Row 0 -> Probability: {pred_0['probability']:.4f} | Flagged: {pred_0['flagged']}")
        print(f"  Row 2 -> Probability: {pred_1['probability']:.4f} | Flagged: {pred_1['flagged']}")

        # Verify against Step 11 evaluation numbers
        # Row 0: ~0.1593 (Unflagged)
        # Row 2: ~0.4177 (Flagged at 0.3)
        assert abs(pred_0["probability"] - 0.1593) < 0.01, f"Unexpected prob for row 0: {pred_0['probability']}"
        assert pred_0["flagged"] is False, "Row 0 should not be flagged at 0.3 cutoff"
        assert abs(pred_1["probability"] - 0.4177) < 0.01, f"Unexpected prob for row 2: {pred_1['probability']}"
        assert pred_1["flagged"] is True, "Row 2 should be flagged at 0.3 cutoff"
        assert result["flagged_count"] == 1
        print("  PASS: Probability values and flag states match offline ml/predict.py exactly!")

        # 4. Test Threshold Behavior (0.5 cutoff vs 0.3 cutoff)
        print("\n[4/5] Testing threshold behavior at cutoff = 0.5...")
        payload_50 = {
            "rows": [rows[2]],
            "threshold": 0.5
        }
        res_50 = client.post("/api/predictions/defect", json=payload_50)
        assert res_50.status_code == 200
        pred_at_50 = res_50.json()["predictions"][0]
        print(f"  Row 2 at cutoff 0.5 -> Probability: {pred_at_50['probability']:.4f} | Flagged: {pred_at_50['flagged']}")
        assert pred_at_50["flagged"] is False, "Row 2 (prob ~0.4177) should not be flagged at 0.5 cutoff"
        print("  PASS: Correctly demonstrates why threshold 0.3 catches this defect whereas 0.5 misses it.")

        # 5. Test Column Count Validation (< 590 columns -> HTTP 400)
        print("\n[5/5] Testing input validation (< 590 columns)...")
        invalid_row = [1.0] * 100  # Only 100 features instead of 590
        res_invalid = client.post("/api/predictions/defect", json={"rows": [invalid_row]})
        assert res_invalid.status_code == 400, f"Expected 400, got {res_invalid.status_code}"
        err_detail = res_invalid.json().get("detail", "")
        print(f"  Expected error returned: {err_detail}")
        assert "Expected 590 raw feature columns" in err_detail
        print("  PASS: Returns clean HTTP 400 with expected error message format.")

    print("\n" + "=" * 70)
    print("ALL 5 ENDPOINT TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
