import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';

// owner-only inline actions for a published or draft review.
// edit routes to /write/:edition_id (the editor handles draft + published).
// delete asks once, then hard-deletes the review row.
//
// `onDeleted` fires after a successful delete so the parent can drop the row.
export default function ReviewActions({ review, onDeleted }) {
  const { user } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (!user || !review || review.user_id !== user.id) return null;

  async function del() {
    setBusy(true);
    const { error } = await supabase.from('reviews').delete().eq('id', review.id);
    setBusy(false);
    if (error) return;
    if (onDeleted) onDeleted(review.id);
    else navigate(0);
  }

  return (
    <div
      className="upper"
      style={{ marginTop: 6, display: 'flex', gap: 14, alignItems: 'baseline' }}
    >
      <Link to={`/write/${review.edition_id}`} style={{ color: 'var(--muted)' }}>edit</Link>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{ color: 'var(--muted)', letterSpacing: 'var(--tr-upper)' }}
        >
          delete
        </button>
      ) : (
        <>
          <span style={{ color: 'var(--muted)' }}>delete?</span>
          <button
            onClick={del}
            disabled={busy}
            style={{ color: 'var(--accent)', letterSpacing: 'var(--tr-upper)' }}
          >
            {busy ? 'deleting…' : 'yes'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            style={{ color: 'var(--muted)', letterSpacing: 'var(--tr-upper)' }}
          >
            no
          </button>
        </>
      )}
    </div>
  );
}
