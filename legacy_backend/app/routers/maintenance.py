from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MaintenanceRecord, Equipment

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

class WorkOrderCreate(BaseModel):
    equipment_id: int
    title: str
    priority: str # High, Medium, Low
    engineer: Optional[str] = "Alex M."
    notes: Optional[str] = None
    type: Optional[str] = "PREVENTIVE"

class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    downtime_minutes: Optional[float] = None
    technician: Optional[str] = None

# In-memory work order store initialized with realistic Fab work orders
WORK_ORDERS = [
    {
        "id": "TKT-892",
        "equipment_id": 2,
        "machine_id": "ETCH-02",
        "tool": "Plasma Etch Chamber B",
        "status": "IN_PROGRESS",
        "priority": "High",
        "engineer": "Elena Rostova",
        "time": "Started 1h 20m ago",
        "issue": "Exhaust pressure drift (3.42 Torr) exceeding safe window.",
        "action": "Turbo-molecular throttle valve seal rebuild and leak rate test.",
        "parts": "O-ring kit, ISO-KF25 clamp, diaphragm rebuild gasket",
        "type": "CORRECTIVE"
    },
    {
        "id": "TKT-893",
        "equipment_id": 3,
        "machine_id": "ETCH-03",
        "tool": "Plasma Etch Chamber C",
        "status": "SCHEDULED",
        "priority": "High",
        "engineer": "Sarah K.",
        "time": "Scheduled for shift changeover",
        "issue": "Spectral vibration harmonics indicate high spindle wear.",
        "action": "Inspect ceramic spindle bearings and wafer chuck aligner.",
        "parts": "Ceramic angular contact bearing pair, alignment shim kit",
        "type": "PREDICTIVE"
    },
    {
        "id": "TKT-894",
        "equipment_id": 4,
        "machine_id": "DEPO-04",
        "tool": "CVD Precursor Tool 4",
        "status": "PENDING",
        "priority": "Medium",
        "engineer": "Unassigned",
        "time": "Queue position #3",
        "issue": "Pre-heat thermocouple TC-3 drifted +12% above setpoint.",
        "action": "Thermocouple resistance calibration and PID loop tuning.",
        "parts": "Type-K Thermocouple probe",
        "type": "PREVENTIVE"
    },
    {
        "id": "TKT-895",
        "equipment_id": 5,
        "machine_id": "CLEA-05",
        "tool": "CMP Polishing Tool 5",
        "status": "COMPLETED",
        "priority": "Low",
        "engineer": "David Rodriguez",
        "time": "Completed 4h ago",
        "issue": "Conditioning disk counter reached 1,200 pad dress cycles.",
        "action": "Diamond conditioning head swap and pad rinse verify.",
        "parts": "100-grit diamond dress disc",
        "type": "PREVENTIVE"
    }
]

@router.get("")
@router.get("/queue")
def list_work_orders():
    return {
        "items": WORK_ORDERS,
        "total": len(WORK_ORDERS),
        "in_progress": sum(1 for w in WORK_ORDERS if w["status"] == "IN_PROGRESS"),
        "scheduled": sum(1 for w in WORK_ORDERS if w["status"] == "SCHEDULED"),
        "completed": sum(1 for w in WORK_ORDERS if w["status"] == "COMPLETED")
    }

@router.post("")
@router.post("/schedule")
def create_work_order(req: WorkOrderCreate, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.id == req.equipment_id).first()
    new_id = f"TKT-{len(WORK_ORDERS) + 893}"
    
    order = {
        "id": new_id,
        "equipment_id": req.equipment_id,
        "machine_id": eq.machine_id if eq else "TOOL-SYS",
        "tool": eq.name if eq else "Fab Equipment",
        "status": "SCHEDULED",
        "priority": req.priority,
        "engineer": req.engineer or "Unassigned",
        "time": "Just created",
        "issue": req.title,
        "action": req.notes or "Inspect and service tool per standard operating procedure (SOP).",
        "parts": "Standard PM maintenance kit",
        "type": req.type or "PREVENTIVE"
    }
    WORK_ORDERS.insert(0, order)
    return order

@router.patch("/{ticket_id}/status")
def update_work_order_status(ticket_id: str, payload: WorkOrderUpdate):
    for w in WORK_ORDERS:
        if w["id"] == ticket_id:
            if payload.status:
                w["status"] = payload.status.upper()
            if payload.technician:
                w["engineer"] = payload.technician
            if payload.notes:
                w["action"] = payload.notes
            return w
    raise HTTPException(status_code=404, detail="Work order not found")

@router.get("/history")
def get_service_history():
    return [
        {
            "id": "SVC-4920",
            "tool": "ETCH-02",
            "tool_name": "Plasma Etcher Chamber B",
            "date": "2026-09-28",
            "type": "Preventative Clean (PM)",
            "technician": "Elena Rostova",
            "downtime_minutes": 240,
            "cost": "$4,200",
            "parts_replaced": "Chamber liner, RF match tuning capacitors",
            "status": "VERIFIED_OPERATIONAL"
        },
        {
            "id": "SVC-4890",
            "tool": "LITH-01",
            "tool_name": "EUV Photolithography Stepper 1",
            "date": "2026-09-15",
            "type": "Corrective Alignment",
            "technician": "Sarah K.",
            "downtime_minutes": 380,
            "cost": "$12,800",
            "parts_replaced": "Reticle stage piezoelectric positioner",
            "status": "VERIFIED_OPERATIONAL"
        },
        {
            "id": "SVC-4812",
            "tool": "DEPO-04",
            "tool_name": "CVD Precursor Tool 4",
            "date": "2026-08-30",
            "type": "Planned Overhaul",
            "technician": "David Rodriguez",
            "downtime_minutes": 180,
            "cost": "$2,950",
            "parts_replaced": "Mass flow controller (MFC-2), showerhead assembly",
            "status": "VERIFIED_OPERATIONAL"
        }
    ]
