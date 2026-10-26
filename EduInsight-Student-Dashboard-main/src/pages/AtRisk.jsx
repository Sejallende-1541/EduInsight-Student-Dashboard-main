import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Sliders,
  Download,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function AtRisk() {
  const [marksThreshold, setMarksThreshold] = useState(40.0);
  const [attendanceThreshold, setAttendanceThreshold] = useState(75.0);
  const [atRiskList, setAtRiskList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAtRisk();
  }, [marksThreshold, attendanceThreshold]);

  const fetchAtRisk = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAtRiskStudents(marksThreshold, attendanceThreshold);
      setAtRiskList(data);
    } catch (err) {
      setError(err.message || 'Error fetching at-risk student records');
    } finally {
      setLoading(false);
    }
  };

  const highRiskCount = atRiskList.filter((item) => item.risk_level === 'High').length;
  const mediumRiskCount = atRiskList.filter((item) => item.risk_level === 'Medium').length;

  const handleDownloadCsv = () => {
    const headers = ['Student ID', 'Name', 'Department', 'Attendance %', 'Final Marks %', 'Risk Level', 'Reasons', 'Recommended Action'];
    const rows = atRiskList.map((item) => [
      item.student.student_id,
      `"${item.student.name}"`,
      item.student.department,
      item.student.attendance_percentage,
      item.student.final_marks,
      item.risk_level,
      `"${item.reasons.join('; ')}"`,
      `"${item.recommendation}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `at_risk_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Rule Configuration Box */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <Sliders size={18} color="#4f46e5" />
              <span>Configurable Early Warning Heuristic Rules</span>
            </div>
            <div className="card-subtitle">
              Adjust minimum institutional benchmarks to dynamically flag vulnerable students without black-box complexity
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchAtRisk}>
            <RefreshCw size={14} />
            <span>Recalculate</span>
          </button>
        </div>

        <div className="form-grid-2">
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Passing Marks Threshold</label>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e11d48' }}>&lt; {marksThreshold}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="60"
              step="1"
              style={{ width: '100%' }}
              value={marksThreshold}
              onChange={(e) => setMarksThreshold(parseFloat(e.target.value))}
            />
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px' }}>
              Students with marks below this cutoff are classified as academically failing.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Minimum Attendance Threshold</label>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#d97706' }}>&lt; {attendanceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              step="1"
              style={{ width: '100%' }}
              value={attendanceThreshold}
              onChange={(e) => setAttendanceThreshold(parseFloat(e.target.value))}
            />
            <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px' }}>
              Students below this cutoff risk debarment from end-semester examinations.
            </p>
          </div>
        </div>
      </div>

      {/* Metric summary banner */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
          <div>
            <div className="kpi-label" style={{ color: '#9f1239' }}>Total Flagged At-Risk</div>
            <div className="kpi-value" style={{ color: '#e11d48' }}>{atRiskList.length}</div>
            <div className="kpi-sub">Students meeting flagging criteria</div>
          </div>
          <div className="kpi-icon rose">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="kpi-card" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
          <div>
            <div className="kpi-label" style={{ color: '#991b1b' }}>High Risk (Both Low Marks & Low Attendance)</div>
            <div className="kpi-value" style={{ color: '#dc2626' }}>{highRiskCount}</div>
            <div className="kpi-sub">Urgent institutional intervention required</div>
          </div>
          <div className="kpi-icon rose">
            <PhoneCall size={22} />
          </div>
        </div>

        <div className="kpi-card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div>
            <div className="kpi-label" style={{ color: '#92400e' }}>Medium Risk (Single Factor)</div>
            <div className="kpi-value" style={{ color: '#d97706' }}>{mediumRiskCount}</div>
            <div className="kpi-sub">Targeted remedial counseling needed</div>
          </div>
          <div className="kpi-icon amber">
            <UserCheck size={22} />
          </div>
        </div>
      </div>

      {/* Flagged Students List Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div>
            <div className="card-title" style={{ margin: 0 }}>
              <span>Vulnerable Student Intervention Registry</span>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleDownloadCsv} disabled={atRiskList.length === 0}>
            <Download size={14} />
            <span>Download At-Risk Report (.CSV)</span>
          </button>
        </div>

        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Department</th>
                <th>Final Marks</th>
                <th>Attendance</th>
                <th>Risk Level</th>
                <th>Specific Flagging Reasons</th>
                <th>Actionable Academic Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Evaluating cohort against threshold parameters...
                  </td>
                </tr>
              ) : atRiskList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#059669' }}>
                    <CheckCircle size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Excellent! No students currently fall below the selected benchmarks.
                  </td>
                </tr>
              ) : (
                atRiskList.map((item) => (
                  <tr key={item.student.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace', color: '#4338ca' }}>
                      {item.student.student_id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.student.name}</td>
                    <td>
                      <span className="badge badge-dept">{item.student.department}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: item.student.final_marks < marksThreshold ? '#e11d48' : '#0f172a' }}>
                      {item.student.final_marks}%
                    </td>
                    <td style={{ fontWeight: 700, color: item.student.attendance_percentage < attendanceThreshold ? '#e11d48' : '#059669' }}>
                      {item.student.attendance_percentage}%
                    </td>
                    <td>
                      <span className={`badge ${item.risk_level === 'High' ? 'badge-high' : 'badge-medium'}`}>
                        {item.risk_level} Risk
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '240px' }}>
                      {item.reasons.map((r, i) => (
                        <div key={i} style={{ marginBottom: '2px' }}>• {r}</div>
                      ))}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#0f172a', maxWidth: '300px' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                        {item.recommendation}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
