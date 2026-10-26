import os
import datetime
from typing import Dict, Any, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sqlalchemy.orm import Session
from ..models import Student

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_FILE = os.path.join(MODEL_DIR, "linear_regression.joblib")

FEATURES = [
    "study_hours_per_week",
    "attendance_percentage",
    "past_exam_marks",
    "assignment_score"
]
TARGET = "final_marks"

# In-memory cached state
_cached_model = None
_cached_metrics = None

def train_linear_regression(db: Session, test_size: float = 0.2) -> Dict[str, Any]:
    global _cached_model, _cached_metrics
    
    students = db.query(Student).all()
    if len(students) < 10:
        return {
            "error": "Insufficient dataset size. At least 10 student records are required to train the model.",
            "is_trained": False
        }
        
    data = []
    for s in students:
        data.append({
            "study_hours_per_week": s.study_hours_per_week,
            "attendance_percentage": s.attendance_percentage,
            "past_exam_marks": s.past_exam_marks,
            "assignment_score": s.assignment_score,
            "final_marks": s.final_marks,
        })
    df = pd.DataFrame(data).dropna()
    
    X = df[FEATURES]
    y = df[TARGET]
    
    # Train/Test Split (prevents data leakage)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42
    )
    
    # Train Linear Regression model strictly on training data
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Evaluate model on unseen test data
    y_pred_test = model.predict(X_test)
    test_mae = round(float(mean_absolute_error(y_test, y_pred_test)), 2)
    test_r2 = round(float(r2_score(y_test, y_pred_test)), 3)
    
    coefficients = {
        feat: round(float(coef), 4) for feat, coef in zip(FEATURES, model.coef_)
    }
    intercept = round(float(model.intercept_), 4)
    
    metadata = {
        "model_name": "Multiple Linear Regression",
        "is_trained": True,
        "sample_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "mae": test_mae,
        "r2_score": test_r2,
        "features": FEATURES,
        "intercept": intercept,
        "coefficients": coefficients,
        "last_trained": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }
    
    # Save model and metadata to disk using joblib
    joblib.dump({"model": model, "metadata": metadata}, MODEL_FILE)
    
    _cached_model = model
    _cached_metrics = metadata
    
    return metadata

def load_or_train_model(db: Session) -> Tuple[Any, Dict[str, Any]]:
    global _cached_model, _cached_metrics
    
    if _cached_model is not None and _cached_metrics is not None:
        return _cached_model, _cached_metrics
        
    if os.path.exists(MODEL_FILE):
        try:
            saved = joblib.load(MODEL_FILE)
            _cached_model = saved["model"]
            _cached_metrics = saved["metadata"]
            return _cached_model, _cached_metrics
        except Exception:
            pass
            
    # If not on disk, train now
    metrics = train_linear_regression(db)
    return _cached_model, metrics

def get_model_info(db: Session) -> Dict[str, Any]:
    _, metrics = load_or_train_model(db)
    return metrics

def predict_student_marks(
    study_hours: float,
    attendance: float,
    past_marks: float,
    assignment: float,
    db: Session
) -> Dict[str, Any]:
    model, metrics = load_or_train_model(db)
    if model is None:
        return {"error": "Model has not been trained yet. Please add data and train the model."}
        
    X_input = pd.DataFrame([{
        "study_hours_per_week": study_hours,
        "attendance_percentage": attendance,
        "past_exam_marks": past_marks,
        "assignment_score": assignment
    }])
    
    raw_pred = float(model.predict(X_input)[0])
    # Bound realistically between 0 and 100
    bounded_pred = round(max(0.0, min(100.0, raw_pred)), 1)
    
    mae = metrics.get("mae", 3.0)
    lower_bound = round(max(0.0, bounded_pred - mae), 1)
    upper_bound = round(min(100.0, bounded_pred + mae), 1)
    
    # Grade classification
    if bounded_pred >= 90:
        grade = "Outstanding (A+)"
    elif bounded_pred >= 75:
        grade = "Distinction (A)"
    elif bounded_pred >= 60:
        grade = "First Class (B)"
    elif bounded_pred >= 40:
        grade = "Pass Class (C)"
    else:
        grade = "Needs Support / At Risk (F)"
        
    # Feature contributions
    coefs = metrics.get("coefficients", {})
    intercept = metrics.get("intercept", 0.0)
    contributions = {
        "Intercept (Base)": round(intercept, 2),
        "Study Hours Effect": round(coefs.get("study_hours_per_week", 0.0) * study_hours, 2),
        "Attendance Effect": round(coefs.get("attendance_percentage", 0.0) * attendance, 2),
        "Past Exam Marks Effect": round(coefs.get("past_exam_marks", 0.0) * past_marks, 2),
        "Assignment Score Effect": round(coefs.get("assignment_score", 0.0) * assignment, 2)
    }
    
    formula = (
        f"Final Marks ≈ {intercept:.2f} + "
        f"({coefs.get('study_hours_per_week', 0):.2f} × {study_hours}) + "
        f"({coefs.get('attendance_percentage', 0):.2f} × {attendance}) + "
        f"({coefs.get('past_exam_marks', 0):.2f} × {past_marks}) + "
        f"({coefs.get('assignment_score', 0):.2f} × {assignment})"
    )
    
    disclaimer = (
        "Note: Predictions are statistical estimates derived from ordinary least squares "
        f"Linear Regression trained on historical cohort data (MAE = ±{mae} marks). "
        "Actual outcomes depend on student effort, assessment difficulty, and test conditions."
    )
    
    return {
        "predicted_marks": bounded_pred,
        "confidence_interval": {
            "lower": lower_bound,
            "upper": upper_bound,
            "margin_of_error_mae": mae
        },
        "predicted_grade": grade,
        "feature_contributions": contributions,
        "formula_explanation": formula,
        "disclaimer": disclaimer
    }
