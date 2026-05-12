import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import Wordmark from '../components/Wordmark.jsx';
import Divider from '../components/Divider.jsx';

export default function Auth() {
  const { user, profile, loading } = useSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user && !profile) return <Navigate to="/auth/username" replace />;
  if (user && profile) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/auth/callback' },
    });
    setBusy(false);
    if (error) setError("couldn't send that link. retry in a moment.");
    else setSent(true);
  }

  return (
    <div className="col" style={{ padding: 'var(--s-6) 0' }}>
      <Wordmark size={22} />

      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--t-small)', marginTop: 'var(--s-3)' }}>
        a magic link will arrive in your inbox.
      </div>

      <Divider />

      {sent ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
          link sent. check your email.
        </div>
      ) : (
        <form onSubmit={submit}>
          <label className="upper" style={{ display: 'block', marginBottom: 'var(--s-1)' }}>email</label>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@somewhere"
            style={{
              width: '100%',
              border: 0,
              borderBottom: '1px solid var(--ink)',
              padding: 'var(--s-2) 0',
              fontSize: 'var(--t-section)',
              background: 'transparent',
              outline: 'none',
            }}
          />
          <div style={{ marginTop: 'var(--s-3)', textAlign: 'center' }}>
            <button type="submit" className="btn" disabled={busy || !email.trim()}>
              {busy ? 'sending ...' : 'send link'}
            </button>
          </div>
          {error && <div style={{ color: 'var(--accent)', marginTop: 'var(--s-2)', fontSize: 'var(--t-micro)', textAlign: 'center' }}>{error}</div>}
        </form>
      )}
    </div>
  );
}
