import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';

// own lists. /lists shows your own lists with a quick create form.
// other people's lists live on their profile under "lists".
export default function Lists() {
  const { user } = useSession();
  const [lists, setLists] = useState(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from('lists')
      .select('id, title, description, is_public, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setLists(data || []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  async function create(e) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('lists')
      .insert({ user_id: user.id, title: title.trim() })
      .select()
      .single();
    setBusy(false);
    if (error) return;
    setTitle('');
    navigate(`/list/${data.id}`);
  }

  if (!user) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}>
        sign in to make lists.
      </div>
    );
  }

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <div className="t-page">lists</div>
      <div className="t-small muted" style={{ marginTop: 4 }}>
        curated reading lists. not status tracking.
      </div>

      <Divider />

      <form onSubmit={create}>
        <label className="upper">new list</label>
        <input
          className="plaintext"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="a title"
          style={{
            width: '100%',
            border: 0,
            borderBottom: '1px solid var(--ink)',
            padding: 'var(--s-2) 0',
            fontSize: 'var(--t-section)',
            background: 'transparent',
            outline: 'none',
          }}
        />
        <div style={{ marginTop: 'var(--s-2)' }}>
          <button type="submit" className="btn" disabled={busy || !title.trim()}>
            create
          </button>
        </div>
      </form>

      <Divider label={lists?.length ? `${lists.length} yours` : 'yours'} />

      {lists === null && (
        <div className="upper loading-dots" style={{ textAlign: 'center', padding: 'var(--s-3) 0' }}>
          loading
        </div>
      )}

      {lists?.length === 0 && (
        <div style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
          <Talisman name="moth" size={140} breathe />
          <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
            nothing here yet.
          </div>
        </div>
      )}

      {lists?.map((l, i) => (
        <Fragment key={l.id}>
          {i > 0 && <Divider />}
          <Link
            to={`/list/${l.id}`}
            style={{ display: 'block', textDecoration: 'none', padding: 'var(--s-2) 0' }}
          >
            <div className="plaintext t-section">{l.title}</div>
            {l.description && (
              <div className="t-small muted" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>
                {l.description}
              </div>
            )}
            <div className="upper" style={{ marginTop: 6 }}>
              {l.is_public ? 'public' : 'private'}
            </div>
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
