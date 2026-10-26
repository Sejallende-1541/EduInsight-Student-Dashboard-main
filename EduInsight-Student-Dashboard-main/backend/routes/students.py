import io
import csv
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Student
from ..schemas import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentListResponse,
    CSVUploadResponse,
    AtRiskStudentResponse
)
from ..services.data_processing import get_at_risk_students

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/", response_model=StudentListResponse)
def list_students(
    search: Optional[str] = Query(None, description="Search by name or student ID"),
    department: Optional[str] = Query(None, description="Filter by department"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Student)
    
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_fmt),
                Student.student_id.ilike(search_fmt)
            )
        )
        
    if department and department != "All":
        query = query.filter(Student.department == department)
        
    total = query.count()
    offset = (page - 1) * page_size
    students = query.order_by(Student.id.desc()).offset(offset).limit(page_size).all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "students": students
    }

@router.get("/all", response_model=List[StudentResponse])
def get_all_students(db: Session = Depends(get_db)):
    """Return all students without pagination for report search and exports."""
    return db.query(Student).order_by(Student.name.asc()).all()

@router.get("/risk/flagged", response_model=List[AtRiskStudentResponse])
def get_at_risk_list(
    marks_threshold: float = Query(40.0, ge=0, le=100),
    attendance_threshold: float = Query(75.0, ge=0, le=100),
    db: Session = Depends(get_db)
):
    return get_at_risk_students(db, marks_threshold, attendance_threshold)

@router.get("/export/csv")
def export_students_csv(db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.id.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "student_id", "name", "gender", "department",
        "study_hours_per_week", "attendance_percentage",
        "past_exam_marks", "assignment_score",
        "math_marks", "science_marks", "english_marks", "final_marks"
    ])
    
    for s in students:
        writer.writerow([
            s.student_id, s.name, s.gender, s.department,
            s.study_hours_per_week, s.attendance_percentage,
            s.past_exam_marks, s.assignment_score,
            s.math_marks, s.science_marks, s.english_marks, s.final_marks
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=eduinsight_students.csv"}
    )

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with ID '{student_id}' not found")
    return student

@router.post("/", response_model=StudentResponse, status_code=201)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.student_id == student_in.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Student ID '{student_in.student_id}' already exists")
        
    student = Student(**student_in.dict())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.put("/{id}", response_model=StudentResponse)
def update_student(id: int, student_in: StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    update_data = student_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(student, field, val)
        
    db.commit()
    db.refresh(student)
    return student

@router.delete("/{id}")
def delete_student(id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}

@router.post("/upload", response_model=CSVUploadResponse)
async def upload_students_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv file.")
        
    contents = await file.read()
    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded = contents.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode CSV file.")
            
    reader = csv.DictReader(io.StringIO(decoded))
    required_cols = {"student_id", "name", "study_hours_per_week", "attendance_percentage", "past_exam_marks", "assignment_score", "final_marks"}
    
    if not reader.fieldnames or not required_cols.issubset(set(reader.fieldnames)):
        missing = required_cols - set(reader.fieldnames or [])
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns: {', '.join(missing)}"
        )
        
    records_processed = 0
    records_inserted = 0
    errors = []
    
    for row_idx, row in enumerate(reader, start=2):
        records_processed += 1
        sid = row.get("student_id", "").strip()
        name = row.get("name", "").strip()
        
        if not sid or not name:
            errors.append(f"Row {row_idx}: student_id and name cannot be blank")
            continue
            
        try:
            study_hours = float(row["study_hours_per_week"])
            attendance = float(row["attendance_percentage"])
            past_marks = float(row["past_exam_marks"])
            assignment = float(row["assignment_score"])
            final = float(row["final_marks"])
            math_val = float(row.get("math_marks", 0.0) or 0.0)
            science_val = float(row.get("science_marks", 0.0) or 0.0)
            english_val = float(row.get("english_marks", 0.0) or 0.0)
        except (ValueError, KeyError) as e:
            errors.append(f"Row {row_idx}: Invalid numeric format ({str(e)})")
            continue
            
        # Check if student exists; update if exists, otherwise insert
        existing = db.query(Student).filter(Student.student_id == sid).first()
        if existing:
            existing.name = name
            existing.gender = row.get("gender", existing.gender)
            existing.department = row.get("department", existing.department)
            existing.study_hours_per_week = study_hours
            existing.attendance_percentage = attendance
            existing.past_exam_marks = past_marks
            existing.assignment_score = assignment
            existing.math_marks = math_val
            existing.science_marks = science_val
            existing.english_marks = english_val
            existing.final_marks = final
            records_inserted += 1
        else:
            student = Student(
                student_id=sid,
                name=name,
                gender=row.get("gender", "Other"),
                department=row.get("department", "General"),
                study_hours_per_week=study_hours,
                attendance_percentage=attendance,
                past_exam_marks=past_marks,
                assignment_score=assignment,
                math_marks=math_val,
                science_marks=science_val,
                english_marks=english_val,
                final_marks=final
            )
            db.add(student)
            records_inserted += 1
            
    db.commit()
    
    return {
        "message": f"Successfully processed {records_processed} rows, saved/updated {records_inserted} student records.",
        "records_processed": records_processed,
        "records_inserted": records_inserted,
        "errors": errors[:15]  # Limit returned errors for clean UI display
    }
