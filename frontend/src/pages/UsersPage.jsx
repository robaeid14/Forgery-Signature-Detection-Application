import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Spinner, Modal, EmptyState, RoleBadge } from '../components/Shared';

const ROLES    = ['admin', 'officer', 'auditor'];
const BRANCHES = ['Head Office', 'Branch A', 'Branch B', 'Branch C', 'Branch D'];

export default function UsersPage() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({
    username: '', email: '', password: '', role: 'officer', full_name: '', branch: 'Branch A'
  });

  const load = () => {
    setLoading(true);
    api.get('/users/').then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/users/', form);
      setShowAdd(false);
      setForm({ username: '', email: '', password: '', role: 'officer', full_name: '', branch: 'Branch A' });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.put(`/users/${editUser.id}`, editUser);
      setEditUser(null); load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user');
    } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    if (u.is_active) {
      await api.post(`/users/${u.id}/deactivate`);
    } else {
      await api.put(`/users/${u.id}`, { ...u, is_active: true });
    }
    load();
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await api.delete(`/users/${confirmDel.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally { setConfirmDel(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              User Management
            </div>
            <div className="page-subtitle">Manage system users, roles, and branch assignments (FR-001, FR-004)</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add User
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        ) : users.length === 0 ? (
          <EmptyState message="No users found" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Username</th><th>Full Name</th><th>Role</th><th>Branch</th>
                  <th>Email</th><th>2FA</th><th>Status</th><th>Last Login</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="mono" style={{ fontWeight: 600 }}>{u.username}</td>
                    <td>{u.full_name}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{u.branch || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span style={{ fontSize: 11, color: u.totp_enabled ? 'var(--success)' : 'var(--text-dim)' }}>
                        {u.totp_enabled ? '✓ On' : '✗ Off'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12,
                        background: u.is_active ? 'var(--success-dim)' : 'var(--danger-dim)',
                        color: u.is_active ? 'var(--success)' : 'var(--danger)' }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditUser({ ...u })}>Edit</button>
                        <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleActive(u)}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-sm"
                          style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                          onClick={() => setConfirmDel({ id: u.id, name: u.username })}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create New User">
        <form onSubmit={handleCreate}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" required value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" required value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" required value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Password * (min 12 chars)</label>
              <input className="form-input" type="password" required minLength={12} value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="form-select" value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <input className="form-input" list="branch-list" value={form.branch}
                onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} />
              <datalist id="branch-list">{BRANCHES.map(b => <option key={b} value={b} />)}</datalist>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner size={14} /> : null} Create User
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit User modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <form onSubmit={handleUpdate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editUser.full_name}
                  onChange={e => setEditUser(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={editUser.email}
                  onChange={e => setEditUser(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={editUser.role}
                  onChange={e => setEditUser(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <input className="form-input" list="branch-list2" value={editUser.branch || ''}
                  onChange={e => setEditUser(p => ({ ...p, branch: e.target.value }))} />
                <datalist id="branch-list2">{BRANCHES.map(b => <option key={b} value={b} />)}</datalist>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Spinner size={14} /> : null} Save Changes
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Confirm User Deletion" maxWidth={400}>
        {confirmDel && (
          <div>
            <p style={{ color: 'var(--text)', marginBottom: 20 }}>
              Permanently delete user{' '}
              <strong style={{ color: 'var(--danger)' }}>{confirmDel.name}</strong>?
              This will remove them from the system. Consider using Deactivate instead for reversibility.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" style={{ background: 'var(--danger-dim)', color: 'var(--danger)',
                border: '1px solid var(--danger)', padding: '8px 20px' }}
                onClick={handleDelete}>Yes, Delete</button>
              <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
