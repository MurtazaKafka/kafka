import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';

// signed-in actions on the edition page: write, currently-reading, add to list.
// rating + reviews live elsewhere on the same page.
export default function EditionActions({ edition }) {
  const { user } = useSession();
  const [reading, setReading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!user || !edition) return;
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('reading')
        .select('edition_id')
        .eq('user_id', user.id)
        .eq('edition_id', edition.id)
        .maybeSingle();
      if (live) { setReading(!!data); setLoaded(true); }
    })();
    return () => { live = false; };
  }, [user, edition]);

  if (!user || !edition) return null;

  async function toggleReading() {
    if (reading) {
      await supabase.from('reading').delete()
        .eq('user_id', user.id).eq('edition_id', edition.id);
      setReading(false);
    } else {
      await supabase.from('reading').insert({ user_id: user.id, edition_id: edition.id });
      setReading(true);
    }
  }

  return (
    <div style={{ marginTop: 'var(--s-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
      <Link className="btn" to={`/write/${edition.id}`}>write</Link>
      {loaded && (
        <button className="btn" onClick={toggleReading}>
          {reading ? '✦ reading' : 'mark reading'}
        </button>
      )}
      <button className="btn" onClick={() => setPickerOpen((v) => !v)}>
        add to list
      </button>
      {pickerOpen && (
        <div style={{ flexBasis: '100%' }}>
          <ListPicker editionId={edition.id} onDone={() => setPickerOpen(false)} />
        </div>
      )}
    </div>
  );
}

function ListPicker({ editionId, onDone }) {
  const { user } = useSession();
  const [lists, setLists] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('lists')
        .select('id, title')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (live) setLists(data || []);
    })();
    return () => { live = false; };
  }, [user]);

  async function addTo(listId) {
    setBusy(true);
    // best-effort: ignore conflict (already in list).
    await supabase
      .from('list_items')
      .upsert({ list_id: listId, edition_id: editionId }, { onConflict: 'list_id,edition_id' });
    setBusy(false);
    onDone();
  }

  async function createAndAdd(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusy(true);
    const { data: list } = await supabase
      .from('lists')
      .insert({ user_id: user.id, title: newTitle.trim() })
      .select()
      .single();
    if (list) {
      await supabase.from('list_items').insert({ list_id: list.id, edition_id: editionId });
    }
    setBusy(false);
    onDone();
  }

  return (
    <div style={{ marginTop: 'var(--s-2)', padding: 'var(--s-3)', border: '1px solid var(--hairline)' }}>
      <div className="upper" style={{ marginBottom: 'var(--s-2)' }}>your lists</div>
      {!lists ? (
        <div className="upper loading-dots">loading</div>
      ) : lists.length === 0 ? (
        <div className="t-small muted">no lists yet — create one below.</div>
      ) : (
        <div style={{ display: 'grid', gap: 4 }}>
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => addTo(l.id)}
              disabled={busy}
              style={{
                textAlign: 'left',
                padding: '4px 0',
                color: 'var(--ink)',
                borderBottom: '1px solid var(--hairline)',
              }}
            >
              <span className="plaintext">{l.title}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={createAndAdd} style={{ marginTop: 'var(--s-3)' }}>
        <label className="upper">or new list</label>
        <input
          className="plaintext"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="title"
          style={{
            width: '100%',
            border: 0,
            borderBottom: '1px solid var(--hairline)',
            padding: '6px 0',
            background: 'transparent',
            outline: 'none',
          }}
        />
        <div style={{ marginTop: 'var(--s-2)', display: 'flex', gap: 'var(--s-2)' }}>
          <button type="submit" className="btn" disabled={busy || !newTitle.trim()}>
            create & add
          </button>
          <button type="button" className="btn" onClick={onDone}>
            close
          </button>
        </div>
      </form>
    </div>
  );
}
