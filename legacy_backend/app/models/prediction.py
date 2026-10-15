from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index=True, nullable=True)
    wafer_id = Column(Integer, ForeignKey("wafers.id"), index=True, nullable=True)
    
    model_name = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    prediction_type = Column(String, nullable=False) # FAILURE, DEFECT, YIELD, ANOMALY
    
    probability = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    contributing_factors = Column(JSON, nullable=True)
    recommendation = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    equipment = relationship("Equipment")
    wafer = relationship("Wafer")
