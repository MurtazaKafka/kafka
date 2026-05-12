// kafka wordmark: ✦ · k a f k a · ✦
// twinkling sparkles, staggered. renders at the size you pass.
// size 22 is the landing-page hero; size 14 is the in-editor signature.

export default function Wordmark({ size = 22, muted = false }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font)',
        fontSize: size,
        fontWeight: 500,
        letterSpacing: 'var(--tr-wordmark)',
        color: muted ? 'var(--muted)' : 'var(--ink)',
        textAlign: 'center',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
      aria-label="kafka"
    >
      <span className="wordmark-sparkle" aria-hidden>✦</span>
      <span style={{ opacity: 0.5 }} aria-hidden> · </span>
      k a f k a
      <span style={{ opacity: 0.5 }} aria-hidden> · </span>
      <span className="wordmark-sparkle delayed" aria-hidden>✦</span>
    </div>
  );
}
