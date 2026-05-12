import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchBooks } from '../lib/openlibrary.js';
import { findOrCreateEdition } from '../lib/books.js';
import { hasRTL } from '../lib/bidi.js';
import { transliterate } from '../lib/translit.js';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import DitheredImage from '../components/DitheredImage.jsx';
import Divider from '../components/Divider.jsx';
import Talisman from '../components/Talisman.jsx';
import PixelFrame from '../components/PixelFrame.jsx';

export default function Search() {
  const [q, setQ] = useState('');
  const [ol, setOl] = useState([]);     // openlibrary results
  const [user, setUser] = useState([]); // user-added (our db) results
  const [loading, setLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const { user: authUser } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!q.trim()) { setOl([]); setUser([]); return; }

    setLoading(true);
    let live = true;
    const query = q.trim();
    const rtl = hasRTL(query);

    // openlibrary search (debounced 200ms).
    // if the query is rtl, also fire a parallel search on a latin transliteration
    // — openlibrary indexes most persian/arabic books under their latinized author names.
    const primary = searchBooks(query);
    const translit = rtl ? transliterate(query) : null;
    const secondary = translit && translit !== query ? searchBooks(translit) : null;

    const t = setTimeout(() => {
      Promise.all([primary.results, secondary?.results]).then(([a, b]) => {
        if (!live) return;
        const merged = mergeOl(a || [], b || []);
        setOl(merged);
        setLoading(false);
      });
    }, 200);

    const abort = () => {
      primary.abort();
      secondary?.abort();
    };

    // user-added parallel search (db). fires independently — pattern stolen
    // from the brief's "persian parallel path" requirement but applies to all
    // queries: kafka users add books openlibrary doesn't have.
    //
    // two shots: by edition title (covers translations) and by work author/title.
    // merge + dedup by edition id. we only keep editions whose parent work was
    // NOT imported from openlibrary — those are already covered by the OL path.
    (async () => {
      const like = `%${q.replace(/[%_]/g, '\\$&')}%`;
      const [byEdition, byWork] = await Promise.all([
        supabase
          .from('editions')
          .select('id, work_id, title, language, cover_url, work:works(title, author, original_year, openlibrary_key)')
          .ilike('title', like)
          .limit(8),
        supabase
          .from('editions')
          .select('id, work_id, title, language, cover_url, work:works!inner(title, author, original_year, openlibrary_key)')
          .or(`title.ilike.${like},author.ilike.${like}`, { foreignTable: 'works' })
          .limit(8),
      ]);
      if (!live) return;
      const seen = new Set();
      const merged = [...(byEdition.data || []), ...(byWork.data || [])]
        .filter((e) => !e.work?.openlibrary_key)
        .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
      setUser(merged);
    })();

    return () => { live = false; abort(); clearTimeout(t); };
  }, [q]);

  async function writeAbout(input) {
    if (!authUser) { navigate('/auth'); return; }
    const { edition } = await findOrCreateEdition(input);
    navigate(`/write/${edition.id}`);
  }

  // mark as read — same find-or-create path, but lands on edition with rate prompt.
  async function readThis(input) {
    if (!authUser) { navigate('/auth'); return; }
    const { edition } = await findOrCreateEdition(input);
    navigate(`/edition/${edition.id}?rate=1`);
  }

  const isRtl = hasRTL(q);

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 120px' }}>
      <label className="upper" style={{ display: 'block', marginBottom: 'var(--s-1)' }}>
        search
      </label>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="title, author, …"
        className="plaintext"
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

      {loading && (
        <div className="upper loading-dots" style={{ marginTop: 'var(--s-2)' }}>
          searching
        </div>
      )}

      {(user.length > 0) && (
        <section>
          <Divider label={isRtl ? 'افزوده شده توسط کاربران' : 'added by users'} />
          {user.map((e) => {
            const input = {
              openlibrary_key: e.work?.openlibrary_key,
              title: e.title,
              author: e.work?.author,
              original_year: e.work?.original_year,
              language: e.language,
              cover_url: e.cover_url,
            };
            return (
              <UserResultRow
                key={e.id}
                edition={e}
                onWrite={() => writeAbout(input)}
                onRead={() => readThis(input)}
              />
            );
          })}
        </section>
      )}

      {(ol.length > 0) && (
        <section>
          <Divider label={isRtl ? 'از Open Library' : 'from Open Library'} />
          {ol.map((r) => (
            <OlResultRow
              key={r.openlibrary_key + (r.isbn || '')}
              r={r}
              onWrite={() => writeAbout(r)}
              onRead={() => readThis(r)}
            />
          ))}
        </section>
      )}

      {(q.trim() && !loading && ol.length === 0 && user.length === 0) && (
        <div style={{ padding: 'var(--s-5) 0 var(--s-3)', textAlign: 'center' }}>
          <Talisman name="eye" size={160} breathe />
          <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
            nothing found.
          </div>
        </div>
      )}

      <Divider />
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={() => setManualOpen((v) => !v)}
          className="nav-link"
          style={{ color: 'var(--muted)', fontSize: 'var(--t-small)' }}
        >
          {isRtl ? '→ کتاب‌تان را پیدا نکردید؟ دستی اضافه کنید' : 'can\'t find your book? add it manually →'}
        </button>
      </div>

      {manualOpen && (
        <div style={{ marginTop: 'var(--s-3)' }}>
          <PixelFrame padding="var(--s-4)">
            <ManualAdd onCreated={(edition) => navigate(`/write/${edition.id}`)} />
          </PixelFrame>
        </div>
      )}
    </div>
  );
}

