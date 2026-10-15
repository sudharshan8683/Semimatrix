import sys
import os
from datetime import datetime, timedelta
import random

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal, Base
from app.models import (
    User, Equipment, ProcessStage, Batch, Wafer, 
    WaferStageHistory, ProductionRecord, MaintenanceRecord,
    DefectRecord, SensorReading
)
from app.auth.security import get_password_hash

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def seed_users(db):
    if db.query(User).count() == 0:
        users = [
            User(username="admin", email="admin@fabsense.local", hashed_password=get_password_hash("admin123"), role="ADMIN"),
            User(username="prod_mgr", email="prod@fabsense.local", hashed_password=get_password_hash("prod123"), role="PRODUCTION_MANAGER"),
            User(username="maint_eng", email="maint@fabsense.local", hashed_password=get_password_hash("maint123"), role="MAINTENANCE_ENGINEER"),
            User(username="qual_eng", email="qual@fabsense.local", hashed_password=get_password_hash("qual123"), role="QUALITY_ENGINEER"),
            User(username="viewer", email="viewer@fabsense.local", hashed_password=get_password_hash("viewer123"), role="VIEWER"),
        ]
        db.add_all(users)
        db.commit()
        print("Users seeded.")

def seed_stages(db):
    if db.query(ProcessStage).count() == 0:
        stage_names = [
            "Wafer Preparation", "Cleaning", "Deposition", 
            "Photolithography", "Etching", "Ion Implantation", 
            "Metallization", "Inspection", "Testing"
        ]
        stages = []
        for i, name in enumerate(stage_names):
            stages.append(ProcessStage(
                name=name,
                sequence_index=i+1,
                nominal_duration_min=random.uniform(15.0, 120.0),
                process_type=name.upper().replace(" ", "_")
            ))
        db.add_all(stages)
        db.commit()
        print("Process Stages seeded.")

def seed_equipment(db):
    if db.query(Equipment).count() == 0:
        process_types = [
            "LITHOGRAPHY", "ETCH", "DEPOSITION", "CLEANING", 
            "ION_IMPLANT", "METALLIZATION", "INSPECTION", "TESTING"
        ]
        equipments = []
        for i in range(1, 25):
            ptype = random.choice(process_types)
            equipments.append(Equipment(
                machine_id=f"{ptype[:4]}-{i:02d}",
                name=f"{ptype.title()} Tool {i}",
                process_type=ptype,
                bay_zone=f"Bay {random.randint(1, 4)}",
                status="IDLE",
                install_date=datetime.utcnow() - timedelta(days=random.randint(100, 1000)),
                age_months=random.uniform(3.0, 36.0),
                temp_min=random.uniform(20.0, 100.0),
                temp_max=random.uniform(120.0, 400.0),
                pressure_min=random.uniform(0.1, 1.0),
                pressure_max=random.uniform(1.5, 5.0),
                vibration_max=random.uniform(2.0, 10.0),
                rated_cycle_time=random.uniform(30.0, 150.0),
                health_score=random.uniform(80.0, 100.0)
            ))
        db.add_all(equipments)
        db.commit()
        print("Equipment seeded.")

def seed_batches_and_wafers(db):
    if db.query(Batch).count() == 0:
        stages = db.query(ProcessStage).all()
        equipments = db.query(Equipment).all()
        
        batches = []
        for i in range(1, 13):
            b = Batch(
                batch_id=f"B-{datetime.utcnow().year}-{i:04d}",
                lot_size=25,
                product_family=random.choice(["Memory", "Logic", "Analog", "Power"]),
                started_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                status="IN_PROGRESS"
            )
            batches.append(b)
        db.add_all(batches)
        db.commit()
        
        wafers = []
        for b in batches:
            for w in range(1, b.lot_size + 1):
                stage = random.choice(stages)
                equipment = random.choice([e for e in equipments if e.process_type.replace("_", "") in stage.process_type.replace("_", "")]) if random.random() > 0.5 else None
                wafers.append(Wafer(
                    wafer_id=f"{b.batch_id}-W{w:02d}",
                    batch_id=b.id,
                    current_stage_id=stage.id,
                    current_equipment_id=equipment.id if equipment else None,
                    status="IN_PROCESS",
                    started_at=b.started_at
                ))
        db.add_all(wafers)
        db.commit()
        print("Batches and Wafers seeded.")

def main():
    db = SessionLocal()
    try:
        seed_users(db)
        seed_stages(db)
        seed_equipment(db)
        seed_batches_and_wafers(db)
        print("Database initialized successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
