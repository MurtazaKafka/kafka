import { Link } from 'react-router-dom';
import Stars from './Stars.jsx';
import { timeAgo } from '../lib/time.js';

// feed item. NOT a card. no border. no background. just type on paper.
// separation between items comes from the <Divider /> that surrounds the list.
export default function ReviewCard({ review }) {
  const {
    id, body, published_at, language,
    profile, edition, rating,
  } = review;

  const preview = truncate(body, 320);

  return (
    <article style={{ padding: 'var(--s-3) 0' }}>
      <header style={{ fontSize: 'var(--t-micro)', color: 'var(--muted)' }}>
        {profile && (
          <Link to={`/@${profile.username}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>
            <span className="t-small" style={{ color: 'var(--ink)' }}>
              {profile.display_name || profile.username}
            </span>
          </Link>
        )}
        {profile && <>  ·  @{profile.username}</>}
        {published_at && <>  ·  {timeAgo(published_at)}</>}
      </header>

      {edition && (
        <div style={{ marginTop: 'var(--s-2)' }}>
          <Link to={`/edition/${edition.id}`} style={{ textDecoration: 'none' }}>
            <div className="plaintext t-section" style={{ color: 'var(--ink)' }}>
              {edition.title}
            </div>
            <div className="t-small muted" style={{ marginTop: 2 }}>
              — {edition.work?.author}
            </div>
          </Link>
        </div>
      )}

      <div
        className="plaintext"
        lang={language || undefined}
        style={{
          marginTop: 'var(--s-3)',
          fontSize: 'var(--t-body)',
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
        }}
      >
        {preview}
        {body.length > preview.length && (
          <>
            {' '}
            <Link to={`/edition/${edition?.id}#review-${id}`} style={{ color: 'var(--muted)' }}>
              continue
            </Link>
          </>
        )}
      </div>

      {rating != null && (
        <div style={{ marginTop: 'var(--s-2)' }}>
          <Stars value={rating} size={14} muted />
        </div>
      )}
    </article>
  );
}

function truncate(s, n) {
  if (!s) return '';
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const last = cut.lastIndexOf(' ');
  return (last > n * 0.7 ? cut.slice(0, last) : cut) + '…';
}
