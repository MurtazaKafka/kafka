import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import Wordmark from '../components/Wordmark.jsx';
import Divider from '../components/Divider.jsx';

const USERNAME_RE = /^[a-z0-9_-]{3,20}$/;

export default function UsernameSetup() {
  const { user, profile, loading, refreshProfile } = useSession();
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    const u = username.toLowerCase().trim();
    if (!USERNAME_RE.test(u)) {
      setError('3-20 chars. lowercase letters, numbers, _ or -.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      username: u,
    });
    setBusy(false);
    if (error) {
      setError(error.code === '23505' ? 'taken. try another.' : 'couldn\'t save that. retry in a moment.');
      return;
    }
    await refreshProfile();
    navigate('/', { replace: true });
  }

  return (
    <div className="col" style={{ padding: 'var(--s-6) 0' }}>
      <Wordmark size={22} />
      <Divider />
      <div className="upper" style={{ textAlign: 'center', marginBottom: 'var(--s-2)' }}>
        pick a username
      </div>
      <form onSubmit={submit}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 'var(--t-section)', color: 'var(--muted)' }}>@</span>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="username"
            style={{
              flex: 1,
              border: 0,
              borderBottom: '1px solid var(--ink)',
              padding: 'var(--s-2) 0',
              fontSize: 'var(--t-section)',
              background: 'transparent',
              outline: 'none',
            }}
          />
        </div>
        <div className="upper" style={{ marginTop: 'var(--s-1)' }}>
          3–20 chars. lowercase, numbers, _ or -.
        </div>
        <div style={{ marginTop: 'var(--s-3)', textAlign: 'center' }}>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'saving ...' : 'continue'}
          </button>
        </div>
        {error && (
          <div style={{ color: 'var(--accent)', marginTop: 'var(--s-2)', fontSize: 'var(--t-micro)', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
