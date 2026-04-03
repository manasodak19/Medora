import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon">💊</div>
        MEDORA
      </Link>

      <ul className="navbar-links">
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
