import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Spinner, Modal, EmptyState } from '../components/Shared';
import SignaturePad from '../components/SignaturePad';
import { useAuth } from '../hooks/useAuth';

export default function CustomersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [selected, setSelected]     = useState(null);
  const [refs, setRefs]             = useState([]);
  const [refImages, setRefImages]   = useState({});
  const [showAddRef, setShowAddRef] = useState(false);
  const [refData, setRefData]       = useState(null);
  const [refFile, setRefFile]       = useState(null);
  const [refMode, setRefMode]       = useState('pad');
  const [saving, setSaving]         = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);   // { type: 'customer'|'reference', id, name }
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    full_name: '', account_number: '', branch: '',
    email: '', phone: '', customer_id: ''
  });

  const load = () => {
    setLoading(true);
    api.get('/signatures/customers', { params: search ? { search } : {} })
      .then(r => setCustomers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const openCustomer = async (c) => {
    setSelected(c);
    const res = await api.get(`/signatures/customers/${c.id}`);
    setRefs(res.data.signatures || []);
    setRefImages({});
  };

  const loadRefImage = async (ref) => {
    if (refImages[ref.id]) return;
    const res = await api.get(`/signatures/references/${ref.id}/image`);
    setRefImages(prev => ({ ...prev, [ref.id]: res.data.image_base64 }));
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/signatures/customers', form);
      setShowAdd(false);
      setForm({ full_name: '', account_number: '', branch: '', email: '', phone: '', customer_id: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReference = async () => {
    setSaving(true);
    try {
      if (refMode === 'pad' && refData) {
        await api.post(`/signatures/customers/${selected.id}/references`, { image_base64: refData });
      } else if (refMode === 'upload' && refFile) {
        const fd = new FormData();
        fd.append('file', refFile);
        await api.post(`/signatures/customers/${selected.id}/references`, fd,
          { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowAddRef(false); setRefData(null); setRefFile(null);
      const res = await api.get(`/signatures/customers/${selected.id}`);
      setRefs(res.data.signatures || []);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add reference');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (type, id, name) => setConfirmDel({ type, id, name });

  const executeDelete = async () => {
    if (!confirmDel) return;
    const { type, id } = confirmDel;
    try {
      if (type === 'customer') {
        await api.delete(`/signatures/customers/${id}`);
        setSelected(null);
        load();
      } else {
        await api.delete(`/signatures/references/${id}`);
        const res = await api.get(`/signatures/customers/${selected.id}`);
        setRefs(res.data.signatures || []);
        load();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally {
      setConfirmDel(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Customer Database
            </div>
            <div className="page-subtitle">Manage customers and their signature reference samples (FR-012, FR-015)</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Customer
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input className="form-input" placeholder="Search by name, account number, customer ID…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 380 }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : customers.length === 0 ? (
          <EmptyState message="No customers found" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th><th>Full Name</th><th>Account Number</th>
                  <th>Branch</th><th>References</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{c.customer_id}</td>
                    <td style={{ fontWeight: 500 }}>{c.full_name}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{c.account_number}</td>
                    <td>{c.branch}</td>
                    <td>
                      <span style={{
                        color: c.signature_count >= 5 ? 'var(--success)'
                             : c.signature_count > 0  ? 'var(--warning)' : 'var(--danger)',
                        fontFamily: 'var(--mono)', fontWeight: 600
                      }}>{c.signature_count} / 5</span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 12,
                        background: c.is_active ? 'var(--success-dim)' : 'var(--danger-dim)',
                        color:      c.is_active ? 'var(--success)'     : 'var(--danger)'
                      }}>{c.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openCustomer(c)}>Manage</button>
                        {isAdmin && (
                          <button className="btn btn-sm" style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                            onClick={() => confirmDelete('customer', c.id, c.full_name)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer detail panel */}
      {selected && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">{selected.full_name} — Signature References</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddRef(true)}>+ Add Reference</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>

          <div style={{ background: 'var(--surface-3)', borderRadius: 8, padding: '10px 14px',
            marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 20px', fontSize: 13 }}>
            <div><span style={{ color: 'var(--text-dim)' }}>Account:</span> <span className="mono">{selected.account_number}</span></div>
            <div><span style={{ color: 'var(--text-dim)' }}>Branch:</span> {selected.branch}</div>
            <div><span style={{ color: 'var(--text-dim)' }}>References:</span>{' '}
              <span style={{ color: refs.length >= 5 ? 'var(--success)' : 'var(--warning)' }}>{refs.length}</span>
            </div>
          </div>

          {refs.length === 0 ? (
            <EmptyState message="No reference signatures — add at least 5 for accurate detection" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {refs.map((ref, i) => (
                <div key={ref.id} style={{ border: '1px solid var(--border)', borderRadius: 8,
                  overflow: 'hidden', background: 'var(--surface-3)' }}>
                  <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Reference #{i+1}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '2px 6px', fontSize: 10 }}
                        onClick={() => loadRefImage(ref)}>View</button>
                      {isAdmin && (
                        <button className="btn btn-sm" style={{ padding: '2px 6px', fontSize: 10,
                          background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                          onClick={() => confirmDelete('reference', ref.id, `Reference #${i+1}`)}>✕</button>
                      )}
                    </div>
                  </div>
                  {refImages[ref.id] ? (
                    <img src={`data:image/png;base64,${refImages[ref.id]}`} alt={`Reference ${i+1}`}
                      style={{ width: '100%', display: 'block', background: '#0d1b2a' }} />
                  ) : (
                    <div style={{ height: 80, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--text-dim)', fontSize: 12 }}>
                      Click View to load
                    </div>
                  )}
                  <div style={{ padding: '6px 10px', fontSize: 10, color: 'var(--text-dim)' }}>
                    {new Date(ref.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Customer modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Customer">
        <form onSubmit={handleAddCustomer}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" required value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Customer ID</label>
              <input className="form-input" placeholder="Auto-generated if empty" value={form.customer_id}
                onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number *</label>
              <input className="form-input" required value={form.account_number}
                onChange={e => setForm(p => ({ ...p, account_number: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Branch *</label>
              <input className="form-input" required value={form.branch}
                onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner size={14} /> : null} Save Customer
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Add Reference modal */}
      <Modal open={showAddRef} onClose={() => setShowAddRef(false)}
        title={`Add Reference Signature — ${selected?.full_name}`}>
        <div className="tabs" style={{ marginBottom: 16 }}>
          <div className={`tab ${refMode === 'pad' ? 'active' : ''}`}
            onClick={() => { setRefMode('pad'); setRefFile(null); }}>✏️ Pen Tablet / Draw</div>
          <div className={`tab ${refMode === 'upload' ? 'active' : ''}`}
            onClick={() => { setRefMode('upload'); setRefData(null); }}>📁 Upload File</div>
        </div>
        {refMode === 'pad' ? (
          <SignaturePad onCapture={setRefData} width={480} height={160} />
        ) : (
          <div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
              onChange={e => setRefFile(e.target.files[0])} />
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}
              onClick={() => fileRef.current?.click()}>
              {refFile ? refFile.name : 'Choose Image File'}
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" disabled={saving || (!refData && !refFile)}
            onClick={handleAddReference}>
            {saving ? <Spinner size={14} /> : null} Save Reference
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAddRef(false)}>Cancel</button>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirm Deletion" maxWidth={400}>
        {confirmDel && (
          <div>
            <p style={{ color: 'var(--text)', marginBottom: 20 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: 'var(--danger)' }}>{confirmDel.name}</strong>?
              {confirmDel.type === 'customer' && ' This will deactivate the customer and all their verification history.'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" style={{ background: 'var(--danger-dim)', color: 'var(--danger)',
                border: '1px solid var(--danger)', padding: '8px 20px' }}
                onClick={executeDelete}>Yes, Delete</button>
              <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
