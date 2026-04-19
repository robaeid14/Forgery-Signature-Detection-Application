import React from 'react';
import { useAuth } from '../hooks/useAuth';

const icons = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  verify: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  history: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  customers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  reports: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  audit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  alerts: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
};

export default function Sidebar({ page, setPage, alertCount = 0 }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isAuditor = user?.role === 'auditor';

  const NavItem = ({ id, label, icon, badge }) => (
    <div className={`nav-item ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}>
      {icons[icon]}
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          background: 'var(--danger)', color: '#fff',
          fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
          borderRadius: 9, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '0 4px'
        }}>{badge}</span>
      )}
    </div>
  );

  return (
    <nav className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">Overview</div>
        <NavItem id="dashboard" label="Dashboard" icon="dashboard" />
      </div>

      {!isAuditor && (
        <div className="sidebar-section">
          <div className="sidebar-label">Verification</div>
          <NavItem id="verify" label="Verify Signature" icon="verify" />
          <NavItem id="history" label="History" icon="history" />
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-label">Data</div>
        {!isAuditor && <NavItem id="customers" label="Customers" icon="customers" />}
        {isAdmin && <NavItem id="users" label="User Management" icon="users" />}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Reports</div>
        <NavItem id="reports" label="Reports" icon="reports" />
        {(isAdmin || isAuditor) && <NavItem id="audit" label="Audit Trail" icon="audit" />}
        <NavItem id="alerts" label="Alerts" icon="alerts" badge={alertCount} />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Account</div>
        <NavItem id="settings" label="Settings" icon="settings" />
        <div className="nav-item" onClick={logout} style={{ color: 'var(--danger)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </div>
      </div>

      <div style={{ margin: '16px', padding: '12px', background: 'var(--surface-3)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>v1.0.0</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>FSDS · WeCare</div>
      </div>
    </nav>
  );
}
