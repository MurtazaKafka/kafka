import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import { timeAgo } from '../lib/time.js';

// single-level replies under a published review. plaintext, no formatting.
// no like counts, no thread depth. either the comment author OR the review
// owner can delete. composer hidden until signed in.
export default function Comments({ reviewId, reviewOwnerId }) {
  const { user } = useSession();
  const [comments, setComments] = useState(null);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reviewId) return;
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('review_comments')
        .select('*, profile:profiles(username, display_name)')
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });
      if (live) setComments(data || []);
    })();
    return () => { live = false; };
  }, [reviewId]);

  async function submit(e) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('review_comments')
      .insert({ review_id: reviewId, user_id: user.id, body: body.trim() })
      .select('*, profile:profiles(username, display_name)')
      .single();
    setBusy(false);
    if (error) return;
    setComments((c) => [...(c || []), data]);
    setBody('');
  }

  async function del(id) {
    const { error } = await supabase.from('review_comments').delete().eq('id', id);
    if (!error) setComments((c) => c.filter((x) => x.id !== id));
  }

  const count = comments?.length ?? 0;

  return (
    <section style={{ marginTop: 'var(--s-3)', paddingTop: 'var(--s-2)', borderTop: '1px solid var(--hairline)' }}>
      {count > 0 && (
        <div className="upper" style={{ marginBottom: 'var(--s-2)' }}>
          {count} {count === 1 ? 'reply' : 'replies'}
        </div>
      )}

      {comments?.map((c) => (
        <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
          <header style={{ fontSize: 'var(--t-micro)', color: 'var(--muted)' }}>
            <Link to={`/@${c.profile?.username}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
              <span className="t-small" style={{ color: 'var(--ink)' }}>
                {c.profile?.display_name || c.profile?.username}
              </span>
            </Link>
            {'  ·  '}@{c.profile?.username}
            {'  ·  '}{timeAgo(c.created_at)}
          </header>
          <div
            className="plaintext"
            style={{
              marginTop: 4,
              fontSize: 'var(--t-small)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {c.body}
          </div>
          {user && (c.user_id === user.id || reviewOwnerId === user.id) && (
            <button
              onClick={() => del(c.id)}
              className="upper"
              style={{ color: 'var(--muted)', marginTop: 4, letterSpacing: 'var(--tr-upper)' }}
            >
              delete
            </button>
          )}
        </div>
      ))}

      {user ? (
        <form onSubmit={submit} style={{ marginTop: 'var(--s-2)' }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="reply…"
            rows={2}
            className="plaintext"
            style={{
              width: '100%',
              border: 0,
              borderBottom: '1px solid var(--hairline)',
              padding: '6px 0',
              background: 'transparent',
              outline: 'none',
              resize: 'vertical',
              fontSize: 'var(--t-small)',
              lineHeight: 1.6,
              unicodeBidi: 'plaintext',
            }}
          />
          <div style={{ marginTop: 6 }}>
            <button type="submit" className="btn" disabled={busy || !body.trim()}>
              {busy ? 'posting…' : 'reply'}
            </button>
          </div>
        </form>
      ) : (
        count === 0 && (
          <div className="upper" style={{ color: 'var(--muted)' }}>
            <Link to="/auth" style={{ color: 'var(--muted)' }}>sign in to reply</Link>
          </div>
        )
      )}
    </section>
  );
}
