import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import Wordmark from '../components/Wordmark.jsx';
import Talisman from '../components/Talisman.jsx';
import PixelFrame from '../components/PixelFrame.jsx';
import Divider from '../components/Divider.jsx';
import { longDate } from '../lib/time.js';

// signed-out landing. zine page, not a saas page.
// one handpicked featured review inside a pixel frame. no marketing copy.
export default function Landing() {
  const [review, setReview] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      // prefer the top editorial pick. fall back to the most recent published
      // review so a fresh deploy is never empty.
      const { data: picks } = await supabase
        .from('editorial_picks')
        .select(`review:reviews!inner(
          *,
          profile:profiles(username, display_name),
          edition:editions(id, title, language, work:works(title, author, original_year))
        )`)
        .order('position', { ascending: true })
        .limit(1);
      let r = picks?.[0]?.review;
      if (!r) {
        const { data } = await supabase
          .from('reviews')
          .select('*, profile:profiles(username, display_name), edition:editions(id, title, language, work:works(title, author, original_year))')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1);
        r = data?.[0];
      }
      if (live) setReview(r ?? null);
    })();
    return () => { live = false; };
  }, []);

  return (
    <div className="col" style={{ padding: 'var(--s-6) 0' }}>
      <Wordmark size={22} />
      <div
        style={{
          textAlign: 'center',
          marginTop: 'var(--s-3)',
          color: 'var(--muted)',
          fontSize: 'var(--t-small)',
        }}
      >
        a place for writing about books.
      </div>

      <div style={{ textAlign: 'center', margin: 'var(--s-6) 0' }}>
        <Talisman name="hand" size={240} breathe />
      </div>

      <Divider />

      <div style={{ margin: 'var(--s-4) 0' }}>
        {review ? (
          <PixelFrame padding="var(--s-4)">
            <div className="plaintext t-section">{review.edition?.title}</div>
            <div className="t-small muted" style={{ marginTop: 4 }}>
              — {review.edition?.work?.author}
              {review.edition?.work?.original_year ? `, ${review.edition.work.original_year}` : ''}
            </div>
            <div className="upper" style={{ marginTop: 'var(--s-2)' }}>
              {longDate(review.published_at)}
            </div>

            <Divider count={10} />

            <div
              className="plaintext"
              lang={review.language || undefined}
              style={{
                fontSize: 'var(--t-body)',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {review.body}
            </div>

            <div
              className="t-small muted"
              style={{ marginTop: 'var(--s-3)' }}
            >
              — {review.profile?.display_name || review.profile?.username}
            </div>
          </PixelFrame>
        ) : (
          <div className="muted" style={{ textAlign: 'center' }}>no reviews yet.</div>
        )}
      </div>

      <Divider />

      <div style={{ textAlign: 'center', marginTop: 'var(--s-4)' }}>
        <Link className="btn" to="/auth">sign in</Link>
      </div>

      <div className="upper" style={{ textAlign: 'center', marginTop: 'var(--s-4)' }}>
        <Link to="/about" style={{ color: 'var(--muted)' }}>about</Link>
      </div>
    </div>
  );
}
