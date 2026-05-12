import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import DitheredImage from '../components/DitheredImage.jsx';
import Stars from '../components/Stars.jsx';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';
import ReviewActions from '../components/ReviewActions.jsx';
import Comments from '../components/Comments.jsx';
import BookmarkButton from '../components/BookmarkButton.jsx';
import EditionActions from '../components/EditionActions.jsx';
import { timeAgo } from '../lib/time.js';

export default function Edition() {
  const { edition_id } = useParams();
  const [params] = useSearchParams();
  const ratePrompt = params.get('rate') === '1';
  const { hash } = useLocation();

  const { user } = useSession();
  const [edition, setEdition] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(null);

  useEffect(() => {
    let live = true;
    // edition + reviews fire in parallel — reviews don't need the edition row.
    // rating waits for the edition (needs work_id), but the edition arrives
    // alongside the reviews so we don't double the wall-clock cost.
    const edP = supabase
      .from('editions')
      .select('*, work:works(*)')
      .eq('id', edition_id)
      .maybeSingle();
    const rvsP = supabase
      .from('reviews')
      .select('*, profile:profiles(username, display_name)')
      .eq('edition_id', edition_id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    (async () => {
      const [{ data: ed }, { data: rvs }] = await Promise.all([edP, rvsP]);
      if (!live) return;
      setEdition(ed);
      setReviews(rvs || []);
      if (!ed || !user) return;

      const { data: r } = await supabase
        .from('ratings')
        .select('stars')
        .eq('user_id', user.id)
        .eq('work_id', ed.work_id)
        .maybeSingle();
      if (live) setRating(r?.stars ?? 0);
    })();
    return () => { live = false; };
  }, [edition_id, user]);

  useEffect(() => {
    if (!hash || !reviews.length) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash, reviews]);

  async function saveRating(stars) {
    if (!user || !edition) return;
    setRating(stars);
    if (stars === 0) {
      await supabase.from('ratings').delete()
        .eq('user_id', user.id).eq('work_id', edition.work_id);
    } else {
      await supabase.from('ratings').upsert({
        user_id: user.id, work_id: edition.work_id, stars,
      });
    }
  }

  if (!edition) {
    return (
      <div className="col upper loading-dots" style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
        loading
      </div>
    );
  }

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <header style={{ display: 'flex', gap: 'var(--s-4)', alignItems: 'flex-start' }}>
        <DitheredImage src={edition.cover_url} width={180} height={270} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <div className="plaintext t-page">{edition.title}</div>
          <div style={{ fontSize: 'var(--t-body)', color: 'var(--muted)', marginTop: 6 }}>
            {edition.work?.author}
          </div>
          <div className="t-small muted" style={{ marginTop: 2 }}>
            {edition.work?.original_year || ''}
          </div>

          <dl style={defList}>
            {edition.language && <DefItem label="language" value={edition.language.toUpperCase()} />}
            {edition.translator && <DefItem label="translator" value={edition.translator} />}
            {edition.publisher && <DefItem label="publisher" value={edition.publisher} />}
            {edition.published_year && <DefItem label="year" value={String(edition.published_year)} />}
            {edition.isbn && <DefItem label="isbn" value={edition.isbn} />}
          </dl>

          <div className="t-small" style={{ marginTop: 'var(--s-3)' }}>
            <Link to={`/book/${edition.work_id}`}>other editions →</Link>
          </div>

          {user && <EditionActions edition={edition} />}
        </div>
      </header>

      {user && (ratePrompt || rating != null) && (
        <>
          <Divider label="rate this book" />
          <div style={{ textAlign: 'center', padding: 'var(--s-2) 0' }}>
            <Stars value={rating || 0} onChange={saveRating} size={24} muted={false} />
            {rating > 0 && (
              <div className="upper" style={{ marginTop: 'var(--s-2)' }}>
                {(rating / 2).toFixed(1)} of 5
              </div>
            )}
          </div>
        </>
      )}

      <Divider label="reviews" />

      {reviews.length === 0 ? (
        <EmptyReviews />
      ) : (
        reviews.map((r, i) => (
          <Fragment key={r.id}>
            {i > 0 && <Divider />}
            <ReviewEntry
              review={r}
              onDeleted={(id) => setReviews((rs) => rs.filter((x) => x.id !== id))}
            />
          </Fragment>
        ))
      )}
    </div>
  );
}

function DefItem({ label, value }) {
  return (
    <>
      <dt className="upper" style={{ gridColumn: 1 }}>{label}</dt>
      <dd className="t-small" style={{ gridColumn: 2, margin: 0 }}>{value}</dd>
    </>
  );
}

const defList = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: 'var(--s-3)',
  rowGap: '4px',
  margin: 'var(--s-3) 0 0',
};

function ReviewEntry({ review, onDeleted }) {
  return (
    <article id={`review-${review.id}`} style={{ padding: 'var(--s-3) 0' }}>
      <header style={{ fontSize: 'var(--t-micro)', color: 'var(--muted)' }}>
        <Link to={`/@${review.profile?.username}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
          <span className="t-small" style={{ color: 'var(--ink)' }}>
            {review.profile?.display_name || review.profile?.username}
          </span>
        </Link>
        {'  ·  '}@{review.profile?.username}
        {'  ·  '}{timeAgo(review.published_at)}
      </header>
      <div
        className="plaintext"
        lang={review.language || undefined}
        style={{
          marginTop: 'var(--s-2)',
          fontSize: 'var(--t-body)',
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
        }}
      >
        {review.body}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s-3)', marginTop: 6 }}>
        <BookmarkButton reviewId={review.id} />
        <ReviewActions review={review} onDeleted={onDeleted} />
      </div>
      <Comments reviewId={review.id} reviewOwnerId={review.user_id} />
    </article>
  );
}

function EmptyReviews() {
  return (
    <div style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
      <Talisman name="eye" size={180} breathe />
      <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
        no reviews yet.
      </div>
      <div style={{ marginTop: 4, fontSize: 'var(--t-small)', color: 'var(--muted)' }}>
        be the first.
      </div>
    </div>
  );
}
