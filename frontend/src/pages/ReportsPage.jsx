import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../utils/api';
import { ClassificationBadge, Spinner } from '../components/Shared';

export default function ReportsPage() {
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');

  const load = () => {
    setLoading(true);
    const endpoint = tab === 'daily'
      ? `/reports/daily?date=${date}`
      : `/reports/monthly?year=${year}&month=${month}`;
    api.get(endpoint).then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab, date, year, month]);

  const exportFile = async (format) => {
    setExporting(format);
    try {
      const params = tab === 'daily' ? `date=${date}` : `date=${year}-${String(month).padStart(2,'0')}-01`;
      const res = await api.get(`/reports/export/${format}?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FSDS_Report_${date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting('');
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ marginBottom: 4, color: 'var(--text-muted)' }}>{label}</div>
        {payload.map(p => <div key={p.name} style={{ color: p.fill || p.stroke }}>{p.name}: {p.value}</div>)}
      </div>
    );
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Reports (FR-020, FR-021)
            </div>
            <div className="page-subtitle">Daily and monthly fraud detection summary reports</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => exportFile('pdf')} disabled={!!exporting}>
              {exporting === 'pdf' ? <Spinner size={14} /> : '📄'} Export PDF
            </button>
            <button className="btn btn-secondary" onClick={() => exportFile('excel')} disabled={!!exporting}>
              {exporting === 'excel' ? <Spinner size={14} /> : '📊'} Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs + date controls */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="tabs">
          <div className={`tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>Daily Report</div>
          <div className={`tab ${tab === 'monthly' ? 'active' : ''}`} onClick={() => setTab('monthly')}>Monthly Report</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          {tab === 'daily' ? (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Report Date</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: 180 }} />
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Year</label>
                <input type="number" className="form-input" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 100 }} min={2020} max={2030} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Month</label>
                <select className="form-select" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ width: 150 }}>
                  {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                </select>
              </div>
            </>
          )}
          <button className="btn btn-primary" onClick={load}>Generate</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : data ? (
        <div>
          {/* Summary cards */}
          <div className="stat-grid">
            <div className="stat-card accent">
              <div className="stat-label">Total Verifications</div>
              <div className="stat-value accent">{data.total}</div>
            </div>
            <div className="stat-card success">
              <div className="stat-label">Genuine</div>
              <div className="stat-value success">{data.genuine}</div>
              <div className="stat-sub">{data.total > 0 ? ((data.genuine/data.total)*100).toFixed(1) : 0}%</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-label">Suspected Forgery</div>
              <div className="stat-value warning">{data.suspected_forgery}</div>
              <div className="stat-sub">{data.total > 0 ? ((data.suspected_forgery/data.total)*100).toFixed(1) : 0}%</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-label">Highly Suspicious</div>
              <div className="stat-value danger">{data.highly_suspicious}</div>
              <div className="stat-sub">{data.total > 0 ? ((data.highly_suspicious/data.total)*100).toFixed(1) : 0}%</div>
            </div>
            {tab === 'daily' && (
              <>
                <div className="stat-card accent">
                  <div className="stat-label">Avg Match Score</div>
                  <div className="stat-value accent">{(data.avg_match_score || 0).toFixed(1)}%</div>
                </div>
                <div className="stat-card accent">
                  <div className="stat-label">Avg Processing Time</div>
                  <div className="stat-value accent">{(data.avg_processing_time_ms || 0).toFixed(0)}ms</div>
                </div>
              </>
            )}
          </div>

          {/* Monthly trend chart */}
          {tab === 'monthly' && data.daily_breakdown && (
            <div className="card mb-20">
              <div className="card-header"><span className="card-title">Daily Trend — {MONTHS[month-1]} {year}</span></div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={Object.entries(data.daily_breakdown).sort().map(([d, v]) => ({ date: d.slice(8), ...v }))}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="genuine" stroke="var(--success)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="suspected" stroke="var(--warning)" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="highly_suspicious" stroke="var(--danger)" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Branch breakdown (daily) */}
          {tab === 'daily' && data.branches && Object.keys(data.branches).length > 0 && (
            <div className="card mb-20">
              <div className="card-header"><span className="card-title">Branch Breakdown</span></div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(data.branches).map(([b, v]) => ({ branch: b, ...v }))} barSize={16}>
                  <XAxis dataKey="branch" tick={{ fontSize: 11, fill: 'var(--text-dim)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-dim)' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="genuine" stackId="a" fill="var(--success)" />
                  <Bar dataKey="suspected" stackId="a" fill="var(--warning)" />
                  <Bar dataKey="highly_suspicious" stackId="a" fill="var(--danger)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transactions table (daily) */}
          {tab === 'daily' && data.transactions?.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Transaction Details ({data.transactions.length})</span></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Customer</th>
                      <th>Score</th>
                      <th>Classification</th>
                      <th>Document</th>
                      <th>Branch</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map(t => (
                      <tr key={t.id}>
                        <td className="mono" style={{ fontSize: 12 }}>{t.transaction_id}</td>
                        <td>{t.customer_name}</td>
                        <td className="mono">{t.match_score?.toFixed(1)}%</td>
                        <td><ClassificationBadge value={t.classification} /></td>
                        <td>{t.document_type}</td>
                        <td>{t.branch}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
