// · · · · · · · · · — the real section divider in kafka.
// replaces <hr> and 1px hairlines between sections.
// optional label sits centered inside the dots row.

export default function Divider({ label, count = 15 }) {
  const dots = '·  '.repeat(count).trim();
  if (!label) {
    return <div className="divider" aria-hidden>{dots}</div>;
  }
  return (
    <div className="divider" aria-hidden>
      {'·  '.repeat(Math.max(3, (count - label.length) >> 1)).trim()}
      <span style={{ margin: '0 0.8em' }}>{label}</span>
      {'·  '.repeat(Math.max(3, (count - label.length) >> 1)).trim()}
    </div>
  );
}
