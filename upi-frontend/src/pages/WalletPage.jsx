import React, { useState, useEffect } from 'react';
import { Wallet, ShieldCheck, Plus, Send } from 'lucide-react';
import { walletAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getErrorMessage } from '../utils';
import AddMoneyModal from '../components/wallet/AddMoneyModal';
import SendMoneyModal from '../components/transactions/SendMoneyModal';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [showSend, setShowSend]     = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);

  const fetchWallet = () => {
    setLoading(true);
    walletAPI.getWallet()
      .then(r => setWallet(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWallet(); }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1 className="page-title">Wallet</h1>
        <p className="page-subtitle">Manage your balance and UPI settings</p>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Balance card */}
        <div style={{
          background: 'linear-gradient(135deg, #0a1628, #0d2040)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)' }} />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8 }}>Total Balance</div>
          {loading ? (
            <div className="skeleton" style={{ width: 180, height: 48, borderRadius: 8, marginBottom: 16 }} />
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.6rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
              {formatCurrency(wallet?.balance)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add</button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowSend(true)}><Send size={14} /> Send</button>
          </div>
        </div>

        {/* Limits card */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Daily Limits</div>
          {loading ? <div className="skeleton" style={{ height: 80 }} /> : (
            <>
              <LimitRow label="Daily Limit" value={formatCurrency(wallet?.dailyLimit)} />
              <LimitRow label="Spent Today" value={formatCurrency(wallet?.dailySpent)} color="var(--warning)" />
              <LimitRow label="Available" value={formatCurrency(wallet?.availableToday)} color="var(--accent)" />
              <div style={{ marginTop: 12, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, ((wallet?.dailySpent || 0) / (wallet?.dailyLimit || 1)) * 100)}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--warning))',
                  borderRadius: 3, transition: 'width 1s ease',
                }} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* UPI ID & PIN card */}
      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>UPI Settings</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Your UPI ID</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.upiId}
            </div>
          </div>
          <button className="btn btn-outline" onClick={() => setShowSetPin(true)}>
            <ShieldCheck size={16} /> {user?.upiPin ? 'Change UPI PIN' : 'Set UPI PIN'}
          </button>
        </div>
      </div>

      {showAdd     && <AddMoneyModal   onClose={() => setShowAdd(false)}     onSuccess={() => { setShowAdd(false);     fetchWallet(); }} />}
      {showSend    && <SendMoneyModal  onClose={() => setShowSend(false)}    onSuccess={() => { setShowSend(false);    fetchWallet(); }} />}
      {showSetPin  && <SetPinModal     onClose={() => setShowSetPin(false)} />}
    </div>
  );
}

function LimitRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(30,45,69,0.4)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: color || 'var(--text-primary)', fontSize: '0.9rem' }}>{value}</span>
    </div>
  );
}

function SetPinModal({ onClose }) {
  const [form, setForm] = useState({ password: '', upiPin: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.upiPin !== form.confirm) { toast.error('PINs do not match'); return; }
    setLoading(true);
    try {
      await authAPI.setUpiPin({ password: form.password, upiPin: form.upiPin });
      toast.success('UPI PIN set successfully!');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fadeup">
        <h2 className="modal-title">Set UPI PIN</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Account Password</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Your login password" />
          </div>
          <div className="form-group">
            <label className="form-label">New UPI PIN (4 or 6 digits)</label>
            <input className="form-input" type="password" value={form.upiPin}
              onChange={e => setForm(f => ({ ...f, upiPin: e.target.value.replace(/\D/, '').slice(0, 6) }))}
              maxLength={6} placeholder="••••" required style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.4em', fontSize: '1.2rem' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm PIN</label>
            <input className="form-input" type="password" value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value.replace(/\D/, '').slice(0, 6) }))}
              maxLength={6} placeholder="••••" required style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.4em', fontSize: '1.2rem' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-outline btn-full" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Set PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
