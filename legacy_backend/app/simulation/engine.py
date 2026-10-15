import random
import time
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Equipment, Wafer, Alert
from app.simulation.profiles import PROFILES
from app.ingestion.ingest import ingest_reading
from app.routers.websocket import manager

def broadcast_live_data(db: Session, equipments):
    total_eq = len(equipments)
    if total_eq == 0:
        return
        
    running_eq = sum(1 for e in equipments if e.status == "RUNNING")
    idle_eq = sum(1 for e in equipments if e.status == "IDLE")
    
    uptime_pct = ((running_eq + idle_eq) / total_eq * 100)
    utilization_pct = (running_eq / total_eq * 100)
    
    current_yield = 97.8 + random.uniform(-0.5, 0.8)
    tools_at_risk = sum(1 for e in equipments if (e.health_score and e.health_score < 75) or e.status in ["WARNING", "CRITICAL", "DOWN"])
    upcoming_maint = sum(1 for e in equipments if e.status == "MAINTENANCE" or (e.health_score and 75 <= e.health_score < 85))
    
    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()

    # Simulate wafers processed (grows over time based on uptime)
    base_wafers = 12450
    time_offset = int((time.time() - 1700000000) / 10) # arbitrary growth
    good_wafers = base_wafers + int(time_offset * (current_yield / 100))
    
    # Simulate potential lost wafers due to tools in maintenance or at risk
    # Assume each tool could process ~144 wafers per day
    lost_wafers = (tools_at_risk + upcoming_maint) * 144

    kpis = {
        "uptime": round(uptime_pct, 1),
        "yield": round(current_yield, 2),
        "at_risk": tools_at_risk,
        "upcoming_maintenance": upcoming_maint,
        "active_alerts": active_alerts,
        "utilization": round(utilization_pct, 1),
        "good_wafers": good_wafers,
        "lost_wafers": lost_wafers
    }
    
    eq_list = []
    for eq in equipments:
        eq_list.append({
            "id": eq.id,
            "machine_id": eq.machine_id,
            "name": eq.name,
            "status": eq.status,
            "process_type": eq.process_type,
            "health_score": round(eq.health_score, 1) if eq.health_score else 100,
            "bay_zone": eq.bay_zone,
        })
        
    payload = {
        "type": "LIVE_UPDATE",
        "tick": time.time(),
        "kpis": kpis,
        "equipment": eq_list
    }
    
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast(payload))
        else:
            asyncio.run(manager.broadcast(payload))
    except RuntimeError:
        asyncio.run(manager.broadcast(payload))

class SimulationEngine:
    def __init__(self):
        self.speed = 1.0
        self.is_running = True

    def tick(self):
        if not self.is_running:
            return
            
        db = SessionLocal()
        try:
            # 1. Advance sensor values with bounded random walk
            equipments = db.query(Equipment).all()
            for eq in equipments:
                if eq.status == "OFFLINE":
                    continue
                    
                prof = PROFILES.get(eq.process_type, PROFILES["TESTING"])
                
                payload = {
                    "equipment_id": eq.id,
                    "timestamp": datetime.utcnow(),
                    "temperature": prof.temp_nom + random.uniform(-1, 1),
                    "pressure": prof.press_nom + random.uniform(-0.1, 0.1),
                    "vibration": prof.vib_nom + random.uniform(-0.5, 0.5),
                    "power_draw": 10.0 + random.uniform(-1, 1),
                    "gas_flow": 5.0 + random.uniform(-0.5, 0.5),
                    "chamber_humidity": 45.0 + random.uniform(-2, 2),
                    "particle_count": int(random.uniform(0, 10)),
                    "cycle_time": prof.cycle_nom,
                    "error_count": 0
                }
                
                ingest_reading(db, payload)
                
                # 2. State transitions (simplified)
                if eq.status == "IDLE" and random.random() < 0.05:
                    eq.status = "RUNNING"
                elif eq.status == "RUNNING" and random.random() < 0.05:
                    eq.status = "IDLE"
                    
            db.commit()
            
            # 3. WS Broadcast
            broadcast_live_data(db, equipments)
            
        finally:
            db.close()

engine_instance = SimulationEngine()
