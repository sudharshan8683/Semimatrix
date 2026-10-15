from fastapi import APIRouter
router = APIRouter(prefix="/anomalies", tags=["anomalies"])
@router.get("")
def list_anomalies(): return {"items": [], "total": 0, "page": 1, "page_size": 100}
