import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('medora-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('medora-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <motion.div 
          className="logo-icon"
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
        >
          <Pill size={20} />
        </motion.div>
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          MEDORA
        </motion.span>
      </Link>

      <ul className="navbar-links">
        <li>
          <motion.button
            className="theme-toggle"
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle dark mode"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={theme}
                className="toggle-icon"
                initial={{ y: 20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: -20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2, ease: "backOut" }}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
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
