import { NavLink, useNavigate } from 'react-router-dom';
import { useSession } from '../store/session.js';

// write · feed · library · search · saved · inbox · out
// pipes are muted dots, labels are ink, current is accent.
// hover = color only. no underlines, no backgrounds.
// unread inbox is marked with a small ✦ next to the label.
// "out" is a sign-out action (not a route) — muted so it sits quietly at the end.
export default function Nav() {
  const { user, profile, unread, signOut } = useSession();
  const navigate = useNavigate();

  const items = user && profile
    ? [
        { label: 'write',   to: '/drafts' },
        { label: 'feed',    to: '/', exact: true },
        { label: 'library', to: `/@${profile.username}` },
        { label: 'search',  to: '/search' },
        { label: 'lists',   to: '/lists' },
        { label: 'saved',   to: '/saved' },
        { label: 'inbox',   to: '/notifications', badge: unread },
        { label: 'about',   to: '/about', muted: true },
        { label: 'out',     action: async () => { await signOut(); navigate('/'); }, muted: true },
      ]
    : [
        { label: 'feed',    to: '/', exact: true },
        { label: 'search',  to: '/search' },
        { label: 'about',   to: '/about', muted: true },
        { label: 'sign in', to: '/auth' },
      ];

  return (
    <nav
      style={{
        padding: 'var(--s-3) var(--s-3) var(--s-2)',
        fontSize: 'var(--t-small)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 0,
        }}
      >
        {items.map((it, i) => (
          <span key={it.to || it.label} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
            {i > 0 && (
              <span
                aria-hidden
                style={{ color: 'var(--muted)', padding: '0 12px', userSelect: 'none' }}
              >
                ·
              </span>
            )}
            {it.action ? (
              <button
                onClick={it.action}
                className="nav-link"
                style={{
                  color: it.muted ? 'var(--muted)' : 'var(--ink)',
                  letterSpacing: 'inherit',
                }}
              >
                {it.label}
              </button>
            ) : (
              <NavLink
                to={it.to}
                end={it.exact}
                style={({ isActive }) => ({
                  color: isActive ? 'var(--accent)' : (it.muted ? 'var(--muted)' : 'var(--ink)'),
                  textDecoration: 'none',
                })}
                className="nav-link"
              >
                {it.label}
                {it.badge > 0 && (
                  <span style={{ color: 'var(--accent)', marginLeft: 4 }} aria-label={`${it.badge} unread`}>
                    ✦
                  </span>
                )}
              </NavLink>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}
