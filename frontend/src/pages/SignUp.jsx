import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup as apiSignup } from '../api';

export default function SignUp({ onAuth }) {
  const navigate = useNavigate();
  const [role, setRole] = useState('user');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Pharmacist fields
    pharmacyName: '',
    city: '',
    phone: '',
    timings: '',
    licenseNumber: '',
    lat: '',
    lng: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (serverError) setServerError('');
  };



  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords don\'t match';

    if (role === 'pharmacist') {
      if (!form.pharmacyName.trim()) errs.pharmacyName = 'Pharmacy name is required';
      if (!form.city.trim()) errs.city = 'City is required';
      if (!form.phone.trim()) errs.phone = 'Phone is required';
      if (!form.timings.trim()) errs.timings = 'Timings are required';
      if (!form.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      const payload = {
        ...form,
        role: role,
      };

      const data = await apiSignup(payload);
      const user = data.user;

      if (user.status === 'pending') {
        alert('Registration successful! Your account is pending admin verification. You cannot login yet.');
        navigate('/signin');
        return;
      }

      onAuth(user);

      if (role === 'pharmacist') {
        navigate('/pharmacist');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setServerError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-md)' }}>
          <span style={{ fontSize: '2rem' }}>💊</span>
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join MEDORA and find medicines near you</p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="inline-alert" style={{ background: 'var(--clr-danger-bg)', color: 'var(--clr-danger)', marginBottom: 'var(--sp-md)' }}>
            ⚠️ {serverError}
          </div>
        )}

        {/* Role Toggle */}
        <div className="role-toggle" style={{ marginBottom: 'var(--sp-lg)' }}>
          <button
            className={role === 'user' ? 'active' : ''}
            onClick={() => setRole('user')}
            type="button"
            disabled={loading}
          >
            👤 User
          </button>
          <button
            className={role === 'pharmacist' ? 'active' : ''}
            onClick={() => setRole('pharmacist')}
            type="button"
            disabled={loading}
          >
            🏥 Pharmacist
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              className="input-field"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              disabled={loading}
            />
            {errors.name && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.name}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="signup-email">Email Address</label>
            <input
              id="signup-email"
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              disabled={loading}
            />
            {errors.email && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.email}</span>}
          </div>

          <div className="grid-2">
            <div className="input-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                className="input-field"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                disabled={loading}
              />
              {errors.password && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.password}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <input
                id="signup-confirm"
                className="input-field"
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                disabled={loading}
              />
              {errors.confirmPassword && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.confirmPassword}</span>}
            </div>
          </div>

          {/* Pharmacist-specific fields */}
          {role === 'pharmacist' && (
            <div className="pharmacist-fields">
              <span className="fields-title">🏥 Pharmacy Details</span>

              <div className="input-group">
                <label htmlFor="pharmacy-name">Pharmacy Name</label>
                <input
                  id="pharmacy-name"
                  className="input-field"
                  type="text"
                  placeholder="e.g. MedPlus Pharmacy"
                  value={form.pharmacyName}
                  onChange={e => update('pharmacyName', e.target.value)}
                  disabled={loading}
                />
                {errors.pharmacyName && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.pharmacyName}</span>}
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label htmlFor="pharmacy-city">City</label>
                  <input
                    id="pharmacy-city"
                    className="input-field"
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={e => update('city', e.target.value)}
                    disabled={loading}
                  />
                  {errors.city && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.city}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="pharmacy-phone">Phone</label>
                  <input
                    id="pharmacy-phone"
                    className="input-field"
                    type="tel"
                    placeholder="+91 98201 XXXXX"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    disabled={loading}
                  />
                  {errors.phone && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.phone}</span>}
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label htmlFor="pharmacy-timings">Timings</label>
                  <input
                    id="pharmacy-timings"
                    className="input-field"
                    type="text"
                    placeholder="e.g. 9 AM – 10 PM"
                    value={form.timings}
                    onChange={e => update('timings', e.target.value)}
                    disabled={loading}
                  />
                  {errors.timings && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.timings}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="pharmacy-license">License Number</label>
                  <input
                    id="pharmacy-license"
                    className="input-field"
                    type="text"
                    placeholder="e.g. MH-PH-2024-XXXXX"
                    value={form.licenseNumber}
                    onChange={e => update('licenseNumber', e.target.value)}
                    disabled={loading}
                  />
                  {errors.licenseNumber && <span style={{ color: 'var(--clr-danger)', fontSize: 'var(--fs-xs)' }}>{errors.licenseNumber}</span>}
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label htmlFor="pharmacy-lat">Latitude</label>
                  <input
                    id="pharmacy-lat"
                    className="input-field"
                    type="number"
                    step="any"
                    placeholder="e.g. 19.0760"
                    value={form.lat}
                    onChange={e => update('lat', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="pharmacy-lng">Longitude</label>
                  <input
                    id="pharmacy-lng"
                    className="input-field"
                    type="number"
                    step="any"
                    placeholder="e.g. 72.8777"
                    value={form.lng}
                    onChange={e => update('lng', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? '⏳ Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/signin">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
