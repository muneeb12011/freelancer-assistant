// src/pages/Network.jsx — people you're connected with, requests, and people you may know.
// Connecting opens a conversation for both of you, and lets you invite each other to squads.
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiMessageSquare, FiUserPlus, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Navbar';
import Badges from '../components/Badges';
import { FreelancerLine } from '../components/ReportCard';
import { ago } from '../lib/format';
import '../styles/Network.css';

function PersonRow({ p, children, note }) {
  return (
    <li className="nw-row">
      <Link to={`/profile/${p._id}`} className="person">
        <Avatar user={p} size={44} />
        <span><strong>{p.name}<Badges badges={p.badges} size={12} /></strong><small>{p.title || 'Aurelance member'}{p.location ? ` · ${p.location}` : ''}</small></span>
      </Link>
      <div className="nw-row-mid">{note || <FreelancerLine rep={p.reputation} />}</div>
      <div className="nw-row-actions">{children}</div>
    </li>
  );
}

export default function Network() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = ['connected', 'requests', 'find'].includes(params.get('tab')) ? params.get('tab') : 'connected';
  const [contacts, setContacts] = useState(null);
  const [connIds, setConnIds] = useState({});
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [requested, setRequested] = useState(new Set());

  const load = useCallback(async () => {
    try {
      const [c, list, inc, out, sug] = await Promise.all([
        api.get('/messages/contacts'), api.get('/connections'),
        api.get('/connections/requests/incoming'), api.get('/connections/requests/sent'),
        api.get('/connections/suggestions').catch(() => ({ suggestions: [] })),
      ]);
      setContacts(c.contacts);
      setConnIds(Object.fromEntries((list.connections || []).filter((x) => x.linkedUser).map((x) => [String(x.linkedUser), x._id])));
      setIncoming(inc.requests); setSent(out.requests); setSuggestions(sug.suggestions || []);
    } catch (e) { toast.err(e); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return undefined; }
    const t = setTimeout(() => api.get(`/connections/search?q=${encodeURIComponent(q.trim())}`).then((r) => setResults(r.users || [])).catch(() => setResults([])), 300);
    return () => clearTimeout(t);
  }, [q]);

  const connect = async (p) => {
    try { const r = await api.post('/connections/request', { userId: p._id }); setRequested((s) => new Set(s).add(String(p._id))); toast.ok(r.connected ? `Connected with ${p.name}` : 'Request sent'); if (r.connected) load(); } catch (e) { toast.err(e); }
  };
  const answer = async (r, accept) => {
    try { await api.post(`/connections/request/${r._id}/${accept ? 'accept' : 'reject'}`); toast.ok(accept ? `Connected with ${r.from.name} — your conversation is in Messages` : 'Request declined'); load(); } catch (e) { toast.err(e); }
  };
  const cancel = async (r) => { try { await api.delete(`/connections/request/${r._id}`); load(); } catch (e) { toast.err(e); } };
  const disconnect = async (p) => {
    if (!window.confirm(`Disconnect from ${p.name}? It’s removed for both of you.`)) return;
    try { await api.delete(`/connections/${connIds[String(p._id)]}`); toast.ok('Disconnected'); load(); } catch (e) { toast.err(e); }
  };

  const connectedIds = new Set((contacts || []).map((c) => String(c._id)));
  const pendingIds = new Set([...sent.map((s) => String(s.userId || s.to?._id)), ...incoming.map((r) => String(r.from?._id)), ...requested]);
  const findList = results ?? suggestions;

  return (
    <div className="nw page-narrow">
      <header className="ledger-title">
        <h1>Network</h1>
        <p>People you’ve connected with. Connecting opens a conversation for both of you, and lets you form squads together.</p>
      </header>
      <nav className="tabs" role="tablist">
        {[['connected', 'Connected', contacts?.length], ['requests', 'Requests', incoming.length], ['find', 'Find people']].map(([id, l, n]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setParams(id === 'connected' ? {} : { tab: id })}>
            {l}{n > 0 && <span className={id === 'requests' ? 'count-pill' : 'ct-n'}>{n}</span>}
          </button>
        ))}
      </nav>

      {tab === 'connected' && (!contacts ? <span className="spinner" /> : contacts.length ? (
        <ul className="nw-list">
          {contacts.map((p) => (
            <PersonRow key={p._id} p={p}>
              <Link className="btn btn-sm" to={`/messages?user=${p._id}`}><FiMessageSquare /> Message</Link>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => disconnect(p)}>Disconnect</button>
            </PersonRow>
          ))}
        </ul>
      ) : <div className="empty"><h3>No connections yet</h3><p>Connect with people you’ve worked with or want to team up with.</p><button type="button" className="btn" onClick={() => setParams({ tab: 'find' })}>Find people</button></div>)}

      {tab === 'requests' && (
        <div className="stack">
          <section>
            <h2 className="nw-h">Asking to connect with you</h2>
            {incoming.length ? (
              <ul className="nw-list">
                {incoming.map((r) => (
                  <PersonRow key={r._id} p={r.from} note={<span className="muted-sm">{r.message ? `“${r.message}” · ` : ''}{ago(r.createdAt)}</span>}>
                    <button type="button" className="btn btn-sm btn-gilt" onClick={() => answer(r, true)}><FiCheck /> Accept</button>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => answer(r, false)}>Decline</button>
                  </PersonRow>
                ))}
              </ul>
            ) : <p className="muted-sm">No requests waiting.</p>}
          </section>
          <section>
            <h2 className="nw-h">You asked</h2>
            {sent.length ? (
              <ul className="nw-list">
                {sent.map((r) => r.to && (
                  <PersonRow key={r._id} p={r.to} note={<span className="muted-sm">Sent {ago(r.createdAt)}</span>}>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => cancel(r)}>Cancel</button>
                  </PersonRow>
                ))}
              </ul>
            ) : <p className="muted-sm">Nothing pending.</p>}
          </section>
        </div>
      )}

      {tab === 'find' && (
        <>
          <label className="jb-search nw-search">
            <FiSearch aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, title or skill" aria-label="Search people" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Clear"><FiX /></button>}
          </label>
          <p className="muted-sm nw-hint">{results ? `${results.length} found` : 'People with skills close to yours'}</p>
          <ul className="nw-list">
            {findList.map((p) => (
              <PersonRow key={p._id} p={p}>
                {connectedIds.has(String(p._id)) ? <span className="chip chip-sage">Connected</span>
                  : pendingIds.has(String(p._id)) ? <span className="chip">Requested</span>
                    : <button type="button" className="btn btn-sm" onClick={() => connect(p)}><FiUserPlus /> Connect</button>}
              </PersonRow>
            ))}
          </ul>
          {!findList.length && <p className="muted-sm">{results ? 'Nobody matches that search.' : 'Add skills to your profile to see suggestions.'}</p>}
        </>
      )}
    </div>
  );
}
