import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import { findOrCreateEdition } from '../lib/books.js';
import { detectLanguage } from '../lib/bidi.js';
import Divider from '../components/Divider.jsx';

// goodreads csv import — logic ported from prototype.
// shelves:
//   "read"   → if review text: published review w/ published_at = date read
//            → if just a rating: ratings row only
//   other shelves are ignored for v1 (no lists yet).
// rating: goodreads 1-5 → kafka 2-10 (×2; goodreads only does whole stars).

export default function Import() {
  const { user, profile } = useSession();
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [finished, setFinished] = useState(false);

  if (!user || !profile) {
    return <div className="col" style={{ padding: 'var(--s-5) 0', color: 'var(--muted)' }}>sign in to import.</div>;
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const filtered = (res.data || []).filter((r) => (r['Exclusive Shelf'] || r['Bookshelves']) === 'read');
        setRows(filtered);
      },
    });
  }

  async function run() {
    if (!rows.length) return;
    setRunning(true);
    setProgress({ done: 0, total: rows.length, errors: 0 });

    let errors = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        await importRow(r, user.id);
      } catch (e) {
        errors++;
      }
      setProgress({ done: i + 1, total: rows.length, errors });
    }
    setRunning(false);
    setFinished(true);
  }

  return (
    <div className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <div className="t-page">import</div>
      <div className="t-small muted" style={{ marginTop: 4 }}>goodreads csv</div>

      <Divider />

      <p className="t-small muted" style={{ lineHeight: 1.7 }}>
        upload your goodreads library export (.csv). only "read" shelf rows are imported.
        reviews with text are published; rating-only rows become private ratings.
      </p>

      {!rows.length && (
        <div style={{ marginTop: 'var(--s-3)' }}>
          <input type="file" accept=".csv,text/csv" onChange={onFile} />
        </div>
      )}

      {rows.length > 0 && !running && !finished && (
        <div style={{ marginTop: 'var(--s-3)' }}>
          <div className="upper">{rows.length} rows ready</div>
          <div style={{ marginTop: 'var(--s-2)' }}>
            <button className="btn" onClick={run}>import</button>
          </div>
        </div>
      )}

      {running && (
        <div className="upper loading-dots" style={{ marginTop: 'var(--s-3)' }}>
          importing  {progress.done} / {progress.total}
          {progress.errors > 0 && <>  ·  {progress.errors} errors</>}
        </div>
      )}

      {finished && (
        <div className="upper" style={{ marginTop: 'var(--s-3)' }}>
          done  ·  {progress.done - progress.errors} imported
          {progress.errors > 0 && <>  ·  {progress.errors} failed</>}
        </div>
      )}
    </div>
  );
}

async function importRow(r, userId) {
  const title = r['Title']?.trim();
  const author = r['Author']?.trim();
  if (!title || !author) return;

  const gYear = parseInt(r['Year Published'] || r['Original Publication Year'] || '', 10);
  const isbn = (r['ISBN13'] || r['ISBN'] || '').replace(/[="\s]/g, '') || null;
  const reviewText = (r['My Review'] || '').trim();
  const gStars = parseInt(r['My Rating'] || '0', 10);   // 0-5
  const dateRead = r['Date Read'] || r['Date Added'] || null;

  const { work, edition } = await findOrCreateEdition({
    title,
    author,
    language: 'en',             // goodreads doesn't reliably expose language; assume english import
    original_year: Number.isFinite(gYear) ? gYear : null,
    published_year: Number.isFinite(gYear) ? gYear : null,
    isbn,
  });

  if (reviewText) {
    await supabase.from('reviews').upsert({
      user_id: userId,
      edition_id: edition.id,
      body: reviewText,
      language: detectLanguage(reviewText) || 'en',
      status: 'published',
      published_at: dateRead ? new Date(dateRead).toISOString() : new Date().toISOString(),
    }, { onConflict: 'user_id,edition_id' });
  }

  if (gStars > 0) {
    await supabase.from('ratings').upsert({
      user_id: userId,
      work_id: work.id,
      stars: gStars * 2,
    });
  }
}
