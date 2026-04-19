import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Spinner, EmptyState } from '../components/Shared';

export function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/reports/audit-trail', { params: { limit: 200, action: actionFilter } })
      .then(r => setLogs(r.data))
      .finally(() => setLoading(false));
  }, [actionFilter]);

  const actionColor = (action) => {
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) return 'var(--danger)';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'var(--accent)';
    if (action.includes('VERIFY')) return 'var(--success)';
    if (action.includes('CREATE')) return 'var(--warning)';
    return 'var(--text-muted)';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Audit Trail (FR-023, NFR-006)
        </div>
        <div className="page-subtitle">Complete 5-year tamper-evident activity log. Read-only access.</div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input className="form-input" placeholder="Filter by action type…" value={actionFilter}
            onChange={e => setActionFilter(e.target.value)} style={{ maxWidth: 300 }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : logs.length === 0 ? (
          <EmptyState message="No audit logs found" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td className="mono" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 500 }}>{l.user_name}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: actionColor(l.action) }}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.resource || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.details || '—'}
                    </td>
                    <td className="mono" style={{ fontSize: 11 }}>{l.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/verifications/alerts').then(r => setAlerts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.post(`/verifications/alerts/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    const unread = alerts.filter(a => !a.is_read);
    await Promise.all(unread.map(a => api.post(`/verifications/alerts/${a.id}/read`)));
    load();
  };

  const sevIcon = { critical: '🚨', high: '⚠️', medium: 'ℹ️' };
  const sevLabel = { critical: 'Highly Suspicious Forgery', high: 'Suspected Forgery', medium: 'Notice' };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              Fraud Alerts (FR-024)
            </div>
            <div className="page-subtitle">Automatic alerts triggered by suspicious and highly suspicious verifications</div>
          </div>
          <button className="btn btn-secondary" onClick={markAllRead}>Mark All Read</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : alerts.length === 0 ? (
        <EmptyState message="No alerts — the system is clean 🎉" />
      ) : (
        <div>
          {/* Summary */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card danger">
              <div className="stat-label">Critical Alerts</div>
              <div className="stat-value danger">{alerts.filter(a => a.severity === 'critical').length}</div>
              <div className="stat-sub">{alerts.filter(a => a.severity === 'critical' && !a.is_read).length} unread</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-label">High Alerts</div>
              <div className="stat-value warning">{alerts.filter(a => a.severity === 'high').length}</div>
              <div className="stat-sub">{alerts.filter(a => a.severity === 'high' && !a.is_read).length} unread</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-label">Total Alerts</div>
              <div className="stat-value accent">{alerts.length}</div>
              <div className="stat-sub">{alerts.filter(a => !a.is_read).length} unread</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(a => (
              <div key={a.id}
                className={`alert-item ${a.severity}`}
                style={{ opacity: a.is_read ? 0.6 : 1, transition: 'opacity 0.2s' }}
              >
                <div style={{ fontSize: 24, lineHeight: 1 }}>{sevIcon[a.severity]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span className="alert-title">{a.title}</span>
                    {!a.is_read && (
                      <span style={{ background: 'var(--danger)', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 6, fontWeight: 700 }}>NEW</span>
                    )}
                  </div>
                  <div className="alert-msg">{a.message}</div>
                  <div className="alert-time">{new Date(a.created_at).toLocaleString()}</div>
                </div>
                {!a.is_read && (
                  <button className="btn btn-secondary btn-sm" onClick={() => markRead(a.id)}>
                    ✓ Read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
