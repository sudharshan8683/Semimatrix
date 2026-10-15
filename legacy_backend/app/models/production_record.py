from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    shift = Column(String, nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index=True, nullable=False)
    
    wafers_started = Column(Integer, default=0)
    wafers_completed = Column(Integer, default=0)
    wafers_good = Column(Integer, default=0)
    wafers_defective = Column(Integer, default=0)
    downtime_minutes = Column(Float, default=0.0)

    equipment = relationship("Equipment")
