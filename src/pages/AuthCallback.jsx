import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../store/session.js';

// supabase's pkce flow consumes the url hash on init.
// we just wait for the session store to settle and redirect.
export default function AuthCallback() {
  const { user, profile, loading } = useSession();
  useEffect(() => { /* no-op — session store handles it */ }, []);
  if (loading) return <div className="col" style={{ padding: 'var(--s-5) 0', color: 'var(--muted)' }}>signing in…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) return <Navigate to="/auth/username" replace />;
  return <Navigate to="/" replace />;
}
