import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../utils/api';
import { ClassificationBadge, ScoreBar, Spinner } from '../components/Shared';
import { useAuth } from '../hooks/useAuth';

const COLORS = { genuine: '#00e5a0', suspected: '#ffb547', highly_suspicious: '#ff4d6d' };

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/overview')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Spinner size={32} />
    </div>
  );
  if (!data) return null;

  const { summary, trend_7days, branch_stats, recent_transactions, unread_alerts } = data;

  const pieData = [
    { name: 'Genuine', value: summary.genuine_count, color: COLORS.genuine },
    { name: 'Suspected', value: summary.suspected_forgery_count, color: COLORS.suspected },
    { name: 'Highly Suspicious', value: summary.highly_suspicious_count, color: COLORS.highly_suspicious },
  ].filter(d => d.value > 0);

  const trendData = trend_7days.map(d => ({
    date: d.date.slice(5),
    Genuine: d.genuine,
    Suspected: d.suspected,
    'High Risk': d.highly_suspicious,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-muted)' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.fill || p.color }}>{p.name}: {p.value}</div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Dashboard
        </div>
        <div className="page-subtitle">Welcome back, {user?.full_name} · {user?.branch}</div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total Verifications</div>
          <div className="stat-value accent">{summary.total_verifications.toLocaleString()}</div>
          <div className="stat-sub">Today: {summary.today_verifications}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Genuine Signatures</div>
          <div className="stat-value success">{summary.genuine_count.toLocaleString()}</div>
          <div className="stat-sub">{summary.total_verifications > 0 ? ((summary.genuine_count / summary.total_verifications) * 100).toFixed(1) : 0}% of total</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Suspected Forgery</div>
          <div className="stat-value warning">{summary.suspected_forgery_count.toLocaleString()}</div>
          <div className="stat-sub">Requires review</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Highly Suspicious</div>
          <div className="stat-value danger">{summary.highly_suspicious_count.toLocaleString()}</div>
          <div className="stat-sub">{summary.unread_alerts} unread alerts</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Avg Match Score</div>
          <div className="stat-value accent">{summary.avg_match_score.toFixed(1)}%</div>
          <div className="stat-sub">Avg response: {summary.avg_processing_time_ms.toFixed(0)}ms</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Customers</div>
          <div className="stat-value success">{summary.total_customers}</div>
          <div className="stat-sub">{summary.total_users} system users</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-24">
        <div className="card">
          <div className="card-header">
            <span className="card-title">7-Day Verification Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} barSize={14}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Genuine" stackId="a" fill={COLORS.genuine} radius={[0,0,0,0]} />
              <Bar dataKey="Suspected" stackId="a" fill={COLORS.suspected} />
              <Bar dataKey="High Risk" stackId="a" fill={COLORS.highly_suspicious} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Classification Breakdown</span>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
              No verifications yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        {/* Recent transactions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Verifications</span>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('history')}>View All</button>
          </div>
          {recent_transactions.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No verifications yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent_transactions.slice(0, 6).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.customer_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>{t.transaction_id}</div>
                  </div>
                  <ScoreBar score={t.match_score} />
                  <ClassificationBadge value={t.classification} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Alerts</span>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('alerts')}>View All</button>
          </div>
          {unread_alerts.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No pending alerts
            </div>
          ) : (
            unread_alerts.map(a => (
              <div key={a.id} className={`alert-item ${a.severity}`}>
                <div style={{ flex: 1 }}>
                  <div className="alert-title">{a.title}</div>
                  <div className="alert-msg">{a.message}</div>
                  <div className="alert-time">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Branch stats */}
      {branch_stats.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Branch Statistics (FR-022)</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Total</th>
                  <th>Genuine</th>
                  <th>Suspected</th>
                  <th>Highly Suspicious</th>
                  <th>Fraud Rate</th>
                </tr>
              </thead>
              <tbody>
                {branch_stats.map(b => {
                  const fraudRate = b.total > 0 ? ((b.suspected + b.highly_suspicious) / b.total * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={b.branch}>
                      <td style={{ fontWeight: 500 }}>{b.branch}</td>
                      <td className="mono">{b.total}</td>
                      <td style={{ color: 'var(--success)' }} className="mono">{b.genuine}</td>
                      <td style={{ color: 'var(--warning)' }} className="mono">{b.suspected}</td>
                      <td style={{ color: 'var(--danger)' }} className="mono">{b.highly_suspicious}</td>
                      <td>
                        <ScoreBar score={100 - parseFloat(fraudRate)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
