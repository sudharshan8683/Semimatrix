from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Equipment, Alert, SensorReading
from app.simulation.engine import engine_instance

router = APIRouter(prefix="/simulation", tags=["simulation"])

@router.post("/start")
def start_simulation():
    engine_instance.is_running = True
    return {"status": "running"}

@router.post("/pause")
def pause_simulation():
    engine_instance.is_running = False
    return {"status": "paused"}

@router.post("/reset")
def reset_simulation(db: Session = Depends(get_db)):
    equipments = db.query(Equipment).all()
    for eq in equipments:
        eq.status = "RUNNING" if eq.id % 4 != 0 else "IDLE"
        eq.health_score = 94.0 + (eq.id % 5)
    db.commit()
    return {"status": "reset_completed", "message": "All fab equipment restored to nominal operating state"}

@router.put("/speed")
@router.post("/speed")
def set_speed(speed: float = 1.0):
    engine_instance.speed = max(0.5, min(10.0, speed))
    return {"speed": engine_instance.speed}

@router.post("/inject-anomaly")
def inject_anomaly(tool_id: str = "ETCH-02", db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.machine_id == tool_id).first()
    if not eq:
        eq = db.query(Equipment).first()
        
    if eq:
        eq.status = "CRITICAL"
        eq.health_score = 48.5
        
        # Add high-pressure reading
        reading = SensorReading(
            equipment_id=eq.id,
            timestamp=datetime.utcnow(),
            temperature=98.5,
            pressure=3.85, # High excursion
            vibration=4.95, # High vibration
            power_draw=14.2,
            gas_flow=6.8,
            chamber_humidity=46.0,
            particle_count=24,
            cycle_time=85.0,
            error_count=3
        )
        db.add(reading)
        
        # Inject matching alert
        alert = Alert(
            alert_type="EQUIPMENT_ANOMALY",
            severity="CRITICAL",
            title=f"{eq.machine_id} Turbo Exhaust Pressure Excursion",
            description=f"Chamber vacuum pressure reached 3.85 Torr (+85% above 2.15 Torr nominal). High risk of wafer scrap.",
            equipment_id=eq.id,
            recommended_action="Quarantine tool immediately. Inspect turbo exhaust throttle seal and conductance valve.",
            status="ACTIVE",
            created_at=datetime.utcnow()
        )
        db.add(alert)
        db.commit()
        
    return {
        "status": "anomaly_injected",
        "machine_id": eq.machine_id if eq else tool_id,
        "message": f"Injected pressure excursion and vibration anomaly on {eq.machine_id if eq else tool_id}."
    }

@router.get("/status")
def get_simulation_status():
    return {
        "is_running": engine_instance.is_running,
        "speed": engine_instance.speed,
        "mode": "Simulated Demonstration Data",
        "data_provenance": "Synthetic Digital Twin Physics Engine (Deterministic)"
    }
