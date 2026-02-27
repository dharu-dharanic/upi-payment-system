import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, ShieldAlert, Activity, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminAPI } from '../../api';
import { formatCurrency } from '../../utils';

const MOCK_CHART = [
  { name: 'Mon', volume: 42000 }, { name: 'Tue', volume: 68000 },
  { name: 'Wed', volume: 54000 }, { name: 'Thu', volume: 91000 },
  { name: 'Fri', volume: 78000 }, { name: 'Sat', volume: 35000 },
  { name: 'Sun', volume: 25000 },
];

export default function AdminDashboardPage() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const pieData = stats ? [
    { name: 'Active',  value: Number(stats.activeUsers),   color: '#00d4aa' },
    { name: 'Frozen',  value: Number(stats.frozenAccounts), color: '#ff4757' },
  ] : [];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--warning-dim)', border: '1px solid var(--warning)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
            <Zap size={18} />
          </div>
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">System overview and monitoring</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard loading={loading} icon={<Users size={20} />} label="Total Users" value={stats?.totalUsers} color="var(--accent)" />
        <StatCard loading={loading} icon={<Activity size={20} />} label="Total Transactions" value={stats?.totalTransactions} color="var(--info)" />
        <StatCard loading={loading} icon={<ShieldAlert size={20} />} label="Flagged" value={stats?.flaggedTransactions} color="var(--warning)" />
        <StatCard loading={loading} icon={<TrendingUp size={20} />} label="Volume Today" value={stats ? formatCurrency(stats.totalVolumeToday) : null} color="var(--accent)" />
      </div>

      <div className="grid-2">
        {/* Volume Chart */}
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Transaction Volume (7 days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_CHART}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: '#4a5568', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                formatter={(v) => [formatCurrency(v), 'Volume']}
              />
              <Area type="monotone" dataKey="volume" stroke="#00d4aa" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Status Pie */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Account Status</div>
          {loading ? (
            <div className="skeleton" style={{ flex: 1, borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{d.name}</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginLeft: 'auto' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ loading, icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        <div style={{ color, opacity: 0.7 }}>{icon}</div>
      </div>
      {loading ? (
        <div className="skeleton" style={{ width: '60%', height: 36, borderRadius: 6 }} />
      ) : (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value ?? '—'}</div>
      )}
    </div>
  );
}
