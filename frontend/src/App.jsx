import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import AdminDashboard from './pages/AdminDashboard';
import PharmacistDashboard from './pages/PharmacistDashboard';
import UserDashboard from './pages/UserDashboard';
import { getMe, logout as apiLogout, getToken } from './api';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from stored JWT token
  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getMe();
        setUser(userData);
      } catch {
        // Token expired or invalid — clear it
        apiLogout();
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const handleAuth = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
  };

  // Show nothing while checking token (prevents flash of login page)
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: 'var(--fs-lg)',
        color: 'var(--clr-text-muted)',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp onAuth={handleAuth} />} />
        <Route path="/signin" element={<SignIn onAuth={handleAuth} />} />

        {/* Protected */}
        <Route
          path="/admin"
          element={
            user?.role === 'admin'
              ? <AdminDashboard />
              : <Navigate to="/signin" replace />
          }
        />
        <Route
          path="/pharmacist"
          element={
            user?.role === 'pharmacist'
              ? <PharmacistDashboard />
              : <Navigate to="/signin" replace />
          }
        />
        <Route
          path="/dashboard"
          element={
            user?.role === 'user'
              ? <UserDashboard />
              : <Navigate to="/signin" replace />
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
