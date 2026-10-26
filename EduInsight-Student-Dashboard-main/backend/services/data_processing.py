from typing import List, Dict, Any
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from ..models import Student

def students_to_dataframe(db: Session) -> pd.DataFrame:
    students = db.query(Student).all()
    if not students:
        return pd.DataFrame()
    
    data = []
    for s in students:
        data.append({
            "id": s.id,
            "student_id": s.student_id,
            "name": s.name,
            "gender": s.gender,
            "department": s.department,
            "study_hours_per_week": s.study_hours_per_week,
            "attendance_percentage": s.attendance_percentage,
            "past_exam_marks": s.past_exam_marks,
            "assignment_score": s.assignment_score,
            "math_marks": s.math_marks,
            "science_marks": s.science_marks,
            "english_marks": s.english_marks,
            "final_marks": s.final_marks,
        })
    return pd.DataFrame(data)

def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
    df = students_to_dataframe(db)
    if df.empty:
        return {
            "total_students": 0,
            "average_marks": 0.0,
            "pass_percentage": 0.0,
            "at_risk_count": 0,
            "highest_marks": 0.0,
            "lowest_marks": 0.0,
            "marks_distribution": [],
            "subject_averages": [],
            "department_distribution": []
        }
    
    total = len(df)
    avg_marks = round(float(df["final_marks"].mean()), 1)
    pass_count = int((df["final_marks"] >= 40.0).sum())
    pass_pct = round((pass_count / total) * 100, 1) if total > 0 else 0.0
    
    # At-risk: marks < 40 or attendance < 75
    at_risk_count = int(((df["final_marks"] < 40.0) | (df["attendance_percentage"] < 75.0)).sum())
    highest = round(float(df["final_marks"].max()), 1)
    lowest = round(float(df["final_marks"].min()), 1)
    
    # Marks distribution bins
    bins = [0, 40, 60, 75, 90, 100]
    labels = ["<40 (Fail)", "40-59 (Pass)", "60-74 (Merit)", "75-89 (Distinction)", "90-100 (Outstanding)"]
    df["grade_bucket"] = pd.cut(df["final_marks"], bins=bins, labels=labels, include_lowest=True)
    dist_series = df["grade_bucket"].value_counts().reindex(labels, fill_value=0)
    marks_distribution = [{"range": k, "count": int(v)} for k, v in dist_series.items()]
    
    # Subject averages
    subject_averages = [
        {"subject": "Mathematics", "average": round(float(df["math_marks"].mean()), 1)},
        {"subject": "Science", "average": round(float(df["science_marks"].mean()), 1)},
        {"subject": "English", "average": round(float(df["english_marks"].mean()), 1)},
        {"subject": "Past Exam", "average": round(float(df["past_exam_marks"].mean()), 1)},
        {"subject": "Assignments", "average": round(float(df["assignment_score"].mean()), 1)},
    ]
    
    # Department breakdown
    dept_counts = df["department"].value_counts().to_dict()
    department_distribution = [{"department": k, "count": int(v)} for k, v in dept_counts.items()]
    
    return {
        "total_students": total,
        "average_marks": avg_marks,
        "pass_percentage": pass_pct,
        "at_risk_count": at_risk_count,
        "highest_marks": highest,
        "lowest_marks": lowest,
        "marks_distribution": marks_distribution,
        "subject_averages": subject_averages,
        "department_distribution": department_distribution
    }

