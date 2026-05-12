import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import Stars from '../components/Stars.jsx';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';
import { timeAgo } from '../lib/time.js';

export default function Work() {
  const { work_id } = useParams();
  const { profile } = useSession();

  const [work, setWork] = useState(null);
  const [editions, setEditions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratingAgg, setRatingAgg] = useState({ avg: null, count: 0 });

  useEffect(() => {
    let live = true;
    // work + editions + ratings agg fire in parallel; reviews waits for the
    // edition ids but joins back into the same paint.
    const workP = supabase.from('works').select('*').eq('id', work_id).maybeSingle();
    const edsP  = supabase.from('editions').select('*').eq('work_id', work_id);
    const rsP   = supabase.from('ratings').select('stars').eq('work_id', work_id);

    (async () => {
      const [{ data: w }, { data: eds }, { data: rs }] = await Promise.all([workP, edsP, rsP]);
      if (!live) return;
      setWork(w);
      setEditions(eds || []);
      if (rs?.length) {
        const sum = rs.reduce((a, b) => a + b.stars, 0);
        setRatingAgg({ avg: sum / rs.length, count: rs.length });
      }
      if (!w) return;

      const editionIds = (eds || []).map((e) => e.id);
      if (editionIds.length) {
        const { data: rvs } = await supabase
          .from('reviews')
          .select('*, profile:profiles(username, display_name), edition:editions(id, title, language, translator)')
          .in('edition_id', editionIds)
          .eq('status', 'published')
          .order('published_at', { ascending: false });
        if (live) setReviews(rvs || []);
      }
    })();
    return () => { live = false; };
  }, [work_id]);

  if (!work) {
    return (
      <div className="col upper loading-dots" style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
        loading
      </div>
    );
  }

  const langs = [...new Set(editions.map((e) => e.language))].sort();
  const reviewsByLang = groupBy(reviews, (r) => r.language || r.edition?.language || 'unknown');
  const primary = profile?.languages?.[0] || 'en';

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <header>
        <div className="plaintext t-page">{work.title}</div>
        <div style={{ fontSize: 'var(--t-body)', color: 'var(--muted)', marginTop: 6 }}>
          {work.author}
        </div>
        <div className="t-small muted" style={{ marginTop: 2 }}>
          {work.original_year || ''}
        </div>
        {langs.length > 0 && (
          <div className="upper" style={{ marginTop: 'var(--s-2)' }}>
            {langs.map((l) => l?.toUpperCase()).join('  ·  ')}
          </div>
        )}
        {ratingAgg.avg != null && (
          <div style={{ marginTop: 'var(--s-2)', display: 'flex', gap: 'var(--s-2)', alignItems: 'center' }}>
            <Stars value={Math.round(ratingAgg.avg)} size={14} muted />
            <span className="upper">
              {(ratingAgg.avg / 2).toFixed(1)}  ·  {ratingAgg.count} {ratingAgg.count === 1 ? 'rating' : 'ratings'}
            </span>
          </div>
        )}
      </header>

      <Divider label="editions" />
      {editions.map((e) => (
        <div key={e.id} style={{ padding: '6px 0' }}>
          <Link to={`/edition/${e.id}`} style={{ textDecoration: 'none' }}>
            <span className="plaintext" style={{ fontWeight: 500 }}>{e.title}</span>
            <span className="t-small muted">
              {'  ·  '}{e.language?.toUpperCase()}
              {e.translator ? `  ·  tr. ${e.translator}` : ''}
              {e.published_year ? `  ·  ${e.published_year}` : ''}
            </span>
          </Link>
        </div>
      ))}

      <Divider label="reviews" />

      {Object.keys(reviewsByLang).length === 0 && <EmptyReviews />}

      {Object.entries(reviewsByLang)
        .sort(([a], [b]) => (a === primary ? -1 : b === primary ? 1 : a.localeCompare(b)))
        .map(([lang, list]) => (
          <LangGroup key={lang} lang={lang} reviews={list} defaultOpen={lang === primary} />
        ))}
    </div>
  );
}

function LangGroup({ lang, reviews, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={{ marginBottom: 'var(--s-4)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--s-2)',
          padding: '8px 0',
          width: '100%',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        <span className="upper" style={{ color: 'var(--ink)' }}>{lang.toUpperCase()}</span>
        <span className="upper">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
        <span className="upper" style={{ marginLeft: 'auto' }}>{open ? '−' : '+'}</span>
      </button>
      {open && reviews.map((r, i) => (
        <Fragment key={r.id}>
          {i > 0 && <Divider />}
          <article style={{ padding: 'var(--s-3) 0' }}>
            <header style={{ fontSize: 'var(--t-micro)', color: 'var(--muted)' }}>
              <Link to={`/@${r.profile?.username}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                <span className="t-small" style={{ color: 'var(--ink)' }}>
                  {r.profile?.display_name || r.profile?.username}
                </span>
              </Link>
              {'  ·  '}@{r.profile?.username}
              {'  ·  '}{timeAgo(r.published_at)}
              {r.edition?.language !== lang && <>{'  ·  '}on {r.edition?.title}</>}
            </header>
            <div
              className="plaintext"
              lang={r.language || undefined}
              style={{ marginTop: 'var(--s-2)', whiteSpace: 'pre-wrap', lineHeight: 1.75, fontSize: 'var(--t-body)' }}
            >
              {r.body}
            </div>
          </article>
        </Fragment>
      ))}
    </section>
  );
}

function EmptyReviews() {
  return (
    <div style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
      <Talisman name="eye" size={180} breathe />
      <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
        no reviews yet.
      </div>
    </div>
  );
}

function groupBy(list, fn) {
  const out = {};
  for (const x of list) {
    const k = fn(x);
    (out[k] ||= []).push(x);
  }
  return out;
}
