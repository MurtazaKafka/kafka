import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import ReviewCard from '../components/ReviewCard.jsx';
import Landing from './Landing.jsx';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';
import PixelFrame from '../components/PixelFrame.jsx';

const TABS = ['following', 'languages', 'editorial'];

export default function Home() {
  const { user, profile, loading } = useSession();
  const [tab, setTab] = useState('following');
  const [items, setItems] = useState(null);

  // `following` and `languages` depend on the profile row (follows + lang prefs).
  // `editorial` does not — fire it as soon as we have a user, even before the
  // profile row hydrates. shaves a roundtrip off first feed paint.
  useEffect(() => {
    if (!user) return;
    if (tab !== 'editorial' && !profile) return;
    let live = true;
    (async () => {
      setItems(null);
      const rows = await fetchFeed(tab, user.id, profile);
      if (live) setItems(rows);
    })();
    return () => { live = false; };
  }, [tab, user, profile]);

  if (loading) return null;
  if (!user) return <Landing />;

  return (
    <div className="col" style={{ padding: 'var(--s-3) 0 var(--s-6)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 0,
          fontSize: 'var(--t-small)',
          paddingBottom: 'var(--s-2)',
        }}
      >
        {TABS.map((t, i) => (
          <Fragment key={t}>
            {i > 0 && (
              <span aria-hidden style={{ color: 'var(--muted)', padding: '0 14px' }}>·</span>
            )}
            <button
              onClick={() => setTab(t)}
              className="nav-link"
              style={{
                color: t === tab ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {t}
            </button>
          </Fragment>
        ))}
      </div>

      <Divider />

      {items === null && (
        <div className="upper loading-dots" style={{ padding: 'var(--s-3) 0', textAlign: 'center' }}>
          reading
        </div>
      )}

      {items?.length === 0 && <EmptyFeed tab={tab} />}

      {items?.map((r, i) => (
        <Fragment key={r.id}>
          {i > 0 && <Divider />}
          <ReviewCard review={r} />
        </Fragment>
      ))}
    </div>
  );
}

async function fetchFeed(tab, userId, profile) {
  if (tab === 'following') {
    const { data: f } = await supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', userId);
    const ids = (f || []).map((x) => x.followee_id);
    if (!ids.length) return [];

    return fetchReviewsFor({ in: ids });
  }

  if (tab === 'languages') {
    const langs = profile.languages?.length ? profile.languages : ['en'];
    return fetchReviewsFor({ languages: langs });
  }

  // editorial: hand-curated picks from the editorial_picks table.
  // a fallback to recent long-form reviews kicks in when the table is empty
  // (so the tab is never blank on a fresh deploy).
  const { data: picks } = await supabase
    .from('editorial_picks')
    .select(`position, review:reviews!inner(
      *,
      profile:profiles(username, display_name),
      edition:editions(id, title, language, work_id, work:works(title, author))
    )`)
    .order('position', { ascending: true })
    .order('added_at', { ascending: false })
    .limit(20);

  let reviews = (picks || []).map((p) => p.review).filter((r) => r && r.status === 'published');

  if (reviews.length === 0) {
    const { data } = await supabase
      .from('reviews')
      .select(SELECT_FIELDS)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);
    reviews = (data || []).filter((r) => (r.body || '').length >= 400).slice(0, 15);
  }

  return attachRatings(reviews);
}

const SELECT_FIELDS =
  '*, profile:profiles(username, display_name), edition:editions(id, title, language, work_id, work:works(title, author))';

async function fetchReviewsFor({ in: userIds, languages }) {
  let q = supabase
    .from('reviews')
    .select(SELECT_FIELDS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);
  if (userIds) q = q.in('user_id', userIds);
  if (languages) q = q.in('language', languages);
  const { data } = await q;
  return attachRatings(data || []);
}

// batch-fetch the author's rating for each review's work. ratings are rendered
// at the bottom of feed cards when present. no rating → no stars line.
async function attachRatings(reviews) {
  if (!reviews.length) return reviews;
  const pairs = reviews
    .map((r) => ({ u: r.user_id, w: r.edition?.work_id }))
    .filter((p) => p.u && p.w);
  if (!pairs.length) return reviews;

  const userIds = [...new Set(pairs.map((p) => p.u))];
  const workIds = [...new Set(pairs.map((p) => p.w))];
  const { data } = await supabase
    .from('ratings')
    .select('user_id, work_id, stars')
    .in('user_id', userIds)
    .in('work_id', workIds);

  const byKey = new Map((data || []).map((r) => [`${r.user_id}|${r.work_id}`, r.stars]));
  return reviews.map((r) => ({ ...r, rating: byKey.get(`${r.user_id}|${r.edition?.work_id}`) ?? null }));
}

function EmptyFeed({ tab }) {
  const copy =
    tab === 'following' ? 'no one you follow has published yet.' :
    tab === 'languages' ? 'no reviews in your languages yet.' :
                          'nothing published yet.';
  const cta =
    tab === 'following' ? <>find readers <Link to="/search">→</Link></> :
    tab === 'languages' ? <><Link to="/settings">add a language</Link></> :
                          null;

  return (
    <div style={{ padding: 'var(--s-4) 0', textAlign: 'center' }}>
      <PixelFrame padding="var(--s-5) var(--s-4)">
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Talisman name="moth" size={180} breathe />
        </div>
        <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>{copy}</div>
        {cta && (
          <div style={{ marginTop: 'var(--s-2)', fontSize: 'var(--t-small)', color: 'var(--muted)' }}>
            {cta}
          </div>
        )}
      </PixelFrame>
    </div>
  );
}
