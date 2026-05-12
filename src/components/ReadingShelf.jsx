import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import DitheredImage from './DitheredImage.jsx';
import Divider from './Divider.jsx';

// own-profile only widget. shows what the user has marked as currently reading.
// reading is fully private (RLS scoped to user_id = auth.uid()).
export default function ReadingShelf({ userId }) {
  const { user } = useSession();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!user || user.id !== userId) return;
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('reading')
        .select('started_at, edition:editions(id, title, cover_url, language, work:works(author))')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });
      if (live) setRows((data || []).filter((r) => r.edition));
    })();
    return () => { live = false; };
  }, [userId, user]);

  if (!user || user.id !== userId) return null;
  if (!rows || rows.length === 0) return null;

  return (
    <section style={{ marginTop: 'var(--s-4)' }}>
      <Divider label="reading now" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--s-3)' }}>
        {rows.map((r) => (
          <Link
            key={r.edition.id}
            to={`/edition/${r.edition.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <DitheredImage src={r.edition.cover_url} width={120} height={180} />
            <div className="plaintext t-small" style={{ marginTop: 6, fontWeight: 500 }}>
              {r.edition.title}
            </div>
            <div className="upper" style={{ marginTop: 2 }}>
              {r.edition.work?.author}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
