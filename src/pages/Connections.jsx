// src/pages/Connections.jsx — Production v4
// ─────────────────────────────────────────────────────────────
//  TABS:  Discover · Network · Pipeline · Requests · Analytics
//
//  STANDARD FEATURES:
//   Search + debounce · Quick filters · Advanced filters
//   Grid + List views · Sort (7 options) · Pagination
//   Bulk select: message / favorite / tag / remove
//   Pin to top · Favorites · Custom tags with color
//   Notes per connection · Reminders with banner
//   Collab requests with project/rate fields
//   Referral send + status tracking
//   Meeting scheduler with .ics download
//   Block connection · Archive connection
//   CSV export · Import modal
//   Profile modal with full detail
//   Groups (named lists of connections)
//   Invite link copy
//   Chat panel with typing indicator, templates, read status
//   Activity feed with type filter
//   Keyboard shortcuts: N=add  /=search  ESC=close
//   Input sanitization on all user text
//   Connection strength bars (1-5)
//   Recently viewed strip
//
//  NEW FEATURES:
//   ★ Network Value Score — total hourly rate potential of network
//   ★ At-Risk Connections — who you haven't contacted in 30d+
//   ★ Skills Gap — which skills are missing from your network
//   ★ Match Score — how well a suggestion matches your tasks/skills
//   ★ Connection Timeline — per-connection activity history (localStorage)
//   ★ Rate negotiation helper in collab modal
//   ★ Note templates for common relationship types
//   ★ Quick actions inline: no modal needed for common actions
//   ★ Response rate tracking per connection
//   ★ Last message preview in list view
//   ★ .ics calendar export for meetings
//   ★ Connection since date badge
// ─────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useRef, useCallback, useMemo, useReducer,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiUserPlus, FiUserCheck, FiMessageSquare,
  FiStar, FiShare2, FiCode, FiMoreVertical, FiCheck,
  FiTrash2, FiEdit3, FiSend, FiLink, FiRefreshCw,
  FiZap, FiBell, FiActivity, FiUsers, FiUser,
  FiMapPin, FiExternalLink, FiChevronDown, FiChevronUp,
  FiFilter, FiDownload, FiUpload, FiCalendar, FiClock,
  FiBarChart2, FiTag, FiMail, FiAlertTriangle,
  FiGrid, FiList, FiTrendingUp, FiArrowDown,
  FiCheckSquare, FiSquare, FiSliders, FiBookmark,
  FiDollarSign, FiAlertCircle, FiTrendingDown,
  FiRepeat, FiArrowRight, FiLock,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Connections.css';

/* ── API ─────────────────────────────────────────────────────── */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tok  = () => localStorage.getItem('authToken');
const hdrs = (json = true) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${tok()}`,
});
const api = {
  get:    url      => fetch(`${BASE}${url}`, { headers: hdrs(false) }).then(r => r.json()),
  post:   (url, b) => fetch(`${BASE}${url}`, { method: 'POST',   headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  patch:  (url, b) => fetch(`${BASE}${url}`, { method: 'PATCH',  headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  delete: url      => fetch(`${BASE}${url}`, { method: 'DELETE', headers: hdrs(false) }).then(r => r.json()),
};

/* ── Security ────────────────────────────────────────────────── */
const san   = str => String(str || '').replace(/[<>"'`]/g, c => ({ '<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;' }[c])).trim().slice(0, 1000);
const sanS  = str => san(str).slice(0, 200);
const sanURL = s  => { try { const u = new URL(s); return ['https:','http:'].includes(u.protocol) ? s : ''; } catch { return ''; } };

