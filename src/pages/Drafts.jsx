import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import { timeAgo } from '../lib/time.js';
import Divider from '../components/Divider.jsx';

export default function Drafts() {
  const { user } = useSession();
  const [drafts, setDrafts] = useState(null);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, edition:editions(id, title, language, work:works(author))')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });
      if (live) setDrafts(data || []);
    })();
    return () => { live = false; };
  }, [user]);

  if (!user) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}>
        sign in to see your drafts.
      </div>
    );
  }

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <div className="t-page">drafts</div>

      <Divider />

      {drafts === null && (
        <div className="upper loading-dots" style={{ padding: 'var(--s-3) 0', textAlign: 'center' }}>
          loading
        </div>
      )}

      {drafts?.length === 0 && (
        <div style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
          <div style={{ color: 'var(--ink-soft)' }}>nothing in progress.</div>
          <div style={{ marginTop: 4, fontSize: 'var(--t-small)', color: 'var(--muted)' }}>
            start one from <Link to="/search">search</Link>.
          </div>
        </div>
      )}

      {drafts?.map((d, i) => (
        <Fragment key={d.id}>
          {i > 0 && <Divider />}
          <Link
            to={`/write/${d.edition_id}`}
            style={{ display: 'block', textDecoration: 'none', padding: 'var(--s-2) 0' }}
          >
            <div className="plaintext t-section">{d.edition?.title}</div>
            <div className="t-small muted" style={{ marginTop: 2 }}>
              {d.edition?.work?.author}
            </div>
            <div className="upper" style={{ marginTop: 6 }}>
              {timeAgo(d.updated_at)}
              {'  ·  '}
              {(d.body || '').trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
