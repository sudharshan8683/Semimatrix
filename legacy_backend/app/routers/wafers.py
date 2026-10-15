from fastapi import APIRouter
router = APIRouter(prefix="/wafers", tags=["wafers"])
@router.get("")
def list_wafers(): return {"items": [], "total": 0, "page": 1, "page_size": 100}
@router.get("/pipeline")
def get_pipeline(): return []
@router.get("/{wafer_id}")
def get_wafer(wafer_id: str): return {}
