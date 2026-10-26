from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ModelMetricsResponse, PredictionInput, PredictionResponse
from ..services.ml_model import get_model_info, train_linear_regression, predict_student_marks

router = APIRouter(prefix="/predictions", tags=["Predictions"])

@router.get("/model-info", response_model=ModelMetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    metrics = get_model_info(db)
    if "error" in metrics:
        raise HTTPException(status_code=400, detail=metrics["error"])
    return metrics

@router.post("/train", response_model=ModelMetricsResponse)
def train_model(
    test_size: float = Query(0.2, ge=0.1, le=0.5, description="Fraction of dataset for test split"),
    db: Session = Depends(get_db)
):
    metrics = train_linear_regression(db, test_size=test_size)
    if "error" in metrics:
        raise HTTPException(status_code=400, detail=metrics["error"])
    return metrics

@router.post("/predict", response_model=PredictionResponse)
def predict(input_data: PredictionInput, db: Session = Depends(get_db)):
    result = predict_student_marks(
        study_hours=input_data.study_hours_per_week,
        attendance=input_data.attendance_percentage,
        past_marks=input_data.past_exam_marks,
        assignment=input_data.assignment_score,
        db=db
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
