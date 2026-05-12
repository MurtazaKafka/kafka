import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../store/session.js';
import Divider from '../components/Divider.jsx';

const LANG_OPTIONS = ['en', 'fa', 'prs', 'ar', 'ps', 'fr', 'de', 'es', 'ru', 'tr', 'ja', 'zh'];

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useSession();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [langs, setLangs] = useState([]);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name || '');
    setBio(profile.bio || '');
    setLangs(profile.languages || []);
  }, [profile]);

  if (!user || !profile) {
    return (
      <div className="col" style={{ padding: 'var(--s-5) 0', textAlign: 'center', color: 'var(--muted)' }}>
        sign in first.
      </div>
    );
  }

  async function save(e) {
    e.preventDefault();
    await supabase.from('profiles').update({
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      languages: langs,
    }).eq('id', user.id);
    await refreshProfile();
    setSavedAt(Date.now());
  }

  function toggleLang(l) {
    setLangs((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
  }

  const input = {
    width: '100%', border: 0, borderBottom: '1px solid var(--hairline)',
    padding: '6px 0', background: 'transparent', outline: 'none',
  };

  return (
    <form onSubmit={save} className="col" style={{ padding: 'var(--s-4) 0 var(--s-6)' }}>
      <div className="t-page">settings</div>

      <Divider />

      <div style={{ display: 'grid', gap: 'var(--s-3)' }}>
        <div>
          <label className="upper">username</label>
          <div style={{ padding: '6px 0', color: 'var(--muted)' }}>@{profile.username}</div>
        </div>

        <div>
          <label className="upper">display name</label>
          <input className="plaintext" style={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div>
          <label className="upper">bio</label>
          <textarea
            className="plaintext"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            style={{ ...input, resize: 'vertical', unicodeBidi: 'plaintext' }}
          />
        </div>

        <div>
          <label className="upper">languages you read</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {LANG_OPTIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleLang(l)}
                className="upper"
                style={{
                  padding: '6px 10px',
                  border: '1px solid',
                  borderColor: langs.includes(l) ? 'var(--ink)' : 'var(--hairline)',
                  color: langs.includes(l) ? 'var(--ink)' : 'var(--muted)',
                  letterSpacing: 'var(--tr-upper)',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Divider />

      <div style={{ display: 'flex', gap: 'var(--s-2)', alignItems: 'center' }}>
        <button type="submit" className="btn">save</button>
        {savedAt && <span className="upper">saved  ✦</span>}
        <button type="button" className="btn" onClick={signOut} style={{ marginLeft: 'auto' }}>sign out</button>
      </div>
    </form>
  );
}
