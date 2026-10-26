import random
import csv
import os

random.seed(42)

first_names = [
    "Aarav", "Ananya", "Rohan", "Priya", "Rahul", "Sneha", "Aditya", "Ishita",
    "Vikram", "Pooja", "Amit", "Neha", "Kunal", "Tanvi", "Siddharth", "Rhea",
    "Arjun", "Kavya", "Manish", "Divya", "Gaurav", "Simran", "Varun", "Meera",
    "Karan", "Anjali", "Nikhil", "Shreya", "Deepak", "Swati", "Harsh", "Sakshi",
    "Dev", "Aastha", "Aryan", "Diya", "Yash", "Khushi", "Mayank", "Ritu",
    "Tarun", "Bhavna", "Pranav", "Nidhi", "Suresh", "Pallavi", "Akash", "Komal"
]

last_names = [
    "Sharma", "Verma", "Gupta", "Patel", "Singh", "Reddy", "Mehta", "Iyer",
    "Kumar", "Joshi", "Deshmukh", "Chopra", "Nair", "Rao", "Pandey", "Bhat",
    "Malhotra", "Saxena", "Choudhury", "Das", "Menon", "Kapoor", "Mishra", "Banerjee"
]

departments = ["Computer Science", "Information Technology", "Data Science", "Electronics", "Mechanical"]
genders = ["Male", "Female"]

output_path = os.path.join(os.path.dirname(__file__), "data", "sample_students.csv")
os.makedirs(os.path.dirname(output_path), exist_ok=True)

students = []

for i in range(1, 151):
    sid = f"STU{1000 + i}"
    fname = random.choice(first_names)
    lname = random.choice(last_names)
    name = f"{fname} {lname}"
    gender = random.choice(genders)
    dept = random.choice(departments)
    
    # Archetypes to ensure realistic variance (struggling, average, high performer, inconsistent)
    tier = random.choices(["high", "mid", "low", "inconsistent"], weights=[0.25, 0.50, 0.15, 0.10])[0]
    
    if tier == "high":
        study_hours = round(random.uniform(18, 32), 1)
        attendance = round(random.uniform(85, 98), 1)
        past_marks = round(random.uniform(75, 96), 1)
        assignment = round(random.uniform(80, 98), 1)
        math = round(random.uniform(78, 98), 1)
        science = round(random.uniform(75, 96), 1)
        english = round(random.uniform(80, 95), 1)
    elif tier == "mid":
        study_hours = round(random.uniform(10, 20), 1)
        attendance = round(random.uniform(72, 88), 1)
        past_marks = round(random.uniform(52, 74), 1)
        assignment = round(random.uniform(55, 78), 1)
        math = round(random.uniform(50, 75), 1)
        science = round(random.uniform(52, 76), 1)
        english = round(random.uniform(58, 80), 1)
    elif tier == "low":
        study_hours = round(random.uniform(3, 10), 1)
        attendance = round(random.uniform(45, 72), 1)
        past_marks = round(random.uniform(28, 48), 1)
        assignment = round(random.uniform(30, 52), 1)
        math = round(random.uniform(25, 48), 1)
        science = round(random.uniform(28, 50), 1)
        english = round(random.uniform(35, 55), 1)
    else: # inconsistent (e.g. good study or past marks but dropped attendance, or vice versa)
        study_hours = round(random.uniform(6, 16), 1)
        attendance = round(random.uniform(55, 82), 1)
        past_marks = round(random.uniform(42, 68), 1)
        assignment = round(random.uniform(45, 70), 1)
        math = round(random.uniform(40, 70), 1)
        science = round(random.uniform(38, 68), 1)
        english = round(random.uniform(50, 75), 1)
        
    # True relationship for final marks with realistic noise (+- 3 marks)
    calculated_final = (
        0.38 * past_marks +
        0.26 * assignment +
        0.18 * attendance +
        0.45 * study_hours +
        random.uniform(-3.5, 3.5)
    )
    final_marks = max(18.0, min(99.0, round(calculated_final, 1)))
    
    students.append({
        "student_id": sid,
        "name": name,
        "gender": gender,
        "department": dept,
        "study_hours_per_week": study_hours,
        "attendance_percentage": attendance,
        "past_exam_marks": past_marks,
        "assignment_score": assignment,
        "math_marks": math,
        "science_marks": science,
        "english_marks": english,
        "final_marks": final_marks
    })

fieldnames = [
    "student_id", "name", "gender", "department",
    "study_hours_per_week", "attendance_percentage",
    "past_exam_marks", "assignment_score",
    "math_marks", "science_marks", "english_marks", "final_marks"
]

with open(output_path, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(students)

print(f"Generated {len(students)} student records at {output_path}")
