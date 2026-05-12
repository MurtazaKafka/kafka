import { Link } from 'react-router-dom';
import Talisman from '../components/Talisman.jsx';
import Divider from '../components/Divider.jsx';

export default function NotFound() {
  return (
    <div className="col" style={{ padding: 'var(--s-6) 0', textAlign: 'center' }}>
      <Talisman name="black-hole" size={280} breathe />
      <div style={{ marginTop: 'var(--s-4)', fontSize: 'var(--t-body)', color: 'var(--ink-soft)' }}>
        nothing at this address.
      </div>
      <Divider />
      <div className="upper">
        <Link to="/" style={{ color: 'var(--muted)' }}>home</Link>
        {'  ·  '}
        <Link to="/search" style={{ color: 'var(--muted)' }}>search</Link>
      </div>
    </div>
  );
}
