import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/Shared';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needs2fa, setNeeds2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password, totpCode);
      if (result.requires2fa) {
        setNeeds2fa(true);
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Make sure the backend is running (START_BACKEND_ONLY.bat).');
      } else {
        setError(err.response?.data?.error || 'Login failed. Check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1><span>FSDS</span></h1>
          <p>Forgery Signature Detection System</p>
          <p style={{ fontSize: 11, marginTop: 2, color: 'var(--accent)', opacity: 0.7 }}>WeCare Software Solutions LTD.</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!needs2fa ? (
            <>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Two-Factor Authentication Code</label>
              <input
                className="form-input"
                type="text"
                value={totpCode}
                onChange={e => setTotpCode(e.target.value)}
                placeholder="6-digit code from authenticator app"
                maxLength={6}
                autoFocus
                required
              />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                Enter the code from your authenticator app.
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
            {loading ? <Spinner size={16} /> : null}
            {needs2fa ? 'Verify & Sign In' : 'Sign In'}
          </button>

          {needs2fa && (
            <button type="button" className="btn btn-secondary w-full"
              onClick={() => { setNeeds2fa(false); setTotpCode(''); }}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              ← Back
            </button>
          )}
        </form>

        <div style={{ marginTop: 24, padding: '12px', background: 'var(--surface-3)', borderRadius: 8, fontSize: 12 }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Demo Credentials</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><span style={{ color: 'var(--accent)' }}>admin</span> / Admin@123456</div>
            <div><span style={{ color: 'var(--success)' }}>officer1</span> / Officer@123456</div>
            <div><span style={{ color: 'var(--warning)' }}>auditor1</span> / Auditor@123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}
