from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index=True, nullable=False)
    type = Column(String, nullable=False) # PREVENTIVE, CORRECTIVE, PREDICTIVE
    
    scheduled_at = Column(DateTime, nullable=True)
    performed_at = Column(DateTime, nullable=True)
    downtime_minutes = Column(Float, default=0.0)
    
    technician = Column(String, nullable=True)
    parts_replaced = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    cost = Column(Float, default=0.0)
    
    triggered_by_prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=True)

    equipment = relationship("Equipment")
    # prediction relationship can be added if needed, but not strictly required for now
