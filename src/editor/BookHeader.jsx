import DitheredImage from '../components/DitheredImage.jsx';
import { longDate } from '../lib/time.js';

export default function BookHeader({ edition, work }) {
  if (!edition) return null;
  const today = longDate(new Date().toISOString());
  return (
    <header style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'flex-start' }}>
      <DitheredImage src={edition.cover_url} width={64} height={96} alt="" />
      <div style={{ paddingTop: 2 }}>
        <div className="upper">writing about</div>
        <div
          className="plaintext t-section"
          style={{ marginTop: 6 }}
        >
          {edition.title}
        </div>
        <div className="t-small muted" style={{ marginTop: 4 }}>
          {(work?.author || '—')}{work?.original_year ? `  ·  ${work.original_year}` : ''}
        </div>
        <div className="upper" style={{ marginTop: 6 }}>
          {today}
        </div>
      </div>
    </header>
  );
}
