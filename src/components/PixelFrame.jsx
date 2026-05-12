// pixel-drawn frame. a punctuation mark. use sparingly:
// landing's featured review, feed empty state, manual-add form, modals.
// never on feed items, the editor, or around every review.

export default function PixelFrame({ children, padding, style }) {
  return (
    <div className="pixel-frame" style={padding ? { padding, ...style } : style}>
      <span className="pixel-frame-corner tl" aria-hidden>+</span>
      <span className="pixel-frame-corner tr" aria-hidden>+</span>
      <span className="pixel-frame-corner bl" aria-hidden>+</span>
      <span className="pixel-frame-corner br" aria-hidden>+</span>
      <div className="pixel-frame-inner">{children}</div>
    </div>
  );
}
