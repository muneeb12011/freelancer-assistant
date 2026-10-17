// src/pages/Messages.jsx — inbox + thread.
//   /messages                 inbox
//   /messages/:id             a thread
//   /messages?user=<userId>   open (or start) a thread with someone
// New messages arrive by polling (4s in an open thread, 15s for the list) — works on serverless hosting.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiPaperclip, FiSend, FiMoreHorizontal, FiSearch, FiX, FiFileText, FiDownload, FiArchive } from 'react-icons/fi';
import api, { API_BASE, errorMessage, tokenStore } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Navbar';
import Badges from '../components/Badges';
import '../styles/Messages.css';

const MAX_FILE = 2 * 1024 * 1024;

const timeOf = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const dayOf = (d) => {
  const x = new Date(d); const now = new Date();
  const diff = Math.floor((new Date(now.toDateString()) - new Date(x.toDateString())) / 86400e3);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return x.toLocaleDateString('en-US', { weekday: diff < 7 ? 'long' : undefined, month: 'short', day: 'numeric', year: x.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};
const shortWhen = (d) => {
  if (!d) return '';
  const x = new Date(d); const now = new Date();
  if (x.toDateString() === now.toDateString()) return timeOf(x);
  if (now - x < 6 * 86400e3) return x.toLocaleDateString('en-US', { weekday: 'short' });
  return x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const fileSize = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

/** Fetch an attachment with auth and open/download it. */
async function openAttachment(att, download = false) {
  const res = await fetch(`${API_BASE}/messages/attachments/${att.id}${download ? '?download=1' : ''}`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
  if (!res.ok) throw new Error('Could not open the file');
  const url = URL.createObjectURL(await res.blob());
  if (download || !/^image\//.test(att.type)) {
    const a = Object.assign(document.createElement('a'), { href: url, download: att.name });
    document.body.appendChild(a); a.click(); a.remove();
  } else window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function AttachmentImage({ att }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let url; let alive = true;
    fetch(`${API_BASE}/messages/attachments/${att.id}`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } })
      .then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b && alive) { url = URL.createObjectURL(b); setSrc(url); } }).catch(() => {});
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [att.id]);
  return src ? <img src={src} alt={att.name} className="ms-img" onClick={() => openAttachment(att)} /> : <span className="ms-img ms-img-loading" />;
}

