import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { adminAPI } from '../../api';
import { formatCurrency, formatDate, getStatusBadge, getRiskBadge } from '../../utils';

export default function AdminFlaggedPage() {
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [totalPages, setTotal]= useState(0);

  const fetch = (p = 0) => {
    setLoading(true);
    adminAPI.getFlagged(p, 20)
      .then(r => {
        const d = r.data.data;
        setTxns(d.content || []);
        setTotal(d.totalPages || 0);
        setPage(d.pageNumber || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(0); }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--warning-dim)', border: '1px solid var(--warning)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <h1 className="page-title">Flagged Transactions</h1>
            <p className="page-subtitle">Transactions marked by the fraud detection engine</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--warning-dim)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 8, alignItems: 'center', color: 'var(--warning)', fontSize: '0.85rem' }}>
        <AlertTriangle size={15} />
        These transactions have been automatically flagged by the fraud detection engine. Review and take action as needed.
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Risk Level</th>
                <th>Fraud Score</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>)}</tr>
                ))
              ) : txns.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <ShieldAlert size={32} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  No flagged transactions — system is clean!
                </td></tr>
              ) : (
                txns.map(t => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)' }}>{t.referenceId}</span></td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.senderName || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.senderUpiId}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.receiverName || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t.receiverUpiId}</div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(t.amount)}</span></td>
                    <td><span className={`badge ${getRiskBadge(t.fraudRiskLevel)}`}>{t.fraudRiskLevel}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden', maxWidth: 60 }}>
                          <div style={{ height: '100%', width: `${t.fraudScore || 0}%`, background: t.fraudScore >= 70 ? 'var(--danger)' : t.fraudScore >= 40 ? 'var(--warning)' : 'var(--accent)', borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{t.fraudScore}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${getStatusBadge(t.status)}`}>{t.status}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(t.createdAt).split(',')[0]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
            <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => fetch(page - 1)}>← Prev</button>
            <span style={{ padding: '7px 14px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{page + 1} / {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => fetch(page + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
