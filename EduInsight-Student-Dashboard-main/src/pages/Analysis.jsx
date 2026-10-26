import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  ScatterChart as ScatterIcon,
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { api } from '../services/api';

const FEATURE_NAMES = {
  study_hours_per_week: 'Study Hours',
  attendance_percentage: 'Attendance %',
  past_exam_marks: 'Past Exam Marks',
  assignment_score: 'Assignment Score',
  math_marks: 'Math Marks',
  science_marks: 'Science Marks',
  english_marks: 'English Marks',
  final_marks: 'Final Marks (Target)',
};

const GRADE_COLORS = {
  '<40 (Fail)': '#ef4444',
  '40-59 (Pass)': '#f59e0b',
  '60-74 (Merit)': '#3b82f6',
  '75-89 (Distinction)': '#6366f1',
  '90-100 (Outstanding)': '#10b981',
};

export default function Analysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalysisSummary();
      setAnalysis(data);
    } catch (err) {
      setError(err.message || 'Error loading data mining analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '12px', color: '#64748b' }}>Running Pandas descriptive statistics and Pearson correlations...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#e11d48' }}>{error}</p>
        <button className="btn btn-primary" onClick={loadAnalysis} style={{ marginTop: '14px' }}>
          Retry
        </button>
      </div>
    );
  }

  const numericFeatures = Object.keys(analysis.descriptive_stats || {});
  const corrCols = Object.keys(analysis.correlation_matrix || {});

  const getHeatmapColor = (val) => {
    if (val === undefined || val === null) return '#f8fafc';
    if (val === 1) return '#dbeafe'; // diagonal
    if (val > 0.8) return '#93c5fd';
    if (val > 0.6) return '#bfdbfe';
    if (val > 0.3) return '#e0e7ff';
    if (val > 0) return '#f1f5f9';
    if (val < -0.3) return '#fee2e2';
    return '#fef2f2';
  };

  return (
    <div>
      {/* Dynamic Data Mining Insights Banner */}
      <div className="insight-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#0369a1', fontWeight: 700, fontSize: '0.98rem' }}>
          <Sparkles size={18} />
          <span>Pandas Data Science Mining & Key Empirical Findings</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {analysis.insights.map((insight, idx) => (
            <div key={idx} className="insight-item">
              <CheckCircle2 size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Descriptive Statistics Table Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <TableIcon size={18} color="#4f46e5" />
              <span>Descriptive Statistics (Pandas DataFrame Summary)</span>
            </div>
            <div className="card-subtitle">
              Calculated dynamically via NumPy and Pandas describe(): Mean, Std Deviation, Median (50%), Min, Max
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadAnalysis}>
            <RefreshCw size={14} />
            <span>Recalculate</span>
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature / Metric</th>
                <th>Mean (μ)</th>
                <th>Std Dev (σ)</th>
                <th>Min</th>
                <th>25% (Q1)</th>
                <th>Median (50%)</th>
                <th>75% (Q3)</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {numericFeatures.map((feat) => {
                const s = analysis.descriptive_stats[feat];
                const isTarget = feat === 'final_marks';
                return (
                  <tr key={feat} style={isTarget ? { backgroundColor: '#f0fdf4', fontWeight: 600 } : {}}>
                    <td style={{ fontWeight: 600, color: isTarget ? '#047857' : '#1e293b' }}>
                      {FEATURE_NAMES[feat] || feat}
                      {isTarget && ' ★'}
                    </td>
                    <td>{s.mean}</td>
                    <td>{s.std}</td>
                    <td>{s.min}</td>
                    <td>{s['25%']}</td>
                    <td>{s['50%']}</td>
                    <td>{s['75%']}</td>
                    <td>{s.max}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualizations Row: Attendance vs Marks Scatter & Marks Histogram */}
      <div className="charts-grid-2">
        {/* Attendance vs Marks Scatter Plot */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ScatterIcon size={18} color="#2563eb" />
                <span>Attendance vs Final Marks Correlation Plot</span>
              </div>
              <div className="card-subtitle">Each point represents a student (X: Attendance %, Y: Marks %)</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="attendance"
                  name="Attendance"
                  unit="%"
                  domain={[40, 100]}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="final_marks"
                  name="Final Marks"
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                />
                <ZAxis range={[50, 50]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                          <strong>{data.name}</strong> ({data.student_id})<br />
                          Dept: {data.department}<br />
                          Attendance: {data.attendance}%<br />
                          Final Marks: {data.final_marks}%<br />
                          Study Hours: {data.study_hours} hrs/wk
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  name="Students"
                  data={analysis.attendance_vs_marks}
                  fill="#4f46e5"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Comparison Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BarChart3 size={18} color="#059669" />
                <span>Subject & Assessment Mean Comparison</span>
              </div>
              <div className="card-subtitle">Class mean across subjects and internal assessment marks</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={analysis.subject_averages} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Class Mean']} />
                <Bar dataKey="average" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {analysis.subject_averages.map((entry, index) => (
                    <Cell
                      key={`sub-bar-${index}`}
                      fill={entry.subject === 'Final Marks' ? '#10b981' : '#4f46e5'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pearson Correlation Matrix Heatmap */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <TrendingUp size={18} color="#d97706" />
              <span>Pearson Correlation Matrix (Pandas .corr())</span>
            </div>
            <div className="card-subtitle">
              Displays pairwise linear correlation coefficient (r) between -1.0 (strong inverse) and +1.0 (strong positive)
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '150px' }}>Feature</th>
                {corrCols.map((col) => (
                  <th key={col} style={{ textAlign: 'center' }}>
                    {FEATURE_NAMES[col] || col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corrCols.map((rowCol) => (
                <tr key={rowCol}>
                  <td style={{ fontWeight: 600 }}>{FEATURE_NAMES[rowCol] || rowCol}</td>
                  {corrCols.map((col) => {
                    const val = analysis.correlation_matrix[rowCol]?.[col];
                    const isDiagonal = rowCol === col;
                    return (
                      <td
                        key={col}
                        style={{
                          textAlign: 'center',
                          backgroundColor: getHeatmapColor(val),
                          fontWeight: isDiagonal ? 700 : 500,
                          color: val > 0.5 ? '#1e3a8a' : '#1e293b',
                        }}
                      >
                        {val !== undefined ? val.toFixed(2) : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
