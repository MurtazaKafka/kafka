// work/edition helpers. one public function: findOrCreateEdition(input).
// used by search (when user clicks "write about this") and by import.

import { supabase } from './supabase.js';

// normalize openlibrary's 3-letter codes to the 2-letter codes we store.
// this is not exhaustive — openlibrary data quality is uneven. unknowns pass through.
const LANG_MAP = {
  eng: 'en', fre: 'fr', fra: 'fr', ger: 'de', deu: 'de', spa: 'es',
  ita: 'it', por: 'pt', rus: 'ru', chi: 'zh', zho: 'zh', jpn: 'ja',
  kor: 'ko', ara: 'ar', per: 'fa', fas: 'fa', prs: 'prs', pus: 'ps',
  tur: 'tr', heb: 'he', hin: 'hi', urd: 'ur',
};

export function normalizeLang(code) {
  if (!code) return null;
  const c = code.toLowerCase();
  return LANG_MAP[c] ?? (c.length === 2 ? c : null);
}

// idempotent upsert of a work, then an edition. returns { work, edition }.
// input shape:
//   { openlibrary_key?, isbn?, title, author, original_year?, language, translator?, publisher?, published_year?, cover_url? }
export async function findOrCreateEdition(input) {
  const lang = normalizeLang(input.language) || 'en';

  // find or create work by openlibrary_key, falling back to (title, author).
  let work = null;
  if (input.openlibrary_key) {
    const { data } = await supabase
      .from('works')
      .select('*')
      .eq('openlibrary_key', input.openlibrary_key)
      .maybeSingle();
    work = data;
  }
  if (!work) {
    const { data } = await supabase
      .from('works')
      .select('*')
      .eq('title', input.title)
      .eq('author', input.author)
      .maybeSingle();
    work = data;
  }
  if (!work) {
    const { data, error } = await supabase
      .from('works')
      .insert({
        openlibrary_key: input.openlibrary_key ?? null,
        title: input.title,
        author: input.author,
        original_year: input.original_year ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    work = data;
  }

  // find or create edition. key is isbn if available, else (work_id, language).
  let edition = null;
  if (input.isbn) {
    const { data } = await supabase
      .from('editions')
      .select('*')
      .eq('isbn', input.isbn)
      .maybeSingle();
    edition = data;
  }
  if (!edition) {
    const { data } = await supabase
      .from('editions')
      .select('*')
      .eq('work_id', work.id)
      .eq('language', lang)
      .limit(1)
      .maybeSingle();
    edition = data;
  }
  if (!edition) {
    const { data, error } = await supabase
      .from('editions')
      .insert({
        work_id: work.id,
        isbn: input.isbn ?? null,
        title: input.title,
        language: lang,
        translator: input.translator ?? null,
        publisher: input.publisher ?? null,
        published_year: input.published_year ?? input.original_year ?? null,
        cover_url: input.cover_url ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    edition = data;
  }

  return { work, edition };
}
