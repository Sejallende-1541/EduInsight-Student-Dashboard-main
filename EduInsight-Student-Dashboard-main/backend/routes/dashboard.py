from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import DashboardStatsResponse
from ..services.data_processing import get_dashboard_metrics

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_stats(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db)
