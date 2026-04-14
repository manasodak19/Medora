import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signin as apiSignin } from '../api';

export default function SignIn({ onAuth }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiSignin(email.trim(), password);
      const user = data.user;

      // Pass user to App state
      onAuth(user);

      // Role-based redirect
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'pharmacist') {
        navigate('/pharmacist');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-md)' }}>
          <span style={{ fontSize: '2rem' }}>💊</span>
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your MEDORA account</p>
        </div>

        {error && (
          <div className="inline-alert" style={{ background: 'var(--clr-danger-bg)', color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)' }}>
            ⚠️ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="signin-email">Email Address</label>
            <input
              id="signin-email"
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              className="input-field"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick login hints */}
        <div style={{
          marginTop: 'var(--sp-lg)',
          padding: 'var(--sp-md)',
          background: 'var(--clr-surface-alt)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--clr-text-muted)',
        }}>
          <strong style={{ color: 'var(--clr-text)', display: 'block', marginBottom: '6px' }}>
            🔑 Quick Login (Demo)
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span><strong>Admin:</strong> admin@medora.com / admin123</span>
          </div>
        </div>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
