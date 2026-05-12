import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import Editor from '../editor/Editor.jsx';
import BookHeader from '../editor/BookHeader.jsx';
import StatusBar from '../editor/StatusBar.jsx';
import { useDraft } from '../editor/useDraft.js';
import Wordmark from '../components/Wordmark.jsx';
import Divider from '../components/Divider.jsx';

export default function Write() {
  const { edition_id } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useSession();

  const [edition, setEdition] = useState(null);
  const [work, setWork] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data } = await supabase
        .from('editions')
        .select('*, work:works(*)')
        .eq('id', edition_id)
        .maybeSingle();
      if (!live) return;
      if (!data) { setMissing(true); return; }
      setEdition(data);
      setWork(data.work);
    })();
    return () => { live = false; };
  }, [edition_id]);

  const draft = useDraft(edition_id, user?.id);
  const editorRef = useRef(null);

  // focus the editor once the draft row is loaded (avoids focus-before-hydrate).
  useEffect(() => {
    if (draft.loaded) editorRef.current?.focus();
  }, [draft.loaded]);

  const handlePublish = useCallback(async () => {
    const row = await draft.publish();
    if (row) navigate(`/edition/${edition_id}?rate=1`);
  }, [draft, navigate, edition_id]);

  // cmd/ctrl+enter → publish (if there's content and we're not already published)
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (draft.text.trim() && draft.review?.status !== 'published') {
          e.preventDefault();
          handlePublish();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePublish, draft.text, draft.review?.status]);

  if (!loading && !user) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center' }}>
        <Wordmark size={22} />
        <div className="muted" style={{ marginTop: 'var(--s-4)' }}>sign in to write.</div>
        <div style={{ marginTop: 'var(--s-2)' }}>
          <a className="btn" href="/auth">sign in</a>
        </div>
      </div>
    );
  }

  if (user && !profile && !loading) {
    return <Navigate to="/auth/username" replace />;
  }

  if (missing) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0' }}>
        <div style={{ color: 'var(--muted)' }}>no edition here.</div>
      </div>
    );
  }

  return (
    <>
      <div className="col" style={{ padding: 'var(--s-4) 0 120px' }}>
        <div style={{ marginBottom: 'var(--s-4)' }}>
          <Wordmark size={14} muted />
        </div>

        <BookHeader edition={edition} work={work} />

        <Divider />

        <div>
          {draft.loaded && (
            <Editor ref={editorRef} text={draft.text} onChange={draft.setText} />
          )}
        </div>
      </div>

      <StatusBar
        text={draft.text}
        saveState={draft.saveState}
        status={draft.review?.status}
        onPublish={handlePublish}
        onUnpublish={draft.unpublish}
      />
    </>
  );
}
