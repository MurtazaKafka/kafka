// openlibrary search — port of the prototype's debounced-fetch-with-abort pattern.
// pattern kept verbatim; return shape rewritten to match the new schema.

const ENDPOINT = 'https://openlibrary.org/search.json';
const COVER = (id, size = 'M') => `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;

// memoized by query string; abort-aware.
const cache = new Map();

// returns { results, abort } — caller calls abort() on cleanup.
// the promise resolves to a normalized result array, or null if aborted.
export function searchBooks(query, { limit = 8 } = {}) {
  const key = `${query}|${limit}`;
  if (cache.has(key)) return { results: cache.get(key), abort: () => {} };

  const controller = new AbortController();
  const url = `${ENDPOINT}?q=${encodeURIComponent(query)}&limit=${limit}&fields=key,title,author_name,first_publish_year,isbn,cover_i,language`;

  const p = fetch(url, { signal: controller.signal })
    .then((r) => r.ok ? r.json() : null)
    .then((j) => j ? normalize(j.docs || []) : [])
    .catch((e) => {
      if (e.name === 'AbortError') return null;
      return [];
    });

  cache.set(key, p);
  p.then((v) => { if (v === null) cache.delete(key); });

  return { results: p, abort: () => controller.abort() };
}

function normalize(docs) {
  return docs.map((d) => ({
    openlibrary_key: d.key,                                    // e.g. "/works/OL1234W"
    title: d.title || '',
    author: (d.author_name && d.author_name[0]) || 'unknown',
    original_year: d.first_publish_year ?? null,
    isbn: d.isbn?.[0] ?? null,
    cover_url: d.cover_i ? COVER(d.cover_i, 'M') : null,
    language: (d.language && d.language[0]) || null,           // 3-letter ISO
  }));
}