// merge two OL result lists, dedup by openlibrary_key + isbn, primary list wins.
function mergeOl(a, b) {
  const seen = new Set();
  const out = [];
  for (const r of [...a, ...b]) {
    const key = `${r.openlibrary_key}|${r.isbn || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

const rowStyle = {
  display: 'flex', gap: 'var(--s-3)', padding: 'var(--s-2) 0',
  borderBottom: '1px solid var(--hairline)',
  alignItems: 'center',
};

function OlResultRow({ r, onWrite, onRead }) {
  return (
    <div style={rowStyle}>
      <DitheredImage src={r.cover_url} width={48} height={72} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="plaintext" style={{ fontSize: 'var(--t-body)', fontWeight: 500 }}>{r.title}</div>
        <div className="t-small muted">
          {r.author}{r.original_year ? `  ·  ${r.original_year}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--s-2)', flexShrink: 0 }}>
        <button className="btn" onClick={onRead} title="rate without writing">read</button>
        <button className="btn" onClick={onWrite}>write</button>
      </div>
    </div>
  );
}

function UserResultRow({ edition, onWrite, onRead }) {
  return (
    <div style={rowStyle}>
      <DitheredImage src={edition.cover_url} width={48} height={72} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="plaintext" style={{ fontSize: 'var(--t-body)', fontWeight: 500 }}>{edition.title}</div>
        <div className="t-small muted">
          {edition.work?.author}
          {edition.work?.original_year ? `  ·  ${edition.work.original_year}` : ''}
          {edition.language ? `  ·  ${edition.language.toUpperCase()}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--s-2)', flexShrink: 0 }}>
        <Link className="btn" to={`/edition/${edition.id}`}>view</Link>
        <button className="btn" onClick={onRead} title="rate without writing">read</button>
        <button className="btn" onClick={onWrite}>write</button>
      </div>
    </div>
  );
}

function ManualAdd({ onCreated }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('en');
  const [year, setYear] = useState('');
  const [isbn, setIsbn] = useState('');
  const [cover, setCover] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setBusy(true);
    try {
      const { edition } = await findOrCreateEdition({
        title: title.trim(),
        author: author.trim(),
        language,
        original_year: year ? parseInt(year, 10) : null,
        published_year: year ? parseInt(year, 10) : null,
        isbn: isbn.trim() || null,
        cover_url: cover.trim() || null,
      });
      onCreated(edition);
    } finally {
      setBusy(false);
    }
  }

  const input = { width: '100%', border: 0, borderBottom: '1px solid var(--hairline)', padding: '6px 0', background: 'transparent', outline: 'none' };

  return (
    <form onSubmit={submit} style={{ marginTop: 'var(--s-3)', display: 'grid', gap: 'var(--s-2)' }}>
      <label className="upper">title</label>
      <input className="plaintext" style={input} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="upper">author</label>
      <input className="plaintext" style={input} value={author} onChange={(e) => setAuthor(e.target.value)} />
      <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
        <div style={{ flex: 1 }}>
          <label className="upper">language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={input}>
            <option value="en">en</option>
            <option value="fa">fa</option>
            <option value="prs">prs (dari)</option>
            <option value="ar">ar</option>
            <option value="ps">ps</option>
            <option value="fr">fr</option>
            <option value="de">de</option>
            <option value="es">es</option>
            <option value="ru">ru</option>
            <option value="tr">tr</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="upper">year</label>
          <input style={input} value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </div>
      <label className="upper">isbn (optional)</label>
      <input style={input} value={isbn} onChange={(e) => setIsbn(e.target.value)} />
      <label className="upper">cover url (optional)</label>
      <input style={input} value={cover} onChange={(e) => setCover(e.target.value)} />
      <div style={{ marginTop: 'var(--s-2)' }}>
        <button type="submit" className="btn" disabled={busy || !title.trim() || !author.trim()}>
          {busy ? 'adding…' : 'add & write'}
        </button>
      </div>
    </form>
  );
}
