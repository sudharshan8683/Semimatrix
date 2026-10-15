from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Equipment, Alert

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/kpis")
@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    equipments = db.query(Equipment).all()
    total_eq = len(equipments)

    running_eq = sum(1 for e in equipments if e.status == "RUNNING")
    idle_eq = sum(1 for e in equipments if e.status == "IDLE")
    warning_eq = sum(1 for e in equipments if e.status == "WARNING")
    critical_eq = sum(1 for e in equipments if e.status in ["CRITICAL", "DOWN"])
    maint_eq = sum(1 for e in equipments if e.status == "MAINTENANCE")

    healthy_eq = sum(1 for e in equipments if (e.health_score or 100) >= 85 and e.status in ["RUNNING", "IDLE"])
    requiring_attention = warning_eq + maint_eq
    high_risk_eq = critical_eq + sum(1 for e in equipments if (e.health_score or 100) < 70)

    # Active alerts
    active_alerts = db.query(Alert).filter(Alert.status.in_(["ACTIVE", "OPEN"])).count()
    critical_alerts = db.query(Alert).filter(Alert.status.in_(["ACTIVE", "OPEN"]), Alert.severity.in_(["CRITICAL", "HIGH"])).count()

    # Yield metrics
    current_yield = 97.72
    yield_trend_pct = +0.62
    estimated_downtime_hours = round(critical_eq * 8.5 + warning_eq * 2.8 + 3.2, 1)

    # Health distribution for pie/bar chart
    health_distribution = [
        {"name": "Optimal Health (>90%)", "count": sum(1 for e in equipments if (e.health_score or 100) >= 90), "color": "#34d399"},
        {"name": "Adequate (75-89%)", "count": sum(1 for e in equipments if 75 <= (e.health_score or 100) < 90), "color": "#38bdf8"},
        {"name": "Elevated Risk (60-74%)", "count": sum(1 for e in equipments if 60 <= (e.health_score or 100) < 75), "color": "#fbbf24"},
        {"name": "Critical Condition (<60%)", "count": sum(1 for e in equipments if (e.health_score or 100) < 60), "color": "#f87171"}
    ]

    # "What needs attention today?" priority triage items
    triage_items = [
        {
            "id": "TRG-01",
            "priority": "P1 - Immediate",
            "title": "ETCH-02 Plasma Chamber Exhaust Excursion",
            "category": "Equipment Anomaly",
            "machine_id": "ETCH-02",
            "reason": "Exhaust pressure drift (3.42 Torr) exceeds 2.80 Torr upper control limit. 42 minutes unresolved.",
            "recommended_action": "Quarantine tool. Run leak-rate diagnostic routine and inspect isolation valves.",
            "status": "URGENT"
        },
        {
            "id": "TRG-02",
            "priority": "P2 - Scheduled Today",
            "title": "ETCH-03 Bearing Vibration Harmonic Warning",
            "category": "Predictive Maintenance",
            "machine_id": "ETCH-03",
            "reason": "High vibration velocity (4.1 mm/s). Predictive horizon: 18-36 hours before ceramic spindle wear.",
            "recommended_action": "Order replacement ceramic bearing kit; schedule maintenance at shift changeover.",
            "status": "WARNING"
        },
        {
            "id": "TRG-03",
            "priority": "P3 - Process Review",
            "title": "Lot B-2026-0004 Scrap Review",
            "category": "Wafer Yield",
            "machine_id": "LITH-01",
            "reason": "Yield dropped to 92.0% (target 97.5%) due to reticle alignment edge distortion.",
            "recommended_action": "Review stepper lens calibration report with Quality Engineering.",
            "status": "ATTENTION"
        }
    ]

    # Predicted vs Actual Failure benchmark tracking (for explainable validation)
    predicted_vs_actual = [
        {"month": "May 2026", "predicted_failures": 6, "actual_failures": 5, "accuracy_pct": 83.3},
        {"month": "Jun 2026", "predicted_failures": 8, "actual_failures": 7, "accuracy_pct": 87.5},
        {"month": "Jul 2026", "predicted_failures": 5, "actual_failures": 5, "accuracy_pct": 100.0},
        {"month": "Aug 2026", "predicted_failures": 9, "actual_failures": 8, "accuracy_pct": 88.9},
        {"month": "Sep 2026", "predicted_failures": 7, "actual_failures": 6, "accuracy_pct": 85.7},
        {"month": "Oct 2026 (MTD)", "predicted_failures": 4, "actual_failures": 3, "accuracy_pct": 75.0}
    ]

    return {
        "kpis": {
            "total_equipment": total_eq,
            "healthy_equipment": healthy_eq,
            "requiring_attention": requiring_attention,
            "high_risk_equipment": high_risk_eq,
            "predicted_failure_risk_pct": round((high_risk_eq / total_eq) * 100, 1) if total_eq else 12.5,
            "current_yield_pct": current_yield,
            "yield_trend_pct": yield_trend_pct,
            "active_alerts_count": active_alerts,
            "critical_alerts_count": critical_alerts,
            "estimated_downtime_hours": estimated_downtime_hours,
            "fab_utilization_pct": round((running_eq / total_eq) * 100, 1) if total_eq else 78.0
        },
        "health_distribution": health_distribution,
        "triage_items": triage_items,
        "predicted_vs_actual": predicted_vs_actual,
        "system_status": {
            "mode": "Simulated Demonstration Data",
            "telemetry_source": "Deterministic Physics Digital Twin Engine (Bays 1-4)",
            "ml_model_status": "Active (SECOM 50-Feature Random Forest)",
            "last_synced": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
    }
