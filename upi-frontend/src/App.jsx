import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/common/ProtectedRoute';
import AppLayout from './components/common/AppLayout';

import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import DashboardPage       from './pages/DashboardPage';
import WalletPage          from './pages/WalletPage';
import TransactionsPage    from './pages/TransactionsPage';
import BankAccountsPage    from './pages/BankAccountsPage';
import AdminDashboardPage  from './pages/admin/AdminDashboardPage';
import AdminUsersPage      from './pages/admin/AdminUsersPage';
import AdminFlaggedPage    from './pages/admin/AdminFlaggedPage';

import './styles/global.css';

export default function App() {
  return (
    <AuthProvider>
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected user routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard"     element={<DashboardPage />} />
            <Route path="/wallet"        element={<WalletPage />} />
            <Route path="/transactions"  element={<TransactionsPage />} />
            <Route path="/bank-accounts" element={<BankAccountsPage />} />

            {/* Admin-only routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/users"     element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/flagged"   element={<ProtectedRoute adminOnly><AdminFlaggedPage /></ProtectedRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.88rem',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#00d4aa', secondary: '#000' } },
          error:   { iconTheme: { primary: '#ff4757', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  );
}
