import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { ClassificationBadge, ScoreBar, Spinner, Modal, EmptyState } from '../components/Shared';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter) params.classification = filter;
    if (search) params.customer = search;
    params.limit = 100;
    api.get('/verifications/', { params })
      .then(r => setTransactions(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter, search]);

  const openDetail = async (txn) => {
    setDetailLoading(true);
    setSelected(txn);
    try {
      const res = await api.get(`/verifications/${txn.id}`);
      setSelected(res.data);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Verification History
        </div>
        <div className="page-subtitle">Complete transaction log with classification results</div>
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="form-input"
            placeholder="Search by customer name or account…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All Classifications</option>
            <option value="Genuine">Genuine</option>
            <option value="Suspected Forgery">Suspected Forgery</option>
            <option value="Highly Suspicious">Highly Suspicious</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : transactions.length === 0 ? (
          <EmptyState message="No verification transactions found" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Account</th>
                  <th>Document</th>
                  <th>Score</th>
                  <th>Classification</th>
                  <th>Officer</th>
                  <th>Branch</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{t.transaction_id}</td>
                    <td style={{ fontWeight: 500 }}>{t.customer_name}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{t.customer_account}</td>
                    <td>{t.document_type}</td>
                    <td><ScoreBar score={t.match_score} /></td>
                    <td><ClassificationBadge value={t.classification} /></td>
                    <td>{t.officer_name}</td>
                    <td>{t.branch}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openDetail(t)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction Detail" maxWidth={600}>
        {detailLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
        ) : selected ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20, padding: '16px 0', background: 'var(--surface-3)', borderRadius: 8 }}>
              <div style={{ fontSize: 40, fontFamily: 'var(--mono)', fontWeight: 700 }}>
                {selected.match_score?.toFixed(1)}%
              </div>
              <div style={{ marginTop: 8 }}><ClassificationBadge value={selected.classification} /></div>
            </div>

            {selected.submitted_image && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>Submitted Signature</div>
                <img
                  src={`data:image/png;base64,${selected.submitted_image}`}
                  alt="Submitted signature"
                  style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, background: '#0d1b2a' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 16 }}>
              {[
                ['Transaction ID', selected.transaction_id],
                ['Customer', selected.customer_name],
                ['Account', selected.customer_account],
                ['Branch', selected.branch],
                ['Document Type', selected.document_type],
                ['Officer', selected.officer_name],
                ['Processing Time', `${selected.processing_time_ms}ms`],
                ['Timestamp', new Date(selected.created_at).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {selected.notes && (
              <div style={{ background: 'var(--surface-3)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                <strong>Notes:</strong> {selected.notes}
              </div>
            )}

            {selected.individual_scores?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Reference Scores</div>
                {selected.individual_scores.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', minWidth: 70 }}>Reference #{i + 1}</span>
                    <ScoreBar score={s.score} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
