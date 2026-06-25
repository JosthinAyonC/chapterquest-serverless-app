import { NavLink } from 'react-router-dom';
import EnvironmentBadge from './EnvironmentBadge';
import { useGuestUser } from '../context/useGuestUser';

const navItems = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/library', label: 'Biblioteca' },
  { to: '/reviews', label: 'Reseñas' },
  { to: '/community', label: 'Comunidad' },
  { to: '/profile', label: 'Perfil' },
];

export default function Header() {
  const { guest } = useGuestUser();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand-group">
          <NavLink to="/" className="brand" end>
            <span className="brand-mark" aria-hidden="true">
              ◎
            </span>
            <span className="brand-text">
              Lit<span>Circle</span>
            </span>
          </NavLink>
          <EnvironmentBadge />
        </div>

        <nav className="main-nav" aria-label="Navegación principal">
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

        <div className="header-meta">
          {guest ? (
            <span className="guest-badge">@{guest.username}</span>
          ) : (
            <span className="guest-badge guest-badge--muted">Invitado</span>
          )}
        </div>
      </div>
    </header>
  );
}
