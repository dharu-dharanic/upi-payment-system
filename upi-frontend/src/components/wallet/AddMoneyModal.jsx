import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { bankAPI, transactionAPI } from '../../api';
import { formatCurrency, generateIdempotencyKey, getErrorMessage } from '../../utils';
import toast from 'react-hot-toast';

export default function AddMoneyModal({ onClose, onSuccess }) {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm]         = useState({ bankAccountId: '', amount: '' });
  const [loading, setLoading]   = useState(false);
  const [loadingAccounts, setLA] = useState(true);
  const [idempKey]              = useState(generateIdempotencyKey());

  useEffect(() => {
    bankAPI.getAccounts()
      .then(r => { setAccounts(r.data.data || []); })
      .finally(() => setLA(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bankAccountId) { toast.error('Select a bank account'); return; }
    setLoading(true);
    try {
      const res = await transactionAPI.addMoney({
        bankAccountId: Number(form.bankAccountId),
        amount: Number(form.amount),
        idempotencyKey: idempKey,
      });
      toast.success(`${formatCurrency(form.amount)} added to wallet!`);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="modal-title">Add Money to Wallet</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Bank Account</label>
            {loadingAccounts ? (
              <div className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-sm)' }} />
            ) : accounts.length === 0 ? (
              <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No linked bank accounts. <a href="/bank-accounts" style={{ color: 'var(--accent)' }}>Add one →</a>
              </div>
            ) : (
              <select className="form-input" value={form.bankAccountId} onChange={e => setForm(f => ({ ...f, bankAccountId: e.target.value }))} required>
                <option value="">Select account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} • {acc.maskedAccountNumber} (Bal: {formatCurrency(acc.bankBalance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick amounts */}
          <div>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Quick Select</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[500, 1000, 2000, 5000].map(amt => (
                <button key={amt} type="button" className={`btn btn-sm ${form.amount == amt ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setForm(f => ({ ...f, amount: String(amt) }))}>
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00" min="1" max="100000" step="0.01" required
              style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }} />
            <span className="form-hint">Max ₹1,00,000 per transaction</span>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || accounts.length === 0} style={{ marginTop: 4 }}>
            {loading ? <span className="spinner" /> : <><Plus size={16} /> Add to Wallet</>}
          </button>
        </form>
      </div>
    </div>
  );
}
