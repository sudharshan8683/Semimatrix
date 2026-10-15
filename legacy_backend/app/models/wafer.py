from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Wafer(Base):
    __tablename__ = "wafers"

    id = Column(Integer, primary_key=True, index=True)
    wafer_id = Column(String, unique=True, index=True, nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), index=True, nullable=False)
    current_stage_id = Column(Integer, ForeignKey("process_stages.id"), nullable=True)
    current_equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=True)
    
    status = Column(String, nullable=False, default="QUEUED") # QUEUED, IN_PROCESS, COMPLETED, SCRAPPED, ON_HOLD
    quality_status = Column(String, nullable=False, default="PENDING") # PASS, FAIL, PENDING, REWORK
    defect_count = Column(Integer, default=0)
    
    started_at = Column(DateTime, nullable=True)
    expected_completion_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    batch = relationship("Batch")
    current_stage = relationship("ProcessStage")
    current_equipment = relationship("Equipment")
