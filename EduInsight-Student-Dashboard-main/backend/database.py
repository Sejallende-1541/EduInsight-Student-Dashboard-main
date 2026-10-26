import os
import csv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, "eduinsight.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from .models import Student
    Base.metadata.create_all(bind=engine)
    
    # Check if database is empty; if so, seed from sample_students.csv
    db = SessionLocal()
    try:
        count = db.query(Student).count()
        if count == 0:
            sample_csv = os.path.join(DATA_DIR, "sample_students.csv")
            if os.path.exists(sample_csv):
                with open(sample_csv, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        student = Student(
                            student_id=row["student_id"],
                            name=row["name"],
                            gender=row.get("gender", "Other"),
                            department=row.get("department", "General"),
                            study_hours_per_week=float(row["study_hours_per_week"]),
                            attendance_percentage=float(row["attendance_percentage"]),
                            past_exam_marks=float(row["past_exam_marks"]),
                            assignment_score=float(row["assignment_score"]),
                            math_marks=float(row.get("math_marks", 0.0)),
                            science_marks=float(row.get("science_marks", 0.0)),
                            english_marks=float(row.get("english_marks", 0.0)),
                            final_marks=float(row["final_marks"])
                        )
                        db.add(student)
                db.commit()
                print("Seeded database with sample student dataset.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()
