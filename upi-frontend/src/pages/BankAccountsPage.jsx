import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Landmark, Star } from 'lucide-react';
import { bankAPI } from '../api';
import { formatCurrency, getErrorMessage } from '../utils';
import toast from 'react-hot-toast';

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);

  const fetch = () => {
    setLoading(true);
    bankAPI.getAccounts()
      .then(r => setAccounts(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this bank account?')) return;
    try {
      await bankAPI.removeAccount(id);
      toast.success('Bank account removed');
      fetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Bank Accounts</h1>
          <p className="page-subtitle">Link accounts to add money to your wallet</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Link Account
        </button>
      </div>

      {loading ? (
        <div className="grid-2">
          {[1,2].map(i => <div key={i} className="card"><div className="skeleton" style={{ height: 100 }} /></div>)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '52px 24px' }}>
          <Landmark size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>No linked accounts</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>Link a bank account to add money to your wallet</p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Link Bank Account
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {accounts.map(acc => (
            <div key={acc.id} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                    <Landmark size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {acc.bankName}
                      {acc.isPrimary && <Star size={12} fill="var(--warning)" color="var(--warning)" />}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {acc.maskedAccountNumber}
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(acc.id)}>
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="divider" style={{ margin: '16px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <InfoItem label="IFSC" value={acc.ifscCode} mono />
                <InfoItem label="Balance" value={formatCurrency(acc.bankBalance)} highlight />
                <InfoItem label="Status" value={acc.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <LinkAccountModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetch(); }} />}
    </div>
  );
}

function InfoItem({ label, value, mono, highlight }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.85rem', fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function LinkAccountModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ accountNumber: '', bankName: '', ifscCode: '', accountHolderName: '', isPrimary: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bankAPI.linkAccount(form);
      toast.success('Bank account linked successfully!');
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
        <h2 className="modal-title">Link Bank Account</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input className="form-input" name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="Enter account number" required />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input className="form-input" name="bankName" value={form.bankName} onChange={handleChange} placeholder="e.g. SBI" required />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input className="form-input" name="ifscCode" value={form.ifscCode} onChange={handleChange} placeholder="SBIN0001234" required maxLength={11} style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Account Holder Name</label>
            <input className="form-input" name="accountHolderName" value={form.accountHolderName} onChange={handleChange} placeholder="As per bank records" required />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <input type="checkbox" name="isPrimary" checked={form.isPrimary} onChange={handleChange} />
            Set as primary account
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-outline btn-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Link Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
