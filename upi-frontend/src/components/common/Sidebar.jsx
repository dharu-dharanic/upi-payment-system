import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Landmark,
  ShieldAlert, Users, LogOut, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_USER = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/wallet',        icon: Wallet,          label: 'Wallet' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/bank-accounts', icon: Landmark,        label: 'Bank Accounts' },
];

const NAV_ADMIN = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users',     icon: Users,           label: 'Users' },
  { to: '/admin/flagged',   icon: ShieldAlert,     label: 'Flagged Txns' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navItems = isAdmin ? [...NAV_USER, ...NAV_ADMIN] : NAV_USER;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--accent)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={18} color="#000" fill="#000" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            PayFlow
          </span>
        </div>
        {isAdmin && (
          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6, display: 'block' }}>
            Admin Mode
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {isAdmin && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 12px', marginTop: 4 }}>
            User
          </div>
        )}
        {NAV_USER.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            marginBottom: 2, fontSize: '0.9rem', fontWeight: 500,
            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
            background: isActive ? 'var(--accent-dim)' : 'transparent',
            transition: 'all 0.15s',
          })}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 12px', marginTop: 12 }}>
              Admin
            </div>
            {NAV_ADMIN.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                marginBottom: 2, fontSize: '0.9rem', fontWeight: 500,
                color: isActive ? 'var(--warning)' : 'var(--text-secondary)',
                background: isActive ? 'var(--warning-dim)' : 'transparent',
                transition: 'all 0.15s',
              })}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34,
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)',
            flexShrink: 0,
          }}>
            {user?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.upiId}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-full" style={{ justifyContent: 'flex-start', gap: 10, color: 'var(--danger)' }} onClick={logout}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
