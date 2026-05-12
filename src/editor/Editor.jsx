import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// the writing surface. plaintext-only contenteditable with per-paragraph
// direction handled by unicode-bidi: plaintext. no toolbar, no formatting.
//
// ref exposes { focus() } so the page can focus the editor after draft loads.
const Editor = forwardRef(function Editor({ text, onChange, placeholder = 'begin.' }, fwdRef) {
  const ref = useRef(null);

  // initial text only — subsequent updates flow user → state, not back.
  // (writing into innerText on every render would wreck the caret.)
  useEffect(() => {
    if (ref.current && ref.current.innerText !== text) {
      ref.current.innerText = text;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(fwdRef, () => ({
    focus() {
      const el = ref.current;
      if (!el) return;
      el.focus();
      // place caret at end
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    },
  }), []);

  return (
    <div style={{ position: 'relative' }}>
      {!text && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            color: 'var(--muted)',
            fontStyle: 'italic',
            fontSize: '17px',
            lineHeight: 1.75,
          }}
        >
          {placeholder}
        </div>
      )}

      <div
        ref={ref}
        contentEditable="plaintext-only"
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerText)}
        spellCheck={false}
        style={{
          fontFamily: "'JetBrains Mono', 'Vazirmatn', monospace",
          fontSize: '17px',
          lineHeight: 1.75,
          color: 'var(--ink)',
          outline: 'none',
          minHeight: '55vh',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          unicodeBidi: 'plaintext',
          caretColor: 'var(--accent)',
        }}
      />
    </div>
  );
});

export default Editor;
