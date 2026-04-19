import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VerifyPage from './pages/VerifyPage';
import HistoryPage from './pages/HistoryPage';
import CustomersPage from './pages/CustomersPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import { AuditPage, AlertsPage } from './pages/AuditAlertsPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import './styles/global.css';
import api from './utils/api';

function AppShell() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = () => {
      api.get('/verifications/stats/summary').then(r => {
        setAlertCount(r.data.unread_alerts || 0);
      }).catch(() => {});
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <LoginPage />;

  const pageComponents = {
    dashboard: <DashboardPage onNavigate={setPage} />,
    verify: <VerifyPage />,
    history: <HistoryPage />,
    customers: <CustomersPage />,
    users: user.role === 'admin' ? <UsersPage /> : <DashboardPage onNavigate={setPage} />,
    reports: <ReportsPage />,
    audit: <AuditPage />,
    alerts: <AlertsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="app-layout">
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          FSDS <span>·</span> WeCare
        </div>
        <div className="topbar-spacer" />

        {/* Alert bell */}
        <div className="topbar-alert-badge" onClick={() => setPage('alerts')} title="View Alerts">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {alertCount > 0 && <span className="badge">{alertCount > 99 ? '99+' : alertCount}</span>}
        </div>

        {/* User menu */}
        <div className="topbar-user" onClick={() => setPage('settings')}>
          <div className="user-avatar">
            {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="user-name">{user.full_name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar page={page} setPage={setPage} alertCount={alertCount} />

      {/* Main */}
      <main className="main-content">
        {pageComponents[page] || <DashboardPage onNavigate={setPage} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