def get_performance_analysis(db: Session) -> Dict[str, Any]:
    df = students_to_dataframe(db)
    if df.empty:
        return {
            "descriptive_stats": {},
            "marks_distribution": [],
            "subject_averages": [],
            "attendance_vs_marks": [],
            "correlation_matrix": {},
            "insights": ["No student data available yet. Please add or upload student records."]
        }
    
    numeric_cols = [
        "study_hours_per_week",
        "attendance_percentage",
        "past_exam_marks",
        "assignment_score",
        "math_marks",
        "science_marks",
        "english_marks",
        "final_marks"
    ]
    
    # Descriptive statistics
    desc = df[numeric_cols].describe().round(2).to_dict()
    # Format descriptive stats cleanly: col -> metric -> val
    descriptive_stats = {}
    for col in numeric_cols:
        descriptive_stats[col] = {
            "mean": float(desc[col].get("mean", 0.0)),
            "std": float(desc[col].get("std", 0.0)),
            "min": float(desc[col].get("min", 0.0)),
            "25%": float(desc[col].get("25%", 0.0)),
            "50%": float(desc[col].get("50%", 0.0)),
            "75%": float(desc[col].get("75%", 0.0)),
            "max": float(desc[col].get("max", 0.0)),
        }
    
    # Marks distribution
    bins = [0, 40, 60, 75, 90, 100]
    labels = ["<40 (Fail)", "40-59 (Pass)", "60-74 (Merit)", "75-89 (Distinction)", "90-100 (Outstanding)"]
    df["grade_bucket"] = pd.cut(df["final_marks"], bins=bins, labels=labels, include_lowest=True)
    dist_series = df["grade_bucket"].value_counts().reindex(labels, fill_value=0)
    marks_distribution = [{"range": k, "count": int(v)} for k, v in dist_series.items()]
    
    # Subject averages
    subject_averages = [
        {"subject": "Mathematics", "average": round(float(df["math_marks"].mean()), 1)},
        {"subject": "Science", "average": round(float(df["science_marks"].mean()), 1)},
        {"subject": "English", "average": round(float(df["english_marks"].mean()), 1)},
        {"subject": "Past Exam", "average": round(float(df["past_exam_marks"].mean()), 1)},
        {"subject": "Assignments", "average": round(float(df["assignment_score"].mean()), 1)},
        {"subject": "Final Marks", "average": round(float(df["final_marks"].mean()), 1)}
    ]
    
    # Attendance vs marks scatter sample (or all up to 100 points for responsiveness)
    attendance_vs_marks = []
    for _, row in df.head(100).iterrows():
        attendance_vs_marks.append({
            "student_id": row["student_id"],
            "name": row["name"],
            "attendance": round(float(row["attendance_percentage"]), 1),
            "final_marks": round(float(row["final_marks"]), 1),
            "study_hours": round(float(row["study_hours_per_week"]), 1),
            "department": row["department"]
        })
        
    # Pearson Correlation Matrix
    corr_df = df[numeric_cols].corr().round(3)
    correlation_matrix = corr_df.to_dict()
    
    # Calculate genuine data-driven insights
    insights = []
    
    # Insight 1: Past Marks Correlation
    past_corr = corr_df.loc["past_exam_marks", "final_marks"]
    if abs(past_corr) >= 0.5:
        strength = "strong" if abs(past_corr) >= 0.7 else "moderate"
        insights.append(
            f"Prior academic performance (Past Exam Marks) exhibits a {strength} positive correlation (r = {past_corr:.2f}) with Final Marks, serving as a prominent predictor."
        )
        
    # Insight 2: Attendance Impact
    att_corr = corr_df.loc["attendance_percentage", "final_marks"]
    high_att_mean = df[df["attendance_percentage"] >= 80]["final_marks"].mean()
    low_att_mean = df[df["attendance_percentage"] < 75]["final_marks"].mean()
    if not np.isnan(high_att_mean) and not np.isnan(low_att_mean):
        diff = high_att_mean - low_att_mean
        insights.append(
            f"Attendance plays a crucial role: students with ≥80% attendance scored an average of {high_att_mean:.1f} marks, which is {diff:.1f} marks higher than students with <75% attendance ({low_att_mean:.1f} marks)."
        )
        
    # Insight 3: Study Hours effect
    sh_corr = corr_df.loc["study_hours_per_week", "final_marks"]
    high_sh_mean = df[df["study_hours_per_week"] >= 15]["final_marks"].mean()
    low_sh_mean = df[df["study_hours_per_week"] < 10]["final_marks"].mean()
    if not np.isnan(high_sh_mean) and not np.isnan(low_sh_mean):
        insights.append(
            f"Study habit mining shows students studying 15+ hours/week achieved an average of {high_sh_mean:.1f} marks, compared to {low_sh_mean:.1f} for those studying under 10 hours/week (r = {sh_corr:.2f})."
        )
        
    # Insight 4: At-risk cohort proportion
    at_risk_pct = round((((df["final_marks"] < 40) | (df["attendance_percentage"] < 75)).sum() / len(df)) * 100, 1)
    insights.append(
        f"{at_risk_pct}% of the cohort currently falls below institutional benchmarks (<40% marks or <75% attendance) and qualifies for targeted remedial intervention."
    )
    
    return {
        "descriptive_stats": descriptive_stats,
        "marks_distribution": marks_distribution,
        "subject_averages": subject_averages,
        "attendance_vs_marks": attendance_vs_marks,
        "correlation_matrix": correlation_matrix,
        "insights": insights
    }

def get_at_risk_students(db: Session, marks_threshold: float = 40.0, attendance_threshold: float = 75.0) -> List[Dict[str, Any]]:
    students = db.query(Student).all()
    at_risk_list = []
    
    for s in students:
        reasons = []
        is_low_marks = s.final_marks < marks_threshold
        is_low_attendance = s.attendance_percentage < attendance_threshold
        
        if is_low_marks:
            reasons.append(f"Scored {s.final_marks}% (Below passing threshold of {marks_threshold}%)")
        if is_low_attendance:
            reasons.append(f"Attendance is {s.attendance_percentage}% (Below minimum requirement of {attendance_threshold}%)")
            
        if reasons:
            if is_low_marks and is_low_attendance:
                risk_level = "High"
                recommendation = "Immediate faculty intervention required: Mandatory remedial classes and parental academic counseling."
            elif is_low_marks:
                risk_level = "Medium"
                recommendation = "Subject-specific tutoring and weekly assignment recovery plan recommended."
            else:
                risk_level = "Medium"
                recommendation = "Attendance warning and counselor meeting to identify cause of absenteeism."
                
            at_risk_list.append({
                "student": s,
                "risk_level": risk_level,
                "reasons": reasons,
                "recommendation": recommendation
            })
            
    # Sort with High risk first, then by final_marks ascending
    at_risk_list.sort(key=lambda x: (0 if x["risk_level"] == "High" else 1, x["student"].final_marks))
    return at_risk_list
