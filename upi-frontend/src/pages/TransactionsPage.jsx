import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Search, Filter } from 'lucide-react';
import { transactionAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadge } from '../utils';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [totalPages, setTotal]= useState(0);
  const [search, setSearch]   = useState('');
  const [statusFilter, setSF] = useState('');

  const fetchTxns = (p = 0) => {
    setLoading(true);
    transactionAPI.getHistory(p, 20)
      .then(r => {
        const d = r.data.data;
        setTxns(d.content || []);
        setTotal(d.totalPages || 0);
        setPage(d.pageNumber || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTxns(0); }, []);

  const filtered = txns.filter(t => {
    const matchSearch = !search ||
      t.referenceId?.toLowerCase().includes(search.toLowerCase()) ||
      t.senderName?.toLowerCase().includes(search.toLowerCase()) ||
      t.receiverName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <p className="page-subtitle">Your complete payment history</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search by name or reference..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={statusFilter} onChange={e => setSF(e.target.value)}>
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="PENDING">Pending</option>
          <option value="FLAGGED">Flagged</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found</td></tr>
              ) : (
                filtered.map(t => {
                  const isCredit = t.type === 'DEPOSIT' || (t.receiverUpiId === user?.upiId && t.type === 'TRANSFER');
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: isCredit ? 'rgba(0,212,170,0.1)' : 'rgba(255,71,87,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isCredit ? 'var(--accent)' : 'var(--danger)',
                          }}>
                            {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                              {isCredit ? (t.senderName || 'Bank Deposit') : (t.receiverName || '—')}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {isCredit ? t.senderUpiId : t.receiverUpiId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {t.referenceId}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem',
                          color: isCredit ? 'var(--accent)' : 'var(--danger)',
                        }}>
                          {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-muted">{t.type}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(t.status)}`}>{t.status}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {formatDate(t.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '16px 20px', borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
            <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => fetchTxns(page - 1)}>← Prev</button>
            <span style={{ padding: '7px 14px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {page + 1} / {totalPages}
            </span>
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => fetchTxns(page + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
