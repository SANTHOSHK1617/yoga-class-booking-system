import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">🧘</span> Serenity <span className="brand-light">Yoga</span>
        </Link>

        <button className="nav-toggle" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/classes" onClick={close}>Classes</NavLink>
          {user && <NavLink to="/my-bookings" onClick={close}>My Bookings</NavLink>}
          {isAdmin && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          {user ? (
            <div className="nav-user">
              <span className="avatar" title={user.email}>{user.name.charAt(0).toUpperCase()}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
            </div>
          ) : (
            <div className="nav-user">
              <Link to="/login" className="btn btn-ghost btn-sm" onClick={close}>Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Sign up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
