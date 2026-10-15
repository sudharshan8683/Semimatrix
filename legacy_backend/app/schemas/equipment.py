from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .core import PredictionResponse

class EquipmentBase(BaseModel):
    machine_id: str
    name: str
    process_type: str
    bay_zone: str
    status: str
    install_date: datetime
    age_months: float
    temp_min: float
    temp_max: float
    pressure_min: float
    pressure_max: float
    vibration_max: float
    rated_cycle_time: float
    total_operating_hours: float
    last_maintenance_at: Optional[datetime] = None
    next_maintenance_due: Optional[datetime] = None
    health_score: float
    utilization_pct: float
    current_wafer_id: Optional[str] = None
    total_failures: int

class EquipmentResponse(EquipmentBase):
    id: int

    class Config:
        from_attributes = True

class EquipmentDetailResponse(EquipmentResponse):
    latest_prediction: Optional[PredictionResponse] = None
    # Add other nested fields if needed (e.g. recent readings)

class EquipmentSummary(BaseModel):
    total: int
    running: int
    idle: int
    warning: int
    critical: int
    maintenance: int
    offline: int
    avg_utilization: float
    avg_health_score: float
