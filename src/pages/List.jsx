import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import DitheredImage from '../components/DitheredImage.jsx';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';

export default function List() {
  const { id } = useParams();
  const { user } = useSession();
  const navigate = useNavigate();

  const [list, setList] = useState(null);
  const [missing, setMissing] = useState(false);
  const [items, setItems] = useState([]);
  const [owner, setOwner] = useState(null);

  // edit state for the owner
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPublic, setEditPublic] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('lists')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!live) return;
      if (!data) { setMissing(true); return; }
      setList(data);
      setEditTitle(data.title);
      setEditDesc(data.description || '');
      setEditPublic(data.is_public);

      const { data: own } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', data.user_id)
        .maybeSingle();
      if (live) setOwner(own);

      const { data: rows } = await supabase
        .from('list_items')
        .select('position, note, added_at, edition:editions(id, title, cover_url, language, work_id, work:works(author, original_year))')
        .eq('list_id', id)
        .order('position', { ascending: true })
        .order('added_at', { ascending: true });
      if (live) setItems(rows || []);
    })();
    return () => { live = false; };
  }, [id]);

  const isOwner = user && list && user.id === list.user_id;

  async function saveMeta() {
    const { error } = await supabase
      .from('lists')
      .update({
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        is_public: editPublic,
      })
      .eq('id', id);
    if (!error) {
      setList((l) => ({ ...l, title: editTitle.trim(), description: editDesc.trim() || null, is_public: editPublic }));
      setEditing(false);
    }
  }

  async function remove(editionId) {
    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('list_id', id)
      .eq('edition_id', editionId);
    if (!error) setItems((rows) => rows.filter((r) => r.edition?.id !== editionId));
  }

  async function deleteList() {
    if (!confirm('delete this list?')) return;
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (!error) navigate('/lists');
  }

  if (missing) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}>
        no list here.
      </div>
    );
  }

  if (!list) {
    return (
      <div className="col upper loading-dots" style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
        loading
      </div>
    );
  }

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <header>
        {!editing ? (
          <>
            <div className="plaintext t-page">{list.title}</div>
            {list.description && (
              <div
                className="plaintext"
                style={{
                  marginTop: 'var(--s-2)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.75,
                  color: 'var(--ink-soft)',
                }}
              >
                {list.description}
              </div>
            )}
            <div className="upper" style={{ marginTop: 'var(--s-3)' }}>
              by{' '}
              <Link to={`/@${owner?.username}`} style={{ color: 'var(--muted)' }}>
                @{owner?.username}
              </Link>
              {'  ·  '}{list.is_public ? 'public' : 'private'}
              {'  ·  '}{items.length} {items.length === 1 ? 'book' : 'books'}
            </div>
            {isOwner && (
              <div className="upper" style={{ marginTop: 'var(--s-2)' }}>
                <button onClick={() => setEditing(true)} style={{ color: 'var(--muted)', letterSpacing: 'var(--tr-upper)' }}>
                  edit
                </button>
                {'  ·  '}
                <button onClick={deleteList} style={{ color: 'var(--accent)', letterSpacing: 'var(--tr-upper)' }}>
                  delete
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--s-2)' }}>
            <label className="upper">title</label>
            <input
              className="plaintext"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ border: 0, borderBottom: '1px solid var(--ink)', padding: '6px 0', background: 'transparent', outline: 'none', fontSize: 'var(--t-section)' }}
            />
            <label className="upper">description</label>
            <textarea
              className="plaintext"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={4}
              style={{ border: 0, borderBottom: '1px solid var(--hairline)', padding: '6px 0', background: 'transparent', outline: 'none', resize: 'vertical', unicodeBidi: 'plaintext' }}
            />
            <label className="upper" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} />
              public
            </label>
            <div style={{ display: 'flex', gap: 'var(--s-2)', marginTop: 'var(--s-2)' }}>
              <button className="btn" onClick={saveMeta} disabled={!editTitle.trim()}>save</button>
              <button className="btn" onClick={() => setEditing(false)}>cancel</button>
            </div>
          </div>
        )}
      </header>

      <Divider />

      {items.length === 0 ? (
        <div style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
          <Talisman name="butterfly" size={160} breathe />
          <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
            no books on this list yet.
          </div>
          <div style={{ marginTop: 4, fontSize: 'var(--t-small)', color: 'var(--muted)' }}>
            <Link to="/search">find a book →</Link>
          </div>
        </div>
      ) : (
        items.map((row, i) => (
          <Fragment key={row.edition?.id || i}>
            {i > 0 && <Divider />}
            <div style={{ display: 'flex', gap: 'var(--s-3)', padding: 'var(--s-2) 0', alignItems: 'flex-start' }}>
              <DitheredImage src={row.edition?.cover_url} width={56} height={84} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/edition/${row.edition?.id}`} style={{ textDecoration: 'none' }}>
                  <div className="plaintext" style={{ fontSize: 'var(--t-body)', fontWeight: 500 }}>
                    {row.edition?.title}
                  </div>
                  <div className="t-small muted" style={{ marginTop: 2 }}>
                    {row.edition?.work?.author}
                    {row.edition?.work?.original_year ? `  ·  ${row.edition.work.original_year}` : ''}
                  </div>
                </Link>
                {row.note && (
                  <div
                    className="plaintext t-small"
                    style={{ marginTop: 6, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}
                  >
                    {row.note}
                  </div>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => remove(row.edition?.id)}
                  className="upper"
                  style={{ color: 'var(--muted)', letterSpacing: 'var(--tr-upper)' }}
                >
                  remove
                </button>
              )}
            </div>
          </Fragment>
        ))
      )}
    </div>
  );
}