/* ── Inbox list ───────────────────────────────────────────── */
function Inbox({ items, activeId, q, setQ, archived, setArchived, loading, contacts }) {
  const fresh = (contacts || []).filter((c) => !c.hasConversation);
  return (
    <aside className="ms-list" aria-label="Conversations">
      <header className="ms-list-head">
        <h1>Messages</h1>
        <div className="ms-list-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!archived} className={!archived ? 'is-on' : ''} onClick={() => setArchived(false)}>Inbox</button>
          <button type="button" role="tab" aria-selected={archived} className={archived ? 'is-on' : ''} onClick={() => setArchived(true)}>Archived</button>
        </div>
        <label className="ms-search">
          <FiSearch aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people or messages" aria-label="Search conversations" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><FiX /></button>}
        </label>
      </header>
      {!archived && !q && fresh.length > 0 && (
        <div className="ms-contacts" aria-label="Connections you haven’t messaged">
          <p>Your connections</p>
          <div className="ms-contacts-row">
            {fresh.slice(0, 12).map((c) => (
              <Link key={c._id} to={`/messages?user=${c._id}`} className="ms-contact" title={`Message ${c.name}`}>
                <Avatar user={c} size={40} />
                <span>{c.name.split(' ')[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      <ul>
        {items.map((c) => (
          <li key={c._id}>
            <Link to={`/messages/${c._id}`} className={`ms-item${c._id === activeId ? ' is-active' : ''}${c.unread ? ' is-unread' : ''}`}>
              <Avatar user={c.with} size={40} />
              <span className="ms-item-body">
                <span className="ms-item-top">
                  <strong>{c.with.name}<Badges badges={c.with.badges} size={12} /></strong>
                  <time>{shortWhen(c.lastMessage?.at)}</time>
                </span>
                <span className="ms-item-preview">
                  {c.lastMessage?.mine && 'You: '}{c.lastMessage?.text || 'No messages yet'}
                </span>
              </span>
              {c.unread > 0 && <span className="count-pill" aria-label={`${c.unread} unread`}>{c.unread}</span>}
            </Link>
          </li>
        ))}
        {!loading && !items.length && (
          <li className="ms-empty-list">
            {q ? 'No conversations match that search.' : archived ? 'Nothing archived.' : (
              <>No messages yet. Start one from someone’s profile, a job post, or <Link to="/connections">your network</Link>.</>
            )}
          </li>
        )}
      </ul>
    </aside>
  );
}

/* ── Thread ───────────────────────────────────────────────── */
function Thread({ id, onActivity }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { refresh } = useUnread();
  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const latest = useRef(null);

  const scrollDown = (smooth = true) => setTimeout(() => endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' }), 30);

  const load = useCallback(async () => {
    try {
      const [m, msgs] = await Promise.all([api.get(`/messages/conversations/${id}`), api.get(`/messages/conversations/${id}/messages`)]);
      setMeta(m.conversation); setMessages(msgs.messages); setHasMore(msgs.hasMore);
      latest.current = msgs.messages.at(-1)?.createdAt || null;
      scrollDown(false); refresh(); onActivity();
    } catch (e) { toast.err(e); navigate('/messages', { replace: true }); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setMeta(null); setMessages([]); load(); }, [load]);

  // Poll for new messages while visible.
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await api.get(`/messages/conversations/${id}/messages${latest.current ? `?after=${encodeURIComponent(latest.current)}` : ''}`);
        if (r.messages.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m._id));
            return [...prev, ...r.messages.filter((m) => !seen.has(m._id))];
          });
          latest.current = r.messages.at(-1).createdAt;
          scrollDown(); refresh(); onActivity();
        }
      } catch { /* offline — next tick */ }
    }, 4000);
    return () => clearInterval(t);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOlder = async () => {
    try {
      const r = await api.get(`/messages/conversations/${id}/messages?before=${encodeURIComponent(messages[0].createdAt)}`);
      setMessages((prev) => [...r.messages, ...prev]); setHasMore(r.hasMore);
    } catch (e) { toast.err(e); }
  };

  const pickFile = (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE) { toast.err('Files can be up to 2 MB.'); return; }
    setFile(f);
  };

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if ((!body && !file) || sending) return;
    setSending(true);
    try {
      let attachment;
      if (file) {
        const data = await new Promise((resolve, reject) => {
          const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
        });
        attachment = { name: file.name, type: file.type || 'application/octet-stream', data };
      }
      const r = await api.post(`/messages/conversations/${id}/messages`, { text: body, attachment }, { timeout: 30000 });
      setMessages((prev) => [...prev, r.message]);
      latest.current = r.message.createdAt;
      setText(''); setFile(null); scrollDown(); onActivity();
    } catch (err) { toast.err(err); }
    setSending(false);
  };

  const unsend = async (m) => {
    try { await api.delete(`/messages/${m._id}`); setMessages((prev) => prev.map((x) => (x._id === m._id ? { ...x, deleted: true, text: '', attachment: null } : x))); } catch (e) { toast.err(e); }
  };

  const action = async (kind) => {
    setMenu(false);
    const uid = meta?.with?._id;
    try {
      if (kind === 'archive') { await api.post(`/messages/conversations/${id}/archive`); toast.ok('Archived'); onActivity(); navigate('/messages'); }
      if (kind === 'block') { const r = await api.post(`/messages/block/${uid}`); toast.ok(r.message); load(); }
      if (kind === 'unblock') { const r = await api.delete(`/messages/block/${uid}`); toast.ok(r.message); load(); }
      if (kind === 'report') {
        const reason = window.prompt(`What happened with ${meta.with.name}? A person on our team will review it.`);
        if (reason === null) return;
        const r = await api.post(`/messages/report/${uid}`, { reason, conversationId: id });
        toast.ok(r.message);
      }
    } catch (e) { toast.err(e); }
  };

  const grouped = useMemo(() => {
    const out = []; let day = '';
    messages.forEach((m) => {
      const d = dayOf(m.createdAt);
      if (d !== day) { out.push({ day: d, key: `d-${m._id}` }); day = d; }
      out.push(m);
    });
    return out;
  }, [messages]);

  const lastMine = [...messages].reverse().find((m) => m.mine);

  if (!meta) return <section className="ms-thread ms-thread-loading"><span className="spinner" /></section>;
  const other = meta.with;

  return (
    <section className="ms-thread" aria-label={`Conversation with ${other.name}`}>
      <header className="ms-thread-head">
        <Link to="/messages" className="ms-back" aria-label="Back to inbox"><FiArrowLeft /></Link>
        {other._id ? (
          <Link to={`/profile/${other._id}`} className="ms-person">
            <Avatar user={other} size={38} />
            <span><strong>{other.name}<Badges badges={other.badges} size={13} /></strong><small>{other.title || 'Freelancer'}{other.location ? `, ${other.location}` : ''}</small></span>
          </Link>
        ) : <span className="ms-person"><strong>{other.name}</strong></span>}
        <div className="ms-menu-wrap">
          <button type="button" className="ms-icon" onClick={() => setMenu((v) => !v)} aria-label="Conversation options" aria-expanded={menu}><FiMoreHorizontal /></button>
          {menu && (
            <div className="menu ms-menu" role="menu">
              <button type="button" role="menuitem" className="menu-item" onClick={() => action('archive')}><FiArchive /> Archive</button>
              {other._id && (meta.blockedByMe
                ? <button type="button" role="menuitem" className="menu-item" onClick={() => action('unblock')}>Unblock {other.name.split(' ')[0]}</button>
                : <button type="button" role="menuitem" className="menu-item" onClick={() => action('block')}>Block {other.name.split(' ')[0]}</button>)}
              {other._id && <button type="button" role="menuitem" className="menu-item menu-danger" onClick={() => action('report')}>Report</button>}
            </div>
          )}
        </div>
      </header>

      <div className="ms-scroll">
        {hasMore && <button type="button" className="btn btn-sm btn-ghost ms-older" onClick={loadOlder}>Show earlier messages</button>}
        {!messages.length && <p className="ms-first">This is the start of your conversation with {other.name.split(' ')[0]}. Say what you need and when — clear first messages get faster replies.</p>}
        {grouped.map((m) => {
          if (m.day) return <div key={m.key} className="ms-day"><span>{m.day}</span></div>;
          if (m.kind === 'system') return <p key={m._id} className="ms-system">{m.text}{/contract|milestone|signed|trial|change/i.test(m.text) && <> <Link to="/contracts" className="ms-system-link">Open contracts</Link></>}</p>;
          return (
            <div key={m._id} className={`ms-msg${m.mine ? ' is-mine' : ''}`}>
              <div className="ms-bubble">
                {m.deleted ? <em className="ms-deleted">Message removed</em> : (
                  <>
                    {m.attachment && (/^image\//.test(m.attachment.type)
                      ? <AttachmentImage att={m.attachment} />
                      : (
                        <button type="button" className="ms-file" onClick={() => openAttachment(m.attachment, true).catch((e) => toast.err(e))}>
                          <FiFileText aria-hidden="true" /><span><strong>{m.attachment.name}</strong><small>{fileSize(m.attachment.size)}</small></span><FiDownload aria-hidden="true" />
                        </button>
                      ))}
                    {m.text && <p>{m.text}</p>}
                  </>
                )}
              </div>
              {!m.mine && !m.deleted && m.flags?.length > 0 && (
                <div className="ms-caution" role="note">
                  <strong>Careful — this message {m.flags.map((f) => f.label.charAt(0).toLowerCase() + f.label.slice(1)).join(' and ')}.</strong>
                  <span>{m.flags[0].tip}</span>
                </div>
              )}
              {m.mine && !m.deleted && m.flags?.length > 0 && <p className="ms-caution-mine">The other person sees a safety note on this message.</p>}
              <div className="ms-meta">
                <time dateTime={m.createdAt}>{timeOf(m.createdAt)}</time>
                {m.mine && lastMine?._id === m._id && <span>{m.readAt ? 'Seen' : 'Sent'}</span>}
                {m.mine && !m.deleted && <button type="button" className="ms-unsend" onClick={() => unsend(m)}>Unsend</button>}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {meta.canSend ? (
        <form className="ms-compose" onSubmit={send}>
          {file && (
            <div className="ms-pending-file"><FiPaperclip /> {file.name} <small>{fileSize(file.size)}</small>
              <button type="button" onClick={() => setFile(null)} aria-label="Remove file"><FiX /></button>
            </div>
          )}
          <div className="ms-compose-row">
            <button type="button" className="ms-icon" onClick={() => fileRef.current?.click()} aria-label="Attach a file"><FiPaperclip /></button>
            <input ref={fileRef} type="file" hidden onChange={pickFile} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" />
            <textarea
              value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={5000}
              placeholder={`Write to ${other.name.split(' ')[0]}…`} aria-label="Message"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button type="submit" className="btn btn-gilt ms-send" disabled={sending || (!text.trim() && !file)} aria-label="Send">
              {sending ? <span className="spinner" /> : <FiSend />}
            </button>
          </div>
        </form>
      ) : (
        <p className="ms-cant">{meta.blockedByMe ? 'You blocked this person. Unblock them from the menu to send messages.' : 'You can’t reply to this conversation.'}</p>
      )}
    </section>
  );
}

export default function Messages() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [archived, setArchived] = useState(false);
  const [contacts, setContacts] = useState([]);

  const loadList = useCallback(async () => {
    try {
      const r = await api.get(`/messages/conversations?archived=${archived}${q ? `&q=${encodeURIComponent(q)}` : ''}`);
      setItems(r.conversations);
    } catch (e) { /* shown once below */ }
    setLoading(false);
  }, [archived, q]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { api.get('/messages/contacts').then((r) => setContacts(r.contacts)).catch(() => {}); }, [items.length]);
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && loadList(), 15000);
    return () => clearInterval(t);
  }, [loadList]);

  // /messages?user=<id> → open or create the thread
  useEffect(() => {
    const uid = params.get('user');
    if (!uid || uid === user?._id) return;
    api.post('/messages/conversations', { userId: uid })
      .then((r) => navigate(`/messages/${r.conversation._id}`, { replace: true }))
      .catch((e) => { toast.err(errorMessage(e)); navigate('/messages', { replace: true }); });
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`ms${id ? ' has-thread' : ''}`}>
      <Inbox items={items} activeId={id} q={q} setQ={setQ} archived={archived} setArchived={setArchived} loading={loading} contacts={contacts} />
      {id ? <Thread key={id} id={id} onActivity={loadList} /> : (
        <section className="ms-thread ms-placeholder">
          <div>
            <h2>Your correspondence</h2>
            <p>Pick a conversation, or message someone from their profile, a job post or your network. Files up to 2 MB can be attached.</p>
            <Link to="/jobs" className="btn">Browse jobs</Link>
          </div>
        </section>
      )}
    </div>
  );
}
