import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';

export default function RegisterPage() {
  const { register } = useAuth();
  const { loading, execute } = useAsync();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await execute(() => register(form), {
      successMsg: 'Account created! Welcome to PayFlow 🎉',
      onSuccess: () => navigate('/dashboard'),
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" style={{ top: '-100px', right: '-100px' }} />

      <div className="auth-card animate-fadeup">
        <div className="auth-logo">
          <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#000" fill="#000" />
          </div>
          PayFlow
        </div>
        <p className="auth-tagline">Create your account — it's free</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Aarav Sharma" required autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="aarav@email.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-input" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="9XXXXXXXXX" maxLength={10} required />
            <span className="form-hint">Indian mobile number (10 digits starting with 6–9)</span>
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
                placeholder="Min 8 chars with upper, lower, digit, symbol"
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
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
