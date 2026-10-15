from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SingleDefectPrediction(BaseModel):
    row_index: int
    probability: float
    flagged: bool

class DefectPredictionRequest(BaseModel):
    rows: List[List[Optional[float]]] = Field(
        ...,
        description="List of sensor reading rows, each containing exactly 590 sensor values."
    )
    threshold: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Probability cutoff threshold (default 0.5, lower values 0.2-0.3 recommended)."
    )

class DefectPredictionResponse(BaseModel):
    threshold: float
    flagged_count: int
    total_rows: int
    predictions: List[SingleDefectPrediction]


class PredictionResponse(BaseModel):
    id: int
    equipment_id: Optional[int] = None
    wafer_id: Optional[int] = None
    model_name: str
    model_version: str
    prediction_type: str
    probability: float
    risk_level: str
    contributing_factors: Optional[List[Dict[str, Any]]] = None
    recommendation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    title: str
    description: str
    equipment_id: Optional[int] = None
    wafer_id: Optional[int] = None
    recommended_action: Optional[str] = None
    status: str
    created_at: datetime
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MaintenanceScheduleRequest(BaseModel):
    equipment_id: int
    type: str
    scheduled_at: datetime

class MaintenanceResponse(BaseModel):
    id: int
    equipment_id: int
    type: str
    scheduled_at: Optional[datetime] = None
    performed_at: Optional[datetime] = None
    downtime_minutes: float
    technician: Optional[str] = None
    parts_replaced: Optional[str] = None
    notes: Optional[str] = None
    cost: float

    class Config:
        from_attributes = True

class SensorReadingResponse(BaseModel):
    id: int
    equipment_id: int
    timestamp: datetime
    temperature: float
    pressure: float
    vibration: float
    power_draw: float
    gas_flow: float
    chamber_humidity: float
    particle_count: int
    cycle_time: float
    error_count: int

    class Config:
        from_attributes = True

class AnomalyEventResponse(BaseModel):
    id: int
    equipment_id: int
    parameter: str
    current_value: float
    normal_min: float
    normal_max: float
    deviation_pct: float
    severity: str
    probable_cause: Optional[str] = None
    recommended_action: Optional[str] = None
    detected_at: datetime
    status: str

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
