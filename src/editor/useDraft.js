import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { detectLanguage } from '../lib/bidi.js';

// load the current user's review for this edition (draft or published).
// autosave debounces writes to 800ms after the last change.
// publish/unpublish flips status + published_at.

const AUTOSAVE_MS = 800;

export function useDraft(editionId, userId) {
  const [review, setReview] = useState(null);     // row or null
  const [text, setText] = useState('');
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [loaded, setLoaded] = useState(false);

  const lastSavedRef = useRef('');
  const timerRef = useRef(null);

  // initial load
  useEffect(() => {
    let live = true;
    if (!editionId || !userId) return;
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('edition_id', editionId)
        .maybeSingle();
      if (!live) return;
      setReview(data ?? null);
      setText(data?.body ?? '');
      lastSavedRef.current = data?.body ?? '';
      setLoaded(true);
    })();
    return () => { live = false; };
  }, [editionId, userId]);

  // autosave on text change
  useEffect(() => {
    if (!loaded || !editionId || !userId) return;
    if (text === lastSavedRef.current) return;

    clearTimeout(timerRef.current);
    setSaveState('saving');
    timerRef.current = setTimeout(async () => {
      const language = detectLanguage(text);
      const payload = {
        user_id: userId,
        edition_id: editionId,
        body: text,
        language,
        status: review?.status ?? 'draft',
      };

      const { data, error } = await supabase
        .from('reviews')
        .upsert(payload, { onConflict: 'user_id,edition_id' })
        .select()
        .single();

      if (error) {
        setSaveState('error');
        return;
      }
      lastSavedRef.current = text;
      setReview(data);
      setSaveState('saved');
    }, AUTOSAVE_MS);

    return () => clearTimeout(timerRef.current);
  }, [text, loaded, editionId, userId, review?.status]);

  async function publish() {
    if (!review || !text.trim()) return null;
    // ensure latest body is written before publishing
    clearTimeout(timerRef.current);
    const { data, error } = await supabase
      .from('reviews')
      .update({
        body: text,
        language: detectLanguage(text),
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', review.id)
      .select()
      .single();
    if (error) { setSaveState('error'); return null; }
    lastSavedRef.current = text;
    setReview(data);
    setSaveState('saved');
    return data;
  }

  async function unpublish() {
    if (!review) return;
    const { data, error } = await supabase
      .from('reviews')
      .update({ status: 'draft', published_at: null })
      .eq('id', review.id)
      .select()
      .single();
    if (error) return;
    setReview(data);
  }

  return { review, text, setText, saveState, publish, unpublish, loaded };
}
