import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import Divider from './Divider.jsx';

// shown on every profile. for the owner it shows all lists; for everyone else,
// public lists only (RLS enforces this too).
export default function ProfileLists({ userId, isMe }) {
  const [lists, setLists] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('lists')
        .select('id, title, is_public, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (live) setLists(data || []);
    })();
    return () => { live = false; };
  }, [userId]);

  if (!lists || lists.length === 0) {
    if (!isMe) return null;
    return null;
  }

  return (
    <section style={{ marginTop: 'var(--s-4)' }}>
      <Divider label="lists" />
      <div style={{ display: 'grid', gap: 4 }}>
        {lists.map((l) => (
          <Link
            key={l.id}
            to={`/list/${l.id}`}
            style={{ textDecoration: 'none', padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}
          >
            <span className="plaintext" style={{ fontWeight: 500 }}>{l.title}</span>
            <span className="upper" style={{ marginLeft: 'var(--s-2)' }}>
              {l.is_public ? 'public' : 'private'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
