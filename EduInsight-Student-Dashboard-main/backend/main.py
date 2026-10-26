from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routes import students, dashboard, analysis, predictions

app = FastAPI(
    title="EduInsight — Education Student Performance Mining System",
    description="College Data Science & ML Backend using Linear Regression & Pandas Analytics",
    version="1.0.0"
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database and seed initial dataset if empty
@app.on_event("startup")
def on_startup():
    init_db()

import os
from fastapi.responses import FileResponse

# Register API routes
app.include_router(students.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")

@app.get("/")
def root():
    return {
        "project": "EduInsight — Education Student Performance Mining System",
        "status": "Online",
        "docs": "/docs",
        "api_prefix": "/api",
        "download_report_docx": "/download-report",
        "download_report_md": "/download-report-md"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "EduInsight Backend"}

@app.get("/download-report")
def download_report():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "EduInsight_Project_Report_Crisp_16Pages.docx")
    return FileResponse(
        path=file_path,
        filename="EduInsight_Project_Report_Crisp_16Pages.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@app.get("/download-report-full")
def download_report_full():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "EduInsight_Project_Report_Final.docx")
    return FileResponse(
        path=file_path,
        filename="EduInsight_Project_Report_Final.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@app.get("/download-report-md")
def download_report_md():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "EduInsight_Project_Report.md")
    return FileResponse(
        path=file_path,
        filename="EduInsight_Project_Report_Sanskruti_Asati.md",
        media_type="text/markdown"
    )
