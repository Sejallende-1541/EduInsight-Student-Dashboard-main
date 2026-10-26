import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Analysis from './pages/Analysis';
import Predictions from './pages/Predictions';
import AtRisk from './pages/AtRisk';
import Reports from './pages/Reports';
import { api } from './services/api';
import './styles/index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Navbar stats fetch error:', err);
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'students':
        return <Students />;
      case 'analysis':
        return <Analysis />;
      case 'predictions':
        return <Predictions />;
      case 'atrisk':
        return <AtRisk />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-wrapper">
        <Navbar activeTab={activeTab} stats={stats} />
        <main className="page-content">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
