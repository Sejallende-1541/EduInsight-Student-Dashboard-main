from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from .database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    gender = Column(String(20), default="Other")
    department = Column(String(100), default="General")
    study_hours_per_week = Column(Float, nullable=False, default=10.0)
    attendance_percentage = Column(Float, nullable=False, default=75.0)
    past_exam_marks = Column(Float, nullable=False, default=50.0)
    assignment_score = Column(Float, nullable=False, default=50.0)
    math_marks = Column(Float, default=50.0)
    science_marks = Column(Float, default=50.0)
    english_marks = Column(Float, default=50.0)
    final_marks = Column(Float, nullable=False, default=50.0)
    created_at = Column(DateTime, default=datetime.utcnow)
