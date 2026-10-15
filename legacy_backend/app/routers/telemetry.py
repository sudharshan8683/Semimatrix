from fastapi import APIRouter
router = APIRouter(prefix="/telemetry", tags=["telemetry"])
@router.get("/{machine_id}")
def get_telemetry(machine_id: str): return []
