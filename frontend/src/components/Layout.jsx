import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiMenu, FiPlusCircle, FiRefreshCw, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuButtonRef = useRef(null);

  const signOut = async () => {
    await logout();
    navigate('/');
    setOpen(false);
  };

  const closeMenu = () => setOpen(false);

  // Keyboard accessibility: Escape closes the mobile menu and returns focus to its toggle.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <>
      <header className="topbar">
        <div className="nav-wrap">
          <Link className="brand" to="/" onClick={closeMenu} aria-label="ReUseCircle home">
            <span className="brand-mark"><FiRefreshCw aria-hidden="true" /></span>
            <span>ReUse<span className="brand-light">Circle</span></span>
          </Link>
          <button
            ref={menuButtonRef}
            className="menu-button"
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="main-navigation"
          >
            {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
          <nav id="main-navigation" className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
            <NavLink to="/browse" onClick={closeMenu}>Explore</NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
                <NavLink to="/requests" onClick={closeMenu}>Sent requests</NavLink>
                <NavLink to="/incoming-requests" onClick={closeMenu}>Received requests</NavLink>
                <NavLink to="/wishlist" onClick={closeMenu}>Wishlist</NavLink>
                <NavLink to="/profile" onClick={closeMenu}>Profile</NavLink>
              </>
            )}
            {user?.role === 'moderator' && <NavLink to="/moderation" onClick={closeMenu}>Moderation</NavLink>}
            {user && <NotificationBell />}
            {user ? (
              <>
                <Link className="button button-small" to="/listings/new" onClick={closeMenu}>
                  <FiPlusCircle aria-hidden="true" /> Give an item
                </Link>
                <button className="text-button" type="button" onClick={signOut}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu}>Log in</NavLink>
                <Link className="button button-small" to="/register" onClick={closeMenu}>Join the circle</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <div className="app-content" id="main-content"><Outlet /></div>
      <footer className="rc-site-footer footer">
        <div className="wrap rc-footer-inner footer-inner">
          <div className="rc-footer-brand-col">
            <Link className="rc-footer-brand" to="/">
              <span className="rc-footer-brand-mark"><FiRefreshCw aria-hidden="true" /></span>
              <span>ReUse<span className="rc-footer-brand-light">Circle</span></span>
            </Link>
            <p className="rc-footer-tagline">Give what you don't need. Find what you do.</p>
          </div>
          <div className="rc-footer-note footer-note">
            <span className="rc-footer-dot footer-dot" aria-hidden="true" /> Small acts, lighter footprints.
          </div>
        </div>
      </footer>
    </>
  );
}
