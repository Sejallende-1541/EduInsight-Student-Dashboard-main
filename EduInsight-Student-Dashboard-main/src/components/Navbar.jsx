import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';

const titles = {
  dashboard: { title: 'Academic Overview Dashboard', subtitle: 'Real-time cohort performance telemetry and distribution analytics' },
  students: { title: 'Student Records Directory', subtitle: 'Manage, search, filter, and import/export student datasets' },
  analysis: { title: 'Exploratory Data Science & Mining', subtitle: 'Descriptive metrics, correlation matrix, and data-driven insights' },
  predictions: { title: 'Marks Prediction & ML Modeling', subtitle: 'Multiple Linear Regression inference with transparent formula coefficients' },
  atrisk: { title: 'At-Risk Academic Early Warning', subtitle: 'Transparent rule-based detection with targeted remedial recommendations' },
  reports: { title: 'Official Performance Reports', subtitle: 'Individual student performance cards and printable academic transcripts' },
};

export default function Navbar({ activeTab, stats }) {
  const current = titles[activeTab] || titles.dashboard;
  const isFallback = stats?.is_offline_fallback;

  return (
    <header className="top-navbar">
      <div className="navbar-title">
        <h2>{current.title}</h2>
        <p>{current.subtitle}</p>
      </div>

      <div className="navbar-actions">
        {stats && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} />
              {stats.total_students} Students Loaded
            </span>
          </div>
        )}
        <div
          className="live-indicator"
          style={isFallback ? { background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' } : {}}
        >
          <span
            className="live-dot"
            style={isFallback ? { backgroundColor: '#f59e0b' } : {}}
          ></span>
          <span>{isFallback ? 'Built-in Dataset Active' : 'FastAPI + SQLite Online'}</span>
        </div>
      </div>
    </header>
  );
}
