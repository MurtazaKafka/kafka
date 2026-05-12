import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';
import ReviewActions from '../components/ReviewActions.jsx';
import ReadingShelf from '../components/ReadingShelf.jsx';
import ProfileLists from '../components/ProfileLists.jsx';
import { timeAgo } from '../lib/time.js';

export default function Profile() {
  const { username: raw } = useParams();
  const username = (raw || '').replace(/^@/, '').toLowerCase();

  const { user } = useSession();
  const [profile, setProfile] = useState(null);
  const [missing, setMissing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (!live) return;
      if (!data) { setMissing(true); return; }
      setProfile(data);

      // reviews + follow-state fire together once we have the profile id.
      const reviewsP = supabase
        .from('reviews')
        .select('*, edition:editions(id, title, language, work:works(author))')
        .eq('user_id', data.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      const followP = (user && user.id !== data.id)
        ? supabase.from('follows').select('followee_id')
            .eq('follower_id', user.id).eq('followee_id', data.id).maybeSingle()
        : Promise.resolve({ data: null });

      const [{ data: rvs }, { data: f }] = await Promise.all([reviewsP, followP]);
      if (!live) return;
      setReviews(rvs || []);
      setFollowing(!!f);
    })();
    return () => { live = false; };
  }, [username, user]);

  async function toggleFollow() {
    if (!user || !profile) return;
    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('followee_id', profile.id);
      setFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, followee_id: profile.id });
      setFollowing(true);
    }
  }

  if (missing) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}>
        no one here.
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="col upper loading-dots" style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
        loading
      </div>
    );
  }

  const isMe = user?.id === profile.id;

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <header>
        <div className="t-page">@{profile.username}</div>
        {profile.display_name && (
          <div style={{ fontSize: 'var(--t-body)', color: 'var(--muted)', marginTop: 4 }}>
            {profile.display_name}
          </div>
        )}
        {profile.bio && (
          <div
            className="plaintext"
            style={{
              marginTop: 'var(--s-3)',
              fontSize: 'var(--t-body)',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
            }}
          >
            {profile.bio}
          </div>
        )}
        {profile.languages?.length > 0 && (
          <div className="upper" style={{ marginTop: 'var(--s-3)' }}>
            {profile.languages.map((l) => l.toUpperCase()).join('  ·  ')}
          </div>
        )}

        {!isMe && user && (
          <div style={{ marginTop: 'var(--s-3)' }}>
            <button className="btn" onClick={toggleFollow}>
              {following ? 'unfollow' : 'follow'}
            </button>
          </div>
        )}

        {isMe && (
          <div className="upper" style={{ marginTop: 'var(--s-3)' }}>
            <Link to="/settings" style={{ color: 'var(--muted)' }}>settings</Link>
            {'  ·  '}
            <Link to="/lists" style={{ color: 'var(--muted)' }}>lists</Link>
            {'  ·  '}
            <Link to="/saved" style={{ color: 'var(--muted)' }}>saved</Link>
            {'  ·  '}
            <Link to="/import" style={{ color: 'var(--muted)' }}>import</Link>
          </div>
        )}
      </header>

      {isMe && <ReadingShelf userId={profile.id} />}
      <ProfileLists userId={profile.id} isMe={isMe} />

      <Divider label={reviews.length === 0 ? 'published' : `${reviews.length} published`} />

      {reviews.length === 0 ? (
        <EmptyPublished isMe={isMe} />
      ) : (
        reviews.map((r, i) => (
          <Fragment key={r.id}>
            {i > 0 && <Divider />}
            <article style={{ padding: 'var(--s-3) 0' }}>
              <header style={{ fontSize: 'var(--t-micro)', color: 'var(--muted)' }}>
                <Link to={`/edition/${r.edition?.id}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                  <span className="t-small" style={{ color: 'var(--ink)' }}>{r.edition?.title}</span>
                </Link>
                {'  ·  '}{r.edition?.work?.author}
                {'  ·  '}{timeAgo(r.published_at)}
              </header>
              <div
                className="plaintext"
                lang={r.language || undefined}
                style={{
                  marginTop: 'var(--s-2)',
                  fontSize: 'var(--t-body)',
                  lineHeight: 1.75,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {r.body}
              </div>
              {isMe && (
                <ReviewActions
                  review={r}
                  onDeleted={(id) => setReviews((prev) => prev.filter((x) => x.id !== id))}
                />
              )}
            </article>
          </Fragment>
        ))
      )}
    </div>
  );
}

function EmptyPublished({ isMe }) {
  return (
    <div style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
      <Talisman name="butterfly" size={180} breathe />
      <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
        no published reviews yet.
      </div>
      {isMe && (
        <div style={{ marginTop: 4, fontSize: 'var(--t-small)', color: 'var(--muted)' }}>
          <Link to="/search">find a book →</Link>
        </div>
      )}
    </div>
  );
}
