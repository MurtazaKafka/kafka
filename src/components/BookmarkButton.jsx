import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';

// toggles a bookmark on a review. tiny inline ✦ glyph, muted when off.
// no count, no public state, only the bookmarker sees it.
export default function BookmarkButton({ reviewId }) {
  const { user } = useSession();
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !reviewId) { setLoaded(true); return; }
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('review_id')
        .eq('user_id', user.id)
        .eq('review_id', reviewId)
        .maybeSingle();
      if (live) { setSaved(!!data); setLoaded(true); }
    })();
    return () => { live = false; };
  }, [user, reviewId]);

  if (!user || !loaded) return null;

  async function toggle() {
    if (saved) {
      await supabase.from('bookmarks').delete()
        .eq('user_id', user.id).eq('review_id', reviewId);
      setSaved(false);
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, review_id: reviewId });
      setSaved(true);
    }
  }

  return (
    <button
      onClick={toggle}
      className="upper"
      style={{
        color: saved ? 'var(--ink)' : 'var(--muted)',
        letterSpacing: 'var(--tr-upper)',
      }}
      title={saved ? 'saved' : 'save for later'}
    >
      {saved ? '✦ saved' : '✦ save'}
    </button>
  );
}
