import { Component } from 'react';
import { Link } from 'react-router-dom';
import Talisman from './Talisman.jsx';
import Divider from './Divider.jsx';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    if (typeof window !== 'undefined' && window?.console) {
      console.error('[kafka] uncaught', err, info);
    }
  }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="col" style={{ padding: 'var(--s-6) 0', textAlign: 'center' }}>
        <Talisman name="black-hole" size={220} breathe />
        <div style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)' }}>
          the page broke. nothing was lost.
        </div>
        <Divider />
        <div className="upper">
          <Link to="/" style={{ color: 'var(--muted)' }}>home</Link>
          {'  ·  '}
          <button
            onClick={() => window.location.reload()}
            style={{ color: 'var(--muted)', letterSpacing: 'var(--tr-upper)' }}
          >
            reload
          </button>
        </div>
      </div>
    );
  }
}
