import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import ReviewCard from '../components/ReviewCard.jsx';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';

export default function Saved() {
  const { user } = useSession();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select(`
          created_at,
          review:reviews!inner(
            *,
            profile:profiles(username, display_name),
            edition:editions(id, title, language, work_id, work:works(title, author))
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (live) setItems((data || []).map((b) => b.review).filter(Boolean));
    })();
    return () => { live = false; };
  }, [user]);

  if (!user) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}>
        sign in to see what you saved.
      </div>
    );
  }

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <div className="t-page">saved</div>
      <div className="t-small muted" style={{ marginTop: 4 }}>reviews to come back to</div>
      <Divider />

      {items === null && (
        <div className="upper loading-dots" style={{ padding: 'var(--s-3) 0', textAlign: 'center' }}>
          loading
        </div>
      )}

      {items?.length === 0 && (
        <div style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
          <Talisman name="moth" size={160} breathe />
          <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
            nothing saved yet.
          </div>
          <div style={{ marginTop: 4, fontSize: 'var(--t-small)', color: 'var(--muted)' }}>
            <Link to="/">browse the feed</Link>
          </div>
        </div>
      )}

      {items?.map((r, i) => (
        <Fragment key={r.id}>
          {i > 0 && <Divider />}
          <ReviewCard review={r} />
        </Fragment>
      ))}
    </div>
  );
}
