from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alert, Equipment

router = APIRouter(prefix="/alerts", tags=["alerts"])

class AlertUpdateStatusRequest(BaseModel):
    status: str # ACTIVE, ACKNOWLEDGED, IN_PROGRESS, RESOLVED
    notes: Optional[str] = None

def _ensure_seed_alerts(db: Session):
    count = db.query(Alert).count()
    if count == 0:
        eqs = db.query(Equipment).all()
        eq_map = {e.machine_id: e.id for e in eqs}
        
        sample_alerts = [
            {
                "alert_type": "EQUIPMENT_ANOMALY",
                "severity": "CRITICAL",
                "title": "Chamber Pressure Drift Detected",
                "description": "Pressure exceeded 3.42 Torr during Cl2 etch cycle (Normal: 1.20 - 2.80 Torr). Risk of anisotropic profile failure.",
                "equipment_id": eq_map.get("ETCH-02", eqs[0].id if eqs else None),
                "recommended_action": "Halt lot processing. Inspect turbo-molecular exhaust throttle valve and purge seal ring.",
                "status": "ACTIVE",
                "created_at": datetime.utcnow() - timedelta(minutes=42)
            },
            {
                "alert_type": "PREDICTIVE_FAILURE",
                "severity": "HIGH",
                "title": "RF Generator Harmonic Distortion",
                "description": "Spectral vibration harmonics indicate high impedance mismatch and dielectric breakdown risk.",
                "equipment_id": eq_map.get("ETCH-03", eqs[1].id if len(eqs) > 1 else None),
                "recommended_action": "Check match network tuning capacitors and clean dielectric isolation plate.",
                "status": "ACTIVE",
                "created_at": datetime.utcnow() - timedelta(hours=2, minutes=15)
            },
            {
                "alert_type": "YIELD_DEVIATION",
                "severity": "HIGH",
                "title": "Wafer Lot Scrap Excursion Warning",
                "description": "Lot B-2026-0004 wafer defect count exceeds 3-sigma statistical process control (SPC) threshold.",
                "equipment_id": eq_map.get("LITH-01", eqs[2].id if len(eqs) > 2 else None),
                "recommended_action": "Quarantine affected lot B-2026-0004 and verify reticle alignment calibration.",
                "status": "ACKNOWLEDGED",
                "created_at": datetime.utcnow() - timedelta(hours=4, minutes=5)
            },
            {
                "alert_type": "EQUIPMENT_ANOMALY",
                "severity": "WARNING",
                "title": "Showerhead Pre-Heat Temperature Drift",
                "description": "CVD precursor showerhead operating at 168°C vs nominal 150°C (+12% thermal excursion).",
                "equipment_id": eq_map.get("DEPO-04", eqs[3].id if len(eqs) > 3 else None),
                "recommended_action": "Verify thermocouple TC-3 loop feedback and calibrate PID heating elements.",
                "status": "IN_PROGRESS",
                "created_at": datetime.utcnow() - timedelta(hours=7, minutes=30)
            },
            {
                "alert_type": "MAINTENANCE_DUE",
                "severity": "WARNING",
                "title": "CMP Polishing Pad Lifetime Threshold Reached",
                "description": "Conditioning disk counter reached 1,240 cycles. Pad groove depth approaching minimum spec.",
                "equipment_id": eq_map.get("CLEA-05", eqs[4].id if len(eqs) > 4 else None),
                "recommended_action": "Schedule pad dress and slurry delivery nozzle rinse during shift changeover.",
                "status": "ACTIVE",
                "created_at": datetime.utcnow() - timedelta(hours=14)
            },
            {
                "alert_type": "SYSTEM_INFO",
                "severity": "INFO",
                "title": "Baseline Telemetry Sync Verified",
                "description": "All 24 cleanroom bay sensors synced with real-time digital twin telemetry loop.",
                "equipment_id": eqs[0].id if eqs else None,
                "recommended_action": "No action needed. Periodic health routine completed.",
                "status": "RESOLVED",
                "created_at": datetime.utcnow() - timedelta(days=1, hours=2)
            }
        ]
        
        for item in sample_alerts:
            alert = Alert(**item)
            db.add(alert)
        db.commit()

@router.get("")
def list_alerts(
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    equipment_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    _ensure_seed_alerts(db)
    query = db.query(Alert)
    
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if equipment_id:
        query = query.filter(Alert.equipment_id == equipment_id)
        
    alerts = query.order_by(Alert.created_at.desc()).all()
    
    # Format with equipment machine_id and name
    results = []
    for a in alerts:
        eq = db.query(Equipment).filter(Equipment.id == a.equipment_id).first() if a.equipment_id else None
        results.append({
            "id": a.id,
            "alert_id": f"ALT-{a.id:04d}",
            "alert_type": a.alert_type,
            "severity": a.severity,
            "title": a.title,
            "description": a.description,
            "equipment_id": a.equipment_id,
            "machine_id": eq.machine_id if eq else "FAB-SYS",
            "equipment_name": eq.name if eq else "Cleanroom System",
            "recommended_action": a.recommended_action,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else datetime.utcnow().isoformat(),
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None
        })
        
    return {
        "items": results,
        "total": len(results),
        "open_count": sum(1 for r in results if r["status"] in ["ACTIVE", "OPEN"]),
        "high_risk_count": sum(1 for r in results if r["severity"] in ["CRITICAL", "HIGH"] and r["status"] != "RESOLVED")
    }

@router.patch("/{alert_id}/status")
@router.patch("/{alert_id}")
def update_alert_status(
    alert_id: int,
    payload: AlertUpdateStatusRequest,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    new_status = payload.status.upper()
    valid_statuses = ["ACTIVE", "OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    alert.status = new_status
    if new_status in ["ACKNOWLEDGED", "IN_PROGRESS"] and not alert.acknowledged_at:
        alert.acknowledged_at = datetime.utcnow()
        
    db.commit()
    db.refresh(alert)
    return {
        "id": alert.id,
        "status": alert.status,
        "updated_at": datetime.utcnow().isoformat(),
        "message": f"Alert ALT-{alert.id:04d} status updated to {alert.status}"
    }

@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    return update_alert_status(alert_id, AlertUpdateStatusRequest(status="ACKNOWLEDGED"), db)
