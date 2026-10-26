# EduInsight — Education Student Performance Mining System

An Educational Data Mining (EDM) and Learning Analytics platform combining real-time cohort tracking, statistical exploratory analysis, at-risk early detection, and predictive grade modeling using Linear Regression.

## System Architecture
- **Presentation Tier (Frontend)**: React 18, Vite, Recharts (Bar, Radar, Pie, Line charts), Tailwind CSS, Lucide icons.
- **Application Tier (Backend REST API)**: Python FastAPI with asynchronous endpoints under `/api`.
- **Analytical & ML Engine**: Pandas, NumPy, Scikit-learn Linear Regression model with cross-validated evaluation.
- **Data Tier**: SQLite embedded database (`eduinsight.db`) managed via SQLAlchemy ORM, with sample student records (`sample_students.csv`).
- **Academic Documentation**: IEEE/UGC compliant formatted project report generators and diagrams.

## Setup & Running

### 1. Backend REST API (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start backend on http://127.0.0.1:8000 (API docs at http://127.0.0.1:8000/docs)
uvicorn main:app --reload --port 8000
```

### 2. Frontend Dashboard (React + Vite)
```bash
# In project root:
npm install

# Start Vite development server (http://localhost:5173)
npm run dev
```

### 3. Report Generation
```bash
# Build the comprehensive 16-page docx project report:
python build_concise_report.py
```

## Author
- **Sanskruti Asati** (PRN: 24070521008)
- Department of Computer Science and Engineering, Symbiosis Institute of Technology (SIT), Nagpur
