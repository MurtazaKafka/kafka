import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';
import { timeAgo } from '../lib/time.js';

// in-app inbox. follows, comments, bookmarks. never email.
// new notifications are flagged with a small ✦ until read. opening the page
// marks everything as read in one shot.
export default function Notifications() {
  const { user, refreshUnread } = useSession();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      // notifications has two columns that could resolve to profiles
      // (user_id = recipient, actor_id = who did the thing). we only want the
      // actor's profile, so we fetch it in a second roundtrip rather than
      // wrestle with PostgREST disambiguation.
      const { data } = await supabase
        .from('notifications')
        .select(`
          id, kind, read_at, created_at, actor_id,
          review:reviews(id, edition_id, edition:editions(id, title)),
          list:lists(id, title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const actorIds = [...new Set((data || []).map((n) => n.actor_id).filter(Boolean))];
      let byActor = new Map();
      if (actorIds.length) {
        const { data: actors } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', actorIds);
        byActor = new Map((actors || []).map((a) => [a.id, a]));
      }
      const rowsWithActor = (data || []).map((n) => ({ ...n, actor: byActor.get(n.actor_id) }));
      if (!live) return;
      setRows(rowsWithActor);

      // mark unread as read (single roundtrip).
      const unread = (data || []).filter((r) => !r.read_at).map((r) => r.id);
      if (unread.length) {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .in('id', unread);
      }
    })();
    return () => { live = false; };
  }, [user]);

  useEffect(() => { refreshUnread(); }, [rows, refreshUnread]);

  if (!user) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}>
        sign in to see notifications.
      </div>
    );
  }

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <div className="t-page">notifications</div>
      <Divider />

      {rows === null && (
        <div className="upper loading-dots" style={{ textAlign: 'center', padding: 'var(--s-3) 0' }}>
          loading
        </div>
      )}

      {rows?.length === 0 && (
        <div style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
          <Talisman name="eye" size={140} breathe />
          <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
            nothing yet.
          </div>
        </div>
      )}

      {rows?.map((n, i) => (
        <Fragment key={n.id}>
          {i > 0 && <Divider />}
          <NotificationLine n={n} />
        </Fragment>
      ))}
    </div>
  );
}

function NotificationLine({ n }) {
  const actor = n.actor?.display_name || n.actor?.username || 'someone';
  const handle = n.actor?.username ? <Link to={`/@${n.actor.username}`} style={{ color: 'var(--ink)' }}>{actor}</Link> : actor;

  let body = null;
  if (n.kind === 'follow') {
    body = <>{handle} started following you.</>;
  } else if (n.kind === 'comment') {
    body = (
      <>
        {handle} replied to your review of{' '}
        <Link to={`/edition/${n.review?.edition_id}#review-${n.review?.id}`}>
          {n.review?.edition?.title || 'a book'}
        </Link>
        .
      </>
    );
  } else if (n.kind === 'bookmark') {
    body = (
      <>
        {handle} saved your review of{' '}
        <Link to={`/edition/${n.review?.edition_id}#review-${n.review?.id}`}>
          {n.review?.edition?.title || 'a book'}
        </Link>
        .
      </>
    );
  } else if (n.kind === 'list_add') {
    body = (
      <>
        {handle} added you to{' '}
        <Link to={`/list/${n.list?.id}`}>{n.list?.title || 'a list'}</Link>.
      </>
    );
  }

  return (
    <div style={{ padding: 'var(--s-2) 0', display: 'flex', gap: 'var(--s-2)' }}>
      <span style={{ color: n.read_at ? 'var(--hairline)' : 'var(--accent)', width: '1em' }} aria-hidden>
        ✦
      </span>
      <div style={{ flex: 1 }}>
        <div className="plaintext" style={{ fontSize: 'var(--t-body)' }}>{body}</div>
        <div className="upper" style={{ marginTop: 2 }}>{timeAgo(n.created_at)}</div>
      </div>
    </div>
  );
}
