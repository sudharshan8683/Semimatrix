from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class WaferStageHistory(Base):
    __tablename__ = "wafer_stage_history"

    id = Column(Integer, primary_key=True, index=True)
    wafer_id = Column(Integer, ForeignKey("wafers.id"), index=True, nullable=False)
    stage_id = Column(Integer, ForeignKey("process_stages.id"), index=True, nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index=True, nullable=True)
    
    entered_at = Column(DateTime, nullable=False)
    exited_at = Column(DateTime, nullable=True)
    duration_min = Column(Float, nullable=True)
    result = Column(String, nullable=True) # e.g. PASS, FAIL

    wafer = relationship("Wafer")
    stage = relationship("ProcessStage")
    equipment = relationship("Equipment")
