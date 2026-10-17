// src/pages/Support.jsx — Production Final
// ─────────────────────────────────────────────────────────────
//  Tabs: Help (FAQ) · Contact · My Tickets · AI Chat · Status · Feedback
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiHelpCircle, FiMail, FiMessageSquare, FiList,
  FiActivity, FiStar, FiSearch, FiChevronDown, FiChevronUp,
  FiThumbsUp, FiThumbsDown, FiSend, FiPaperclip, FiX,
  FiCheckCircle, FiAlertCircle, FiClock, FiRefreshCw,
  FiExternalLink, FiZap, FiFile, FiUpload,
  FiArrowUp, FiCheck, FiAlertTriangle,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Support.css';

import api, { askAI, errorMessage } from '../services/api';
/* ── API ─────────────────────────────────────────────────── */


/* ── AI chat runs server-side: POST /api/ai/support-chat ── */




/* ── Helpers ─────────────────────────────────────────────── */
const arr     = v => Array.isArray(v) ? v : [];
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';

/* ── Status config ───────────────────────────────────────── */
const STATUS_CFG = {
  operational: { label:'Operational', color:'#7DC39A', bg:'rgba(125,195,154,0.1)',  icon:<FiCheckCircle size={12}/> },
  degraded:    { label:'Degraded',    color:'#E3A64B', bg:'rgba(227,166,75,0.1)',  icon:<FiAlertCircle size={12}/> },
  down:        { label:'Down',        color:'#D9605A', bg:'rgba(217,96,90,0.1)',   icon:<FiAlertTriangle size={12}/> },
  maintenance: { label:'Maintenance', color:'#7FA6CF', bg:'rgba(127,166,207,0.1)',  icon:<FiClock size={12}/> },
};

const TICKET_STATUS = {
  open:       { label:'Open',        color:'#7FA6CF', bg:'rgba(127,166,207,0.1)'  },
  inprogress: { label:'In Progress', color:'#E3A64B', bg:'rgba(227,166,75,0.1)'  },
  resolved:   { label:'Resolved',    color:'#7DC39A', bg:'rgba(125,195,154,0.1)'  },
  closed:     { label:'Closed',      color:'#6C776F', bg:'rgba(108,119,111,0.1)'    },
};

/* ── Fallback FAQs (shown instantly before API returns) ─── */
// FAQs come from the API (/support/faqs) — one source of truth shared with the server.
const FALLBACK_FAQS = [];

/* ── Tab config ──────────────────────────────────────────── */
const TABS = [
  { id:'help',     label:'Help',       icon:<FiHelpCircle  size={13}/> },
  { id:'contact',  label:'Contact',    icon:<FiMail        size={13}/> },
  { id:'tickets',  label:'My Tickets', icon:<FiList        size={13}/> },
  { id:'chat',     label:'AI Chat',    icon:<FiZap         size={13}/> },
  { id:'status',   label:'Status',     icon:<FiActivity    size={13}/> },
  { id:'feedback', label:'Feedback',   icon:<FiStar        size={13}/> },
];

const SUGGESTIONS = [
  'How does the scope lock work?',
  'How do I verify my payout method?',
  'A client hasn’t answered my application',
  'How do I record that I paid a milestone?',
  'I cannot log in to my account',
  'What does Premium include?',
];

