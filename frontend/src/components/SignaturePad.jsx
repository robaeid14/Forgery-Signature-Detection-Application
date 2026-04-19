import React, { useRef, useState, useEffect, useCallback } from 'react';

/**
 * SignaturePad — captures signatures via:
 *   - Pen tablet (Wacom / XP-Pen via pointer events + pressure sensitivity)
 *   - Mouse
 *   - Touch (mobile)
 * 
 * Props:
 *   onCapture(dataURL) — called when user lifts pen/mouse
 *   onClear()
 *   width, height
 *   disabled
 */
export default function SignaturePad({
  onCapture,
  width = 520,
  height = 200,
  disabled = false,
}) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPoint = useRef(null);
  const ctx = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    ctx.current = canvas.getContext('2d');
    ctx.current.fillStyle = '#0d1b2a';
    ctx.current.fillRect(0, 0, width, height);
    ctx.current.strokeStyle = '#00d4ff';
    ctx.current.lineWidth = 2;
    ctx.current.lineCap = 'round';
    ctx.current.lineJoin = 'round';
  }, [width, height]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      const t = e.touches[0];
      return {
        x: (t.clientX - rect.left) * scaleX,
        y: (t.clientY - rect.top) * scaleY,
        pressure: t.force || 0.5
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure > 0 ? e.pressure : 0.5
    };
  };

  const startDraw = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    lastPoint.current = pos;
    ctx.current.beginPath();
    ctx.current.moveTo(pos.x, pos.y);
  }, [disabled]);

  const draw = useCallback((e) => {
    if (!drawing || disabled) return;
    e.preventDefault();
    const pos = getPos(e);
    const c = ctx.current;
    const pressure = pos.pressure;

    // Pressure-sensitive line width for pen tablet
    c.lineWidth = Math.max(1, pressure * 4);
    c.strokeStyle = `rgba(0, 212, 255, ${0.6 + pressure * 0.4})`;

    c.lineTo(pos.x, pos.y);
    c.stroke();
    c.beginPath();
    c.moveTo(pos.x, pos.y);

    lastPoint.current = pos;
    setHasSignature(true);
  }, [drawing, disabled]);

  const endDraw = useCallback((e) => {
    if (!drawing) return;
    setDrawing(false);
    ctx.current.beginPath();
    const dataURL = canvasRef.current.toDataURL('image/png');
    if (onCapture) onCapture(dataURL);
  }, [drawing, onCapture]);

  const clear = useCallback(() => {
    const c = ctx.current;
    c.fillStyle = '#0d1b2a';
    c.fillRect(0, 0, width, height);
    setHasSignature(false);
    if (onCapture) onCapture(null);
  }, [width, height, onCapture]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        className={`sig-pad-wrap ${hasSignature ? 'has-sig' : ''}`}
        style={{ width: '100%', maxWidth: width }}
      >
        {!hasSignature && (
          <div className="sig-pad-hint">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>Draw signature here</span>
            <span style={{ fontSize: 11 }}>Pen tablet, mouse, or touch supported</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={clear}
          disabled={disabled}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.14"/>
          </svg>
          Clear
        </button>
        {hasSignature && (
          <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Signature captured
          </span>
        )}
      </div>
    </div>
  );
}
