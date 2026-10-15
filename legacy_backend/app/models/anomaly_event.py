from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index=True, nullable=False)
    parameter = Column(String, nullable=False)
    
    current_value = Column(Float, nullable=False)
    normal_min = Column(Float, nullable=False)
    normal_max = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    
    severity = Column(String, nullable=False)
    probable_cause = Column(String, nullable=True)
    recommended_action = Column(String, nullable=True)
    detected_at = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="ACTIVE")

    equipment = relationship("Equipment")
