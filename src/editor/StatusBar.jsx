import { detectScripts } from '../lib/bidi.js';

const MOD = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? '⌘' : 'ctrl';

export default function StatusBar({ text, saveState, onPublish, onUnpublish, status }) {
  const hasText = !!text.trim();
  const words = hasText ? text.trim().split(/\s+/).length : 0;
  const scripts = detectScripts(text).join('  ·  ');
  const canPublish = hasText;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        background: 'var(--paper)',
        borderTop: '1px solid var(--hairline)',
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 'var(--col)',
          margin: '0 auto',
          padding: '10px var(--s-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'var(--t-micro)',
          color: 'var(--muted)',
          letterSpacing: 'var(--tr-upper)',
          textTransform: 'uppercase',
        }}
      >
        <div>
          {words} {words === 1 ? 'word' : 'words'}
          {scripts && <>  ·  {scripts}</>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
          <span aria-live="polite">{renderSave(saveState, hasText)}</span>
          {status === 'published' ? (
            <button className="btn" onClick={onUnpublish}>unpublish</button>
          ) : (
            <button
              className="btn btn-accent"
              onClick={onPublish}
              disabled={!canPublish}
              title={`publish (${MOD} + enter)`}
            >
              publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function renderSave(s, hasText) {
  if (s === 'saving') return 'saving ...';
  if (s === 'saved')  return 'saved  ✦';
  if (s === 'error')  return 'save failed';
  // idle with content: a single breathing sparkle instead of em dash.
  return hasText ? <span className="wordmark-sparkle">✦</span> : '';
}
