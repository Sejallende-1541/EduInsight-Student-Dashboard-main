import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Search,
  User,
  GraduationCap,
  Award,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function Reports() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStudents();
  }, []);

  const loadAllStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getAllStudents();
      setStudents(data);
      if (data.length > 0) {
        setSelectedStudent(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStudentReport = () => {
    if (!selectedStudent) return;
    const s = selectedStudent;
    const content = `EDUSIGHT OFFICIAL STUDENT REPORT CARD
======================================
Generated Date: ${new Date().toLocaleDateString()}
Student ID: ${s.student_id}
Student Name: ${s.name}
Department: ${s.department}
Gender: ${s.gender}

ACADEMIC ENGAGEMENT & EFFORT
----------------------------
Study Hours Per Week: ${s.study_hours_per_week} hrs
Attendance Percentage: ${s.attendance_percentage}%

SUBJECT & ASSESSMENT MARKS
--------------------------
Mathematics: ${s.math_marks}%
Science: ${s.science_marks}%
English: ${s.english_marks}%
Past Exam Marks: ${s.past_exam_marks}%
Assignment Score: ${s.assignment_score}%

OVERALL EVALUATION
------------------
Final Exam Marks: ${s.final_marks}%
Status: ${s.final_marks >= 40 && s.attendance_percentage >= 75 ? 'Good Standing' : 'Academic Intervention Required'}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${s.student_id}_Academic_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: '#64748b' }}>Loading student report repository...</p>
      </div>
    );
  }

  const isAtRisk = selectedStudent && (selectedStudent.final_marks < 40.0 || selectedStudent.attendance_percentage < 75.0);

  return (
    <div>
      {/* Student Selector Toolbar */}
      <div className="toolbar no-print" style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div className="search-input-box" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search student by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '220px' }}
            value={selectedStudent?.id || ''}
            onChange={(e) => {
              const found = students.find((s) => s.id === parseInt(e.target.value));
              if (found) setSelectedStudent(found);
            }}
          >
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.student_id} — {s.name} ({s.department})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="/EduInsight_Project_Report_Crisp_16Pages.docx"
            download="EduInsight_Project_Report_Crisp_16Pages.docx"
            className="btn btn-primary"
            style={{ textDecoration: 'none', background: '#059669', borderColor: '#059669' }}
            title="Download crisp 15-17 page college project report"
          >
            <FileText size={15} />
            <span>Download Report (16 Pages)</span>
          </a>
          <button className="btn btn-secondary" onClick={handleDownloadStudentReport}>
            <Download size={15} />
            <span>Download Summary</span>
          </button>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Report Card</span>
          </button>
        </div>
      </div>

      {/* Official Report Card Sheet */}
      {selectedStudent && (
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto', padding: '36px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          {/* Institution Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: '#0f172a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <GraduationCap size={28} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  INSTITUTE OF HIGHER EDUCATION & TECHNOLOGY
                </h1>
                <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Office of the Academic Registrar • EduInsight Analytics Division
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#64748b' }}>
              <div>Report Reference: <strong>EI-{selectedStudent.student_id}</strong></div>
              <div>Issue Date: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Individual Academic Performance Report Card
            </h2>
            <div style={{ height: '3px', width: '60px', background: '#4f46e5', margin: '8px auto 0', borderRadius: '2px' }}></div>
          </div>

          {/* Student Profile Grid */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px 24px', marginBottom: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Student ID</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4338ca', fontFamily: 'monospace' }}>
                  {selectedStudent.student_id}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Full Name</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedStudent.name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Department</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
                  {selectedStudent.department}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Gender</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
                  {selectedStudent.gender}
                </div>
              </div>
            </div>
          </div>

          {/* Effort & Engagement Metrics */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              1. Academic Engagement & Effort Mining
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Attendance Record</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: selectedStudent.attendance_percentage < 75 ? '#e11d48' : '#059669', marginTop: '2px' }}>
                  {selectedStudent.attendance_percentage}%
                </div>
                <div style={{ fontSize: '0.75rem', color: selectedStudent.attendance_percentage < 75 ? '#e11d48' : '#64748b' }}>
                  {selectedStudent.attendance_percentage < 75 ? '⚠ Warning: Below mandatory 75% attendance cutoff' : '✓ Satisfies institutional attendance requirement'}
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Weekly Self-Study Commitment</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5', marginTop: '2px' }}>
                  {selectedStudent.study_hours_per_week} hrs/wk
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {selectedStudent.study_hours_per_week >= 15 ? '✓ Strong independent study discipline' : '• Recommended target: 15+ hours/week'}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Assessment Scores Table */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              2. Coursework & Examination Performance
            </h3>
            <table className="data-table" style={{ border: '1px solid #e2e8f0' }}>
              <thead>
                <tr>
                  <th>Course / Evaluation Component</th>
                  <th>Maximum</th>
                  <th>Marks Obtained</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Mathematics</td>
                  <td>100</td>
                  <td style={{ fontWeight: 600 }}>{selectedStudent.math_marks}%</td>
                  <td><span className={`badge ${selectedStudent.math_marks >= 40 ? 'badge-low' : 'badge-high'}`}>{selectedStudent.math_marks >= 40 ? 'Pass' : 'Fail'}</span></td>
                </tr>
                <tr>
                  <td>Science</td>
                  <td>100</td>
                  <td style={{ fontWeight: 600 }}>{selectedStudent.science_marks}%</td>
                  <td><span className={`badge ${selectedStudent.science_marks >= 40 ? 'badge-low' : 'badge-high'}`}>{selectedStudent.science_marks >= 40 ? 'Pass' : 'Fail'}</span></td>
                </tr>
                <tr>
                  <td>English</td>
                  <td>100</td>
                  <td style={{ fontWeight: 600 }}>{selectedStudent.english_marks}%</td>
                  <td><span className={`badge ${selectedStudent.english_marks >= 40 ? 'badge-low' : 'badge-high'}`}>{selectedStudent.english_marks >= 40 ? 'Pass' : 'Fail'}</span></td>
                </tr>
                <tr>
                  <td>Continuous Internal Assessment (Assignments)</td>
                  <td>100</td>
                  <td style={{ fontWeight: 600 }}>{selectedStudent.assignment_score}%</td>
                  <td><span className={`badge ${selectedStudent.assignment_score >= 40 ? 'badge-low' : 'badge-high'}`}>{selectedStudent.assignment_score >= 40 ? 'Satisfactory' : 'Needs Work'}</span></td>
                </tr>
                <tr>
                  <td>Mid-Term / Past Exam Benchmark</td>
                  <td>100</td>
                  <td style={{ fontWeight: 600 }}>{selectedStudent.past_exam_marks}%</td>
                  <td><span className={`badge ${selectedStudent.past_exam_marks >= 40 ? 'badge-low' : 'badge-high'}`}>{selectedStudent.past_exam_marks >= 40 ? 'Pass' : 'Fail'}</span></td>
                </tr>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td>FINAL RECORDED COMPOSITE MARKS</td>
                  <td>100</td>
                  <td style={{ fontSize: '1.1rem', color: selectedStudent.final_marks >= 40 ? '#059669' : '#e11d48' }}>
                    {selectedStudent.final_marks}%
                  </td>
                  <td>
                    <span className={`badge ${selectedStudent.final_marks >= 40 ? 'badge-low' : 'badge-high'}`}>
                      {selectedStudent.final_marks >= 40 ? 'Passed' : 'At-Risk / Failed'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Academic Committee Assessment */}
          <div style={{ background: isAtRisk ? '#fff1f2' : '#f0fdf4', border: `1px solid ${isAtRisk ? '#fecdd3' : '#bbf7d0'}`, borderRadius: '10px', padding: '18px 24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isAtRisk ? '#9f1239' : '#166534', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
              {isAtRisk ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
              <span>Faculty Academic Evaluation & Status</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: isAtRisk ? '#be123c' : '#15803d', lineHeight: '1.5' }}>
              {isAtRisk
                ? `Student is currently flagged for Academic Intervention due to ${selectedStudent.final_marks < 40 ? 'sub-threshold examination scores' : ''} ${selectedStudent.attendance_percentage < 75 ? 'and irregular attendance records' : ''}. Mandatory mentor meeting and remedial coursework assigned.`
                : 'Student demonstrates healthy academic consistency and satisfies all performance prerequisites for progression into subsequent coursework.'}
            </p>
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '28px', borderTop: '1px solid #e2e8f0', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #94a3b8', height: '36px', marginBottom: '8px' }}></div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Faculty Advisor Signature</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Department of {selectedStudent.department}</div>
            </div>

            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid #94a3b8', height: '36px', marginBottom: '8px' }}></div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>Controller of Examinations</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>EduInsight Academic System</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
