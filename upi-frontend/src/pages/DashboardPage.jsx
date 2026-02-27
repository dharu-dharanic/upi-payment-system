import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Plus, Send, TrendingUp, Shield, Clock } from 'lucide-react';
import { walletAPI, transactionAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatRelative, getStatusBadge } from '../utils';
import SendMoneyModal from '../components/transactions/SendMoneyModal';
import AddMoneyModal from '../components/wallet/AddMoneyModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [wallet, setWallet]         = useState(null);
  const [txns, setTxns]             = useState([]);
  const [loadingWallet, setLW]      = useState(true);
  const [loadingTxns, setLT]        = useState(true);
  const [showSend, setShowSend]     = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  const fetchAll = () => {
    walletAPI.getWallet()
      .then(r => setWallet(r.data.data))
      .finally(() => setLW(false));
    transactionAPI.getHistory(0, 5)
      .then(r => setTxns(r.data.data?.content || []))
      .finally(() => setLT(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const onTxnSuccess = () => {
    setShowSend(false);
    setShowDeposit(false);
    fetchAll();
  };

  return (
    <div className="animate-fade">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>
            Good {getGreeting()},
          </div>
          <h1 className="page-title">{user?.fullName?.split(' ')[0]} 👋</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {user?.upiId}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowDeposit(true)}>
            <Plus size={16} /> Add Money
          </button>
          <button className="btn btn-primary" onClick={() => setShowSend(true)}>
            <Send size={16} /> Send Money
          </button>
        </div>
      </div>

      {/* Wallet Hero Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 50%, #0a1628 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 36px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative glow */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Wallet Balance
          </div>
          {loadingWallet ? (
            <div className="skeleton" style={{ width: 220, height: 52, borderRadius: 8 }} />
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 16 }}>
              {formatCurrency(wallet?.balance)}
            </div>
          )}

          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Daily Spent</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--warning)' }}>
                {loadingWallet ? '—' : formatCurrency(wallet?.dailySpent)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Available Today</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--accent)' }}>
                {loadingWallet ? '—' : formatCurrency(wallet?.availableToday)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {wallet && (
            <div style={{ marginTop: 20 }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (wallet.dailySpent / wallet.dailyLimit) * 100)}%`,
                  background: 'var(--accent)',
                  borderRadius: 2,
                  transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Daily limit: {formatCurrency(wallet.dailyLimit)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <QuickStat icon={<Send size={18} />} label="Send Money" desc="Transfer instantly" color="var(--accent)" onClick={() => setShowSend(true)} />
        <QuickStat icon={<Plus size={18} />} label="Add Money" desc="Load from bank" color="var(--info)" onClick={() => setShowDeposit(true)} />
        <QuickStat icon={<Clock size={18} />} label="History" desc="View all transactions" color="var(--warning)" to="/transactions" />
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>Recent Transactions</h2>
          <Link to="/transactions" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>View all →</Link>
        </div>

        {loadingTxns ? (
          [1,2,3].map(i => <TxnSkeleton key={i} />)
        ) : txns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <TrendingUp size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
            <div>No transactions yet</div>
            <button className="btn btn-outline btn-sm" style={{ marginTop: 12 }} onClick={() => setShowSend(true)}>Make your first payment</button>
          </div>
        ) : (
          txns.map(t => <TxnRow key={t.id} txn={t} userId={user?.id} />)
        )}
      </div>

      {showSend    && <SendMoneyModal onClose={() => setShowSend(false)}    onSuccess={onTxnSuccess} />}
      {showDeposit && <AddMoneyModal  onClose={() => setShowDeposit(false)} onSuccess={onTxnSuccess} />}
    </div>
  );
}

function QuickStat({ icon, label, desc, color, onClick, to }) {
  const content = (
    <div className="stat-card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px' }} onClick={onClick}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>
      </div>
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return content;
}

function TxnRow({ txn, userId }) {
  const isSender  = txn.senderUpiId && txn.senderUpiId.startsWith(String(userId));
  const isCredit  = txn.type === 'DEPOSIT' || (!isSender && txn.type === 'TRANSFER');
  const name      = isCredit ? (txn.senderName || 'Bank') : (txn.receiverName || '—');
  const upiId     = isCredit ? txn.senderUpiId : txn.receiverUpiId;
  const amountStr = `${isCredit ? '+' : '-'}${formatCurrency(txn.amount)}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(30,45,69,0.4)' }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: isCredit ? 'rgba(0,212,170,0.1)' : 'rgba(255,71,87,0.1)',
        border: `1px solid ${isCredit ? 'rgba(0,212,170,0.25)' : 'rgba(255,71,87,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isCredit ? 'var(--accent)' : 'var(--danger)',
      }}>
        {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
          {txn.referenceId}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: isCredit ? 'var(--accent)' : 'var(--danger)', fontSize: '0.92rem' }}>
          {amountStr}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
          {formatRelative(txn.createdAt)}
        </div>
      </div>
      <span className={`badge ${getStatusBadge(txn.status)}`} style={{ marginLeft: 4 }}>{txn.status}</span>
    </div>
  );
}

function TxnSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '12px 0', alignItems: 'center' }}>
      <div className="skeleton" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ width: '40%', height: 14 }} />
        <div className="skeleton" style={{ width: '60%', height: 11 }} />
      </div>
      <div className="skeleton" style={{ width: 70, height: 16, borderRadius: 4 }} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
