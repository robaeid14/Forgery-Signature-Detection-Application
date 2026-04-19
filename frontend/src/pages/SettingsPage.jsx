import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Spinner, RoleBadge } from '../components/Shared';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');

  // Password change
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  // 2FA
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [tfaLoading, setTfaLoading] = useState(false);
  const [tfaMsg, setTfaMsg] = useState('');
  const [tfaErr, setTfaErr] = useState('');

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pwForm.new_password !== pwForm.confirm) {
      setPwErr('Passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 12) {
      setPwErr('Password must be at least 12 characters (FR-005)');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      });
      setPwMsg('Password changed successfully');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwErr(err.response?.data?.error || 'Failed');
    } finally {
      setPwLoading(false);
    }
  };

  const setup2fa = async () => {
    setTfaLoading(true); setTfaErr(''); setTfaMsg('');
    try {
      const res = await api.post('/auth/setup-2fa');
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
    } catch { setTfaErr('Failed to set up 2FA'); }
    finally { setTfaLoading(false); }
  };

  const enable2fa = async () => {
    setTfaLoading(true); setTfaErr('');
    try {
      await api.post('/auth/enable-2fa', { code: totpInput });
      setTfaMsg('2FA enabled successfully! You will need your authenticator app on next login.');
      setQrCode(''); setSecret(''); setTotpInput('');
      refreshUser();
    } catch (err) {
      setTfaErr(err.response?.data?.error || 'Invalid code');
    } finally {
      setTfaLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          Account Settings
        </div>
      </div>

      <div style={{ maxWidth: 680 }}>
        {/* Profile card */}
        <div className="card mb-20">
          <div className="card-header">
            <span className="card-title">Profile Information</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            {[
              ['Full Name', user?.full_name],
              ['Username', user?.username],
              ['Email', user?.email],
              ['Branch', user?.branch],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{v || '—'}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Role</div>
              <RoleBadge role={user?.role} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>2FA Status</div>
              <span style={{ color: user?.totp_enabled ? 'var(--success)' : 'var(--warning)', fontWeight: 500 }}>
                {user?.totp_enabled ? '✓ Enabled' : '✗ Not Enabled'}
              </span>
            </div>
          </div>
        </div>

        <div className="tabs">
          <div className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
            🔑 Change Password
          </div>
          <div className={`tab ${tab === '2fa' ? 'active' : ''}`} onClick={() => setTab('2fa')}>
            🔐 Two-Factor Auth
          </div>
        </div>

        {tab === 'password' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Change Password</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Min 12 chars, mixed case, numbers, special chars (FR-005)</span>
            </div>
            {pwErr && <div className="error-msg">{pwErr}</div>}
            {pwMsg && <div className="success-msg">{pwMsg}</div>}
            <form onSubmit={changePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="form-input" type="password" required value={pwForm.current_password}
                  onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password" required minLength={12} value={pwForm.new_password}
                  onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="form-input" type="password" required minLength={12} value={pwForm.confirm}
                  onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? <Spinner size={14} /> : null} Update Password
              </button>
            </form>
          </div>
        )}

        {tab === '2fa' && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Two-Factor Authentication (FR-002)</span>
            </div>
            {user?.totp_enabled ? (
              <div className="success-msg">
                ✓ 2FA is currently enabled. Use your authenticator app when logging in.
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Enable TOTP-based 2FA for enhanced account security. You will need an authenticator app such as Google Authenticator or Authy.
                </p>
                {tfaErr && <div className="error-msg">{tfaErr}</div>}
                {tfaMsg && <div className="success-msg">{tfaMsg}</div>}
                {!qrCode ? (
                  <button className="btn btn-primary" onClick={setup2fa} disabled={tfaLoading}>
                    {tfaLoading ? <Spinner size={14} /> : null} Set Up 2FA
                  </button>
                ) : (
                  <div>
                    <p style={{ fontSize: 13, marginBottom: 12 }}>Scan this QR code with your authenticator app:</p>
                    <img src={`data:image/png;base64,${qrCode}`} alt="QR Code"
                      style={{ width: 180, height: 180, border: '2px solid var(--border-strong)', borderRadius: 8, marginBottom: 16, display: 'block' }} />
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Or enter this secret manually:</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 13, padding: '8px 12px', background: 'var(--surface-3)', borderRadius: 6, marginBottom: 16, wordBreak: 'break-all' }}>
                      {secret}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Enter verification code from app</label>
                      <input className="form-input" maxLength={6} value={totpInput}
                        onChange={e => setTotpInput(e.target.value)} placeholder="000000" style={{ maxWidth: 200 }} />
                    </div>
                    <button className="btn btn-primary" onClick={enable2fa} disabled={tfaLoading || totpInput.length !== 6}>
                      {tfaLoading ? <Spinner size={14} /> : null} Activate 2FA
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
