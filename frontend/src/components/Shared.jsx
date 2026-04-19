import React from 'react';

export function ClassificationBadge({ value }) {
  if (!value) return null;
  const map = {
    'Genuine': 'cls-genuine',
    'Suspected Forgery': 'cls-suspected',
    'Highly Suspicious': 'cls-suspicious',
  };
  const dots = {
    'Genuine': '●',
    'Suspected Forgery': '◆',
    'Highly Suspicious': '▲',
  };
  return (
    <span className={`cls-badge ${map[value] || ''}`}>
      {dots[value]} {value}
    </span>
  );
}

export function ScoreBar({ score }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  let color = 'var(--danger)';
  if (pct >= 85) color = 'var(--success)';
  else if (pct >= 60) color = 'var(--warning)';

  return (
    <div className="score-bar-wrap">
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="score-val" style={{ color }}>{pct.toFixed(1)}%</span>
    </div>
  );
}

export function Spinner({ size = 18 }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} />
  );
}

export function EmptyState({ icon, message = 'No data found' }) {
  return (
    <div className="empty-state">
      {icon && <div>{icon}</div>}
      <p>{message}</p>
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 560 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    admin: { background: 'rgba(0,212,255,0.12)', color: 'var(--accent)', border: '1px solid rgba(0,212,255,0.3)' },
    officer: { background: 'rgba(0,229,160,0.12)', color: 'var(--success)', border: '1px solid rgba(0,229,160,0.3)' },
    auditor: { background: 'rgba(255,181,71,0.12)', color: 'var(--warning)', border: '1px solid rgba(255,181,71,0.3)' },
  };
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      ...(styles[role] || styles.auditor)
    }}>
      {role}
    </span>
  );
}
