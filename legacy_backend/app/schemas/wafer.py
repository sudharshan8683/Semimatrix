from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ProcessStageResponse(BaseModel):
    id: int
    name: str
    sequence_index: int
    nominal_duration_min: float
    process_type: str

    class Config:
        from_attributes = True

class WaferBase(BaseModel):
    wafer_id: str
    batch_id: int
    status: str
    quality_status: str
    defect_count: int
    started_at: Optional[datetime] = None
    expected_completion_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class WaferResponse(WaferBase):
    id: int
    current_stage_id: Optional[int] = None
    current_equipment_id: Optional[int] = None

    class Config:
        from_attributes = True

class WaferDetailResponse(WaferResponse):
    current_stage: Optional[ProcessStageResponse] = None
    # We can add current_equipment and batch details as well if needed
    
class BatchResponse(BaseModel):
    id: int
    batch_id: str
    lot_size: int
    product_family: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True
