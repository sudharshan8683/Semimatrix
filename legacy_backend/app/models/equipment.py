from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    process_type = Column(String, nullable=False) # LITHOGRAPHY, ETCH, DEPOSITION, etc.
    bay_zone = Column(String, nullable=False)
    status = Column(String, nullable=False, default="IDLE") # RUNNING, IDLE, WARNING, CRITICAL, MAINTENANCE, OFFLINE
    
    install_date = Column(DateTime, nullable=False)
    age_months = Column(Float, nullable=False, default=0)
    
    temp_min = Column(Float, nullable=False)
    temp_max = Column(Float, nullable=False)
    pressure_min = Column(Float, nullable=False)
    pressure_max = Column(Float, nullable=False)
    vibration_max = Column(Float, nullable=False)
    rated_cycle_time = Column(Float, nullable=False)
    
    total_operating_hours = Column(Float, default=0.0)
    last_maintenance_at = Column(DateTime, nullable=True)
    next_maintenance_due = Column(DateTime, nullable=True)
    
    health_score = Column(Float, default=100.0)
    utilization_pct = Column(Float, default=0.0)
    
    current_wafer_id = Column(String, nullable=True)
    total_failures = Column(Integer, default=0)
