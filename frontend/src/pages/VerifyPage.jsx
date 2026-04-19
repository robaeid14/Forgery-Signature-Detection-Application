import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import SignaturePad from '../components/SignaturePad';
import { ClassificationBadge, ScoreBar, Spinner, Modal } from '../components/Shared';

const DOC_TYPES = ['Cheque', 'Loan Agreement', 'Withdrawal Slip', 'Authorization Form', 'Other'];

export default function VerifyPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [inputMode, setInputMode] = useState('pad'); // 'pad' | 'upload'
  const [docType, setDocType] = useState('Cheque');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [references, setReferences] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/signatures/customers').then(r => setCustomers(r.data)).catch(() => {});
  }, []);

  const selectCustomer = async (c) => {
    setSelectedCustomer(c);
    setShowCustomerPicker(false);
    setResult(null);
    // Load their references
    const res = await api.get(`/signatures/customers/${c.id}`);
    setReferences(res.data.signatures || []);
  };

  const handleVerify = async () => {
    if (!selectedCustomer) return;
    const hasInput = signatureData || uploadedFile;
    if (!hasInput) return;

    setLoading(true);
    setResult(null);
    try {
      if (inputMode === 'pad' && signatureData) {
        const res = await api.post('/verifications/verify', {
          customer_id: selectedCustomer.id,
          image_base64: signatureData,
          document_type: docType,
          notes
        });
        setResult(res.data);
      } else if (inputMode === 'upload' && uploadedFile) {
        const form = new FormData();
        form.append('file', uploadedFile);
        form.append('customer_id', selectedCustomer.id);
        form.append('document_type', docType);
        form.append('notes', notes);
        const res = await api.post('/verifications/verify', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResult(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    !customerSearch ||
    c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.account_number.includes(customerSearch) ||
    c.customer_id.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const classColor = result ? {
    'Genuine': 'var(--success)',
    'Suspected Forgery': 'var(--warning)',
    'Highly Suspicious': 'var(--danger)',
  }[result.classification] : '';

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          Verify Signature
        </div>
        <div className="page-subtitle">Submit a signature for AI-powered forgery detection (FR-007 – FR-014)</div>
      </div>

      <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
        {/* Left: Input panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Step 1: Customer */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <span className="card-title">
                <span style={{ background: 'var(--accent)', color: 'var(--navy)', width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginRight: 8 }}>1</span>
                Select Customer
              </span>
            </div>
            {selectedCustomer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, background: 'var(--surface-3)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedCustomer.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                    {selectedCustomer.account_number} · {selectedCustomer.branch}
                  </div>
                  <div style={{ fontSize: 12, color: references.length >= 5 ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>
                    {references.length} reference signature{references.length !== 1 ? 's' : ''} on file
                    {references.length < 5 && references.length > 0 && ' (minimum 5 recommended)'}
                    {references.length === 0 && ' — cannot verify'}
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedCustomer(null); setResult(null); setReferences([]); }}>
                  Change
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={() => setShowCustomerPicker(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Search & Select Customer
              </button>
            )}
          </div>

          {/* Step 2: Document type */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <span className="card-title">
                <span style={{ background: 'var(--accent)', color: 'var(--navy)', width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginRight: 8 }}>2</span>
                Document Details
              </span>
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Document Type</label>
              <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
                {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this transaction..." style={{ minHeight: 60 }} />
            </div>
          </div>

          {/* Step 3: Signature input */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <span className="card-title">
                <span style={{ background: 'var(--accent)', color: 'var(--navy)', width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginRight: 8 }}>3</span>
                Capture Signature
              </span>
            </div>

            <div className="tabs" style={{ marginBottom: 16 }}>
              <div className={`tab ${inputMode === 'pad' ? 'active' : ''}`} onClick={() => { setInputMode('pad'); setUploadedFile(null); }}>
                ✏️ Pen Tablet / Draw
              </div>
              <div className={`tab ${inputMode === 'upload' ? 'active' : ''}`} onClick={() => { setInputMode('upload'); setSignatureData(null); }}>
                📁 Upload File
              </div>
            </div>

            {inputMode === 'pad' ? (
              <SignaturePad
                onCapture={setSignatureData}
                width={460}
                height={180}
              />
            ) : (
              <div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: 'none' }}
                  onChange={e => setUploadedFile(e.target.files[0])} />
                <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}
                  onClick={() => fileRef.current?.click()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {uploadedFile ? uploadedFile.name : 'Choose Image (JPEG, PNG, PDF)'}
                </button>
                {uploadedFile && (
                  <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ File selected: {(uploadedFile.size / 1024).toFixed(1)} KB
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 16, padding: '11px' }}
              disabled={loading || !selectedCustomer || (!signatureData && !uploadedFile) || references.length === 0}
              onClick={handleVerify}
            >
              {loading ? <><Spinner size={16} /> Analyzing…</> : <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                </svg>
                Run Verification
              </>}
            </button>
            {selectedCustomer && references.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 8, textAlign: 'center' }}>
                No reference signatures on file — add references first
              </div>
            )}
          </div>
        </div>

        {/* Right: Result panel */}
        <div>
          {result ? (
            <div className="card" style={{ border: `1px solid ${classColor}`, boxShadow: `0 0 20px ${classColor}22` }}>
              <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
                <div style={{ fontSize: 48, fontFamily: 'var(--mono)', fontWeight: 700, color: classColor }}>
                  {result.match_score.toFixed(1)}%
                </div>
                <div style={{ marginTop: 8 }}>
                  <ClassificationBadge value={result.classification} />
                </div>
              </div>

              <div style={{ background: 'var(--surface-3)', borderRadius: 8, padding: '14px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                  {[
                    ['Transaction ID', result.transaction_id],
                    ['Customer', result.customer_name],
                    ['Account', result.customer_account],
                    ['Document', result.document_type],
                    ['Branch', result.branch],
                    ['Process Time', `${result.processing_time_ms}ms`],
                    ['References', `${result.references_checked} checked`],
                    ['Officer', result.officer_name],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, fontFamily: k === 'Transaction ID' || k === 'Process Time' || k === 'References' ? 'var(--mono)' : undefined }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {result.individual_scores?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Per-Reference Scores</div>
                  {result.individual_scores.map((s, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', minWidth: 70 }}>Ref #{i + 1}</span>
                        <ScoreBar score={s.score} />
                      </div>
                      {s.components && (
                        <div style={{ marginLeft: 82, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px 8px' }}>
                          {Object.entries(s.components).map(([k, v]) => (
                            <div key={k} style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
                              <span style={{ color: v >= 85 ? 'var(--success)' : v >= 60 ? 'var(--warning)' : 'var(--danger)', fontFamily: 'var(--mono)' }}>{v}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: classColor + '18', border: `1px solid ${classColor}44`, fontSize: 13 }}>
                {result.classification === 'Genuine' && '✓ Signature matches reference. Transaction may proceed normally.'}
                {result.classification === 'Suspected Forgery' && '⚠ Signature shows anomalies. Recommend manual secondary review before proceeding.'}
                {result.classification === 'Highly Suspicious' && '🚨 Signature significantly deviates from reference. Flag for immediate fraud investigation. DO NOT process transaction.'}
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                onClick={() => { setResult(null); setSignatureData(null); setUploadedFile(null); }}>
                New Verification
              </button>
            </div>
          ) : (
            <div className="card" style={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.3, marginBottom: 16 }}>
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Awaiting Verification</div>
              <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
                Select a customer, capture or upload a signature, then run verification
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer picker modal */}
      <Modal open={showCustomerPicker} onClose={() => setShowCustomerPicker(false)} title="Select Customer" maxWidth={520}>
        <div className="form-group">
          <input
            className="form-input"
            placeholder="Search by name, account number, or customer ID…"
            value={customerSearch}
            onChange={e => setCustomerSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>No customers found</div>
          ) : (
            filteredCustomers.map(c => (
              <div key={c.id} onClick={() => selectCustomer(c)}
                style={{ padding: '12px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: 'var(--surface-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-3)'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                    {c.account_number} · {c.branch}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: c.signature_count >= 5 ? 'var(--success)' : 'var(--warning)' }}>
                  {c.signature_count} refs
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
