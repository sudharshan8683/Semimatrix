from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False) # INFO, WARNING, HIGH, CRITICAL
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index=True, nullable=True)
    wafer_id = Column(Integer, ForeignKey("wafers.id"), index=True, nullable=True)
    
    recommended_action = Column(String, nullable=True)
    status = Column(String, nullable=False, default="ACTIVE") # ACTIVE, ACKNOWLEDGED, RESOLVED
    
    created_at = Column(DateTime, server_default=func.now())
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

    equipment = relationship("Equipment")
    wafer = relationship("Wafer")
    acknowledger = relationship("User")
