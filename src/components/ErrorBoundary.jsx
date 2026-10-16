// src/components/ErrorBoundary.jsx — one broken widget shouldn't blank the whole app.
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[ui]', error, info?.componentStack); } // eslint-disable-line no-console
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 520, margin: '12vh auto', padding: 24 }} className="panel">
        <h2 style={{ fontSize: 'var(--fs-xl)', marginBottom: 8 }}>This page hit an error</h2>
        <p style={{ color: 'var(--bone-2)', marginBottom: 16 }}>Your data is safe. Reload the page; if it keeps happening, send us the message below from Support.</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: 'var(--bone-3)', background: 'var(--ink-2)', padding: 12, borderRadius: 6, marginBottom: 16 }}>{String(this.state.error?.message || this.state.error)}</pre>
        <button type="button" className="btn btn-gilt" onClick={() => window.location.reload()}>Reload page</button>
      </div>
    );
  }
}