/* ── Quick nav links (shown in Help tab) ─────────────────── */
const QUICK_LINKS = [
  { label:'Post a job',        path:'/jobs/new',    color:'#CFA75A', desc:'Or a small paid trial task'          },
  { label:'Contracts',         path:'/contracts',   color:'#7FA6CF', desc:'Milestones, deliveries and payments' },
  { label:'Payout methods',    path:'/settings?tab=payouts', color:'#7DC39A', desc:'Bank, Payoneer, Wise, card' },
  { label:'ID verification',   path:'/settings?tab=verification', color:'#A99BD6', desc:'Get the verified badge' },
  { label:'Squads',            path:'/talent?tab=mine', color:'#E3A64B', desc:'Team up for bigger jobs'         },
  { label:'Plans',             path:'/billing',     color:'#CFA75A', desc:'Your plan, receipts and renewal'   },
];

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function Support() {
  const { user } = useAuth();
  const [tab, setTab] = useState('help');

  /* ── Toast ── */
  const [toast, setToast] = useState({ show:false, msg:'', err:false });
  const showToast = useCallback((msg, err=false) => {
    setToast({ show:true, msg, err });
    setTimeout(() => setToast(t => ({...t, show:false})), 3500);
  }, []);

  /* ── Scroll to top ── */
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const fn = () => setShowTop(window.scrollY > 320);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* ════════════════════════════════════════════════════════
     TAB 1 — HELP / FAQ
  ════════════════════════════════════════════════════════ */
  const [faqs,      setFaqs]      = useState(FALLBACK_FAQS);
  const [faqOpen,   setFaqOpen]   = useState(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCat,    setFaqCat]    = useState('All');
  const [faqVotes,  setFaqVotes]  = useState({});

  useEffect(() => {
    api.get('/support/faqs').then(r => {
      if (arr(r.faqs).length) setFaqs(r.faqs);
    }).catch(() => {});
  }, []);

  const faqCategories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];

  const filteredFaqs = faqs.filter(f => {
    const matchCat  = faqCat === 'All' || f.category === faqCat;
    const q         = faqSearch.toLowerCase();
    const matchQ    = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const voteFaq = (id, type) => {
    if (faqVotes[id]) return;
    setFaqVotes(p => ({...p, [id]: type}));
    api.post('/support/faq-feedback', { faqId:id, helpful: type === 'up' }).catch(() => {});
  };

  /* ════════════════════════════════════════════════════════
     TAB 2 — CONTACT
  ════════════════════════════════════════════════════════ */
  const BLANK_FORM = { subject:'', category:'general', priority:'normal', message:'' };
  const [contactForm,   setContactForm]   = useState(BLANK_FORM);
  const [attachment,    setAttachment]    = useState(null);
  const [attachPreview, setAttachPreview] = useState(null);
  const [contactBusy,   setContactBusy]  = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const fileRef = useRef(null);

  const handleFile = e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Max file size is 10 MB.', true); return; }
    setAttachment(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setAttachPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else setAttachPreview(null);
  };

  const submitContact = async e => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      showToast('Subject and message are required.', true); return;
    }
    setContactBusy(true);
    try {
      const r = await api.post('/support/contact', {
        ...contactForm,
        userName:  user?.name,
        userEmail: user?.email,
      });
      setCreatedTicket(r.ticket || r);
      setContactForm(BLANK_FORM);
      setAttachment(null); setAttachPreview(null);
      showToast(`Ticket created — ID: ${r.ticket?.ticketId || 'submitted'}`);
    } catch { showToast('Failed to submit. Please try again.', true); }
    setContactBusy(false);
  };

  /* ════════════════════════════════════════════════════════
     TAB 3 — MY TICKETS
  ════════════════════════════════════════════════════════ */
  const [tickets,      setTickets]      = useState([]);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketExpand, setTicketExpand] = useState(null);
  const [ticketsLoad,  setTicketsLoad]  = useState(false);

  const loadTickets = useCallback(async () => {
    setTicketsLoad(true);
    try {
      const r = await api.get('/support/tickets');
      setTickets(arr(r.tickets || r));
    } catch { setTickets([]); }
    setTicketsLoad(false);
  }, []);

  useEffect(() => { if (tab === 'tickets') loadTickets(); }, [tab, loadTickets]);

  const filteredTickets = tickets.filter(t => {
    const matchFilter = ticketFilter === 'all' || t.status === ticketFilter;
    const q           = ticketSearch.toLowerCase();
    const matchSearch = !q || (t.subject||'').toLowerCase().includes(q) || (t.ticketId||'').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  /* ════════════════════════════════════════════════════════
     TAB 4 — AI CHAT
  ════════════════════════════════════════════════════════ */
  const [chatMsgs,    setChatMsgs]    = useState([]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatBusy,    setChatBusy]    = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chatMsgs, chatBusy]);

  useEffect(() => {
    if (tab === 'chat' && chatMsgs.length === 0) {
      setChatMsgs([{
        role: 'assistant',
        content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm the Aurelance Support AI — I can help with jobs, contracts, payouts, verification, billing and technical questions. What can I help you with?`,
        ts: new Date(),
      }]);
    }
  }, [tab]);

  const sendChat = async e => {
    e.preventDefault();
    const text = chatInput.trim(); if (!text) return;
    const userMsg = { role:'user', content:text, ts:new Date() };
    setChatMsgs(p => [...p, userMsg]);
    setChatInput('');
    setChatBusy(true);
    try {
      // Build API history — Anthropic requires first message to be 'user'
      // Strip welcome message (assistant) if it's the first, keep last 20 msgs for context
      const allMsgs = [...chatMsgs, userMsg].map(m => ({ role:m.role, content:m.content }));
      const firstUser = allMsgs.findIndex(m => m.role === 'user');
      const history   = (firstUser >= 0 ? allMsgs.slice(firstUser) : allMsgs).slice(-20);
      const prior   = history.slice(0, -1);
      const reply   = await askAI('support-chat', text, { history: prior });
      setChatMsgs(p => [...p, { role:'assistant', content:reply, ts:new Date() }]);
    } catch (e) {
      setChatMsgs(p => [...p, { role:'assistant', content: e?.status === 429 || e?.status === 503 ? errorMessage(e) : "I can't answer right now. Try again in a moment, or open a ticket below and a person will reply.", ts:new Date() }]);
    }
    setChatBusy(false);
  };

  const clearChat = () => {
    setChatMsgs([{ role:'assistant', content:"Chat cleared. How can I help you?", ts:new Date() }]);
  };

  /* ════════════════════════════════════════════════════════
     TAB 5 — STATUS
  ════════════════════════════════════════════════════════ */
  const [statusData,  setStatusData]  = useState(null);
  const [statusLoad,  setStatusLoad]  = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const loadStatus = useCallback(async () => {
    setStatusLoad(true);
    try {
      const r = await api.get('/support/status');
      setStatusData(r.status || r);
    } catch {
      setStatusData({
        overall: 'operational',
        services: [
          { name:'API',          status:'operational' },
          { name:'Jobs & contracts', status:'operational' },
          { name:'Messages',     status:'operational' },
          { name:'AI Features',  status:'operational' },
          { name:'Auth',         status:'operational' },
          { name:'File Storage', status:'operational' },
          { name:'Database',     status:'operational' },
        ],
        incidents: [],
      });
    }
    setLastChecked(new Date());
    setStatusLoad(false);
  }, []);

  useEffect(() => { if (tab === 'status') loadStatus(); }, [tab, loadStatus]);

  /* ════════════════════════════════════════════════════════
     TAB 6 — FEEDBACK
  ════════════════════════════════════════════════════════ */
  const [nps,           setNps]          = useState(null);
  const [aspects,       setAspects]      = useState({ speed:0, quality:0, knowledge:0 });
  const [feedbackMsg,   setFeedbackMsg]  = useState('');
  const [feedbackCat,   setFeedbackCat]  = useState('general');
  const [feedbackBusy,  setFeedbackBusy] = useState(false);
  const [feedbackDone,  setFeedbackDone] = useState(false);

  const submitFeedback = async e => {
    e.preventDefault();
    if (nps === null) { showToast('Please select a score (0–10).', true); return; }
    setFeedbackBusy(true);
    try {
      await api.post('/support/rate', { nps, aspectRatings:aspects, comment:feedbackMsg, category:feedbackCat });
      setFeedbackDone(true);
      showToast('Thank you for your feedback!');
    } catch { showToast('Could not submit feedback. Please try again.', true); }
    setFeedbackBusy(false);
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="sp-root">

      {/* Toast */}
      {toast.show && (
        <div className={`sp-toast${toast.err?' err':''}`}>
          {toast.err ? <FiAlertCircle size={12}/> : <FiCheck size={12}/>} {toast.msg}
        </div>
      )}

      {/* Hero */}
      <div className="sp-hero">
        <div>
          <h1 className="sp-title">Support Center</h1>
          <p className="sp-sub">Get help, track tickets, or chat with our AI assistant</p>
        </div>
        <div className="sp-hero-meta">
          <a href="mailto:aurelance454@gmail.com" className="sp-contact-pill">
            <FiMail size={12}/> aurelance454@gmail.com
          </a>
          <span className="sp-eta"><FiClock size={11}/> Replies within one business day</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sp-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`sp-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="sp-body">

        {/* ═══ TAB 1 — HELP ═══════════════════════════════ */}
        {tab === 'help' && (
          <div className="sp-tab-body">
            <div className="sp-card">
              <div className="sp-card-hdr">
                <h2>Frequently Asked Questions</h2>
                <span className="sp-count">{faqs.length} articles</span>
              </div>

              <div className="sp-faq-controls">
                <div className="sp-search-wrap">
                  <FiSearch size={13} className="sp-search-ico"/>
                  <input className="sp-input sp-search-input" value={faqSearch}
                    onChange={e => setFaqSearch(e.target.value)} placeholder="Search questions…"/>
                  {faqSearch && <button className="sp-clear-btn" onClick={() => setFaqSearch('')}><FiX size={11}/></button>}
                </div>
                <div className="sp-cat-pills">
                  {faqCategories.map(cat => (
                    <button key={cat} className={`sp-cat-pill${faqCat===cat?' active':''}`}
                      onClick={() => setFaqCat(cat)}>{cat}</button>
                  ))}
                </div>
              </div>

              {!filteredFaqs.length ? (
                <div className="sp-empty">
                  <FiHelpCircle size={28}/>
                  <strong>No results for "{faqSearch}"</strong>
                  <p>Try a different term or <button className="sp-link-btn" onClick={() => setTab('contact')}>submit a ticket</button>.</p>
                </div>
              ) : (
                <div className="sp-faq-list">
                  {filteredFaqs.map(faq => {
                    const open  = faqOpen === faq.id;
                    const voted = faqVotes[faq.id];
                    return (
                      <div key={faq.id} className={`sp-faq-item${open?' open':''}`}>
                        <button className="sp-faq-hdr" onClick={() => setFaqOpen(open ? null : faq.id)}>
                          <span className="sp-faq-q">{faq.question}</span>
                          <div className="sp-faq-right">
                            <span className="sp-faq-cat">{faq.category}</span>
                            {open ? <FiChevronUp size={13}/> : <FiChevronDown size={13}/>}
                          </div>
                        </button>
                        {open && (
                          <div className="sp-faq-body">
                            <p className="sp-faq-answer">{faq.answer}</p>
                            <div className="sp-faq-vote">
                              <span>Was this helpful?</span>
                              <button className={`sp-vote-btn up${voted==='up'?' voted':''}`}
                                onClick={() => voteFaq(faq.id,'up')} disabled={!!voted}>
                                <FiThumbsUp size={11}/> {voted==='up'?'Thanks!':'Yes'}
                              </button>
                              <button className={`sp-vote-btn down${voted==='down'?' voted':''}`}
                                onClick={() => voteFaq(faq.id,'down')} disabled={!!voted}>
                                <FiThumbsDown size={11}/> {voted==='down'?'Noted':'No'}
                              </button>
                              {voted && <span className="sp-vote-done">Thank you for the feedback.</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sp-card sp-still-stuck">
              <FiHelpCircle size={20} style={{color:'var(--gold)',flexShrink:0}}/>
              <div>
                <strong>Still need help?</strong>
                <p>A person replies within one business day.</p>
              </div>
              <div className="sp-stuck-btns">
                <button className="sp-btn-primary" onClick={() => setTab('contact')}>Submit a Ticket</button>
                <button className="sp-btn-secondary" onClick={() => setTab('chat')}><FiZap size={12}/> Ask AI</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 2 — CONTACT ════════════════════════════ */}
        {tab === 'contact' && (
          <div className="sp-tab-body">

            {createdTicket && (
              <div className="sp-ticket-confirm">
                <FiCheckCircle size={18} style={{color:'#7DC39A',flexShrink:0}}/>
                <div>
                  <strong>Ticket submitted!</strong>
                  <p>Ticket ID: <code>{createdTicket.ticketId || createdTicket._id || 'submitted'}</code> — we reply within one business day.</p>
                </div>
                <button className="sp-btn-secondary" onClick={() => { setCreatedTicket(null); setTab('tickets'); }}>
                  View Tickets
                </button>
              </div>
            )}

            <div className="sp-card">
              <div className="sp-card-hdr"><h2>Submit a Support Ticket</h2></div>
              <form className="sp-form" onSubmit={submitContact}>

                <div className="sp-field">
                  <label>Subject <span className="sp-req">*</span></label>
                  <input className="sp-input" value={contactForm.subject} required
                    onChange={e => setContactForm(f => ({...f, subject:e.target.value}))}
                    placeholder="Brief description of your issue"/>
                </div>

                <div className="sp-form-row">
                  <div className="sp-field">
                    <label>Category</label>
                    <select className="sp-input sp-select" value={contactForm.category}
                      onChange={e => setContactForm(f => ({...f, category:e.target.value}))}>
                      <option value="general">General Question</option>
                      <option value="billing">Billing &amp; Payments</option>
                      <option value="jobs">Jobs &amp; applications</option>
                      <option value="contracts">Contracts &amp; payments</option>
                      <option value="safety">Scam or safety concern</option>
                      <option value="verification">Verification &amp; payouts</option>
                      <option value="ai">AI Features</option>
                      <option value="account">Account &amp; Security</option>
                      <option value="technical">Technical Issue</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>
                  <div className="sp-field">
                    <label>Priority</label>
                    <select className="sp-input sp-select" value={contactForm.priority}
                      onChange={e => setContactForm(f => ({...f, priority:e.target.value}))}>
                      <option value="low">Low — General question</option>
                      <option value="normal">Normal — Need help soon</option>
                      <option value="high">High — Blocking my work</option>
                      <option value="urgent">Urgent — Critical issue</option>
                    </select>
                  </div>
                </div>

                <div className="sp-field">
                  <label>
                    Message <span className="sp-req">*</span>
                    <span className="sp-char">{contactForm.message.length} chars</span>
                  </label>
                  <textarea className="sp-input sp-textarea" rows={6} required
                    value={contactForm.message}
                    onChange={e => setContactForm(f => ({...f, message:e.target.value}))}
                    placeholder="Describe your issue in detail — include any error messages, steps to reproduce, and what you expected to happen."/>
                </div>

                {/* File attachment */}
                <div className="sp-field">
                  <label>Screenshot or File (optional — max 10 MB)</label>
                  <div className="sp-file-zone" onClick={() => fileRef.current?.click()}>
                    {attachment ? (
                      <div className="sp-file-attached">
                        {attachPreview
                          ? <img src={attachPreview} alt="preview" className="sp-file-preview"/>
                          : <FiFile size={22} style={{color:'var(--gold)'}}/>}
                        <div>
                          <span className="sp-file-name">{attachment.name}</span>
                          <span className="sp-file-size">{(attachment.size/1024).toFixed(1)} KB</span>
                        </div>
                        <button type="button" className="sp-file-rm"
                          onClick={e => { e.stopPropagation(); setAttachment(null); setAttachPreview(null); }}>
                          <FiX size={12}/>
                        </button>
                      </div>
                    ) : (
                      <div className="sp-file-ph">
                        <FiUpload size={18}/>
                        <span>Click to attach a screenshot or file</span>
                        <span className="sp-file-types">PNG, JPG, PDF, DOCX, ZIP</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" style={{display:'none'}} onChange={handleFile}
                    accept="image/*,.pdf,.doc,.docx,.zip,.txt"/>
                </div>

                {user && (
                  <div className="sp-submitter">
                    <FiCheckCircle size={11} style={{color:'#7DC39A'}}/>
                    Submitting as <strong>{user.name}</strong> ({user.email})
                  </div>
                )}

                <div className="sp-form-actions">
                  <button type="button" className="sp-btn-ghost"
                    onClick={() => { setContactForm(BLANK_FORM); setAttachment(null); setAttachPreview(null); }}>
                    Reset
                  </button>
                  <button type="submit" className="sp-btn-primary" disabled={contactBusy}>
                    {contactBusy ? 'Submitting…' : <><FiSend size={12}/> Submit Ticket</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Direct email */}
            <div className="sp-card">
              <div className="sp-card-hdr"><h2>Direct Contact</h2></div>
              <a href="mailto:aurelance454@gmail.com" className="sp-direct-opt">
                <span className="sp-do-icon" style={{color:'#7FA6CF',background:'rgba(127,166,207,0.1)'}}>
                  <FiMail size={16}/>
                </span>
                <div>
                  <strong>Email Support</strong>
                  <span>aurelance454@gmail.com — replies within one business day</span>
                </div>
                <FiExternalLink size={11} style={{color:'var(--text-muted)',marginLeft:'auto'}}/>
              </a>
            </div>
          </div>
        )}

        {/* ═══ TAB 3 — MY TICKETS ═════════════════════════ */}
        {tab === 'tickets' && (
          <div className="sp-tab-body">
            <div className="sp-card">
              <div className="sp-card-hdr">
                <h2>My Support Tickets</h2>
                <button className="sp-icon-btn" onClick={loadTickets} title="Refresh"><FiRefreshCw size={12}/></button>
              </div>

              <div className="sp-tickets-controls">
                <div className="sp-search-wrap">
                  <FiSearch size={13} className="sp-search-ico"/>
                  <input className="sp-input sp-search-input" value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)} placeholder="Search by subject or ID…"/>
                </div>
                <div className="sp-filter-row">
                  {['all','open','inprogress','resolved','closed'].map(s => (
                    <button key={s} className={`sp-filter-pill${ticketFilter===s?' active':''}`}
                      onClick={() => setTicketFilter(s)}>
                      {s==='all'?'All':s==='inprogress'?'In Progress':s.charAt(0).toUpperCase()+s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {ticketsLoad ? (
                <div className="sp-loading"><div className="sp-spinner"/> Loading tickets…</div>
              ) : !filteredTickets.length ? (
                <div className="sp-empty">
                  <FiList size={28}/>
                  <strong>{ticketSearch||ticketFilter!=='all'?'No matching tickets':'No tickets yet'}</strong>
                  <p>{ticketSearch||ticketFilter!=='all'?'Try a different filter.':'Submit a ticket from the Contact tab.'}</p>
                  {!ticketSearch&&ticketFilter==='all'&&(
                    <button className="sp-btn-primary" onClick={() => setTab('contact')}>Submit a Ticket</button>
                  )}
                </div>
              ) : (
                <div className="sp-tickets-list">
                  {filteredTickets.map(ticket => {
                    const st  = TICKET_STATUS[ticket.status] || TICKET_STATUS.open;
                    const xpd = ticketExpand === (ticket._id||ticket.id);
                    return (
                      <div key={ticket._id||ticket.id} className={`sp-ticket-row${xpd?' expanded':''}`}>
                        <button className="sp-ticket-btn"
                          onClick={() => setTicketExpand(xpd ? null : (ticket._id||ticket.id))}>
                          <div className="sp-ticket-main">
                            <span className="sp-ticket-id">#{ticket.ticketId||ticket._id?.slice(-6)||'——'}</span>
                            <span className="sp-ticket-subject">{ticket.subject||'No subject'}</span>
                          </div>
                          <div className="sp-ticket-meta">
                            {ticket.category && <span className="sp-ticket-cat">{ticket.category}</span>}
                            <span className="sp-status-badge" style={{color:st.color,background:st.bg}}>{st.label}</span>
                            <span className="sp-ticket-date">{fmtDate(ticket.createdAt)}</span>
                            {xpd ? <FiChevronUp size={12}/> : <FiChevronDown size={12}/>}
                          </div>
                        </button>
                        {xpd && (
                          <div className="sp-ticket-detail">
                            {ticket.message && <p className="sp-ticket-body">{ticket.message}</p>}
                            {ticket.priority && (
                              <span className="sp-priority-badge" data-p={ticket.priority}>
                                Priority: {ticket.priority}
                              </span>
                            )}
                            {arr(ticket.replies).length > 0 && (
                              <div className="sp-replies">
                                <h4>Replies</h4>
                                {arr(ticket.replies).map((r,i) => (
                                  <div key={i} className={`sp-reply${r.fromSupport?' support':''}`}>
                                    <span className="sp-reply-who">{r.fromSupport?'Support Team':'You'}</span>
                                    <p>{r.message}</p>
                                    <span className="sp-reply-ts">{fmtDate(r.createdAt)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TAB 4 — AI CHAT ════════════════════════════ */}
        {tab === 'chat' && (
          <div className="sp-tab-body">
            <div className="sp-card sp-chat-card">

              {/* Header */}
              <div className="sp-chat-hdr">
                <div className="sp-chat-agent">
                  <div className="sp-agent-ico"><FiZap size={15}/></div>
                  <div>
                    <strong>Aurelance AI</strong>
                    <span className="sp-agent-status"><span className="sp-online-dot"/>Online</span>
                  </div>
                </div>
                <button className="sp-icon-btn" onClick={clearChat} title="Clear chat"><FiRefreshCw size={12}/></button>
              </div>

              {/* Messages */}
              <div className="sp-chat-msgs">
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`sp-msg ${m.role==='user'?'user':'bot'}`}>
                    {m.role==='assistant' && <div className="sp-msg-ico"><FiZap size={11}/></div>}
                    <div className="sp-msg-wrap">
                      <div className="sp-msg-bubble"><p>{m.content}</p></div>
                      <span className="sp-msg-ts">
                        {m.ts ? new Date(m.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {chatBusy && (
                  <div className="sp-msg bot">
                    <div className="sp-msg-ico"><FiZap size={11}/></div>
                    <div className="sp-typing"><span/><span/><span/></div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {/* Suggestions */}
              {chatMsgs.length <= 1 && (
                <div className="sp-suggestions">
                  {SUGGESTIONS.map((s,i) => (
                    <button key={i} className="sp-suggestion" onClick={() => setChatInput(s)}>{s}</button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form className="sp-chat-input-row" onSubmit={sendChat}>
                <input className="sp-input sp-chat-input" value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask me anything about Aurelance…" disabled={chatBusy}/>
                <button type="submit" className="sp-chat-send" disabled={!chatInput.trim()||chatBusy}>
                  <FiSend size={14}/>
                </button>
              </form>

              <div className="sp-chat-note">
                AI responses are for general guidance. For account-specific issues,{' '}
                <button className="sp-link-btn" onClick={() => setTab('contact')}>submit a ticket</button>.
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB 5 — STATUS ═════════════════════════════ */}
        {tab === 'status' && (
          <div className="sp-tab-body">
            <div className="sp-card">
              <div className="sp-card-hdr">
                <h2>System Status</h2>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  {lastChecked && <span style={{fontSize:11,color:'var(--text-muted)'}}>Checked {lastChecked.toLocaleTimeString()}</span>}
                  <button className="sp-icon-btn" onClick={loadStatus} disabled={statusLoad}>
                    <FiRefreshCw size={12} style={statusLoad?{animation:'sp-spin .8s linear infinite'}:{}}/>
                  </button>
                </div>
              </div>

              {statusLoad && !statusData ? (
                <div className="sp-loading"><div className="sp-spinner"/> Checking status…</div>
              ) : statusData ? (
                <>
                  {(() => {
                    const cfg = STATUS_CFG[statusData.overall] || STATUS_CFG.operational;
                    return (
                      <div className="sp-overall" style={{borderColor:cfg.color,background:cfg.bg}}>
                        <span style={{color:cfg.color}}>{cfg.icon}</span>
                        <strong style={{color:cfg.color}}>All Systems {cfg.label}</strong>
                      </div>
                    );
                  })()}
                  <div className="sp-services">
                    {arr(statusData.services).map((svc,i) => {
                      const cfg = STATUS_CFG[svc.status] || STATUS_CFG.operational;
                      return (
                        <div key={i} className="sp-service-row">
                          <span className="sp-service-name">{svc.name}</span>
                          <span className="sp-service-status" style={{color:cfg.color,background:cfg.bg}}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {arr(statusData.incidents).length > 0 && (
                    <div className="sp-incidents">
                      <h3>Active Incidents</h3>
                      {arr(statusData.incidents).map((inc,i) => (
                        <div key={i} className="sp-incident">
                          <FiAlertTriangle size={13} style={{color:'#E3A64B',flexShrink:0}}/>
                          <div>
                            <strong>{inc.title}</strong>
                            <p>{inc.description}</p>
                            <span>{fmtDate(inc.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
            <div className="sp-card sp-uptime-note">
              <FiActivity size={14} style={{color:'#7DC39A',flexShrink:0}}/>
              <p>Aurelance targets 99.9% uptime. If you see issues not shown here,{' '}
                <button className="sp-link-btn" onClick={() => setTab('contact')}>submit a ticket</button>.
              </p>
            </div>
          </div>
        )}

        {/* ═══ TAB 6 — FEEDBACK ═══════════════════════════ */}
        {tab === 'feedback' && (
          <div className="sp-tab-body">
            {feedbackDone ? (
              <div className="sp-card sp-feedback-done">
                <FiCheckCircle size={38} style={{color:'#7DC39A'}}/>
                <h2>Thank you for your feedback!</h2>
                <p>We use every response to make Aurelance better.</p>
                <button className="sp-btn-primary" onClick={() => {
                  setFeedbackDone(false); setNps(null);
                  setAspects({speed:0,quality:0,knowledge:0}); setFeedbackMsg('');
                }}>Submit Another</button>
              </div>
            ) : (
              <form className="sp-card" onSubmit={submitFeedback}>
                <div className="sp-card-hdr"><h2>Rate Your Support Experience</h2></div>

                {/* NPS */}
                <div className="sp-fb-section">
                  <h3>How likely are you to recommend Aurelance to a colleague?</h3>
                  <p className="sp-nps-sub">0 = Not at all likely &nbsp;·&nbsp; 10 = Extremely likely</p>
                  <div className="sp-nps-row">
                    {Array.from({length:11},(_,i)=>i).map(n => (
                      <button type="button" key={n}
                        className={`sp-nps-btn${nps===n?' sel':''}${n>=9?' promoter':n>=7?' passive':' detractor'}`}
                        onClick={() => setNps(n)}>{n}
                      </button>
                    ))}
                  </div>
                  {nps !== null && (
                    <p className="sp-nps-label">
                      {nps>=9?'🌟 Excellent! You\'re a promoter.':nps>=7?'😊 Good — you\'re satisfied.':'😔 We\'ll work to do better.'}
                    </p>
                  )}
                </div>

                {/* Aspect stars */}
                <div className="sp-fb-section">
                  <h3>Rate specific aspects</h3>
                  {[
                    ['speed',     'Response Speed',  'How fast did we respond?'],
                    ['quality',   'Answer Quality',  'Were our answers accurate and helpful?'],
                    ['knowledge', 'Knowledge',       'Did the team understand your issue?'],
                  ].map(([key,label,desc]) => (
                    <div key={key} className="sp-aspect-row">
                      <div className="sp-aspect-label">
                        <strong>{label}</strong>
                        <span>{desc}</span>
                      </div>
                      <div className="sp-stars">
                        {[1,2,3,4,5].map(s => (
                          <button type="button" key={s}
                            className={`sp-star${aspects[key]>=s?' lit':''}`}
                            onClick={() => setAspects(a => ({...a,[key]:s}))}>★
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Category + comment */}
                <div className="sp-fb-section">
                  <div className="sp-field">
                    <label>Feedback Category</label>
                    <select className="sp-input sp-select" value={feedbackCat} onChange={e => setFeedbackCat(e.target.value)}>
                      <option value="general">General Experience</option>
                      <option value="ai">AI Features</option>
                      <option value="billing">Billing</option>
                      <option value="contracts">Contracts</option>
                      <option value="ui">Interface &amp; Design</option>
                      <option value="performance">Performance</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>
                  <div className="sp-field">
                    <label>Additional Comments (optional)</label>
                    <textarea className="sp-input sp-textarea" rows={4}
                      value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)}
                      placeholder="Tell us what went well, what could be better, or features you'd love to see…"/>
                  </div>
                </div>

                <div className="sp-form-actions">
                  <button type="submit" className="sp-btn-primary" disabled={feedbackBusy||nps===null}>
                    {feedbackBusy ? 'Submitting…' : <><FiSend size={12}/> Submit Feedback</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>

      {/* Scroll to top */}
      {showTop && (
        <button className="sp-scroll-top" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <FiArrowUp size={15}/>
        </button>
      )}
    </div>
  );
}