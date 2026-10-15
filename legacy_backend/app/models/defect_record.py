from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class DefectRecord(Base):
    __tablename__ = "defect_records"

    id = Column(Integer, primary_key=True, index=True)
    wafer_id = Column(Integer, ForeignKey("wafers.id"), index=True, nullable=False)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index=True, nullable=False)
    stage_id = Column(Integer, ForeignKey("process_stages.id"), index=True, nullable=False)
    
    defect_type = Column(String, nullable=False) # PARTICLE, PATTERN, SCRATCH, etc.
    severity = Column(String, nullable=False)
    detected_at = Column(DateTime, nullable=False)
    root_cause_hint = Column(String, nullable=True)

    wafer = relationship("Wafer")
    equipment = relationship("Equipment")
    stage = relationship("ProcessStage")
