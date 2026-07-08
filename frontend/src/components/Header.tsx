import { useEffect, useId, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import EnvironmentBadge from './EnvironmentBadge';

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/library', label: 'Library' },
  { to: '/guide', label: 'Guide' },
  { to: '/play', label: 'Play' },
  { to: '/review', label: 'Review' },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`menu-icon${open ? ' menu-icon--open' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen);
    return () => document.body.classList.remove('nav-open');
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand-group">
          <NavLink to="/" className="brand" end>
            <img
              src="/litlecirclelogo.png"
              alt="LitCircle"
              className="brand-logo"
              width={52}
              height={52}
            />
          </NavLink>
          <EnvironmentBadge />
        </div>

        <nav className="main-nav desktop-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header-cta desktop-only">
          <Link to="/guide" className="btn btn--primary btn--sm">
            Start your circle
          </Link>
        </div>

        <button
          type="button"
          className="header-menu-btn"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              className="mobile-nav-backdrop"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              id={menuId}
              className="mobile-nav"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ul className="mobile-nav-list">
                {navItems.map(({ to, label, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        isActive
                          ? 'mobile-nav-link mobile-nav-link--active'
                          : 'mobile-nav-link'
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <Link
                to="/guide"
                className="btn btn--primary mobile-nav-cta"
                onClick={() => setMenuOpen(false)}
              >
                Start your circle
              </Link>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
