from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class StudentBase(BaseModel):
    student_id: str = Field(..., example="STU1001")
    name: str = Field(..., example="Aarav Sharma")
    gender: Optional[str] = "Other"
    department: Optional[str] = "Computer Science"
    study_hours_per_week: float = Field(..., ge=0, le=100)
    attendance_percentage: float = Field(..., ge=0, le=100)
    past_exam_marks: float = Field(..., ge=0, le=100)
    assignment_score: float = Field(..., ge=0, le=100)
    math_marks: Optional[float] = Field(0.0, ge=0, le=100)
    science_marks: Optional[float] = Field(0.0, ge=0, le=100)
    english_marks: Optional[float] = Field(0.0, ge=0, le=100)
    final_marks: float = Field(..., ge=0, le=100)

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    department: Optional[str] = None
    study_hours_per_week: Optional[float] = Field(None, ge=0, le=100)
    attendance_percentage: Optional[float] = Field(None, ge=0, le=100)
    past_exam_marks: Optional[float] = Field(None, ge=0, le=100)
    assignment_score: Optional[float] = Field(None, ge=0, le=100)
    math_marks: Optional[float] = Field(None, ge=0, le=100)
    science_marks: Optional[float] = Field(None, ge=0, le=100)
    english_marks: Optional[float] = Field(None, ge=0, le=100)
    final_marks: Optional[float] = Field(None, ge=0, le=100)

class StudentResponse(StudentBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    students: List[StudentResponse]

class DashboardStatsResponse(BaseModel):
    total_students: int
    average_marks: float
    pass_percentage: float
    at_risk_count: float
    highest_marks: float
    lowest_marks: float
    marks_distribution: List[Dict[str, Any]]
    subject_averages: List[Dict[str, Any]]
    department_distribution: List[Dict[str, Any]]

class AnalysisSummaryResponse(BaseModel):
    descriptive_stats: Dict[str, Dict[str, float]]
    marks_distribution: List[Dict[str, Any]]
    subject_averages: List[Dict[str, Any]]
    attendance_vs_marks: List[Dict[str, Any]]
    correlation_matrix: Dict[str, Dict[str, float]]
    insights: List[str]

class PredictionInput(BaseModel):
    study_hours_per_week: float = Field(..., ge=0, le=100, description="Weekly study hours")
    attendance_percentage: float = Field(..., ge=0, le=100, description="Attendance %")
    past_exam_marks: float = Field(..., ge=0, le=100, description="Past exam marks out of 100")
    assignment_score: float = Field(..., ge=0, le=100, description="Assignment score out of 100")

class PredictionResponse(BaseModel):
    predicted_marks: float
    confidence_interval: Dict[str, float]
    predicted_grade: str
    feature_contributions: Dict[str, float]
    formula_explanation: str
    disclaimer: str

class ModelMetricsResponse(BaseModel):
    model_name: str
    is_trained: bool
    train_size: int
    test_size: int
    r2_score: float
    mae: float
    features: List[str]
    intercept: float
    coefficients: Dict[str, float]
    sample_size: int
    last_trained: Optional[str] = None

class AtRiskRuleParams(BaseModel):
    marks_threshold: float = Field(40.0, ge=0, le=100)
    attendance_threshold: float = Field(75.0, ge=0, le=100)

class AtRiskStudentResponse(BaseModel):
    student: StudentResponse
    risk_level: str  # "High", "Medium", "Low"
    reasons: List[str]
    recommendation: str

class CSVUploadResponse(BaseModel):
    message: str
    records_processed: int
    records_inserted: int
    errors: List[str]
