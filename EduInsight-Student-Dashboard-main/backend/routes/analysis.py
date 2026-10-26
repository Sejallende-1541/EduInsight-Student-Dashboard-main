from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AnalysisSummaryResponse
from ..services.data_processing import get_performance_analysis

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("/summary", response_model=AnalysisSummaryResponse)
def get_analysis_summary(db: Session = Depends(get_db)):
    return get_performance_analysis(db)
