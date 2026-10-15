from fastapi import APIRouter
router = APIRouter(prefix="/production", tags=["production"])
@router.get("/summary")
def summary(): return {}
@router.get("/timeline")
def timeline(): return []