/* ── localStorage ────────────────────────────────────────────── */
const ls = {
  get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ── Debounce ────────────────────────────────────────────────── */
function useDebounce(val, ms = 300) {
  const [d, setD] = useState(val);
  useEffect(() => { const t = setTimeout(() => setD(val), ms); return () => clearTimeout(t); }, [val, ms]);
  return d;
}

/* ── Helpers ─────────────────────────────────────────────────── */
const arr      = v  => Array.isArray(v) ? v : [];
const initials = n  => (n || '?').split(' ').map(c => c[0]).join('').toUpperCase().slice(0, 2);
const fmtDate  = d  => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
const daysAgo  = d  => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;
const fmtDays  = d  => d === null ? '—' : d === 0 ? 'Today' : d === 1 ? 'Yesterday' : d < 30 ? `${d}d ago` : d < 365 ? `${Math.floor(d/30)}mo ago` : `${Math.floor(d/365)}y ago`;

/* ── Network value score ──────────────────────────────────────── */
const networkValue = conns => conns.reduce((s, c) => s + (c.hourlyRate || 0), 0);

/* ── Skills gap ──────────────────────────────────────────────── */
const skillsInNetwork = conns => {
  const map = {};
  conns.forEach(c => arr(c.skills).forEach(s => { map[s] = (map[s] || 0) + 1; }));
  return map;
};

/* ── At-risk connections (30+ days no contact) ────────────────── */
const atRiskConns = conns => conns.filter(c => {
  const d = daysAgo(c.lastInteraction || c.updatedAt);
  return d !== null && d >= 30;
});

/* ── Match score (0-100) for suggestion vs user profile ──────── */
const matchScore = (suggestion, userSkills = []) => {
  const sSkills = arr(suggestion.skills).map(s => s.toLowerCase());
  const uSkills = arr(userSkills).map(s => s.toLowerCase());
  if (!sSkills.length || !uSkills.length) return Math.round(50 + Math.random() * 30);
  const overlap = sSkills.filter(s => uSkills.some(u => s.includes(u) || u.includes(s))).length;
  return Math.min(99, Math.round(30 + (overlap / Math.max(sSkills.length, 1)) * 70));
};

/* ── Generate .ics calendar file ─────────────────────────────── */
const downloadICS = (name, date, time, notes) => {
  const dt = new Date(`${date}T${time || '09:00'}`);
  const pad = n => String(n).padStart(2, '0');
  const stamp = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const end = new Date(dt.getTime() + 60 * 60 * 1000);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aurelance//Meeting//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@aurelance`,
    `DTSTART:${stamp(dt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:Meeting with ${san(name)}`,
    `DESCRIPTION:${san(notes).replace(/\n/g, '\\n')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: `meeting-${san(name).replace(/\s+/g,'-').slice(0,20)}.ics`,
  }).click();
};

/* ── CSV export ──────────────────────────────────────────────── */
const exportCSV = (rows, filename) => {
  const header = ['Name','Role','Skills','Availability','Rate','Location','Email','Rating','Strength','Last Contacted','Tags'];
  const body = rows.map(c => [
    c.name, c.role||'', arr(c.skills).join('; '), c.availability||'',
    c.hourlyRate||'', c.location||'', c.email||'', c.rating||'',
    c.strength||0, c.lastInteraction||'', c._tag||'',
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const blob = new Blob([[header.join(','),...body].join('\n')], { type:'text/csv' });
  Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename }).click();
};

/* ── Constants ───────────────────────────────────────────────── */
const PAGE = 9;

const AV_CFG = {
  available: { label:'Available', color:'#4caf82', bg:'rgba(76,175,130,.12)',  bd:'rgba(76,175,130,.3)'   },
  busy:      { label:'Busy',      color:'#e8a030', bg:'rgba(232,160,48,.12)',  bd:'rgba(232,160,48,.3)'   },
  offline:   { label:'Offline',   color:'#4a4843', bg:'rgba(255,255,255,.04)', bd:'rgba(255,255,255,.07)' },
};

const TAG_CFG = {
  'Hot Lead':     { bg:'rgba(224,92,92,.12)',   color:'#e08888', bd:'rgba(224,92,92,.3)'    },
  'Collaborator': { bg:'rgba(155,114,232,.12)', color:'#c0a4f4', bd:'rgba(155,114,232,.3)'  },
  'Client':       { bg:'rgba(201,168,76,.12)',  color:'#e8c97a', bd:'rgba(201,168,76,.3)'   },
  'Mentor':       { bg:'rgba(74,144,217,.12)',  color:'#7db8e8', bd:'rgba(74,144,217,.3)'   },
  'Partner':      { bg:'rgba(76,175,130,.12)',  color:'#7fcfaa', bd:'rgba(76,175,130,.3)'   },
  'Prospect':     { bg:'rgba(232,160,48,.12)',  color:'#f0c060', bd:'rgba(232,160,48,.3)'   },
};
const ALL_TAGS = Object.keys(TAG_CFG);

const SORT_OPTS = [
  { id:'name',      label:'Name A–Z'            },
  { id:'name_desc', label:'Name Z–A'            },
  { id:'rating',    label:'Highest Rated'       },
  { id:'rate',      label:'Highest Rate'        },
  { id:'recent',    label:'Recently Added'      },
  { id:'contacted', label:'Last Contacted'      },
  { id:'strength',  label:'Connection Strength' },
  { id:'at_risk',   label:'At-Risk First'       },
];

const QUICK_FILTERS = [
  'All','Favorites','Pinned','At-Risk','Available',
  'Developers','Designers','Clients','Hot Leads','High Rate',
];

const TABS = [
  { id:'discover',  label:'Discover',  icon:<FiZap size={12}/>        },
  { id:'network',   label:'Network',   icon:<FiUsers size={12}/>      },
  { id:'pipeline',  label:'Pipeline',  icon:<FiTrendingUp size={12}/> },
  { id:'requests',  label:'Requests',  icon:<FiBell size={12}/>       },
  { id:'analytics', label:'Analytics', icon:<FiBarChart2 size={12}/>  },
];

const NOTE_TEMPLATES = [
  { label:'Great collaborator',  text:'Excellent communicator. Delivered on time and above expectations. Would work with again.' },
  { label:'Client notes',        text:'Client has a fixed budget of $[amount]. Prefers async communication. Responds quickly via email.' },
  { label:'Follow-up needed',    text:'Met at [event/platform]. Interested in [topic]. Follow up about [project] after [date].' },
  { label:'Potential lead',      text:'Looking for [service] for their [company/project]. Budget: $[range]. Timeline: [timeframe].' },
];

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Avatar({ name, photo, size = 44, online }) {
  return (
    <div className="cn-aw" style={{ width: size, height: size }}>
      {photo
        ? <img src={sanURL(photo) || undefined} alt={sanS(name)} className="cn-av" style={{ width: size, height: size }}/>
        : <div className="cn-av cn-av-i" style={{ width: size, height: size, fontSize: Math.round(size * .36) }}>
            {initials(name)}
          </div>}
      {online && <span className="cn-online"/>}
    </div>
  );
}

const Sk = ({ s }) => <span className="cn-sk">{sanS(s)}</span>;

function AvBadge({ status = 'offline' }) {
  const c = AV_CFG[status] || AV_CFG.offline;
  return (
    <span className="cn-avail" style={{ color: c.color, background: c.bg, border: `1px solid ${c.bd}` }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }}/>
      {c.label}
    </span>
  );
}

function Strength({ level = 0 }) {
  const colors = ['#e05c5c','#e8a030','#e8a030','#4caf82','#4caf82'];
  const label  = ['','Acquaintance','Familiar','Active','Close','Core'][level] || '';
  return (
    <div className="cn-strength" title={`Strength: ${label} (${level}/5)`}>
      {[1,2,3,4,5].map(i => (
        <div key={i} className="cn-strength-bar"
          style={{ background: i <= level ? colors[level-1] : 'rgba(255,255,255,.07)' }}/>
      ))}
      {level > 0 && <span className="cn-strength-lbl" style={{ color: colors[level-1] }}>{label}</span>}
    </div>
  );
}

function MatchBadge({ score }) {
  const color = score >= 80 ? '#4caf82' : score >= 60 ? '#e8a030' : '#8e8a82';
  return (
    <span className="cn-match-badge" style={{ color, background: `${color}14`, borderColor: `${color}30` }}>
      {score}% match
    </span>
  );
}

function AtRiskBadge({ days }) {
  if (days === null || days < 30) return null;
  return (
    <span className="cn-at-risk-badge" title={`No contact in ${days} days`}>
      <FiAlertCircle size={9}/> {days}d
    </span>
  );
}

function Toast({ msg, err }) {
  if (!msg) return null;
  return <div className={`cn-toast${err ? ' err' : ''}`}>{err ? '✕' : '✓'} {msg}</div>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function Connections() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  /* ── Tab / view ─────────────────────────────────────────────── */
  const [tab,          setTab]          = useState('discover');
  const [viewMode,     setViewMode]     = useState('grid');
  const [filter,       setFilter]       = useState('All');
  const [searchRaw,    setSearchRaw]    = useState('');
  const search = useDebounce(searchRaw, 300);
  const [skillFilter,  setSkillFilter]  = useState('');
  const [sortBy,       setSortBy]       = useState('name');
  const [page,         setPage]         = useState(1);
  const [bulkMode,     setBulkMode]     = useState(false);
  const [selected,     setSelected]     = useState([]);
  const [showAdvFilter,setShowAdvFilter]= useState(false);
  const [advF,         setAdvF]         = useState({ minRate:'', maxRate:'', location:'', availability:'' });
  const searchRef = useRef(null);

  /* ── Server data ────────────────────────────────────────────── */
  const [connections,   setConnections]   = useState([]);
  const [requests,      setRequests]      = useState([]);
  const [sentReqs,      setSentReqs]      = useState([]);
  const [suggestions,   setSuggestions]   = useState([]);
  const [activity,      setActivity]      = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [actFilter,     setActFilter]     = useState('All');
  const [loading,       setLoading]       = useState(true);

  /* ── localStorage-backed state ──────────────────────────────── */
  const [favs,         setFavs]         = useState(() => ls.get('cn_favs', []));
  const [notes,        setNotes]        = useState(() => ls.get('cn_notes', {}));
  const [pinned,       setPinned]       = useState(() => ls.get('cn_pinned', []));
  const [tags,         setTags]         = useState(() => ls.get('cn_tags', {}));
  const [reminders,    setReminders]    = useState(() => ls.get('cn_reminders', {}));
  const [groups,       setGroups]       = useState(() => ls.get('cn_groups', []));
  const [recentViewed, setRecentViewed] = useState(() => ls.get('cn_recent', []));
  const [connTimeline, setConnTimeline] = useState(() => ls.get('cn_timeline', {})); // {id: [{type,note,date}]}
  const [archived,     setArchived]     = useState(() => ls.get('cn_archived', [])); // [id]

  /* ── Modals ─────────────────────────────────────────────────── */
  const [profileModal,  setProfileModal]  = useState(null);
  const [noteModal,     setNoteModal]     = useState(null);
  const [noteText,      setNoteText]      = useState('');
  const [collabModal,   setCollabModal]   = useState(null);
  const [collabForm,    setCollabForm]    = useState({ message:'', project:'', rate:'', timeline:'' });
  const [referralModal, setReferralModal] = useState(null);
  const [refMsg,        setRefMsg]        = useState('');
  const [addModal,      setAddModal]      = useState(false);
  const [addForm,       setAddForm]       = useState({ name:'', email:'', role:'', skills:'', message:'' });
  const [importModal,   setImportModal]   = useState(false);
  const [tagModal,      setTagModal]      = useState(null);
  const [meetingModal,  setMeetingModal]  = useState(null);
  const [meetingForm,   setMeetingForm]   = useState({ date:'', time:'09:00', notes:'' });
  const [reminderModal, setReminderModal] = useState(null);
  const [reminderDate,  setReminderDate]  = useState('');
  const [groupModal,    setGroupModal]    = useState(false);
  const [groupForm,     setGroupForm]     = useState({ name:'', color:'#c9a84c' });
  const [bulkMsgModal,  setBulkMsgModal]  = useState(false);
  const [bulkMsg,       setBulkMsg]       = useState('');
  const [blockModal,    setBlockModal]    = useState(null);
  const [timelineModal, setTimelineModal] = useState(null); // conn — show per-connection timeline
  const [logModal,      setLogModal]      = useState(null); // conn — log interaction manually
  const [logForm,       setLogForm]       = useState({ type:'call', note:'', date:'' });
  const [gapModal,      setGapModal]      = useState(false); // skills gap analysis

  /* ── Chat ───────────────────────────────────────────────────── */
  const [chatWith,      setChatWith]      = useState(null);
  const [chatMsgs,      setChatMsgs]      = useState([]);
  const [chatInput,     setChatInput]     = useState('');
  const [chatLoad,      setChatLoad]      = useState(false);
  const [isTyping,      setIsTyping]      = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const chatEndRef = useRef(null);
  const pollRef    = useRef(null);

  /* ── Invite ─────────────────────────────────────────────────── */
  const [inviteLink,    setInviteLink]    = useState('');

  /* ── Toast ──────────────────────────────────────────────────── */
  const [toast, setToast] = useState({ msg:'', err:false });
  const notify = useCallback((msg, err = false) => {
    setToast({ msg: san(msg), err });
    setTimeout(() => setToast({ msg:'', err:false }), 3200);
  }, []);

  /* ── Keyboard shortcuts ─────────────────────────────────────── */
  useEffect(() => {
    const h = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' && !e.ctrlKey) { e.preventDefault(); setAddModal(true); }
      if (e.key === '/')               { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') {
        if (chatWith) closeChat();
        else if (profileModal) setProfileModal(null);
        else if (collabModal)  setCollabModal(null);
        else if (noteModal)    setNoteModal(null);
        else if (meetingModal) setMeetingModal(null);
        else if (tagModal)     setTagModal(null);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [chatWith, profileModal, collabModal, noteModal, meetingModal, tagModal]); // eslint-disable-line

  /* ── Load all ───────────────────────────────────────────────── */
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [conn, req, sent, sugg, act] = await Promise.allSettled([
      api.get('/connections'),
      api.get('/connections/requests/incoming'),
      api.get('/connections/requests/sent'),
      api.get('/connections/suggestions'),
      api.get('/connections/activity'),
    ]);
    if (conn.status === 'fulfilled') setConnections(arr(conn.value?.connections || conn.value));
    if (req.status  === 'fulfilled') setRequests(arr(req.value?.requests || req.value));
    if (sent.status === 'fulfilled') setSentReqs(arr(sent.value?.requests || sent.value));
    if (sugg.status === 'fulfilled') setSuggestions(arr(sugg.value?.suggestions || sugg.value));
    if (act.status  === 'fulfilled') setActivity(arr(act.value?.activities || act.value));
    setLoading(false);
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Search users (API) ─────────────────────────────────────── */
  const debSearch = useDebounce(searchRaw, 380);
  useEffect(() => {
    if (!debSearch.trim()) { setSearchResults([]); return; }
    api.get(`/connections/search?q=${encodeURIComponent(debSearch)}`)
      .then(d => setSearchResults(arr(d?.users || d)))
      .catch(() => {});
  }, [debSearch]);

  /* ── Chat scroll + poll ─────────────────────────────────────── */
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs]);
  useEffect(() => {
    if (!chatWith) return;
    pollRef.current = setInterval(async () => {
      try {
        const d = await api.get(`/connections/chat/${chatWith._id}`);
        setChatMsgs(arr(d?.messages || d));
        setIsTyping(!!d?.typing);
      } catch {}
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [chatWith?._id]); // eslint-disable-line

  /* ── Due reminders ──────────────────────────────────────────── */
  const dueReminders = useMemo(() => {
    const today = new Date().toDateString();
    return Object.entries(reminders)
      .filter(([, d]) => d && new Date(d).toDateString() === today)
      .map(([id]) => connections.find(c => c._id === id))
      .filter(Boolean);
  }, [reminders, connections]);

  /* ── Derived metrics ────────────────────────────────────────── */
  const activeConns = useMemo(() => connections.filter(c => !archived.includes(c._id)), [connections, archived]);

  const netValue = useMemo(() => networkValue(activeConns), [activeConns]);

  const atRisk = useMemo(() => atRiskConns(activeConns), [activeConns]);

  const skillMap = useMemo(() => skillsInNetwork(activeConns), [activeConns]);

  const userSkills = useMemo(() => arr(user?.skills), [user]);

  /* ── Filter + sort ──────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let res = [...activeConns];
    const q = search.toLowerCase();
    if (q) res = res.filter(c =>
      (c.name||'').toLowerCase().includes(q) ||
      (c.role||'').toLowerCase().includes(q) ||
      arr(c.skills).some(s => s.toLowerCase().includes(q)) ||
      (c.location||'').toLowerCase().includes(q)
    );
    if (skillFilter) res = res.filter(c => arr(c.skills).some(s => s.toLowerCase().includes(skillFilter.toLowerCase())));
    if (advF.availability) res = res.filter(c => c.availability === advF.availability);
    if (advF.location)     res = res.filter(c => (c.location||'').toLowerCase().includes(advF.location.toLowerCase()));
    if (advF.minRate)      res = res.filter(c => (c.hourlyRate||0) >= Number(advF.minRate));
    if (advF.maxRate)      res = res.filter(c => (c.hourlyRate||0) <= Number(advF.maxRate));

    switch (filter) {
      case 'Favorites':   res = res.filter(c => favs.includes(c._id)); break;
      case 'Pinned':      res = res.filter(c => pinned.includes(c._id)); break;
      case 'At-Risk':     res = res.filter(c => atRisk.some(r => r._id === c._id)); break;
      case 'Available':   res = res.filter(c => c.availability === 'available'); break;
      case 'Developers':  res = res.filter(c => /developer|engineer|frontend|backend|fullstack/i.test(c.role||'')); break;
      case 'Designers':   res = res.filter(c => /designer|ux|ui|figma/i.test(c.role||'')); break;
      case 'Clients':     res = res.filter(c => /client|founder|ceo|manager|owner/i.test(c.role||'')); break;
      case 'Hot Leads':   res = res.filter(c => tags[c._id] === 'Hot Lead'); break;
      case 'High Rate':   res = res.filter(c => (c.hourlyRate||0) >= 50); break;
      default: break;
    }

    res.sort((a, b) => {
      switch (sortBy) {
        case 'name':      return (a.name||'').localeCompare(b.name||'');
        case 'name_desc': return (b.name||'').localeCompare(a.name||'');
        case 'rating':    return (b.rating||0) - (a.rating||0);
        case 'rate':      return (b.hourlyRate||0) - (a.hourlyRate||0);
        case 'strength':  return (b.strength||0) - (a.strength||0);
        case 'at_risk':   return (daysAgo(a.lastInteraction)||0) - (daysAgo(b.lastInteraction)||0);
        default:          return 0;
      }
    });

    // pinned always first
    return [...res.filter(c => pinned.includes(c._id)), ...res.filter(c => !pinned.includes(c._id))];
  }, [activeConns, favs, pinned, tags, filter, search, skillFilter, sortBy, advF, atRisk]);

  const paginated = filtered.slice(0, page * PAGE);
  const hasMore   = paginated.length < filtered.length;

  /* ── Analytics ──────────────────────────────────────────────── */
  const analytics = useMemo(() => {
    const devs   = activeConns.filter(c => /developer|engineer|frontend|backend/i.test(c.role||''));
    const designs= activeConns.filter(c => /designer|ux|ui/i.test(c.role||''));
    const clients = activeConns.filter(c => /client|founder|ceo|manager/i.test(c.role||''));
    const total   = activeConns.length || 1;
    return {
      total:           activeConns.length,
      available:       activeConns.filter(c => c.availability==='available').length,
      avgRating:       activeConns.length ? (activeConns.reduce((s,c)=>s+(c.rating||0),0)/activeConns.length).toFixed(1) : 0,
      avgRate:         activeConns.length ? Math.round(activeConns.reduce((s,c)=>s+(c.hourlyRate||0),0)/activeConns.length) : 0,
      netValue,
      devCount:        devs.length,
      designCount:     designs.length,
      clientCount:     clients.length,
      atRiskCount:     atRisk.length,
      topCollabs:      activeConns.filter(c=>c.collabStatus==='accepted').length,
      pendingCollabs:  activeConns.filter(c=>c.collabStatus==='pending').length,
      favCount:        favs.length,
      topSkills:       Object.entries(skillMap).sort(([,a],[,b])=>b-a).slice(0,12),
      devPct:          Math.round((devs.length/total)*100),
      designPct:       Math.round((designs.length/total)*100),
      clientPct:       Math.round((clients.length/total)*100),
    };
  }, [activeConns, favs, netValue, atRisk, skillMap]);

  /* ── Connection actions ─────────────────────────────────────── */
  const sendRequest = async (userId, name) => {
    try {
      await api.post('/connections/request', { userId: sanS(userId) });
      setSentReqs(p => [...p, { userId, name }]);
      setSearchResults(p => p.filter(u => u._id !== userId));
      setSuggestions(p => p.filter(u => u._id !== userId));
      notify(`Request sent to ${sanS(name)}!`);
    } catch { notify('Failed to send request.', true); }
  };

  const acceptRequest = async (requestId, name) => {
    try {
      await api.post(`/connections/request/${requestId}/accept`);
      notify(`Connected with ${sanS(name)}!`);
      loadAll();
    } catch { notify('Failed to accept.', true); }
  };

  const rejectRequest = async (requestId) => {
    try {
      await api.post(`/connections/request/${requestId}/reject`);
      setRequests(p => p.filter(r => r._id !== requestId));
      notify('Request declined.');
    } catch { notify('Failed to decline.', true); }
  };

  const cancelRequest = async (id) => {
    try {
      await api.delete(`/connections/request/${id}`);
      setSentReqs(p => p.filter(r => r._id !== id));
      notify('Request cancelled.');
    } catch { notify('Failed.', true); }
  };

  const removeConnection = async (id, name) => {
    try {
      await api.delete(`/connections/${id}`);
      setConnections(p => p.filter(c => c._id !== id));
      notify(`${sanS(name)} removed.`);
    } catch { notify('Failed.', true); }
  };

  const archiveConnection = (id, name) => {
    const u = [...archived, id];
    setArchived(u); ls.set('cn_archived', u);
    notify(`${sanS(name)} archived from view.`);
  };

  const unarchive = (id) => {
    const u = archived.filter(a => a !== id);
    setArchived(u); ls.set('cn_archived', u);
    notify('Restored.');
  };

  const blockConnection = async () => {
    try {
      await api.post(`/connections/block/${blockModal._id}`);
      setConnections(p => p.filter(c => c._id !== blockModal._id));
      notify(`${sanS(blockModal.name)} blocked.`);
    } catch { notify('Failed.', true); }
    setBlockModal(null);
  };

  /* ── Bulk actions ───────────────────────────────────────────── */
  const toggleSel = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const selAll    = () => setSelected(filtered.map(c => c._id));
  const clrSel    = () => { setSelected([]); setBulkMode(false); };

  const bulkRemove = async () => {
    for (const id of selected) { try { await api.delete(`/connections/${id}`); } catch {} }
    setConnections(p => p.filter(c => !selected.includes(c._id)));
    notify(`${selected.length} removed.`); clrSel();
  };
  const bulkFav = () => {
    const u = [...new Set([...favs, ...selected])];
    setFavs(u); ls.set('cn_favs', u);
    notify(`${selected.length} added to favorites.`); clrSel();
  };
  const bulkTag = tagName => {
    const u = { ...tags };
    selected.forEach(id => { u[id] = tagName; });
    setTags(u); ls.set('cn_tags', u);
    notify(`Tagged ${selected.length} as "${tagName}".`); clrSel();
  };
  const bulkArchive = () => {
    const u = [...new Set([...archived, ...selected])];
    setArchived(u); ls.set('cn_archived', u);
    notify(`${selected.length} archived.`); clrSel();
  };
  const sendBulkMsg = async () => {
    if (!bulkMsg.trim()) return;
    for (const id of selected) { try { await api.post(`/connections/chat/${id}`, { message: san(bulkMsg) }); } catch {} }
    notify(`Message sent to ${selected.length} connections.`);
    setBulkMsgModal(false); setBulkMsg(''); clrSel();
  };

  /* ── Local helpers ──────────────────────────────────────────── */
  const toggleFav = id => {
    const u = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    setFavs(u); ls.set('cn_favs', u);
    notify(favs.includes(id) ? 'Removed from favorites.' : 'Added to favorites ★');
  };
  const togglePin = id => {
    const u = pinned.includes(id) ? pinned.filter(p => p !== id) : [...pinned, id];
    setPinned(u); ls.set('cn_pinned', u);
    notify(pinned.includes(id) ? 'Unpinned.' : 'Pinned to top.');
  };
  const openNote = conn => { setNoteModal(conn); setNoteText(notes[conn._id] || ''); };
  const saveNote = () => {
    const u = { ...notes, [noteModal._id]: san(noteText) };
    setNotes(u); ls.set('cn_notes', u);
    setNoteModal(null); notify('Note saved.');
  };
  const applyTag = (id, tagName) => {
    const u = tagName ? { ...tags, [id]: tagName }
      : Object.fromEntries(Object.entries(tags).filter(([k]) => k !== id));
    setTags(u); ls.set('cn_tags', u);
    setTagModal(null); notify(tagName ? `Tagged as "${tagName}".` : 'Tag removed.');
  };
  const saveReminder = () => {
    const u = { ...reminders, [reminderModal._id]: reminderDate };
    setReminders(u); ls.set('cn_reminders', u);
    setReminderModal(null); notify('Reminder set.');
  };
  const clearReminder = id => {
    const { [id]:_, ...u } = reminders;
    setReminders(u); ls.set('cn_reminders', u); notify('Reminder cleared.');
  };

  /* ── Interaction log ────────────────────────────────────────── */
  const logInteraction = () => {
    if (!logForm.note.trim() || !logModal) return;
    const entry = { type: logForm.type, note: san(logForm.note), date: logForm.date || new Date().toISOString().slice(0,10), ts: Date.now() };
    const u = { ...connTimeline, [logModal._id]: [entry, ...arr(connTimeline[logModal._id])].slice(0,50) };
    setConnTimeline(u); ls.set('cn_timeline', u);
    setLogModal(null); setLogForm({ type:'call', note:'', date:'' });
    notify('Interaction logged.');
  };

  /* ── Groups ─────────────────────────────────────────────────── */
  const createGroup = () => {
    if (!groupForm.name.trim()) return;
    const g = { id: Date.now(), name: sanS(groupForm.name), color: groupForm.color, members: selected };
    const u = [...groups, g]; setGroups(u); ls.set('cn_groups', u);
    setGroupModal(false); setGroupForm({ name:'', color:'#c9a84c' });
    notify(`Group "${g.name}" created.`); clrSel();
  };

  /* ── Recently viewed ────────────────────────────────────────── */
  const trackView = useCallback(conn => {
    setRecentViewed(prev => {
      const u = [conn, ...prev.filter(c => c._id !== conn._id)].slice(0, 8);
      ls.set('cn_recent', u); return u;
    });
  }, []);

  /* ── Profile modal ──────────────────────────────────────────── */
  const viewProfile = async conn => {
    trackView(conn);
    setProfileModal(conn);
    try {
      const d = await api.get(`/connections/profile/${conn._id}`);
      if (d?.profile || d?._id) setProfileModal(d?.profile || d);
    } catch {}
  };

  /* ── Chat ───────────────────────────────────────────────────── */
  const openChat = async conn => {
    setChatWith(conn); setChatLoad(true);
    try {
      const d = await api.get(`/connections/chat/${conn._id}`);
      setChatMsgs(arr(d?.messages || d));
    } catch { setChatMsgs([]); }
    finally { setChatLoad(false); }
  };
  const closeChat = () => {
    setChatWith(null); setChatMsgs([]);
    if (pollRef.current) clearInterval(pollRef.current);
  };
  const sendMsg = async () => {
    if (!chatInput.trim() || !chatWith) return;
    const txt = san(chatInput.trim()); setChatInput('');
    setChatMsgs(p => [...p, { sender:'me', text:txt, createdAt:new Date().toISOString() }]);
    try { await api.post(`/connections/chat/${chatWith._id}`, { message: txt }); }
    catch { notify('Message failed.', true); }
  };

  const CHAT_TEMPLATES = useMemo(() => [
    { label:'Quick hello',  text:`Hey ${chatWith?.name?.split(' ')[0]||'there'}! Hope you're well. Just reaching out to stay in touch.` },
    { label:'Collab ask',   text:`Hi! I have a project that might be a great fit for your skills. Would love to chat about it.` },
    { label:'Follow up',    text:`Hey! Following up on our last chat. Did you get a chance to look into that? Let me know!` },
    { label:'Referral',     text:`I have a client who needs exactly your skills. Can I connect you two? Quick intro, no commitment.` },
    { label:'Rate check',   text:`Quick question — are you available for a new project? If so, what's your current rate?` },
  ], [chatWith]);

  /* ── Collab / Referral ──────────────────────────────────────── */
  const sendCollab = async () => {
    if (!collabForm.message.trim()) return;
    try {
      await api.post('/connections/collab', {
        toUserId: collabModal._id,
        message:  san(collabForm.message),
        skill:    sanS(collabForm.project),
        rate:     collabForm.rate ? +collabForm.rate : undefined,
      });
      notify(`Collaboration request sent to ${sanS(collabModal.name)}!`);
    } catch { notify('Failed to send.', true); }
    setCollabModal(null); setCollabForm({ message:'', project:'', rate:'', timeline:'' });
  };
  const sendReferral = async () => {
    if (!refMsg.trim()) return;
    try {
      await api.post('/connections/referral', { toUserId: referralModal._id, message: san(refMsg) });
      notify(`Referral sent to ${sanS(referralModal.name)}!`);
    } catch { notify('Failed.', true); }
    setReferralModal(null); setRefMsg('');
  };

  /* ── Add connection ─────────────────────────────────────────── */
  const submitAdd = async () => {
    if (!addForm.name.trim()) { notify('Name is required.', true); return; }
    try {
      await api.post('/connections/invite-direct', {
        name:    sanS(addForm.name),
        email:   sanS(addForm.email),
        role:    sanS(addForm.role),
        skills:  sanS(addForm.skills),
        message: san(addForm.message),
      });
      notify(`Request sent to ${sanS(addForm.name)}!`);
      setAddModal(false); setAddForm({ name:'', email:'', role:'', skills:'', message:'' });
    } catch { notify('Failed to send.', true); }
  };

  /* ── Meeting ────────────────────────────────────────────────── */
  const scheduleMeeting = async () => {
    if (!meetingForm.date) { notify('Date is required.', true); return; }
    try {
      await api.post('/connections/meeting', { userId: meetingModal._id, ...meetingForm });
      notify(`Meeting scheduled with ${sanS(meetingModal.name)}!`);
    } catch { notify('Meeting saved locally.'); }
    // Log to timeline
    const entry = { type:'meeting', note: san(meetingForm.notes || `Meeting on ${meetingForm.date}`), date: meetingForm.date, ts: Date.now() };
    const u = { ...connTimeline, [meetingModal._id]: [entry, ...arr(connTimeline[meetingModal._id])].slice(0,50) };
    setConnTimeline(u); ls.set('cn_timeline', u);
    setMeetingModal(null); setMeetingForm({ date:'', time:'09:00', notes:'' });
  };

  /* ── Invite link ────────────────────────────────────────────── */
  const generateInvite = async () => {
    try {
      const d = await api.post('/connections/invite', {});
      const link = d?.link || `${window.location.origin}/join?ref=${d?.code||user?._id}`;
      setInviteLink(link); navigator.clipboard?.writeText(link); notify('Invite link copied!');
    } catch {
      const fb = `${window.location.origin}/join?ref=${user?._id}`;
      setInviteLink(fb); navigator.clipboard?.writeText(fb); notify('Invite link copied!');
    }
  };

  /* ── Tab pipeline ───────────────────────────────────────────── */
  const collabReqs = activeConns.filter(c => c.collabStatus);
  const filtAct    = actFilter === 'All' ? activity : activity.filter(a => a.type === actFilter);

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="cn-page">
      <Toast msg={toast.msg} err={toast.err}/>

      {/* ── REMINDER BANNER ────────────────────────────────── */}
      {dueReminders.length > 0 && (
        <div className="cn-reminder-banner">
          <FiClock size={13}/> Follow-up today:
          {dueReminders.map(c => (
            <button key={c._id} className="cn-reminder-pill" onClick={() => openChat(c)}>{c.name}</button>
          ))}
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="cn-header">
        <div className="cn-header-inner">
          <div className="cn-header-left">
            <h1 className="cn-title">Connections</h1>
            <p className="cn-sub">
              {activeConns.length} in network
              {netValue > 0 && <> · <span style={{ color:'var(--cn-gold)' }}>${netValue.toLocaleString()}/hr potential</span></>}
            </p>
          </div>
          <div className="cn-header-mid">
            <div className="cn-search-wrap">
              <FiSearch size={13} className="cn-search-icon"/>
              <input ref={searchRef} type="text" className="cn-search-input"
                placeholder="Search name, skill, role, location… (press /)"
                value={searchRaw} onChange={e => { setSearchRaw(e.target.value); setPage(1); }}/>
              {searchRaw && <button className="cn-search-x" onClick={() => { setSearchRaw(''); setSearchResults([]); }}><FiX size={11}/></button>}
            </div>
          </div>
          <div className="cn-header-right">
            <div className="cn-kb-row">
              <span className="cn-kb-chip">N</span> new
              <span className="cn-kb-chip">/</span> search
            </div>
            <button className="cn-hbtn cn-hbtn--gold" onClick={() => setAddModal(true)}><FiUserPlus size={12}/> Add</button>
            <button className="cn-hbtn" onClick={generateInvite}><FiLink size={12}/> Invite</button>
            <button className="cn-hbtn" onClick={() => exportCSV(activeConns.map(c=>({...c,_tag:tags[c._id]||''})), 'connections.csv')} title="Export CSV"><FiDownload size={12}/></button>
            <button className="cn-hbtn" onClick={() => setImportModal(true)} title="Import"><FiUpload size={12}/></button>
            <button className="cn-hbtn" onClick={() => { loadAll(); notify('Refreshed!'); }} title="Refresh"><FiRefreshCw size={12}/></button>
          </div>
        </div>

        {inviteLink && (
          <div className="cn-invite-bar">
            <FiLink size={11}/>
            <span className="cn-invite-url">{inviteLink}</span>
            <button className="cn-hbtn" style={{ padding:'3px 10px', fontSize:10 }} onClick={() => { navigator.clipboard?.writeText(inviteLink); notify('Copied!'); }}>Copy</button>
            <button className="cn-x-btn" onClick={() => setInviteLink('')}><FiX size={11}/></button>
          </div>
        )}

        <div className="cn-tabs">
          {TABS.map(t => {
            const badge = t.id==='requests' ? requests.length
              : t.id==='network'   ? activeConns.length
              : t.id==='pipeline'  ? collabReqs.length
              : 0;
            return (
              <button key={t.id} className={`cn-tab${tab===t.id?' on':''}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
                {badge > 0 && <span className="cn-tab-badge">{badge}</span>}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── STATS STRIP ────────────────────────────────────── */}
      <div className="cn-stats-strip">
        {[
          { l:'Connections',  v:activeConns.length,       icon:<FiUsers size={13}/>,       color:'var(--cn-gold)'  },
          { l:'Favorites',    v:favs.length,               icon:<FiStar size={13}/>,        color:'#e8c97a'         },
          { l:'Requests',     v:requests.length,           icon:<FiBell size={13}/>,        color:'#e08888'         },
          { l:'At-Risk',      v:atRisk.length,             icon:<FiAlertCircle size={13}/>, color:'#e8a030'         },
          { l:'Available Now',v:analytics.available,       icon:<FiZap size={13}/>,         color:'#7fcfaa'         },
          { l:'Net Value/hr', v:`$${netValue.toLocaleString()}`, icon:<FiDollarSign size={13}/>, color:'var(--cn-gold)' },
        ].map(({ l, v, icon, color }) => (
          <div className="cn-stat" key={l}>
            <div className="cn-stat-icon" style={{ color, background:`${color}18` }}>{icon}</div>
            <div>
              <div className="cn-stat-val">{v}</div>
              <div className="cn-stat-lbl">{l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ TAB: DISCOVER ══════════════════════════════════ */}
      {tab === 'discover' && (
        <div className="cn-tab-body">

          {/* Search results */}
          {(debSearch || searchResults.length > 0) && (
            <div className="cn-section">
              <div className="cn-section-hdr">
                <h2 className="cn-section-title"><FiSearch size={14}/> Search Results</h2>
                {searchResults.length > 0 && <span className="cn-count-badge">{searchResults.length} found</span>}
              </div>
              {searchResults.length === 0 && debSearch && <p className="cn-empty-msg">No users found for "{debSearch}".</p>}
              <div className="cn-list">
                {searchResults.map(u => {
                  const score = matchScore(u, userSkills);
                  return (
                    <div className="cn-list-item" key={u._id}>
                      <Avatar name={u.name} photo={u.photo} online={u.online}/>
                      <div className="cn-list-info">
                        <div className="cn-list-name">{u.name}</div>
                        <div className="cn-list-sub">
                          {u.role || 'Freelancer'}
                          {u.location && <> · <FiMapPin size={10}/> {u.location}</>}
                          {u.hourlyRate > 0 && <> · ${u.hourlyRate}/hr</>}
                        </div>
                        <div className="cn-sk-row">
                          {arr(u.skills).slice(0,4).map(s => <Sk key={s} s={s}/>)}
                          {userSkills.length > 0 && <MatchBadge score={score}/>}
                        </div>
                      </div>
                      <div className="cn-list-acts">
                        <button className="cn-btn ghost sm" onClick={() => viewProfile(u)}><FiUser size={11}/> Profile</button>
                        {connections.some(c => c._id === u._id)
                          ? <button className="cn-btn success sm" disabled><FiUserCheck size={11}/> Connected</button>
                          : sentReqs.some(r => r.userId === u._id)
                          ? <button className="cn-btn ghost sm" disabled><FiCheck size={11}/> Sent</button>
                          : <button className="cn-btn gold sm" onClick={() => sendRequest(u._id, u.name)}><FiUserPlus size={11}/> Connect</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recently viewed */}
          {recentViewed.length > 0 && !debSearch && (
            <div className="cn-section">
              <div className="cn-section-hdr">
                <h2 className="cn-section-title"><FiClock size={14}/> Recently Viewed</h2>
                <button className="cn-link-btn" onClick={() => { setRecentViewed([]); ls.set('cn_recent',[]); }}>Clear</button>
              </div>
              <div className="cn-recent-strip">
                {recentViewed.map(u => (
                  <button key={u._id} className="cn-recent-item" onClick={() => viewProfile(u)}>
                    <Avatar name={u.name} photo={u.photo} size={38} online={u.online}/>
                    <span className="cn-recent-name">{u.name?.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* At-risk alert */}
          {atRisk.length > 0 && !debSearch && (
            <div className="cn-section cn-section--alert">
              <div className="cn-section-hdr">
                <h2 className="cn-section-title"><FiAlertCircle size={14}/> At-Risk Connections <span style={{fontSize:11,color:'var(--cn-ts)',fontWeight:400}}>(no contact in 30+ days)</span></h2>
                <button className="cn-link-btn" onClick={() => { setTab('network'); setFilter('At-Risk'); }}>View all</button>
              </div>
              <div className="cn-list">
                {atRisk.slice(0,3).map(c => (
                  <div className="cn-list-item" key={c._id}>
                    <Avatar name={c.name} photo={c.photo} size={36}/>
                    <div className="cn-list-info">
                      <div className="cn-list-name">{c.name}</div>
                      <div className="cn-list-sub">{c.role||'Freelancer'} · Last contact: <span style={{color:'#e8a030'}}>{fmtDays(daysAgo(c.lastInteraction))}</span></div>
                    </div>
                    <div className="cn-list-acts">
                      <button className="cn-btn blue sm" onClick={() => openChat(c)}><FiMessageSquare size={11}/> Reach Out</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="cn-section">
            <div className="cn-section-hdr">
              <h2 className="cn-section-title"><FiZap size={14}/> People You May Know</h2>
              {loading && <span className="cn-pill-load">Loading…</span>}
              {userSkills.length > 0 && <span style={{fontSize:11,color:'var(--cn-ts)'}}>Matching your skills: {userSkills.slice(0,3).join(', ')}</span>}
            </div>
            {!loading && !suggestions.length && <p className="cn-empty-msg">No suggestions yet. Complete your profile for better matches.</p>}
            <div className="cn-sugg-grid">
              {suggestions.map(u => {
                const score = matchScore(u, userSkills);
                return (
                  <div className="cn-sugg-card" key={u._id}>
                    <div className="cn-sugg-top">
                      <Avatar name={u.name} photo={u.photo} size={44} online={u.online}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="cn-sugg-name">{u.name}</div>
                        <div className="cn-sugg-role">{u.role||'Freelancer'}</div>
                        {u.hourlyRate > 0 && <div className="cn-sugg-rate">${u.hourlyRate}/hr</div>}
                        {u.mutualConnections > 0 && <div className="cn-mutual">{u.mutualConnections} mutual</div>}
                      </div>
                      <MatchBadge score={score}/>
                    </div>
                    {u.reason && <div className="cn-sugg-reason">✦ {u.reason}</div>}
                    <div className="cn-sk-row" style={{ marginBottom:8 }}>{arr(u.skills).slice(0,3).map(s => <Sk key={s} s={s}/>)}</div>
                    <div className="cn-sugg-acts">
                      <button className="cn-btn ghost sm" onClick={() => viewProfile(u)}><FiUser size={11}/> Profile</button>
                      {sentReqs.some(r => r.userId === u._id)
                        ? <button className="cn-btn ghost sm" disabled><FiCheck size={11}/> Sent</button>
                        : <button className="cn-btn gold sm" onClick={() => sendRequest(u._id, u.name)}><FiUserPlus size={11}/> Connect</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sent requests */}
          {sentReqs.length > 0 && (
            <div className="cn-section">
              <div className="cn-section-hdr">
                <h2 className="cn-section-title"><FiSend size={14}/> Sent Requests</h2>
                <span className="cn-count-badge">{sentReqs.length}</span>
              </div>
              <div className="cn-list">
                {sentReqs.map(r => (
                  <div className="cn-list-item" key={r._id||r.userId}>
                    <Avatar name={r.name} photo={r.photo} size={36}/>
                    <div className="cn-list-info">
                      <div className="cn-list-name">{r.name||'Freelancer'}</div>
                      <span className="cn-badge-pending">Pending approval</span>
                    </div>
                    <div className="cn-list-acts">
                      <button className="cn-btn red sm" onClick={() => cancelRequest(r._id)}><FiX size={11}/> Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: NETWORK ═══════════════════════════════════ */}
      {tab === 'network' && (
        <div className="cn-tab-body">

          {/* Controls */}
          <div className="cn-controls-bar">
            <div className="cn-filters-row">
              {QUICK_FILTERS.map(f => (
                <button key={f} className={`cn-flt-btn${filter===f?' on':''}`}
                  onClick={() => { setFilter(f); setPage(1); }}>
                  {f === 'At-Risk' && atRisk.length > 0 && <span className="cn-flt-dot"/>}
                  {f}
                </button>
              ))}
            </div>
            <div className="cn-controls-right">
              <div className="cn-sort-wrap">
                <FiArrowDown size={11} style={{color:'var(--cn-tm)'}}/>
                <select className="cn-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  {SORT_OPTS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <button className={`cn-icon-btn${showAdvFilter?' on':''}`} onClick={() => setShowAdvFilter(p=>!p)} title="Advanced filters"><FiSliders size={13}/></button>
              <div className="cn-view-toggle">
                <button className={viewMode==='grid'?'on':''} onClick={() => setViewMode('grid')}><FiGrid size={12}/></button>
                <button className={viewMode==='list'?'on':''} onClick={() => setViewMode('list')}><FiList size={12}/></button>
              </div>
              <button className={`cn-icon-btn${bulkMode?' on':''}`} onClick={() => { setBulkMode(p=>!p); setSelected([]); }} title="Bulk select"><FiCheckSquare size={13}/></button>
              <button className="cn-icon-btn" onClick={() => setGroupModal(true)} title="Create group"><FiBookmark size={13}/></button>
              <button className="cn-icon-btn" onClick={() => setGapModal(true)} title="Skills gap analysis"><FiAlertCircle size={13}/></button>
              <div className="cn-sk-filter-wrap">
                <FiFilter size={11} style={{color:'var(--cn-tm)'}}/>
                <input type="text" className="cn-sk-filter-input" placeholder="Filter by skill…"
                  value={skillFilter} onChange={e => { setSkillFilter(e.target.value); setPage(1); }}/>
                {skillFilter && <button className="cn-search-x" onClick={() => setSkillFilter('')}><FiX size={10}/></button>}
              </div>
            </div>
          </div>

          {/* Advanced filter drawer */}
          {showAdvFilter && (
            <div className="cn-adv-drawer">
              <div className="cn-adv-grid">
                <div className="cn-adv-field">
                  <label>Availability</label>
                  <select value={advF.availability} onChange={e=>setAdvF(f=>({...f,availability:e.target.value}))}>
                    <option value="">Any</option>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="cn-adv-field">
                  <label>Location</label>
                  <input type="text" placeholder="e.g. Pakistan, London…" value={advF.location} onChange={e=>setAdvF(f=>({...f,location:e.target.value}))}/>
                </div>
                <div className="cn-adv-field">
                  <label>Min Rate ($/hr)</label>
                  <input type="number" min="0" placeholder="0" value={advF.minRate} onChange={e=>setAdvF(f=>({...f,minRate:e.target.value}))}/>
                </div>
                <div className="cn-adv-field">
                  <label>Max Rate ($/hr)</label>
                  <input type="number" min="0" placeholder="500" value={advF.maxRate} onChange={e=>setAdvF(f=>({...f,maxRate:e.target.value}))}/>
                </div>
              </div>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button className="cn-btn ghost sm" onClick={() => setAdvF({minRate:'',maxRate:'',location:'',availability:''})}>Clear</button>
                <span style={{fontSize:12,color:'var(--cn-tm)',alignSelf:'center'}}>{filtered.length} results</span>
              </div>
            </div>
          )}

          {/* Bulk bar */}
          {bulkMode && selected.length > 0 && (
            <div className="cn-bulk-bar">
              <span className="cn-bulk-count">{selected.length} selected</span>
              <div className="cn-bulk-acts">
                <button className="cn-btn ghost sm" onClick={() => setBulkMsgModal(true)}><FiMessageSquare size={11}/> Message All</button>
                <button className="cn-btn ghost sm" onClick={bulkFav}><FiStar size={11}/> Favorite</button>
                <button className="cn-btn ghost sm" onClick={bulkArchive}><FiDownload size={11}/> Archive</button>
                {ALL_TAGS.slice(0,3).map(t => (
                  <button key={t} className="cn-btn ghost sm" style={{fontSize:10}} onClick={() => bulkTag(t)}>{t}</button>
                ))}
                <button className="cn-btn red sm" onClick={bulkRemove}><FiTrash2 size={11}/> Remove</button>
                <button className="cn-btn ghost sm" onClick={clrSel}><FiX size={11}/> Cancel</button>
              </div>
              <button className="cn-btn ghost sm" onClick={selAll}>Select All ({filtered.length})</button>
            </div>
          )}

          {/* Groups strip */}
          {groups.length > 0 && (
            <div className="cn-groups-strip">
              {groups.map(g => (
                <button key={g.id} className="cn-group-pill" style={{borderColor:g.color,color:g.color}}>
                  {g.name} <span style={{opacity:.5}}>{arr(g.members).length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Pinned strip */}
          {pinned.length > 0 && filter !== 'Pinned' && (
            <div className="cn-section cn-section--pinned">
              <h2 className="cn-section-title"><FiBookmark size={13}/> Pinned</h2>
              <div className="cn-list">
                {activeConns.filter(c => pinned.includes(c._id)).map(c => (
                  <div className="cn-list-item" key={c._id} style={{gap:14}}>
                    <Avatar name={c.name} photo={c.photo} size={36} online={c.online}/>
                    <div className="cn-list-info">
                      <span className="cn-list-name">{c.name}</span>
                      <div className="cn-list-sub">{c.role||'Freelancer'}</div>
                    </div>
                    <div className="cn-list-acts">
                      <button className="cn-btn blue sm" onClick={() => openChat(c)}><FiMessageSquare size={10}/></button>
                      <button className="cn-btn ghost sm" onClick={() => viewProfile(c)}><FiUser size={10}/></button>
                      <button className="cn-icon-btn" onClick={() => togglePin(c._id)} title="Unpin"><FiBookmark size={11} style={{color:'var(--cn-gold)'}}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Network header */}
          <div className="cn-section">
            <div className="cn-net-hdr">
              <h2 className="cn-section-title" style={{margin:0,border:'none',padding:0}}>
                Your Network
                <span className="cn-count-pill">{loading?'…':`${paginated.length} / ${filtered.length}`}</span>
              </h2>
              {loading && <span className="cn-pill-load">Loading…</span>}
            </div>

            {!loading && filtered.length === 0 ? (
              <div className="cn-empty-state">
                <FiUsers size={34} style={{opacity:.2}}/>
                <h3>No connections found</h3>
                <p>{filter!=='All'||search||skillFilter ? 'Try adjusting your filters.' : 'Start building your network.'}</p>
                <button className="cn-btn gold" onClick={() => { setTab('discover'); setFilter('All'); setSkillFilter(''); }}>
                  Discover Freelancers
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <>
                <div className="cn-list-view">
                  {paginated.map(c => (
                    <ConnRow key={c._id} c={c}
                      isFav={favs.includes(c._id)} isPinned={pinned.includes(c._id)}
                      tag={tags[c._id]} note={notes[c._id]} reminder={reminders[c._id]}
                      isSelected={selected.includes(c._id)} bulkMode={bulkMode}
                      onSelect={() => toggleSel(c._id)}
                      onChat={() => openChat(c)} onProfile={() => viewProfile(c)}
                      onFav={() => toggleFav(c._id)} onPin={() => togglePin(c._id)}
                      onCollab={() => { setCollabModal(c); setCollabForm({message:'',project:'',rate:'',timeline:''}); }}
                      onReferral={() => { setReferralModal(c); setRefMsg(''); }}
                      onNote={() => openNote(c)} onMeeting={() => setMeetingModal(c)}
                      onReminder={() => { setReminderModal(c); setReminderDate(reminders[c._id]||''); }}
                      onTag={() => setTagModal(c)}
                      onLog={() => { setLogModal(c); setLogForm({type:'call',note:'',date:new Date().toISOString().slice(0,10)}); }}
                      onTimeline={() => setTimelineModal(c)}
                      onRemove={() => removeConnection(c._id, c.name)}
                      onArchive={() => archiveConnection(c._id, c.name)}
                      onBlock={() => setBlockModal(c)}/>
                  ))}
                </div>
                {hasMore && <div className="cn-load-more"><button className="cn-btn ghost" onClick={() => setPage(p=>p+1)}>Load More ({filtered.length-paginated.length} remaining)</button></div>}
              </>
            ) : (
              <>
                <div className="cn-grid">
                  {paginated.map(c => (
                    <ConnCard key={c._id} c={c}
                      isFav={favs.includes(c._id)} isPinned={pinned.includes(c._id)}
                      tag={tags[c._id]} note={notes[c._id]} reminder={reminders[c._id]}
                      timeline={arr(connTimeline[c._id])}
                      isSelected={selected.includes(c._id)} bulkMode={bulkMode}
                      onSelect={() => toggleSel(c._id)}
                      onChat={() => openChat(c)} onProfile={() => viewProfile(c)}
                      onFav={() => toggleFav(c._id)} onPin={() => togglePin(c._id)}
                      onCollab={() => { setCollabModal(c); setCollabForm({message:'',project:'',rate:'',timeline:''}); }}
                      onReferral={() => { setReferralModal(c); setRefMsg(''); }}
                      onNote={() => openNote(c)} onMeeting={() => setMeetingModal(c)}
                      onReminder={() => { setReminderModal(c); setReminderDate(reminders[c._id]||''); }}
                      onTag={() => setTagModal(c)}
                      onLog={() => { setLogModal(c); setLogForm({type:'call',note:'',date:new Date().toISOString().slice(0,10)}); }}
                      onTimeline={() => setTimelineModal(c)}
                      onRemove={() => removeConnection(c._id, c.name)}
                      onArchive={() => archiveConnection(c._id, c.name)}
                      onBlock={() => setBlockModal(c)}/>
                  ))}
                </div>
                {hasMore && <div className="cn-load-more"><button className="cn-btn ghost" onClick={() => setPage(p=>p+1)}>Load More ({filtered.length-paginated.length} remaining)</button></div>}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: PIPELINE ══════════════════════════════════ */}
      {tab === 'pipeline' && (
        <div className="cn-tab-body">
          <div className="cn-section">
            <h2 className="cn-section-title"><FiCode size={14}/> Collaboration Pipeline</h2>
            <div className="cn-pipeline-cols">
              {['pending','accepted','declined'].map(status => {
                const col = collabReqs.filter(c => c.collabStatus === status);
                const colors = { pending:'#e8c97a', accepted:'#7fcfaa', declined:'#e08888' };
                const totalRate = col.reduce((s,c) => s+(c.hourlyRate||0), 0);
                return (
                  <div className="cn-pipeline-col" key={status}>
                    <div className="cn-pipeline-col-hdr" style={{borderColor:colors[status]}}>
                      <div style={{display:'flex',alignItems:'center',gap:7}}>
                        <span style={{color:colors[status],fontWeight:600,fontSize:12,textTransform:'capitalize'}}>{status}</span>
                        <span className="cn-count-badge">{col.length}</span>
                      </div>
                      {totalRate > 0 && <span style={{fontSize:11,color:'var(--cn-tm)'}}>${totalRate}/hr total</span>}
                    </div>
                    {col.length === 0 && <p className="cn-empty-msg" style={{padding:'12px 0'}}>No {status} collabs.</p>}
                    {col.map(c => (
                      <div className="cn-pipeline-card" key={c._id}>
                        <Avatar name={c.name} photo={c.photo} size={32}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,color:'var(--cn-text)'}}>{c.name}</div>
                          <div style={{fontSize:11,color:'var(--cn-gold)'}}>{c.role||'Freelancer'}</div>
                          {c.hourlyRate > 0 && <div style={{fontSize:10,color:'var(--cn-ts)'}}>${c.hourlyRate}/hr</div>}
                        </div>
                        <button className="cn-icon-btn" onClick={() => openChat(c)}><FiMessageSquare size={12}/></button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Archived connections restore */}
          {archived.length > 0 && (
            <div className="cn-section">
              <div className="cn-section-hdr">
                <h2 className="cn-section-title"><FiDownload size={14}/> Archived Connections</h2>
                <span className="cn-count-badge">{archived.length}</span>
              </div>
              <div className="cn-list">
                {connections.filter(c => archived.includes(c._id)).map(c => (
                  <div className="cn-list-item" key={c._id}>
                    <Avatar name={c.name} photo={c.photo} size={36}/>
                    <div className="cn-list-info">
                      <div className="cn-list-name">{c.name}</div>
                      <div className="cn-list-sub">{c.role||'Freelancer'}</div>
                    </div>
                    <div className="cn-list-acts">
                      <button className="cn-btn ghost sm" onClick={() => unarchive(c._id)}><FiRepeat size={11}/> Restore</button>
                      <button className="cn-btn red sm" onClick={() => removeConnection(c._id, c.name)}><FiTrash2 size={11}/> Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: REQUESTS ══════════════════════════════════ */}
      {tab === 'requests' && (
        <div className="cn-tab-body">
          <div className="cn-section">
            <div className="cn-section-hdr">
              <h2 className="cn-section-title"><FiBell size={14}/> Incoming Requests</h2>
              <span className="cn-count-badge">{requests.length}</span>
            </div>
            {!requests.length
              ? <p className="cn-empty-msg">No pending requests.</p>
              : <div className="cn-list">
                  {requests.map(r => (
                    <div className="cn-list-item" key={r._id}>
                      <Avatar name={r.from?.name} photo={r.from?.photo} size={46}/>
                      <div className="cn-list-info">
                        <div className="cn-list-name">{r.from?.name||'Freelancer'}</div>
                        <div className="cn-list-sub" style={{color:'var(--cn-gold)'}}>{r.from?.title||r.from?.role||'Freelancer'}</div>
                        {r.from?.location && <div className="cn-list-sub"><FiMapPin size={10}/> {r.from.location}</div>}
                        {r.from?.hourlyRate > 0 && <div className="cn-list-sub">${r.from.hourlyRate}/hr</div>}
                        <div className="cn-sk-row">{arr(r.from?.skills).slice(0,3).map(s => <Sk key={s} s={s}/>)}</div>
                        {r.message && <div className="cn-req-msg">"{sanS(r.message)}"</div>}
                        {r.createdAt && <div style={{fontSize:10,color:'var(--cn-tm)',marginTop:2}}>{fmtDate(r.createdAt)}</div>}
                      </div>
                      <div className="cn-list-acts">
                        <button className="cn-btn ghost sm" onClick={() => viewProfile(r.from)}><FiUser size={11}/></button>
                        <button className="cn-btn success sm" onClick={() => acceptRequest(r._id, r.from?.name)}><FiCheck size={11}/> Accept</button>
                        <button className="cn-btn red sm" onClick={() => rejectRequest(r._id)}><FiX size={11}/> Decline</button>
                      </div>
                    </div>
                  ))}
                </div>}
          </div>

          {sentReqs.length > 0 && (
            <div className="cn-section">
              <div className="cn-section-hdr">
                <h2 className="cn-section-title"><FiSend size={14}/> Sent Requests</h2>
                <span className="cn-count-badge">{sentReqs.length}</span>
              </div>
              <div className="cn-list">
                {sentReqs.map(r => (
                  <div className="cn-list-item" key={r._id||r.userId}>
                    <Avatar name={r.name||r.to?.name} photo={r.photo} size={38}/>
                    <div className="cn-list-info">
                      <div className="cn-list-name">{r.name||r.to?.name||'Freelancer'}</div>
                      <span className="cn-badge-pending">Pending</span>
                    </div>
                    <div className="cn-list-acts">
                      <button className="cn-btn red sm" onClick={() => cancelRequest(r._id)}><FiX size={11}/> Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: ANALYTICS ═════════════════════════════════ */}
      {tab === 'analytics' && (
        <div className="cn-tab-body">
          <div className="cn-analytics-grid">
            {[
              { l:'Total Connections',  v:analytics.total,              color:'var(--cn-gold)' },
              { l:'Network Value/hr',   v:`$${netValue.toLocaleString()}`, color:'#7fcfaa'     },
              { l:'Avg Rating',         v:analytics.avgRating+'★',       color:'#e8c97a'       },
              { l:'Avg Hourly Rate',    v:`$${analytics.avgRate}`,        color:'#7db8e8'       },
              { l:'Active Collabs',     v:analytics.topCollabs,          color:'#c0a4f4'        },
              { l:'At-Risk',           v:analytics.atRiskCount,          color:'#e8a030'        },
            ].map(({ l, v, color }) => (
              <div className="cn-kpi" key={l}>
                <div className="cn-kpi-val" style={{color}}>{v}</div>
                <div className="cn-kpi-lbl">{l}</div>
              </div>
            ))}
          </div>

          {/* Breakdown bars */}
          <div className="cn-section">
            <h2 className="cn-section-title"><FiBarChart2 size={14}/> Network Breakdown</h2>
            <div className="cn-breakdown-list">
              {[
                { label:'Developers / Engineers', count:analytics.devCount,    pct:analytics.devPct,    color:'#7db8e8' },
                { label:'Designers / UX/UI',      count:analytics.designCount, pct:analytics.designPct, color:'#c0a4f4' },
                { label:'Clients / Founders',     count:analytics.clientCount, pct:analytics.clientPct, color:'#e8c97a' },
                { label:'Other Roles',            count:analytics.total-analytics.devCount-analytics.designCount-analytics.clientCount,
                  pct:Math.max(0,100-analytics.devPct-analytics.designPct-analytics.clientPct), color:'#7fcfaa' },
              ].filter(r => r.count > 0).map(r => (
                <div className="cn-breakdown-row" key={r.label}>
                  <div className="cn-breakdown-label">{r.label}</div>
                  <div className="cn-breakdown-bar-wrap">
                    <div className="cn-breakdown-bar" style={{width:`${r.pct}%`,background:r.color}}/>
                  </div>
                  <div className="cn-breakdown-count" style={{color:r.color}}>{r.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* At-Risk */}
          {atRisk.length > 0 && (
            <div className="cn-section">
              <div className="cn-section-hdr">
                <h2 className="cn-section-title"><FiAlertCircle size={14}/> At-Risk Connections</h2>
                <button className="cn-link-btn" onClick={() => { setTab('network'); setFilter('At-Risk'); }}>View in Network →</button>
              </div>
              <div className="cn-list">
                {atRisk.slice(0,5).map(c => (
                  <div className="cn-list-item" key={c._id}>
                    <Avatar name={c.name} photo={c.photo} size={34}/>
                    <div className="cn-list-info">
                      <div className="cn-list-name">{c.name}</div>
                      <div className="cn-list-sub">Last contact: <span style={{color:'#e8a030'}}>{fmtDays(daysAgo(c.lastInteraction))}</span></div>
                    </div>
                    <div className="cn-list-acts">
                      <button className="cn-btn blue sm" onClick={() => { openChat(c); setTab('network'); }}><FiMessageSquare size={11}/> Reach Out</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top skills */}
          <div className="cn-section">
            <div className="cn-section-hdr">
              <h2 className="cn-section-title"><FiTag size={14}/> Top Skills in Your Network</h2>
              <button className="cn-link-btn" onClick={() => setGapModal(true)}>Skills Gap →</button>
            </div>
            <div className="cn-skill-cloud">
              {analytics.topSkills.map(([skill, count]) => (
                <button key={skill} className="cn-skill-cloud-item"
                  style={{fontSize:Math.max(10,Math.min(16,10+count*1.5))}}
                  onClick={() => { setTab('network'); setSkillFilter(skill); }}>
                  {skill} <span style={{opacity:.5,fontSize:9}}>{count}</span>
                </button>
              ))}
              {!analytics.topSkills.length && <p className="cn-empty-msg">No skill data yet.</p>}
            </div>
          </div>

          {/* Activity feed */}
          <div className="cn-section">
            <div className="cn-act-hdr">
              <h2 className="cn-section-title" style={{margin:0,border:'none',padding:0}}><FiActivity size={14}/> Activity Feed</h2>
              <div className="cn-act-filter">
                <label>Type:</label>
                <select value={actFilter} onChange={e => setActFilter(e.target.value)}>
                  {['All','connection','request','referral','collab','chat'].map(v => (
                    <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            {!filtAct.length && <p className="cn-empty-msg">No recent activity.</p>}
            <div className="cn-activity-list">
              {filtAct.map((a, i) => (
                <div className="cn-activity-item" key={a._id||i}>
                  <div className="cn-activity-dot"/>
                  <div className="cn-activity-body">
                    <p className="cn-activity-msg">{a.message}</p>
                    <small>{new Date(a.createdAt||a.timestamp).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ CHAT PANEL ═══════════════════════════════════ */}
      {chatWith && (
        <div className="cn-chat-panel">
          <div className="cn-chat-head">
            <Avatar name={chatWith.name} photo={chatWith.photo} size={34}/>
            <div style={{flex:1,minWidth:0}}>
              <div className="cn-chat-name">{chatWith.name}</div>
              <div className="cn-chat-sub">{chatWith.role||'Freelancer'} {chatWith.hourlyRate > 0 && `· $${chatWith.hourlyRate}/hr`}</div>
            </div>
            <button className="cn-icon-btn" onClick={() => setShowTemplates(p=>!p)} title="Quick replies"><FiZap size={12}/></button>
            <button className="cn-icon-btn" onClick={() => navigate(`/profile/${chatWith._id}`)} title="View profile"><FiExternalLink size={12}/></button>
            <button className="cn-x-btn" onClick={closeChat}><FiX size={13}/></button>
          </div>

          {showTemplates && (
            <div className="cn-templates">
              {CHAT_TEMPLATES.map(t => (
                <button key={t.label} className="cn-template-btn"
                  onClick={() => { setChatInput(t.text); setShowTemplates(false); }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="cn-chat-msgs">
            {chatLoad && <p className="cn-chat-hint">Loading…</p>}
            {!chatLoad && !chatMsgs.length && (
              <div className="cn-chat-empty"><FiMessageSquare size={22}/><span>Say hello!</span></div>
            )}
            {chatMsgs.map((m, i) => (
              <div key={i} className={`cn-cmsg${(m.sender==='me'||m.isOwn)?' own':''}`}>
                <p>{sanS(m.text || m.message)}</p>
                <small>{new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small>
              </div>
            ))}
            {isTyping && <p className="cn-typing">{chatWith.name} is typing…</p>}
            <div ref={chatEndRef}/>
          </div>

          <div className="cn-chat-input-row">
            <input type="text" placeholder={`Message ${chatWith.name}…`} maxLength={2000}
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMsg(); } }}/>
            <button className="cn-chat-send" onClick={sendMsg} disabled={!chatInput.trim()}><FiSend size={13}/></button>
          </div>
        </div>
      )}

      {/* ══════════════ MODALS ══════════════════════════ */}

      {/* Profile */}
      {profileModal && (
        <Overlay onClose={() => setProfileModal(null)}>
          <div className="cn-modal cn-modal--lg">
            <ModalClose onClick={() => setProfileModal(null)}/>
            <div className="cn-profile-top">
              <Avatar name={profileModal.name} photo={profileModal.photo} size={66}/>
              <div>
                <h2 className="cn-profile-name">{profileModal.name}</h2>
                <div className="cn-profile-role">{profileModal.role||profileModal.title||'Freelancer'}</div>
                {profileModal.location && <div className="cn-profile-loc"><FiMapPin size={11}/> {profileModal.location}</div>}
                {profileModal.email    && <div className="cn-profile-loc"><FiMail size={11}/> <a href={`mailto:${profileModal.email}`} style={{color:'var(--cn-blue)',textDecoration:'none'}}>{profileModal.email}</a></div>}
                <div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                  <AvBadge status={profileModal.availability}/>
                  {profileModal.hourlyRate > 0 && <span style={{fontSize:12,color:'var(--cn-ts)'}}>${profileModal.hourlyRate}/hr</span>}
                  {tags[profileModal._id] && (() => { const cfg = TAG_CFG[tags[profileModal._id]]; return <span className="cn-tag-badge" style={{background:cfg?.bg,color:cfg?.color,borderColor:cfg?.bd}}>{tags[profileModal._id]}</span>; })()}
                </div>
              </div>
            </div>
            {profileModal.bio && <p className="cn-profile-bio">{profileModal.bio}</p>}
            {arr(profileModal.skills).length > 0 && (
              <div className="cn-sk-row" style={{flexWrap:'wrap',gap:6,marginBottom:14}}>
                {profileModal.skills.map(s => <Sk key={s} s={s}/>)}
              </div>
            )}
            <div className="cn-profile-stats">
              {[
                ['Projects', profileModal.projectsCollab||0],
                ['Referrals', profileModal.referrals||0],
                ['Rating', profileModal.rating||'—'],
                ['Since', profileModal.memberSince||'2024'],
                ['Strength', profileModal.strength ? `${profileModal.strength}/5` : '—'],
              ].map(([l,v]) => (
                <div className="cn-pstat" key={l}><span>{v}</span><label>{l}</label></div>
              ))}
            </div>
            {notes[profileModal._id] && (
              <div className="cn-profile-note">
                <div style={{fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--cn-tm)',marginBottom:5}}>Your Note</div>
                <p style={{fontSize:13,color:'var(--cn-ts)',lineHeight:1.6}}>{notes[profileModal._id]}</p>
              </div>
            )}
            <div className="cn-modal-actions">
              {connections.some(c => c._id === profileModal._id)
                ? <button className="cn-btn blue" onClick={() => { openChat(profileModal); setProfileModal(null); }}><FiMessageSquare size={12}/> Chat</button>
                : <button className="cn-btn gold" onClick={() => { sendRequest(profileModal._id, profileModal.name); setProfileModal(null); }}><FiUserPlus size={12}/> Connect</button>}
              <button className="cn-btn purple" onClick={() => { setCollabModal(profileModal); setCollabForm({message:'',project:'',rate:'',timeline:''}); setProfileModal(null); }}><FiCode size={12}/> Collaborate</button>
              <button className="cn-btn success" onClick={() => { setReferralModal(profileModal); setRefMsg(''); setProfileModal(null); }}><FiShare2 size={12}/> Refer</button>
              <button className="cn-btn ghost" onClick={() => { setMeetingModal(profileModal); setProfileModal(null); }}><FiCalendar size={12}/> Schedule</button>
              <button className="cn-btn ghost" onClick={() => { openNote(profileModal); setProfileModal(null); }}><FiEdit3 size={12}/> Note</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Note */}
      {noteModal && (
        <Overlay onClose={() => setNoteModal(null)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setNoteModal(null)}/>
            <h2 className="cn-modal-title"><FiEdit3 size={14}/> Note — {noteModal.name}</h2>
            <p className="cn-modal-hint">Private note, only visible to you.</p>
            <div className="cn-note-templates">
              {NOTE_TEMPLATES.map(t => (
                <button key={t.label} className="cn-note-tpl-btn"
                  onClick={() => setNoteText(t.text)}>
                  {t.label}
                </button>
              ))}
            </div>
            <textarea className="cn-modal-ta" rows={5}
              placeholder="E.g. Excellent React developer. Delivered ahead of schedule."
              value={noteText} onChange={e => setNoteText(e.target.value)} maxLength={1000}/>
            <div style={{fontSize:10.5,color:'var(--cn-tm)',marginTop:4}}>{noteText.length}/1000</div>
            <div className="cn-modal-footer">
              {notes[noteModal._id] && <button className="cn-btn red sm" onClick={() => { const u={...notes}; delete u[noteModal._id]; setNotes(u); ls.set('cn_notes',u); setNoteModal(null); notify('Note deleted.'); }}><FiTrash2 size={11}/> Delete</button>}
              <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                <button className="cn-btn ghost" onClick={() => setNoteModal(null)}>Cancel</button>
                <button className="cn-btn gold" onClick={saveNote}><FiCheck size={12}/> Save</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Tag */}
      {tagModal && (
        <Overlay onClose={() => setTagModal(null)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setTagModal(null)}/>
            <h2 className="cn-modal-title"><FiTag size={14}/> Tag — {tagModal.name}</h2>
            <p className="cn-modal-hint">Assign a label for quick identification.</p>
            <div className="cn-tag-grid">
              {ALL_TAGS.map(t => {
                const cfg = TAG_CFG[t];
                return (
                  <button key={t} className={`cn-tag-option${tags[tagModal._id]===t?' on':''}`}
                    style={{background:cfg.bg,color:cfg.color,borderColor:cfg.bd}}
                    onClick={() => applyTag(tagModal._id, tags[tagModal._id]===t ? null : t)}>
                    {t}
                  </button>
                );
              })}
            </div>
            {tags[tagModal._id] && <button className="cn-btn red sm" style={{marginTop:14}} onClick={() => applyTag(tagModal._id, null)}>Remove Tag</button>}
          </div>
        </Overlay>
      )}

      {/* Meeting */}
      {meetingModal && (
        <Overlay onClose={() => setMeetingModal(null)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setMeetingModal(null)}/>
            <h2 className="cn-modal-title"><FiCalendar size={14}/> Schedule Meeting — {meetingModal.name}</h2>
            <div className="cn-modal-field"><label>Date *</label><input type="date" value={meetingForm.date} onChange={e=>setMeetingForm(f=>({...f,date:e.target.value}))}/></div>
            <div className="cn-modal-field"><label>Time</label><input type="time" value={meetingForm.time} onChange={e=>setMeetingForm(f=>({...f,time:e.target.value}))}/></div>
            <div className="cn-modal-field"><label>Agenda / Notes</label><textarea rows={3} className="cn-modal-ta" placeholder="Topics to discuss, preparation notes…" value={meetingForm.notes} onChange={e=>setMeetingForm(f=>({...f,notes:e.target.value}))} maxLength={500}/></div>
            <div className="cn-modal-footer">
              <button className="cn-btn ghost sm" onClick={() => meetingForm.date && downloadICS(meetingModal.name, meetingForm.date, meetingForm.time, meetingForm.notes)} disabled={!meetingForm.date}>
                <FiDownload size={11}/> Export .ics
              </button>
              <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                <button className="cn-btn ghost" onClick={() => setMeetingModal(null)}>Cancel</button>
                <button className="cn-btn gold" onClick={scheduleMeeting} disabled={!meetingForm.date}><FiCalendar size={12}/> Schedule</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Reminder */}
      {reminderModal && (
        <Overlay onClose={() => setReminderModal(null)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setReminderModal(null)}/>
            <h2 className="cn-modal-title"><FiClock size={14}/> Follow-up Reminder — {reminderModal.name}</h2>
            <p className="cn-modal-hint">A banner will appear at the top of the page on this date.</p>
            <div className="cn-modal-field"><label>Reminder Date</label><input type="date" value={reminderDate} onChange={e=>setReminderDate(e.target.value)}/></div>
            <div className="cn-modal-footer">
              {reminders[reminderModal._id] && <button className="cn-btn red sm" onClick={() => { clearReminder(reminderModal._id); setReminderModal(null); }}>Clear</button>}
              <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                <button className="cn-btn ghost" onClick={() => setReminderModal(null)}>Cancel</button>
                <button className="cn-btn gold" onClick={saveReminder} disabled={!reminderDate}><FiCheck size={12}/> Set</button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {/* Collab — with rate negotiation helper */}
      {collabModal && (
        <Overlay onClose={() => setCollabModal(null)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setCollabModal(null)}/>
            <h2 className="cn-modal-title"><FiCode size={14}/> Collaborate — {collabModal.name}</h2>
            {collabModal.hourlyRate > 0 && (
              <div className="cn-collab-rate-hint">
                <FiDollarSign size={12}/> Their rate: <strong>${collabModal.hourlyRate}/hr</strong>
                <span className="cn-collab-rate-sub">You can suggest a project rate or split revenue.</span>
              </div>
            )}
            <div className="cn-modal-field"><label>Project / Skill Needed</label><input type="text" value={collabForm.project} onChange={e=>setCollabForm(f=>({...f,project:e.target.value}))} placeholder="e.g. UI design, React frontend, API…" maxLength={200}/></div>
            <div className="cn-f2-fields">
              <div className="cn-modal-field"><label>Budget / Rate Offer ($)</label><input type="number" min="0" value={collabForm.rate} onChange={e=>setCollabForm(f=>({...f,rate:e.target.value}))} placeholder={collabModal.hourlyRate||'hourly rate'}/></div>
              <div className="cn-modal-field"><label>Timeline</label><input type="text" value={collabForm.timeline} onChange={e=>setCollabForm(f=>({...f,timeline:e.target.value}))} placeholder="e.g. 2 weeks, 1 month…" maxLength={100}/></div>
            </div>
            <div className="cn-modal-field"><label>Message *</label><textarea rows={4} className="cn-modal-ta" value={collabForm.message} onChange={e=>setCollabForm(f=>({...f,message:e.target.value}))} placeholder="Describe the project, what you need, and why you think they'd be a great fit…" maxLength={1000}/></div>
            <div className="cn-modal-footer">
              <button className="cn-btn ghost" onClick={() => setCollabModal(null)}>Cancel</button>
              <button className="cn-btn purple" onClick={sendCollab} disabled={!collabForm.message.trim()}><FiSend size={12}/> Send Request</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Referral */}
      {referralModal && (
        <Overlay onClose={() => setReferralModal(null)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setReferralModal(null)}/>
            <h2 className="cn-modal-title"><FiShare2 size={14}/> Refer Client — {referralModal.name}</h2>
            <p className="cn-modal-hint">Send {referralModal.name} a client or project referral.</p>
            <div className="cn-modal-field"><label>Message *</label><textarea rows={4} className="cn-modal-ta" value={refMsg} onChange={e=>setRefMsg(e.target.value)} placeholder="E.g. Client needs a React dev, ~$4k budget. You'd be a great fit. Can I connect you?" maxLength={500}/></div>
            <div className="cn-modal-footer">
              <button className="cn-btn ghost" onClick={() => setReferralModal(null)}>Cancel</button>
              <button className="cn-btn success" onClick={sendReferral} disabled={!refMsg.trim()}><FiShare2 size={12}/> Send</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Log Interaction */}
      {logModal && (
        <Overlay onClose={() => setLogModal(null)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setLogModal(null)}/>
            <h2 className="cn-modal-title"><FiActivity size={14}/> Log Interaction — {logModal.name}</h2>
            <div className="cn-log-types">
              {[{v:'call',l:'📞 Call'},{v:'email',l:'✉️ Email'},{v:'meeting',l:'🤝 Meeting'},{v:'message',l:'💬 Message'},{v:'note',l:'📝 Note'}].map(t => (
                <button key={t.v} className={`cn-log-type-btn${logForm.type===t.v?' on':''}`}
                  onClick={() => setLogForm(f=>({...f,type:t.v}))}>{t.l}</button>
              ))}
            </div>
            <div className="cn-modal-field"><label>Date</label><input type="date" value={logForm.date} onChange={e=>setLogForm(f=>({...f,date:e.target.value}))}/></div>
            <div className="cn-modal-field"><label>Notes *</label><textarea rows={3} className="cn-modal-ta" value={logForm.note} onChange={e=>setLogForm(f=>({...f,note:e.target.value}))} placeholder="What was discussed? Any next steps or decisions?" maxLength={500}/></div>
            <div className="cn-modal-footer">
              <button className="cn-btn ghost" onClick={() => setLogModal(null)}>Cancel</button>
              <button className="cn-btn gold" onClick={logInteraction} disabled={!logForm.note.trim()}><FiCheck size={12}/> Log</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Per-connection timeline */}
      {timelineModal && (
        <Overlay onClose={() => setTimelineModal(null)}>
          <div className="cn-modal cn-modal--lg">
            <ModalClose onClick={() => setTimelineModal(null)}/>
            <h2 className="cn-modal-title"><FiClock size={14}/> Relationship Timeline — {timelineModal.name}</h2>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <button className="cn-btn gold sm" onClick={() => { setLogModal(timelineModal); setLogForm({type:'call',note:'',date:new Date().toISOString().slice(0,10)}); setTimelineModal(null); }}>
                <FiActivity size={11}/> Log Interaction
              </button>
            </div>
            {!arr(connTimeline[timelineModal._id]).length
              ? <p className="cn-empty-msg">No interactions logged yet. Use "Log Interaction" to track calls, meetings, and emails.</p>
              : <div className="cn-tl-list">
                  {arr(connTimeline[timelineModal._id]).map((e, i) => {
                    const icons = { call:'📞', email:'✉️', meeting:'🤝', message:'💬', note:'📝' };
                    return (
                      <div key={i} className="cn-tl-item">
                        <div className="cn-tl-dot"/>
                        <div>
                          <p className="cn-tl-msg"><span>{icons[e.type]||'·'}</span> {e.note}</p>
                          <small className="cn-tl-time">{fmtDate(e.date||e.ts)}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>}
          </div>
        </Overlay>
      )}

      {/* Skills gap modal */}
      {gapModal && (
        <Overlay onClose={() => setGapModal(false)}>
          <div className="cn-modal cn-modal--lg">
            <ModalClose onClick={() => setGapModal(false)}/>
            <h2 className="cn-modal-title"><FiAlertCircle size={14}/> Skills Gap Analysis</h2>
            <p className="cn-modal-hint">Skills well-covered in your network (green) vs areas where you might need more connections (amber).</p>
            {!Object.keys(skillMap).length
              ? <p className="cn-empty-msg">No skill data. Connect with more freelancers first.</p>
              : (
                <div className="cn-gap-grid">
                  {Object.entries(skillMap).sort(([,a],[,b])=>b-a).map(([skill, count]) => {
                    const pct   = Math.min(100, Math.round((count / Math.max(1, activeConns.length)) * 100));
                    const color = pct > 30 ? '#4caf82' : pct > 10 ? '#e8a030' : '#e05c5c';
                    return (
                      <div key={skill} className="cn-gap-item">
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                          <span style={{fontSize:12,color:'var(--cn-ts)'}}>{skill}</span>
                          <span style={{fontSize:11,color,fontWeight:600}}>{count} connection{count!==1?'s':''}</span>
                        </div>
                        <div className="cn-breakdown-bar-wrap">
                          <div className="cn-breakdown-bar" style={{width:`${pct}%`,background:color,transition:'width .4s ease'}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            <div className="cn-modal-footer" style={{marginTop:16}}>
              <button className="cn-btn gold" onClick={() => { setGapModal(false); setTab('discover'); }}>
                <FiZap size={12}/> Find Freelancers to Fill Gaps
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Add connection */}
      {addModal && (
        <Overlay onClose={() => setAddModal(false)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setAddModal(false)}/>
            <h2 className="cn-modal-title"><FiUserPlus size={14}/> Add Connection</h2>
            <div className="cn-modal-field"><label>Full Name *</label><input type="text" value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Zara Ahmed" maxLength={200}/></div>
            <div className="cn-modal-field"><label>Email</label><input type="email" value={addForm.email} onChange={e=>setAddForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" maxLength={200}/></div>
            <div className="cn-modal-field"><label>Role / Title</label><input type="text" value={addForm.role} onChange={e=>setAddForm(f=>({...f,role:e.target.value}))} placeholder="Frontend Developer, Designer…" maxLength={100}/></div>
            <div className="cn-modal-field"><label>Skills (comma separated)</label><input type="text" value={addForm.skills} onChange={e=>setAddForm(f=>({...f,skills:e.target.value}))} placeholder="React, Figma, Node.js" maxLength={300}/></div>
            <div className="cn-modal-field"><label>Message</label><textarea rows={3} className="cn-modal-ta" value={addForm.message} onChange={e=>setAddForm(f=>({...f,message:e.target.value}))} placeholder="Introduce yourself…" maxLength={500}/></div>
            <div className="cn-modal-footer">
              <button className="cn-btn ghost" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="cn-btn gold" onClick={submitAdd}><FiSend size={12}/> Send Request</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Import */}
      {importModal && (
        <Overlay onClose={() => setImportModal(false)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setImportModal(false)}/>
            <h2 className="cn-modal-title"><FiUpload size={14}/> Import Contacts</h2>
            <div className="cn-import-options">
              <div className="cn-import-opt">
                <FiUpload size={22} style={{color:'var(--cn-gold)'}}/>
                <strong>CSV File</strong>
                <p>Upload a CSV with Name, Email, Role, Skills columns.</p>
                <input type="file" accept=".csv" style={{fontSize:12,color:'var(--cn-tm)'}} onChange={() => { notify('CSV import coming soon.'); setImportModal(false); }}/>
              </div>
              <div className="cn-import-opt">
                <FiLink size={22} style={{color:'#0a66c2'}}/>
                <strong>LinkedIn</strong>
                <p>Upload your LinkedIn connections export.</p>
                <input type="file" accept=".csv" style={{fontSize:12,color:'var(--cn-tm)'}} onChange={() => { notify('LinkedIn import coming soon.'); setImportModal(false); }}/>
              </div>
            </div>
            <div className="cn-modal-footer">
              <button className="cn-btn ghost" onClick={() => setImportModal(false)}>Cancel</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Group */}
      {groupModal && (
        <Overlay onClose={() => setGroupModal(false)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setGroupModal(false)}/>
            <h2 className="cn-modal-title"><FiBookmark size={14}/> Create Group</h2>
            <div className="cn-modal-field"><label>Group Name *</label><input type="text" value={groupForm.name} onChange={e=>setGroupForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Design Team, Key Clients…" maxLength={100}/></div>
            <div className="cn-modal-field">
              <label>Colour</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}>
                {['#c9a84c','#9b72e8','#4caf82','#4a90d9','#e05c5c','#e8a030'].map(col => (
                  <button key={col} onClick={() => setGroupForm(f=>({...f,color:col}))}
                    style={{width:26,height:26,borderRadius:'50%',background:col,border:groupForm.color===col?'2px solid white':'2px solid transparent',cursor:'pointer'}}/>
                ))}
              </div>
            </div>
            {selected.length > 0 && <p className="cn-modal-hint">{selected.length} selected connections will be added.</p>}
            <div className="cn-modal-footer">
              <button className="cn-btn ghost" onClick={() => setGroupModal(false)}>Cancel</button>
              <button className="cn-btn gold" onClick={createGroup} disabled={!groupForm.name.trim()}>Create Group</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Bulk message */}
      {bulkMsgModal && (
        <Overlay onClose={() => setBulkMsgModal(false)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setBulkMsgModal(false)}/>
            <h2 className="cn-modal-title"><FiMessageSquare size={14}/> Message {selected.length} Connections</h2>
            <p className="cn-modal-hint">This message will be sent to all {selected.length} selected connections individually.</p>
            <div className="cn-modal-field"><label>Message *</label><textarea rows={5} className="cn-modal-ta" value={bulkMsg} onChange={e=>setBulkMsg(e.target.value)} placeholder="Write your message…" maxLength={1000}/></div>
            <div className="cn-modal-footer">
              <button className="cn-btn ghost" onClick={() => setBulkMsgModal(false)}>Cancel</button>
              <button className="cn-btn gold" onClick={sendBulkMsg} disabled={!bulkMsg.trim()}><FiSend size={12}/> Send to All</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Block confirm */}
      {blockModal && (
        <Overlay onClose={() => setBlockModal(null)}>
          <div className="cn-modal">
            <ModalClose onClick={() => setBlockModal(null)}/>
            <h2 className="cn-modal-title" style={{color:'var(--cn-red)'}}><FiAlertTriangle size={14}/> Block {blockModal.name}?</h2>
            <p className="cn-modal-hint">This removes the connection and prevents future contact. You can unblock in Settings.</p>
            <div className="cn-modal-footer">
              <button className="cn-btn ghost" onClick={() => setBlockModal(null)}>Cancel</button>
              <button className="cn-btn red" onClick={blockConnection}><FiAlertTriangle size={12}/> Block</button>
            </div>
          </div>
        </Overlay>
      )}

    </div>
  );
}

/* ── Modal helpers ──────────────────────────────────────────── */
function Overlay({ children, onClose }) {
  return <div className="cn-overlay" onClick={e => e.target===e.currentTarget&&onClose()}>{children}</div>;
}
function ModalClose({ onClick }) {
  return <button className="cn-modal-close" onClick={onClick}><FiX size={13}/></button>;
}

/* ── CONNECTION CARD (grid) ─────────────────────────────────── */
function ConnCard({
  c, isFav, isPinned, tag, note, reminder, timeline, isSelected, bulkMode,
  onSelect, onChat, onProfile, onFav, onPin, onCollab, onReferral,
  onNote, onMeeting, onReminder, onTag, onLog, onTimeline, onRemove, onArchive, onBlock,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const h = e => { if (menuRef.current&&!menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const tagCfg      = tag ? TAG_CFG[tag] : null;
  const daysNoContact = daysAgo(c.lastInteraction);

  return (
    <div className={`cn-card${isSelected?' selected':''}${isPinned?' pinned':''}`}
      onClick={bulkMode ? onSelect : undefined}>

      {bulkMode && (
        <div className="cn-card-checkbox" onClick={e => { e.stopPropagation(); onSelect(); }}>
          {isSelected ? <FiCheckSquare size={14} style={{color:'var(--cn-gold)'}}/> : <FiSquare size={14} style={{color:'var(--cn-tm)'}}/>}
        </div>
      )}

      <div className="cn-card-badges">
        {isPinned && <span className="cn-pin-badge"><FiBookmark size={9}/></span>}
        {reminder  && <span className="cn-reminder-badge" title="Reminder set"><FiClock size={9}/></span>}
        {tagCfg    && <span className="cn-tag-badge" style={{background:tagCfg.bg,color:tagCfg.color,borderColor:tagCfg.bd}}>{tag}</span>}
        <AtRiskBadge days={daysNoContact}/>
      </div>

      <div className="cn-card-top">
        <div className="cn-card-identity">
          <Avatar name={c.name} photo={c.photo} size={44} online={c.online}/>
          <div className="cn-card-meta">
            <div className="cn-card-name">{c.name}</div>
            <div className="cn-card-role">{c.role||c.title||'Freelancer'}</div>
            {c.location  && <div className="cn-card-loc"><FiMapPin size={9}/> {c.location}</div>}
            {c.hourlyRate > 0 && <div className="cn-card-rate">${c.hourlyRate}/hr</div>}
            {c.lastInteraction && <div className="cn-card-last">↩ {fmtDays(daysNoContact)}</div>}
          </div>
        </div>
        <div className="cn-card-top-right">
          <button className={`cn-fav-btn${isFav?' on':''}`} onClick={e=>{e.stopPropagation();onFav();}}>{isFav?'★':'☆'}</button>
          <div ref={menuRef} style={{position:'relative'}}>
            <button className="cn-more-btn" onClick={e=>{e.stopPropagation();setMenuOpen(p=>!p);}}><FiMoreVertical size={13}/></button>
            {menuOpen && (
              <div className="cn-dropdown">
                <button onClick={()=>{setMenuOpen(false);onProfile();}}><FiUser size={11}/> View Profile</button>
                <button onClick={()=>{setMenuOpen(false);onNote();}}><FiEdit3 size={11}/> {note?'Edit':'Add'} Note</button>
                <button onClick={()=>{setMenuOpen(false);onTag();}}><FiTag size={11}/> {tag?'Change Tag':'Add Tag'}</button>
                <button onClick={()=>{setMenuOpen(false);onPin();}}><FiBookmark size={11}/> {isPinned?'Unpin':'Pin to Top'}</button>
                <button onClick={()=>{setMenuOpen(false);onMeeting();}}><FiCalendar size={11}/> Schedule Meeting</button>
                <button onClick={()=>{setMenuOpen(false);onReminder();}}><FiClock size={11}/> Set Reminder</button>
                <button onClick={()=>{setMenuOpen(false);onLog();}}><FiActivity size={11}/> Log Interaction</button>
                <button onClick={()=>{setMenuOpen(false);onTimeline();}}><FiClock size={11}/> View Timeline {arr(timeline).length>0&&`(${arr(timeline).length})`}</button>
                <div style={{height:1,background:'rgba(255,255,255,.07)',margin:'3px 0'}}/>
                <button onClick={()=>{setMenuOpen(false);onArchive();}} style={{color:'var(--cn-ts)'}}><FiDownload size={11}/> Archive</button>
                <button onClick={()=>{setMenuOpen(false);onBlock();}} style={{color:'#e8a030'}}><FiAlertTriangle size={11}/> Block</button>
                <button className="danger" onClick={()=>{setMenuOpen(false);onRemove();}}><FiTrash2 size={11}/> Remove</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cn-sk-row">{arr(c.skills).slice(0,3).map(s => <Sk key={s} s={s}/>)}</div>

      <div className="cn-card-status-row">
        <AvBadge status={c.availability||'offline'}/>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {c.rating > 0 && <span className="cn-rating">{c.rating}★</span>}
          {c.mutualConnections > 0 && <span className="cn-mutual-badge">{c.mutualConnections} mutual</span>}
        </div>
      </div>

      {c.strength > 0 && <Strength level={c.strength}/>}

      {note && (
        <div className="cn-note-preview" onClick={e=>e.stopPropagation()}>
          {note.length > 80 ? note.slice(0,80)+'…' : note}
        </div>
      )}

      {arr(timeline).length > 0 && (
        <div className="cn-timeline-hint" onClick={e=>{e.stopPropagation();onTimeline();}}>
          <FiActivity size={9}/> {arr(timeline).length} interaction{arr(timeline).length!==1?'s':''} logged
        </div>
      )}

      <div className="cn-card-actions">
        <button className="cn-btn blue sm" onClick={e=>{e.stopPropagation();onChat();}}><FiMessageSquare size={10}/> Chat</button>
        <button className="cn-btn purple sm" onClick={e=>{e.stopPropagation();onCollab();}}><FiCode size={10}/> Collab</button>
        <button className="cn-btn success sm" onClick={e=>{e.stopPropagation();onReferral();}}><FiShare2 size={10}/> Refer</button>
      </div>
    </div>
  );
}

/* ── CONNECTION ROW (list view) ─────────────────────────────── */
function ConnRow({
  c, isFav, isPinned, tag, note, reminder, isSelected, bulkMode,
  onSelect, onChat, onProfile, onFav, onPin, onCollab, onReferral,
  onNote, onMeeting, onReminder, onTag, onLog, onTimeline, onRemove, onArchive, onBlock,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const h = e => { if (menuRef.current&&!menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const tagCfg      = tag ? TAG_CFG[tag] : null;
  const daysNoContact = daysAgo(c.lastInteraction);

  return (
    <div className={`cn-list-row${isSelected?' selected':''}`} onClick={bulkMode ? onSelect : undefined}>
      {bulkMode && (
        <div onClick={e=>{e.stopPropagation();onSelect();}} style={{flexShrink:0}}>
          {isSelected ? <FiCheckSquare size={14} style={{color:'var(--cn-gold)'}}/> : <FiSquare size={14} style={{color:'var(--cn-tm)'}}/>}
        </div>
      )}
      <Avatar name={c.name} photo={c.photo} size={40} online={c.online}/>
      <div className="cn-lr-info">
        <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
          <span className="cn-card-name" style={{fontSize:13.5}}>{c.name}</span>
          {isPinned && <FiBookmark size={10} style={{color:'var(--cn-gold)',opacity:.7}}/>}
          {reminder  && <FiClock size={10} style={{color:'#e8a030',opacity:.8}}/>}
          {tagCfg    && <span className="cn-tag-badge" style={{background:tagCfg.bg,color:tagCfg.color,borderColor:tagCfg.bd,fontSize:9}}>{tag}</span>}
          <AtRiskBadge days={daysNoContact}/>
        </div>
        <div className="cn-card-role" style={{fontSize:11.5}}>
          {c.role||'Freelancer'}
          {c.location ? ` · ${c.location}` : ''}
          {c.hourlyRate > 0 ? ` · $${c.hourlyRate}/hr` : ''}
        </div>
        <div className="cn-sk-row" style={{gap:3}}>{arr(c.skills).slice(0,4).map(s => <Sk key={s} s={s}/>)}</div>
      </div>
      <div className="cn-lr-status">
        <AvBadge status={c.availability||'offline'}/>
        {c.rating > 0 && <span className="cn-rating">{c.rating}★</span>}
        {c.lastInteraction && <span style={{fontSize:10,color:'var(--cn-tm)'}}>{fmtDays(daysNoContact)}</span>}
      </div>
      <div className="cn-lr-acts">
        <button className="cn-btn blue sm" onClick={e=>{e.stopPropagation();onChat();}}><FiMessageSquare size={10}/></button>
        <button className="cn-btn purple sm" onClick={e=>{e.stopPropagation();onCollab();}}><FiCode size={10}/></button>
        <button className={`cn-fav-btn${isFav?' on':''}`} onClick={e=>{e.stopPropagation();onFav();}}>{isFav?'★':'☆'}</button>
        <div ref={menuRef} style={{position:'relative'}}>
          <button className="cn-more-btn" onClick={e=>{e.stopPropagation();setMenuOpen(p=>!p);}}><FiMoreVertical size={13}/></button>
          {menuOpen && (
            <div className="cn-dropdown" style={{right:0,left:'auto'}}>
              <button onClick={()=>{setMenuOpen(false);onProfile();}}><FiUser size={11}/> Profile</button>
              <button onClick={()=>{setMenuOpen(false);onNote();}}><FiEdit3 size={11}/> {note?'Edit':'Add'} Note</button>
              <button onClick={()=>{setMenuOpen(false);onTag();}}><FiTag size={11}/> Tag</button>
              <button onClick={()=>{setMenuOpen(false);onPin();}}><FiBookmark size={11}/> {isPinned?'Unpin':'Pin'}</button>
              <button onClick={()=>{setMenuOpen(false);onMeeting();}}><FiCalendar size={11}/> Schedule</button>
              <button onClick={()=>{setMenuOpen(false);onReminder();}}><FiClock size={11}/> Reminder</button>
              <button onClick={()=>{setMenuOpen(false);onLog();}}><FiActivity size={11}/> Log</button>
              <button onClick={()=>{setMenuOpen(false);onTimeline();}}><FiClock size={11}/> Timeline</button>
              <div style={{height:1,background:'rgba(255,255,255,.07)',margin:'3px 0'}}/>
              <button onClick={()=>{setMenuOpen(false);onArchive();}}><FiDownload size={11}/> Archive</button>
              <button className="danger" onClick={()=>{setMenuOpen(false);onRemove();}}><FiTrash2 size={11}/> Remove</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}