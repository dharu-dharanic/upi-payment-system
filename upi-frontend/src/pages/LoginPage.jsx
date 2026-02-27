import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const { loading, execute } = useAsync();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await execute(() => login(form.identifier, form.password), {
      successMsg: 'Welcome back!',
      onSuccess: (user) => navigate(user.role === 'ROLE_ADMIN' ? '/admin/dashboard' : '/dashboard'),
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" style={{ top: '-200px', left: '-200px' }} />
      <div className="auth-bg-glow" style={{ bottom: '-200px', right: '-200px', opacity: 0.5 }} />

      <div className="auth-card animate-fadeup">
        <div className="auth-logo">
          <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#000" fill="#000" />
          </div>
          PayFlow
        </div>
        <p className="auth-tagline">Sign in to your account</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email / Phone / UPI ID</label>
            <input
              className="form-input"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="you@email.com or 9XXXXXXXXX"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                name="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', padding: 4 }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link>
        </p>

      </div>
    </div>
  );
}
