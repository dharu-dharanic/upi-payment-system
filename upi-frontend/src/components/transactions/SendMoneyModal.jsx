import React, { useState } from 'react';
import { X, Send, Shield, ChevronRight } from 'lucide-react';
import { transactionAPI } from '../../api';
import { formatCurrency, generateIdempotencyKey, getErrorMessage } from '../../utils';
import toast from 'react-hot-toast';

const STEPS = { DETAILS: 1, CONFIRM: 2, PIN: 3 };

export default function SendMoneyModal({ onClose, onSuccess }) {
  const [step, setStep]     = useState(STEPS.DETAILS);
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({ receiverIdentifier: '', amount: '', description: '' });
  const [pin, setPin]       = useState('');
  const [idempKey]          = useState(generateIdempotencyKey());

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleDetails = (e) => {
    e.preventDefault();
    if (!form.receiverIdentifier || !form.amount) return;
    if (Number(form.amount) < 1) { toast.error('Minimum ₹1'); return; }
    if (Number(form.amount) > 50000) { toast.error('Maximum ₹50,000 per transfer'); return; }
    setStep(STEPS.CONFIRM);
  };

  const handleConfirm = () => setStep(STEPS.PIN);

  const handleTransfer = async () => {
    if (pin.length < 4) { toast.error('Enter your 4 or 6 digit UPI PIN'); return; }
    setLoading(true);
    try {
      const payload = {
        receiverIdentifier: form.receiverIdentifier,
        amount: Number(form.amount),
        description: form.description,
        upiPin: pin,
        idempotencyKey: idempKey,
      };
      const res = await transactionAPI.transfer(payload);
      toast.success(`₹${form.amount} sent! Ref: ${res.data.data.referenceId}`);
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fadeup">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 className="modal-title" style={{ marginBottom: 0 }}>
              {step === STEPS.DETAILS ? 'Send Money' : step === STEPS.CONFIRM ? 'Confirm Transfer' : 'Enter UPI PIN'}
            </h2>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[1,2,3].map(s => (
                <div key={s} style={{ width: 24, height: 3, borderRadius: 2, background: s <= step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
              ))}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Step 1: Details */}
        {step === STEPS.DETAILS && (
          <form onSubmit={handleDetails} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Receiver (UPI ID / Phone / Email)</label>
              <input className="form-input" name="receiverIdentifier" value={form.receiverIdentifier} onChange={handleChange} placeholder="9XXXXXXXXX@upi" required autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" name="amount" type="number" value={form.amount} onChange={handleChange}
                placeholder="0.00" min="1" max="50000" step="0.01" required
                style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700 }} />
              <span className="form-hint">Min ₹1 • Max ₹50,000 per transfer</span>
            </div>

            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <input className="form-input" name="description" value={form.description} onChange={handleChange} placeholder="Rent, food, etc." maxLength={200} />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: 8 }}>
              Continue <ChevronRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: Confirm */}
        {step === STEPS.CONFIRM && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border)' }}>
              <Row label="To" value={form.receiverIdentifier} />
              <Row label="Amount" value={formatCurrency(form.amount)} highlight />
              {form.description && <Row label="Note" value={form.description} />}
              <Row label="Idempotency Key" value={idempKey.substring(0, 20) + '...'} mono small />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.82rem' }}>
              <Shield size={14} /> ACID-compliant transaction. Atomic and irreversible on success.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline btn-full" onClick={() => setStep(STEPS.DETAILS)}>← Back</button>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleConfirm}>Enter PIN →</button>
            </div>
          </div>
        )}

        {/* Step 3: PIN */}
        {step === STEPS.PIN && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Authorise payment of <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(form.amount)}</strong> to{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{form.receiverIdentifier}</strong>
            </div>

            <div className="form-group" style={{ width: '100%', alignItems: 'center' }}>
              <label className="form-label">UPI PIN</label>
              <input
                className="form-input"
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/, '').slice(0, 6))}
                placeholder="••••••"
                maxLength={6}
                autoFocus
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em', fontFamily: 'var(--font-mono)', width: '100%' }}
              />
              <span className="form-hint" style={{ textAlign: 'center', width: '100%' }}>Enter your 4 or 6 digit UPI PIN</span>
            </div>

            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button className="btn btn-outline btn-full" onClick={() => setStep(STEPS.CONFIRM)}>← Back</button>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleTransfer} disabled={loading}>
                {loading ? <span className="spinner" /> : <><Send size={16} /> Pay Now</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight, mono, small }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(30,45,69,0.5)' }}>
      <span style={{ fontSize: small ? '0.72rem' : '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{
        fontSize: highlight ? '1.1rem' : small ? '0.72rem' : '0.9rem',
        fontWeight: highlight ? 800 : 600,
        color: highlight ? 'var(--accent)' : 'var(--text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>{value}</span>
    </div>
  );
}
