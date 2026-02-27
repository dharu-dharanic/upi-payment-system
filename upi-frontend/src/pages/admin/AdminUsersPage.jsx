import React, { useState, useEffect } from 'react';
import { Snowflake, CheckCircle, Search } from 'lucide-react';
import { adminAPI } from '../../api';
import { formatDate, getErrorMessage } from '../../utils';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(0);
  const [totalPages, setTotal]= useState(0);
  const [search, setSearch]   = useState('');
  const [acting, setActing]   = useState(null);

  const fetch = (p = 0) => {
    setLoading(true);
    adminAPI.getUsers(p, 20)
      .then(r => {
        const d = r.data.data;
        setUsers(d.content || []);
        setTotal(d.totalPages || 0);
        setPage(d.pageNumber || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(0); }, []);

  const handleFreeze = async (userId, isFrozen) => {
    setActing(userId);
    try {
      if (isFrozen) await adminAPI.unfreezeUser(userId);
      else          await adminAPI.freezeUser(userId);
      toast.success(isFrozen ? 'Account unfrozen' : 'Account frozen');
      fetch(page);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActing(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.upiId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Monitor and manage platform users</p>
      </div>

      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>UPI ID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(u => {
                const isFrozen = u.status === 'FROZEN';
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent)', flexShrink: 0 }}>
                          {u.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{u.upiId}</span></td>
                    <td>
                      <span className={`badge ${u.role === 'ROLE_ADMIN' ? 'badge-warning' : 'badge-muted'}`}>
                        {u.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : u.status === 'FROZEN' ? 'badge-info' : 'badge-danger'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(u.createdAt).split(',')[0]}</td>
                    <td>
                      {u.role !== 'ROLE_ADMIN' && (
                        <button
                          className={`btn btn-sm ${isFrozen ? 'btn-outline' : 'btn-danger'}`}
                          disabled={acting === u.id}
                          onClick={() => handleFreeze(u.id, isFrozen)}
                        >
                          {acting === u.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> :
                            isFrozen ? <><CheckCircle size={13} /> Unfreeze</> : <><Snowflake size={13} /> Freeze</>}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
