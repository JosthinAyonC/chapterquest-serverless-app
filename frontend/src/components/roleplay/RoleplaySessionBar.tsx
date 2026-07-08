import { useLocation } from 'react-router-dom';
import { useRoleplayBookTitle } from '../../hooks/useRoleplayBookTitle';

export default function RoleplaySessionBar() {
  const { pathname } = useLocation();
  const isRoleplayRoute =
    pathname === '/review/host' || pathname.startsWith('/roleplay/');

  const { title, coverColor, sessionCode, loading } = useRoleplayBookTitle();

  if (!isRoleplayRoute) return null;

  return (
    <div className="roleplay-session-bar" aria-label="Book for this review">
      <div className="container roleplay-session-bar-inner">
        <div className="roleplay-session-bar-book">
          <span
            className="roleplay-session-bar-cover"
            style={{ background: coverColor ?? 'var(--color-accent)' }}
            aria-hidden="true"
          >
            📖
          </span>
          <div className="roleplay-session-bar-text">
            <span className="roleplay-session-bar-label">Review for</span>
            {loading ? (
              <span className="roleplay-session-bar-title">Loading book…</span>
            ) : title ? (
              <span className="roleplay-session-bar-title">{title}</span>
            ) : (
              <span className="roleplay-session-bar-title roleplay-session-bar-title--muted">
                No book linked to this session
              </span>
            )}
          </div>
        </div>
        {sessionCode ? (
          <span className="roleplay-session-bar-code" aria-label="Session code">
            {sessionCode}
          </span>
        ) : null}
      </div>
    </div>
  );
}
