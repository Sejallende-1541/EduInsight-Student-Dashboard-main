import React from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Sparkles,
  AlertTriangle,
  FileText,
  GraduationCap,
  Cpu
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Records', icon: Users },
    { id: 'analysis', label: 'Performance Analysis', icon: BarChart3 },
    { id: 'predictions', label: 'Marks Prediction', icon: Sparkles },
    { id: 'atrisk', label: 'At-Risk Students', icon: AlertTriangle },
    { id: 'reports', label: 'Reports & Transcripts', icon: FileText },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <div className="logo-icon">
            <GraduationCap size={22} />
          </div>
          <div className="logo-text">
            <h1>EduInsight</h1>
            <span>Performance Mining System</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="model-badge">
          <div className="model-badge-title">
            <Cpu size={14} />
            <span>Linear Regression Engine</span>
          </div>
          <div className="model-badge-desc">
            OLS ML Pipeline • SQLite DB • Scikit-learn
          </div>
        </div>
      </div>
    </aside>
  );
}
