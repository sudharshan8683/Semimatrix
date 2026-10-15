import sys
from pathlib import Path

# Add ml/service to path
SERVICE_DIR = Path(__file__).resolve().parent.parent / "service"
sys.path.insert(0, str(SERVICE_DIR))

import main


def test_health_check():
    res = main.health_check()
    assert res["status"] == "healthy"
    assert "secom_model_loaded" in res


def test_anomaly_scoring_clean_telemetry():
    req = main.AnomalyScoreRequest(
        equipment_id="CVD-01",
        telemetry=[
            {"temperature": 400.1, "pressure": 2500.5},
            {"temperature": 400.3, "pressure": 2498.9},
            {"temperature": 400.0, "pressure": 2501.2}
        ],
        nominal_specs={
            "temperature": {"nominal": 400.0, "usl": 415.0, "lsl": 385.0},
            "pressure": {"nominal": 2500.0, "usl": 2650.0, "lsl": 2350.0}
        }
    )
    res = main.score_anomaly(req)
    assert res.equipment_id == "CVD-01"
    assert res.anomaly_score < 0.5
    assert res.is_anomaly is False


def test_anomaly_scoring_out_of_spec_tripwire():
    req = main.AnomalyScoreRequest(
        equipment_id="CVD-01",
        telemetry=[
            {"temperature": 420.5, "pressure": 2500.0} # Temperature > USL (415.0)
        ],
        nominal_specs={
            "temperature": {"nominal": 400.0, "usl": 415.0, "lsl": 385.0},
            "pressure": {"nominal": 2500.0, "usl": 2650.0, "lsl": 2350.0}
        }
    )
    res = main.score_anomaly(req)
    assert len(res.parameter_deviations) > 0
    assert res.parameter_deviations[0]["parameter"] == "temperature"
    assert res.parameter_deviations[0]["severity"] == "critical"
    assert res.is_anomaly is True


def test_health_risk_honest_label_documentation():
    # When insufficient positive failure labels (< 10), supervised ML must be reported as unavailable
    req = main.HealthRiskRequest(
        equipment_id="ETCH-02",
        drift_slope=0.85,
        anomaly_rate=0.45,
        spc_violations_count=3,
        days_since_maintenance=45.0,
        active_alarms_count=2,
        has_labelled_failures=True,
        positive_failure_samples=3 # Less than 10
    )
    res = main.score_health_risk(req)
    assert res.supervised_available is False
    assert "insufficient labelled failure events" in res.supervised_model_note
    assert res.health_index < 60.0
    assert res.failure_probability > 0.40


def test_secom_benchmark_metrics():
    res = main.get_secom_metrics()
    assert res["dataset"] == "UCI SECOM Semiconductor Process Dataset"
    assert "class_imbalance" in res
    assert res["class_imbalance"]["test_total_wafers"] == 314
    assert res["class_imbalance"]["test_positive_fails"] == 17
    # Verify realistic PR-AUC and honest commentary
    assert res["metrics"]["pr_auc"] == 0.0719
    assert res["metrics"]["precision_at_0_5"] == 0.0
    assert "severely imbalanced" in res["honest_evaluation_summary"]
