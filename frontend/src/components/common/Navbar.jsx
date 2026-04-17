import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Sun, Moon } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('medora-theme') || 'light';
  });
  const [iconSpin, setIconSpin] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('medora-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setIconSpin(true);
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    setTimeout(() => setIconSpin(false), 400);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon"><Pill size={20} /></div>
        MEDORA
      </Link>

      <ul className="navbar-links">
        <li>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            <span className={`toggle-icon ${iconSpin ? 'spin-in' : ''}`}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </span>
          </button>
        </li>
        {!user ? (
          <>
            <li><Link to="/signin">Sign In</Link></li>
            <li><Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link></li>
          </>
        ) : (
          <>
            {user.role === 'admin' && <li><Link to="/admin" className="nav-active">Admin Panel</Link></li>}
            {user.role === 'pharmacist' && <li><Link to="/pharmacist" className="nav-active">Inventory</Link></li>}
            {user.role === 'user' && <li><Link to="/dashboard" className="nav-active">Dashboard</Link></li>}
            <li>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-light)' }}>
                {user.email}
              </span>
            </li>
            <li>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Sign Out
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
