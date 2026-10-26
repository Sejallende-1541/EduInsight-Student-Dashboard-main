import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  BarChart2,
  BookOpen,
  ArrowRight
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
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
const GRADE_COLORS = {
  '<40 (Fail)': '#ef4444',
  '40-59 (Pass)': '#f59e0b',
  '60-74 (Merit)': '#3b82f6',
  '75-89 (Distinction)': '#6366f1',
  '90-100 (Outstanding)': '#10b981',
};

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem' }}>Mining student performance records...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', borderColor: '#fecdd3' }}>
        <AlertTriangle size={36} color="#e11d48" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ color: '#9f1239' }}>Error Loading Dashboard</h3>
        <p style={{ color: '#64748b', marginTop: '6px' }}>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboard} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Cohort Size</div>
            <div className="kpi-value">{stats.total_students}</div>
            <div className="kpi-sub">Registered across 5 departments</div>
          </div>
          <div className="kpi-icon blue">
            <Users size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Class Average Score</div>
            <div className="kpi-value">{stats.average_marks}%</div>
            <div className="kpi-sub">Range: {stats.lowest_marks}% – {stats.highest_marks}%</div>
          </div>
          <div className="kpi-icon emerald">
            <Award size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Overall Pass Rate</div>
            <div className="kpi-value">{stats.pass_percentage}%</div>
            <div className="kpi-sub">Benchmark: ≥ 40.0% final marks</div>
          </div>
          <div className="kpi-icon indigo">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">At-Risk Students</div>
            <div className="kpi-value" style={{ color: stats.at_risk_count > 0 ? '#e11d48' : '#059669' }}>
              {stats.at_risk_count}
            </div>
            <div className="kpi-sub">Needing academic support</div>
          </div>
          <div className="kpi-icon rose">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => setActiveTab('students')}>
          <Users size={16} />
          <span>View Student Directory</span>
        </button>
        <button className="btn btn-primary" onClick={() => setActiveTab('predictions')}>
          <Sparkles size={16} />
          <span>Run Linear Regression Predictor</span>
        </button>
        <button className="btn btn-danger" onClick={() => setActiveTab('atrisk')}>
          <AlertTriangle size={16} />
          <span>Inspect {stats.at_risk_count} At-Risk Students</span>
        </button>
      </div>

      {/* Charts Row */}
      <div className="charts-grid-2">
        {/* Marks Distribution Histogram */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BarChart2 size={18} color="#4f46e5" />
                <span>Final Marks Distribution</span>
              </div>
              <div className="card-subtitle">Count of students categorized by institutional grade tiers</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={stats.marks_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value} Students`, 'Count']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.marks_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.range] || '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject-wise Averages */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <BookOpen size={18} color="#06b6d4" />
                <span>Subject & Assessment Averages</span>
              </div>
              <div className="card-subtitle">Comparative performance metrics across individual subjects</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={stats.subject_averages} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Average Score']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="average" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {stats.subject_averages.map((entry, index) => (
                    <Cell key={`cell-sub-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Department Distribution & System Highlights */}
      <div className="charts-grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Department Enrollment Breakdown</div>
              <div className="card-subtitle">Distribution of students across engineering disciplines</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stats.department_distribution}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {stats.department_distribution.map((entry, index) => (
                    <Cell key={`cell-dept-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Students`, 'Cohort']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Project Mining Highlights</div>
              <div className="card-subtitle">Key architectural foundations for academic viva evaluation</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
              <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>Ordinary Least Squares (OLS) Linear Regression:</strong>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Used strictly to predict final marks from study hours, attendance, past marks, and assignments. Interpretable coefficients allow transparent factor evaluation.
              </p>
            </div>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #059669' }}>
              <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>Zero Data Leakage:</strong>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Strict 80/20 train-test splitting with random seed ensures evaluation metrics (MAE and R²) are calculated purely on unseen test records.
              </p>
            </div>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #d97706' }}>
              <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>Rule-Based Early Intervention:</strong>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Flags students falling below marks (&lt;40%) or attendance (&lt;75%) thresholds with specific actionable recommendations without black-box complexity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
