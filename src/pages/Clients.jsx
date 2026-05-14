// src/pages/Clients.jsx — Production v4
// ──────────────────────────────────────────────────────────────
//  VIEWS:   Table · Kanban pipeline · Cards grid
//
//  STANDARD FEATURES:
//   KPI strip         · Sortable table · Inline status dropdown
//   Health score      · Payment health bar · Recency badge
//   Contract expiry alerts · Archive (soft-delete) vs hard-delete
//   Bulk actions      · Detail panel (profile/invoices/tasks/log/notes/timeline)
//   Communication log · Add calls/meetings/emails manually
//   Client tier badge (A/B/C/D) auto-calculated
//   Duplicate detection on create
//   Tags inline add/remove · Reminder banners · Portal link
//   Export CSV · Import modal · Email modal
//   Keyboard shortcuts: N=new  /=search  ESC=close
//   Revenue forecast (simple linear)
//   Input sanitization on all text fields
//
//  PREMIUM FEATURES:
//   ★ AI Client Intelligence — Anthropic API analysis per client
//     (health summary, risk flags, next-action recommendation)
//   ★ Revenue Forecast  — projection from invoice history
//   ★ Tier Segmentation — VIP/Growth/Standard/At-Risk badges
// ──────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiX, FiEdit3, FiTrash2,
  FiMail, FiPhone, FiGlobe, FiMapPin,
  FiDollarSign, FiCheckCircle, FiFileText, FiStar,
  FiChevronUp, FiChevronDown, FiRefreshCw,
  FiUsers, FiBriefcase, FiAlertCircle, FiCheck, FiMinus,
  FiActivity, FiDownload, FiUpload, FiGrid, FiList,
  FiTrendingUp, FiClock, FiLink, FiCopy, FiCalendar,
  FiTag, FiSliders, FiBarChart2,
  FiArrowUpRight, FiZap, FiSend, FiMessageSquare,
  FiArchive, FiEye, FiPhone as FiPhoneCall,
  FiCoffee, FiLock, FiRepeat,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Clients.css';

/* ── API ─────────────────────────────────────────────────────── */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tok  = () => localStorage.getItem('authToken');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` });
const api  = {
  get:    url      => fetch(`${BASE}${url}`, { headers: hdrs() }).then(r => r.json()),
  post:   (url, b) => fetch(`${BASE}${url}`, { method: 'POST',   headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  patch:  (url, b) => fetch(`${BASE}${url}`, { method: 'PATCH',  headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  delete: url      => fetch(`${BASE}${url}`, { method: 'DELETE', headers: hdrs() }).then(r => r.json()),
};

/* ── Security: sanitize text before storing/displaying ───────── */
const sanitize = str => String(str || '').replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;').trim().slice(0, 2000);
const sanitizeShort = str => String(str || '').replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;').trim().slice(0, 200);

/* ── localStorage helpers ────────────────────────────────────── */
const ls = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

/* ── Helpers ─────────────────────────────────────────────────── */
const arr     = v  => Array.isArray(v) ? v : [];
const fmt$    = n  => '$' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const initials = n => (n || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const daysAgo  = d => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;
const dLeft    = d => d ? Math.ceil((new Date(d) - Date.now()) / 86400000)  : null;
const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const fmtDateShort = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

/* ── Usecase: debounce search for performance ────────────────── */
function useDebounce(val, delay = 300) {
  const [dv, setDv] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDv(val), delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return dv;
}

/* ── Health score composite (0-100) ──────────────────────────── */
const healthScore = c => {
  let s = 0;
  const da = daysAgo(c.updatedAt || c.lastActivity);
  if (da !== null) s += da < 7 ? 30 : da < 30 ? 20 : da < 90 ? 10 : 0;
  const paidRatio = c.paidInvoices && c.invoiceCount ? c.paidInvoices / c.invoiceCount : 0;
  s += Math.round(paidRatio * 40);
  if (c.status === 'Active')      s += 20;
  if (c.status === 'In Progress') s += 15;
  if (c.status === 'Lead')        s += 10;
  if ((c.revenue || 0) > 0)      s += 10;
  return Math.min(100, s);
};

/* ── Client tier (A=VIP, B=Growth, C=Standard, D=At-Risk) ──── */
const clientTier = c => {
  const rev   = c.revenue || c.totalRevenue || 0;
  const score = healthScore(c);
  if (rev > 10000 && score >= 60) return 'A';
  if (rev > 3000  && score >= 40) return 'B';
  if (score >= 30)                return 'C';
  return 'D';
};

const TIER_CFG = {
  A: { label: 'VIP',      color: '#c9a84c', bg: 'rgba(201,168,76,.12)',  desc: 'High revenue, healthy relationship' },
  B: { label: 'Growth',   color: '#4a90d9', bg: 'rgba(74,144,217,.1)',   desc: 'Active, growing revenue'            },
  C: { label: 'Standard', color: '#8e8a82', bg: 'rgba(142,138,130,.1)',  desc: 'Active but lower engagement'        },
  D: { label: 'At-Risk',  color: '#e05c5c', bg: 'rgba(224,92,92,.1)',    desc: 'Inactive or low health score'       },
};

/* ── Revenue forecast: simple linear from monthly invoices ───── */
const revenueForcast = (invoices) => {
  if (!invoices.length) return null;
  const paid = arr(invoices).filter(i => i.status === 'paid');
  if (paid.length < 2) return null;
  const byMonth = {};
  paid.forEach(i => {
    const k = (i.issueDate || i.createdAt || '').slice(0, 7);
    if (k) byMonth[k] = (byMonth[k] || 0) + (i.total || 0);
  });
  const months = Object.values(byMonth).sort();
  const avg = months.reduce((s, v) => s + v, 0) / months.length;
  const trend = months.length > 1
    ? (months[months.length - 1] - months[0]) / (months.length - 1)
    : 0;
  return Math.max(0, Math.round(avg + trend));
};

/* ── Export CSV ──────────────────────────────────────────────── */
const exportCSV = clients => {
  const header = ['Name','Company','Email','Phone','Status','Tier','Revenue','Health','Location','Tags','Contract Status','Last Active'];
  const rows = clients.map(c => [
    c.name, c.company||'', c.email||'', c.phone||'', c.status||'',
    clientTier(c), c.revenue||0, healthScore(c), c.address||'',
    arr(c.tags).join('; '), c.contractStatus||'',
    c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv' });
  Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob), download: `clients-${new Date().toISOString().slice(0,10)}.csv`,
  }).click();
};

/* ── Anthropic AI (premium) ──────────────────────────────────── */
const askClaude = async (prompt) => {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 600,
      system: 'You are a senior business consultant analysing freelancer-client relationships. Be direct, specific, and actionable. Respond in JSON only.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const d = await r.json();
  const text = d.content?.map(b => b.text || '').join('') || '{}';
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()); }
  catch { return { summary: text, risks: [], actions: [] }; }
};

/* ── Constants ───────────────────────────────────────────────── */
const STATUS = {
  Active:        { c: '#4caf82', bg: 'rgba(76,175,130,.12)',  bd: 'rgba(76,175,130,.3)'  },
  'In Progress': { c: '#4a90d9', bg: 'rgba(74,144,217,.12)',  bd: 'rgba(74,144,217,.3)'  },
  Lead:          { c: '#9b72e8', bg: 'rgba(155,114,232,.12)', bd: 'rgba(155,114,232,.3)' },
  'On Hold':     { c: '#e8a030', bg: 'rgba(232,160,48,.12)',  bd: 'rgba(232,160,48,.3)'  },
  Completed:     { c: '#5a5650', bg: 'rgba(90,86,80,.15)',    bd: 'rgba(90,86,80,.3)'    },
  Archived:      { c: '#3a3835', bg: 'rgba(58,56,53,.2)',     bd: 'rgba(58,56,53,.4)'    },
};

const CONTRACT_STATUS = {
  Active:  { c: '#4caf82', bg: 'rgba(76,175,130,.1)'  },
  Pending: { c: '#e8a030', bg: 'rgba(232,160,48,.1)'  },
  Expired: { c: '#e05c5c', bg: 'rgba(224,92,92,.1)'   },
  None:    { c: '#4a4843', bg: 'rgba(255,255,255,.04)' },
};

const COMM_TYPES = [
  { id: 'call',    label: 'Call',    icon: '📞', color: '#4caf82'  },
  { id: 'email',   label: 'Email',   icon: '✉️', color: '#4a90d9'  },
  { id: 'meeting', label: 'Meeting', icon: '🤝', color: '#9b72e8'  },
  { id: 'note',    label: 'Note',    icon: '📝', color: '#e8a030'  },
];

const AVATAR_PAL = [
  ['#c9a84c','#6b4514'],['#4a90d9','#0f2d4a'],['#4caf82','#0f3d28'],
  ['#9b72e8','#2d1460'],['#e05c5c','#4a1010'],['#38bdf8','#083250'],
];
const avatarGrad = name => AVATAR_PAL[(name || '').charCodeAt(0) % AVATAR_PAL.length];

const blankForm = () => ({
  name:'', email:'', phone:'', company:'', website:'',
  status:'Active', tags:'', notes:'', address:'',
  hourlyRate:'', projectBudget:'', contractValue:'',
  contractExpiry:'', contractStatus:'None', source:'',
  priority:'Normal',
});

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Toast({ show, msg, err }) {
  if (!show) return null;
  return (
    <div className={`cl-toast${err ? ' err' : ''}`}>
      {err ? <FiAlertCircle size={13}/> : <FiCheckCircle size={13}/>} {msg}
    </div>
  );
}

function Avatar({ name, size = 36 }) {
  const [a, b] = avatarGrad(name);
  return (
    <div className="cl-av" style={{
      width: size, height: size, fontSize: Math.round(size * .36),
      background: `linear-gradient(135deg,${a},${b})`,
    }}>
      {initials(name)}
    </div>
  );
}

function StatusPill({ status, onClick, size = 'md' }) {
  const s = STATUS[status] || STATUS['On Hold'];
  return (
    <button className={`cl-pill cl-pill--${size}`} onClick={onClick}
      style={{ color: s.c, background: s.bg, borderColor: s.bd }}>
      <span className="cl-pill-dot" style={{ background: s.c }}/>
      {status}
      {onClick && <FiChevronDown size={9} style={{ marginLeft: 4, opacity: .6 }}/>}
    </button>
  );
}

function TierBadge({ tier }) {
  const cfg = TIER_CFG[tier] || TIER_CFG.C;
  return (
    <span className="cl-tier-badge" style={{ color: cfg.color, background: cfg.bg }} title={cfg.desc}>
      {tier} · {cfg.label}
    </span>
  );
}

function HealthBar({ paid = 0, total = 0 }) {
  if (!total) return <span className="cl-dash">—</span>;
  const pct   = Math.round((paid / total) * 100);
  const color = pct >= 80 ? '#4caf82' : pct >= 40 ? '#e8a030' : '#e05c5c';
  return (
    <div className="cl-hbar-wrap" title={`${paid}/${total} invoices paid`}>
      <div className="cl-hbar-track">
        <div className="cl-hbar-fill" style={{ width: `${pct}%`, background: color }}/>
      </div>
      <span className="cl-hbar-pct" style={{ color }}>{pct}%</span>
    </div>
  );
}

function HealthScore({ score }) {
  const color = score >= 70 ? '#4caf82' : score >= 40 ? '#e8a030' : '#e05c5c';
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'At Risk' : 'Inactive';
  return (
    <div className="cl-score-wrap" title={`Health: ${score}/100`}>
      <div className="cl-score-ring" style={{ '--pct': score, '--clr': color }}>
        <span style={{ color, fontSize: 10, fontWeight: 700 }}>{score}</span>
      </div>
      <span className="cl-score-lbl" style={{ color }}>{label}</span>
    </div>
  );
}

function Recency({ date }) {
  const d = daysAgo(date);
  if (d === null) return <span className="cl-rec none">—</span>;
  const label = d === 0 ? 'Today' : d === 1 ? 'Yesterday'
    : d < 7 ? `${d}d ago` : d < 30 ? `${Math.floor(d/7)}w ago`
    : d < 365 ? `${Math.floor(d/30)}mo ago` : `${Math.floor(d/365)}y ago`;
  const cls = d < 7 ? 'fresh' : d < 30 ? 'warm' : 'cold';
  return <span className={`cl-rec ${cls}`}>{label}</span>;
}

/* ── Sparkline SVG ───────────────────────────────────────────── */
function Sparkline({ values = [], color = '#c9a84c', width = 60, height = 22 }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${x},${y}`;
  }).join(' ');
  const area = `M ${pts.split(' ').join(' L ')} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function Clients() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const isPremium  = user?.plan === 'premium';

  /* ── Data state ──────────────────────────────────────────── */
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  /* ── UI state ────────────────────────────────────────────── */
  const [viewMode,    setViewMode]    = useState('table');
  const [searchRaw,   setSearchRaw]   = useState('');
  const search = useDebounce(searchRaw, 280);
  const [activeTab,   setActiveTab]   = useState('all');
  const [sortCol,     setSortCol]     = useState('name');
  const [sortDir,     setSortDir]     = useState('asc');
  const [selected,    setSelected]    = useState(new Set());
  const [statusMenu,  setStatusMenu]  = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [advFilter,   setAdvFilter]   = useState({ minRevenue:'', maxRevenue:'', source:'', priority:'', contractStatus:'', tier:'' });
  const searchRef = useRef(null);

  /* ── Reminders ────────────────────────────────────────────── */
  const [reminders, setReminders] = useState(() => ls.get('cl_reminders', {}));

  /* ── Detail panel ─────────────────────────────────────────── */
  const [detail,      setDetail]      = useState(null);
  const [detailTab,   setDetailTab]   = useState('profile');
  const [detailInv,   setDetailInv]   = useState([]);
  const [detailTasks, setDetailTasks] = useState([]);
  const [detailLoad,  setDetailLoad]  = useState(false);
  const [inlineNote,  setInlineNote]  = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [newTag,      setNewTag]      = useState('');
  const [addingTag,   setAddingTag]   = useState(false);

  /* ── Communication log (localStorage, per-client) ─────────── */
  const [commLog,    setCommLog]    = useState([]);
  const [newComm,    setNewComm]    = useState({ type:'call', note:'', date: new Date().toISOString().slice(0,10) });
  const [addingComm, setAddingComm] = useState(false);

  /* ── AI Insights (premium) ────────────────────────────────── */
  const [aiInsight,     setAiInsight]     = useState(null);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiError,       setAiError]       = useState('');

  /* ── Drawer ───────────────────────────────────────────────── */
  const [drawer,  setDrawer]  = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(blankForm());
  const [saving,  setSaving]  = useState(false);
  const [dupWarn, setDupWarn] = useState(null);

  /* ── Modals ───────────────────────────────────────────────── */
  const [delTarget,     setDelTarget]     = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [importModal,   setImportModal]   = useState(false);
  const [reminderModal, setReminderModal] = useState(null);
  const [reminderDate,  setReminderDate]  = useState('');
  const [emailModal,    setEmailModal]    = useState(null);
  const [emailForm,     setEmailForm]     = useState({ subject:'', body:'' });
  const [portalCopied,  setPortalCopied]  = useState(null);
  const [forecastModal, setForecastModal] = useState(null);

  /* ── Toast ────────────────────────────────────────────────── */
  const [toast, setToast] = useState({ show: false, msg: '', err: false });
  const showToast = useCallback((msg, err = false) => {
    setToast({ show: true, msg, err });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  /* ── Load clients ─────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/clients?limit=300');
      setClients(arr(r.clients || r));
    } catch { showToast('Failed to load clients.', true); }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  /* ── Keyboard shortcuts ───────────────────────────────────── */
  useEffect(() => {
    const h = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' && !drawer) { e.preventDefault(); openNew(); }
      if (e.key === '/' && !showFilters) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') {
        if (emailModal) setEmailModal(null);
        else if (drawer) setDrawer(false);
        else if (detail) setDetail(null);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [drawer, detail, emailModal, showFilters]); // eslint-disable-line

  /* ── Load detail data ─────────────────────────────────────── */
  useEffect(() => {
    if (!detail) return;
    setInlineNote(detail.notes || '');
    setEditingNote(false);
    setAddingTag(false);
    setNewTag('');
    setAiInsight(null);
    setAiError('');
    setAddingComm(false);
    setCommLog(ls.get(`cl_comm_${detail._id}`, []));
    (async () => {
      setDetailLoad(true);
      const [ir, tr] = await Promise.allSettled([
        api.get(`/invoices?clientId=${detail._id}&limit=20`),
        api.get(`/tasks?clientId=${detail._id}&limit=20`),
      ]);
      if (ir.status === 'fulfilled') setDetailInv(arr(ir.value.invoices || ir.value));
      if (tr.status === 'fulfilled') setDetailTasks(arr(tr.value.tasks || tr.value));
      setDetailLoad(false);
    })();
  }, [detail?._id]); // eslint-disable-line

  /* ── Due reminders ────────────────────────────────────────── */
  const dueToday = useMemo(() => {
    const today = new Date().toDateString();
    return Object.entries(reminders)
      .filter(([, d]) => d && new Date(d).toDateString() === today)
      .map(([id]) => clients.find(c => c._id === id))
      .filter(Boolean);
  }, [reminders, clients]);

  /* ── Expiring contracts (within 14 days) ─────────────────── */
  const expiringContracts = useMemo(() =>
    clients.filter(c => {
      if (!c.contractExpiry || c.contractStatus !== 'Active') return false;
      const dl = dLeft(c.contractExpiry);
      return dl !== null && dl >= 0 && dl <= 14;
    }),
  [clients]);

  /* ── Filter + sort ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let res = clients.filter(c => {
      if (!showArchived && c.status === 'Archived') return false;
      if (showArchived && c.status !== 'Archived')  return false;
      if (activeTab !== 'all' && c.status !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        if (![c.name, c.email, c.company, ...arr(c.tags)].some(v => (v||'').toLowerCase().includes(q))) return false;
      }
      if (advFilter.minRevenue && (c.revenue||0) < +advFilter.minRevenue) return false;
      if (advFilter.maxRevenue && (c.revenue||0) > +advFilter.maxRevenue) return false;
      if (advFilter.source   && c.source !== advFilter.source)     return false;
      if (advFilter.priority && c.priority !== advFilter.priority) return false;
      if (advFilter.contractStatus && c.contractStatus !== advFilter.contractStatus) return false;
      if (advFilter.tier && clientTier(c) !== advFilter.tier)      return false;
      return true;
    });

    res.sort((a, b) => {
      let av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
      if (sortCol === 'revenue') { av = a.revenue || 0; bv = b.revenue || 0; }
      if (sortCol === 'health')  { av = healthScore(a); bv = healthScore(b); }
      if (sortCol === 'tier')    { av = clientTier(a);  bv = clientTier(b); }
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return res;
  }, [clients, activeTab, search, sortCol, sortDir, advFilter, showArchived]);

  /* ── KPI totals ───────────────────────────────────────────── */
  const kpi = useMemo(() => {
    const active = clients.filter(c => c.status !== 'Archived');
    return {
      total:       active.length,
      activeCount: active.filter(c => c.status === 'Active').length,
      leads:       active.filter(c => c.status === 'Lead').length,
      revenue:     active.reduce((s, c) => s + (c.revenue || c.totalRevenue || 0), 0),
      outstanding: active.reduce((s, c) => s + (c.outstanding || c.unpaidRevenue || 0), 0),
      vip:         active.filter(c => clientTier(c) === 'A').length,
    };
  }, [clients]);

  const tabCounts = useMemo(() => ({
    all:           clients.filter(c => c.status !== 'Archived').length,
    Active:        clients.filter(c => c.status === 'Active').length,
    Lead:          clients.filter(c => c.status === 'Lead').length,
    'In Progress': clients.filter(c => c.status === 'In Progress').length,
    'On Hold':     clients.filter(c => c.status === 'On Hold').length,
    Completed:     clients.filter(c => c.status === 'Completed').length,
  }), [clients]);

  /* ── Sort ─────────────────────────────────────────────────── */
  const sortToggle = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const SortIco = ({ col }) => (
    <span className="cl-sort-ico">
      {sortCol === col
        ? (sortDir === 'asc' ? <FiChevronUp size={11}/> : <FiChevronDown size={11}/>)
        : <span className="cl-sort-both"><FiChevronUp size={9}/><FiChevronDown size={9}/></span>}
    </span>
  );

  /* ── Select ───────────────────────────────────────────────── */
  const allSel    = filtered.length > 0 && filtered.every(c => selected.has(c._id));
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(filtered.map(c => c._id)));
  const toggleSel = id => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  /* ── Bulk actions ─────────────────────────────────────────── */
  const bulkStatus = async status => {
    const ids = [...selected];
    await Promise.all(ids.map(id => api.patch(`/clients/${id}`, { status })));
    setClients(p => p.map(c => selected.has(c._id) ? { ...c, status } : c));
    setSelected(new Set());
    showToast(`${ids.length} client${ids.length > 1 ? 's' : ''} updated.`);
  };
  const bulkExport = () => exportCSV(filtered.filter(c => selected.has(c._id)));
  const bulkDelete = async () => {
    for (const id of [...selected]) {
      try { await api.delete(`/clients/${id}`); } catch {}
    }
    setClients(p => p.filter(c => !selected.has(c._id)));
    showToast(`${selected.size} clients deleted.`);
    setSelected(new Set());
  };

  /* ── Duplicate check ──────────────────────────────────────── */
  const checkDuplicate = email => {
    if (!email) return null;
    return clients.find(c => c.email?.toLowerCase() === email.toLowerCase() && c._id !== editing?._id) || null;
  };

  /* ── Save ─────────────────────────────────────────────────── */
  const openNew  = () => { setEditing(null); setForm(blankForm()); setDupWarn(null); setDrawer(true); };
  const openEdit = c  => {
    setEditing(c);
    setDupWarn(null);
    setForm({
      name:           sanitizeShort(c.name),
      email:          sanitizeShort(c.email),
      phone:          sanitizeShort(c.phone),
      company:        sanitizeShort(c.company),
      website:        sanitizeShort(c.website),
      status:         c.status || 'Active',
      tags:           arr(c.tags).join(', '),
      notes:          sanitize(c.notes),
      address:        sanitizeShort(c.address),
      hourlyRate:     c.hourlyRate || '',
      projectBudget:  c.projectBudget || '',
      contractValue:  c.contractValue || '',
      contractExpiry: c.contractExpiry?.slice(0, 10) || '',
      contractStatus: c.contractStatus || 'None',
      source:         sanitizeShort(c.source),
      priority:       c.priority || 'Normal',
    });
    setDrawer(true);
  };

  const save = async e => {
    e.preventDefault();
    const name = sanitizeShort(form.name);
    if (!name.trim()) { showToast('Name is required.', true); return; }

    // duplicate detection
    const dup = checkDuplicate(form.email);
    if (dup && !dupWarn) { setDupWarn(dup); return; }

    setSaving(true);
    const payload = {
      name,
      email:         sanitizeShort(form.email),
      phone:         sanitizeShort(form.phone),
      company:       sanitizeShort(form.company),
      website:       sanitizeShort(form.website),
      status:        form.status,
      tags:          form.tags ? form.tags.split(',').map(s => sanitizeShort(s).trim()).filter(Boolean) : [],
      notes:         sanitize(form.notes),
      address:       sanitizeShort(form.address),
      source:        sanitizeShort(form.source),
      priority:      form.priority,
      contractStatus:form.contractStatus,
      hourlyRate:    form.hourlyRate    ? +form.hourlyRate    : undefined,
      projectBudget: form.projectBudget ? +form.projectBudget : undefined,
      contractValue: form.contractValue ? +form.contractValue : undefined,
      contractExpiry:form.contractExpiry || undefined,
    };

    try {
      if (editing) {
        const r = await api.patch(`/clients/${editing._id}`, payload);
        const u = r.client || r;
        setClients(p => p.map(c => c._id === editing._id ? u : c));
        if (detail?._id === editing._id) setDetail(u);
        showToast('Client updated.');
      } else {
        const r = await api.post('/clients', payload);
        setClients(p => [...p, r.client || r]);
        showToast('Client created.');
      }
      setDrawer(false); setDupWarn(null);
    } catch { showToast('Save failed.', true); }
    setSaving(false);
  };

  /* ── Delete / Archive ─────────────────────────────────────── */
  const archiveClient = async client => {
    try {
      const r = await api.patch(`/clients/${client._id}`, { status: 'Archived' });
      const u = r.client || { ...client, status: 'Archived' };
      setClients(p => p.map(c => c._id === client._id ? u : c));
      if (detail?._id === client._id) setDetail(null);
      showToast(`${client.name} archived.`);
    } catch { showToast('Archive failed.', true); }
    setArchiveTarget(null);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/clients/${delTarget._id}`);
      setClients(p => p.filter(c => c._id !== delTarget._id));
      if (detail?._id === delTarget._id) setDetail(null);
      showToast('Client permanently deleted.');
    } catch { showToast('Delete failed.', true); }
    setDelTarget(null);
  };

  const unarchive = async client => {
    try {
      const r = await api.patch(`/clients/${client._id}`, { status: 'Active' });
      const u = r.client || { ...client, status: 'Active' };
      setClients(p => p.map(c => c._id === client._id ? u : c));
      showToast(`${client.name} restored.`);
    } catch { showToast('Restore failed.', true); }
  };

  /* ── Inline status patch ──────────────────────────────────── */
  const patchStatus = async (client, status) => {
    setStatusMenu(null);
    setClients(p => p.map(c => c._id === client._id ? { ...c, status } : c));
    if (detail?._id === client._id) setDetail(d => ({ ...d, status }));
    try { await api.patch(`/clients/${client._id}`, { status }); }
    catch { load(); showToast('Status update failed.', true); }
  };

  /* ── Save note inline ─────────────────────────────────────── */
  const saveNote = async () => {
    const notes = sanitize(inlineNote);
    try {
      const r = await api.patch(`/clients/${detail._id}`, { notes });
      const u = r.client || { ...detail, notes };
      setClients(p => p.map(c => c._id === detail._id ? u : c));
      setDetail(u); setEditingNote(false);
      showToast('Note saved.');
    } catch { showToast('Failed.', true); }
  };

  /* ── Add/remove tag inline ────────────────────────────────── */
  const addTagInline = async () => {
    const tag = sanitizeShort(newTag).toLowerCase();
    if (!tag || !detail) return;
    const updated = [...new Set([...arr(detail.tags), tag])];
    try {
      const r = await api.patch(`/clients/${detail._id}`, { tags: updated });
      const u = r.client || { ...detail, tags: updated };
      setClients(p => p.map(c => c._id === detail._id ? u : c));
      setDetail(u); setNewTag(''); setAddingTag(false);
      showToast('Tag added.');
    } catch { showToast('Failed.', true); }
  };
  const removeTagInline = async tag => {
    const updated = arr(detail.tags).filter(t => t !== tag);
    try {
      const r = await api.patch(`/clients/${detail._id}`, { tags: updated });
      const u = r.client || { ...detail, tags: updated };
      setClients(p => p.map(c => c._id === detail._id ? u : c));
      setDetail(u);
    } catch { showToast('Failed.', true); }
  };

  /* ── Communication log ────────────────────────────────────── */
  const addCommEntry = () => {
    if (!newComm.note.trim() || !detail) return;
    const entry = {
      id: Date.now(), ...newComm,
      note: sanitize(newComm.note),
      ts: new Date().toISOString(),
    };
    const updated = [entry, ...commLog];
    setCommLog(updated);
    ls.set(`cl_comm_${detail._id}`, updated);
    setNewComm({ type: 'call', note: '', date: new Date().toISOString().slice(0, 10) });
    setAddingComm(false);
    showToast('Interaction logged.');
  };
  const delCommEntry = id => {
    const updated = commLog.filter(e => e.id !== id);
    setCommLog(updated);
    if (detail) ls.set(`cl_comm_${detail._id}`, updated);
  };

  /* ── Reminder ─────────────────────────────────────────────── */
  const saveReminder = () => {
    const u = { ...reminders, [reminderModal._id]: reminderDate };
    setReminders(u); ls.set('cl_reminders', u);
    setReminderModal(null); showToast('Reminder set.');
  };
  const clearReminder = id => {
    const { [id]: _, ...u } = reminders;
    setReminders(u); ls.set('cl_reminders', u);
    showToast('Reminder cleared.');
  };

  /* ── Portal link ─────────────────────────────────────────── */
  const copyPortalLink = client => {
    navigator.clipboard?.writeText(`${window.location.origin}/portal/${client._id}`);
    setPortalCopied(client._id);
    setTimeout(() => setPortalCopied(null), 2200);
    showToast('Portal link copied!');
  };

  /* ── Send email ───────────────────────────────────────────── */
  const sendEmail = async () => {
    try {
      await api.post('/clients/email', { clientId: emailModal._id, ...emailForm });
      showToast(`Email sent to ${emailModal.name}!`);
    } catch {
      window.open(`mailto:${emailModal.email}?subject=${encodeURIComponent(emailForm.subject)}&body=${encodeURIComponent(emailForm.body)}`);
      showToast('Opened in mail client.');
    }
    setEmailModal(null); setEmailForm({ subject: '', body: '' });
  };

  /* ── AI Insights (premium) ────────────────────────────────── */
  const generateInsight = async () => {
    if (!isPremium) return;
    setAiLoading(true); setAiError('');
    const paidR = detail.paidInvoices && detail.invoiceCount
      ? Math.round((detail.paidInvoices / detail.invoiceCount) * 100) : null;
    const prompt = `Analyse this freelancer-client relationship and return JSON with keys:
      summary (2 sentences), risks (array of up to 3 short strings), actions (array of up to 3 actionable strings), sentiment (one of: positive/neutral/negative).
      Data: name="${detail.name}", company="${detail.company||'N/A'}", status="${detail.status}",
      health_score=${healthScore(detail)}, tier="${clientTier(detail)}",
      revenue=$${detail.revenue||0}, outstanding=$${detail.outstanding||0},
      payment_rate=${paidR !== null ? paidR+'%' : 'unknown'},
      last_active="${daysAgo(detail.updatedAt||detail.lastActivity)} days ago",
      contract="${detail.contractStatus||'None'}", notes="${(detail.notes||'').slice(0,200)}".`;
    try {
      const res = await askClaude(prompt);
      setAiInsight(res);
    } catch { setAiError('AI unavailable — check your connection.'); }
    setAiLoading(false);
  };

  /* ── Revenue forecast modal ───────────────────────────────── */
  const openForecast = () => {
    const forecast = revenueForcast(detailInv);
    setForecastModal({ client: detail, forecast, invoices: detailInv });
  };

  /* ── Kanban groups ────────────────────────────────────────── */
  const kanbanCols = useMemo(() =>
    Object.keys(STATUS).filter(s => s !== 'Archived').map(s => ({
      status: s, clients: filtered.filter(c => c.status === s),
    })),
  [filtered]);

  /* ── Revenue sparkline data per-client (from invoices cache) ─ */
  const clientSparkline = useCallback(client => {
    const byMonth = {};
    arr(detailInv.filter(i => i.status === 'paid')).forEach(i => {
      const k = (i.issueDate || '').slice(0, 7);
      if (k) byMonth[k] = (byMonth[k] || 0) + (i.total || 0);
    });
    return Object.entries(byMonth).sort().slice(-6).map(([, v]) => v);
  }, [detailInv]);

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="cl-root" onClick={() => setStatusMenu(null)}>
      <Toast {...toast}/>

      {/* ── REMINDER BANNER ──────────────────────────────── */}
      {dueToday.length > 0 && (
        <div className="cl-reminder-banner">
          <FiClock size={13}/> Follow-up due today:
          {dueToday.map(c => (
            <button key={c._id} className="cl-reminder-pill"
              onClick={() => { setDetail(c); setDetailTab('profile'); }}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* ── CONTRACT EXPIRY ALERT ─────────────────────────── */}
      {expiringContracts.length > 0 && (
        <div className="cl-contract-alert">
          <FiAlertCircle size={13}/> {expiringContracts.length} contract{expiringContracts.length > 1 ? 's' : ''} expiring soon:
          {expiringContracts.map(c => (
            <button key={c._id} className="cl-reminder-pill" style={{ borderColor: 'rgba(224,92,92,.4)', color: '#e05c5c' }}
              onClick={() => { setDetail(c); setDetailTab('profile'); }}>
              {c.name} — {dLeft(c.contractExpiry)}d
            </button>
          ))}
        </div>
      )}

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="cl-header">
        <div className="cl-header-l">
          <h1 className="cl-title">Clients</h1>
          <span className="cl-total-pill">{kpi.total}</span>
          {clients.filter(c => c.status === 'Archived').length > 0 && (
            <button className={`cl-archive-toggle${showArchived ? ' active' : ''}`}
              onClick={() => { setShowArchived(p => !p); setActiveTab('all'); }}>
              <FiArchive size={12}/> {showArchived ? 'View Active' : `Archived (${clients.filter(c=>c.status==='Archived').length})`}
            </button>
          )}
        </div>
        <div className="cl-header-r">
          <div className="cl-kb-hints">
            <span className="cl-kb-chip">N</span> new
            <span className="cl-kb-chip">/</span> search
          </div>
          <button className="cl-icon-btn" onClick={load} title="Refresh"><FiRefreshCw size={14}/></button>
          <button className="cl-icon-btn" onClick={() => exportCSV(filtered)} title="Export CSV"><FiDownload size={14}/></button>
          <button className="cl-icon-btn" onClick={() => setImportModal(true)} title="Import"><FiUpload size={14}/></button>
          <div className="cl-view-toggle">
            <button className={viewMode === 'table'  ? 'on' : ''} onClick={() => setViewMode('table')}  title="Table"><FiList size={13}/></button>
            <button className={viewMode === 'cards'  ? 'on' : ''} onClick={() => setViewMode('cards')}  title="Cards"><FiGrid size={13}/></button>
            <button className={viewMode === 'kanban' ? 'on' : ''} onClick={() => setViewMode('kanban')} title="Pipeline"><FiBarChart2 size={13}/></button>
          </div>
          <button className="cl-primary-btn" onClick={openNew}><FiPlus size={14}/> New Client</button>
        </div>
      </div>

      {/* ── KPI STRIP ────────────────────────────────────── */}
      <div className="cl-kpi-strip">
        {[
          { label: 'Total Clients',  value: kpi.total,              icon: <FiUsers size={14}/>,      color: 'var(--cl-gold)',  sub: 'in your CRM'        },
          { label: 'Active',         value: kpi.activeCount,         icon: <FiZap size={14}/>,         color: '#4caf82',        sub: 'working now'        },
          { label: 'VIP (A-Tier)',   value: kpi.vip,                 icon: <FiStar size={14}/>,        color: '#c9a84c',        sub: 'top revenue clients' },
          { label: 'Leads',          value: kpi.leads,               icon: <FiTrendingUp size={14}/>,  color: '#9b72e8',        sub: 'in pipeline'        },
          { label: 'Total Revenue',  value: fmt$(kpi.revenue),       icon: <FiDollarSign size={14}/>, color: 'var(--cl-gold)', sub: 'all time earned'    },
          { label: 'Outstanding',    value: fmt$(kpi.outstanding),   icon: <FiAlertCircle size={14}/>, color: '#e8a030',        sub: 'unpaid invoices'    },
        ].map(({ label, value, icon, color, sub }) => (
          <div className="cl-kpi" key={label}>
            <div className="cl-kpi-icon" style={{ color, background: `${color}18` }}>{icon}</div>
            <div className="cl-kpi-body">
              <div className="cl-kpi-val" style={{ color }}>{value}</div>
              <div className="cl-kpi-lbl">{label}</div>
              <div className="cl-kpi-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH + TABS + FILTERS ──────────────────────── */}
      <div className="cl-controls">
        <div className="cl-controls-top">
          <div className="cl-search-wrap">
            <FiSearch size={13} className="cl-search-ico"/>
            <input ref={searchRef} className="cl-search" value={searchRaw}
              onChange={e => setSearchRaw(e.target.value)}
              placeholder="Search name, email, company, tag… (press /)"/>
            {searchRaw && <button className="cl-search-clr" onClick={() => setSearchRaw('')}><FiX size={12}/></button>}
          </div>
          <button className={`cl-icon-btn${showFilters ? ' on' : ''}`}
            onClick={() => setShowFilters(p => !p)} title="Advanced filters">
            <FiSliders size={14}/>
          </button>
        </div>
        {!showArchived && (
          <div className="cl-tabs">
            {Object.entries(tabCounts).map(([tab, count]) => (
              <button key={tab} className={`cl-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}>
                {tab === 'all' ? 'All' : tab}
                <span className="cl-tab-n">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="cl-adv-filter">
          <div className="cl-adv-grid">
            <div className="cl-adv-field"><label>Min Revenue ($)</label><input type="number" value={advFilter.minRevenue} onChange={e=>setAdvFilter(f=>({...f,minRevenue:e.target.value}))} placeholder="0"/></div>
            <div className="cl-adv-field"><label>Max Revenue ($)</label><input type="number" value={advFilter.maxRevenue} onChange={e=>setAdvFilter(f=>({...f,maxRevenue:e.target.value}))} placeholder="Any"/></div>
            <div className="cl-adv-field">
              <label>Tier</label>
              <select value={advFilter.tier} onChange={e=>setAdvFilter(f=>({...f,tier:e.target.value}))}>
                <option value="">Any</option>
                {Object.entries(TIER_CFG).map(([t,{label}]) => <option key={t} value={t}>{t} — {label}</option>)}
              </select>
            </div>
            <div className="cl-adv-field">
              <label>Priority</label>
              <select value={advFilter.priority} onChange={e=>setAdvFilter(f=>({...f,priority:e.target.value}))}>
                <option value="">Any</option>
                <option>High</option><option>Normal</option><option>Low</option>
              </select>
            </div>
            <div className="cl-adv-field">
              <label>Contract</label>
              <select value={advFilter.contractStatus} onChange={e=>setAdvFilter(f=>({...f,contractStatus:e.target.value}))}>
                <option value="">Any</option>
                {Object.keys(CONTRACT_STATUS).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="cl-adv-field"><label>Source</label><input value={advFilter.source} onChange={e=>setAdvFilter(f=>({...f,source:e.target.value}))} placeholder="e.g. Referral"/></div>
          </div>
          <button className="cl-btn-ghost sm" onClick={() => setAdvFilter({minRevenue:'',maxRevenue:'',source:'',priority:'',contractStatus:'',tier:''})}>
            Clear Filters
          </button>
        </div>
      )}

      {/* ── BULK BAR ──────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="cl-bulk-bar">
          <span className="cl-bulk-n">{selected.size} selected</span>
          <span className="cl-bulk-sep"/>
          <span className="cl-bulk-lbl">Move to:</span>
          {Object.keys(STATUS).filter(s => s !== 'Archived').map(s => (
            <button key={s} className="cl-bulk-s-btn"
              style={{ color: STATUS[s].c, background: STATUS[s].bg, borderColor: `${STATUS[s].c}50` }}
              onClick={() => bulkStatus(s)}>{s}</button>
          ))}
          <span className="cl-bulk-sep"/>
          <button className="cl-bulk-action-btn" onClick={bulkExport}><FiDownload size={11}/> Export</button>
          <button className="cl-bulk-action-btn" onClick={() => bulkStatus('Archived')}><FiArchive size={11}/> Archive</button>
          <button className="cl-bulk-action-btn danger" onClick={bulkDelete}><FiTrash2 size={11}/> Delete</button>
          <button className="cl-bulk-clr" onClick={() => setSelected(new Set())}><FiX size={11}/> Clear</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          LAYOUT WRAPPER
      ══════════════════════════════════════════════════ */}
      <div className={`cl-layout${detail ? ' split' : ''}`}>

        {/* ═══ TABLE VIEW ═══════════════════════════════ */}
        {viewMode === 'table' && (
          <div className="cl-table-section">
            {loading ? (
              <div className="cl-loading"><div className="cl-spin"/><span>Loading clients…</span></div>
            ) : !filtered.length ? (
              <div className="cl-empty">
                <FiUsers size={38}/>
                <strong>{search || activeTab !== 'all' ? 'No matches' : showArchived ? 'No archived clients' : 'No clients yet'}</strong>
                <p>{search ? 'Try a different search.' : showArchived ? 'Archive clients instead of deleting them.' : 'Add your first client to start managing relationships.'}</p>
                {!search && !showArchived && activeTab === 'all' && (
                  <button className="cl-primary-btn" onClick={openNew}><FiPlus size={13}/> Add First Client</button>
                )}
              </div>
            ) : (
              <div className="cl-table-outer">
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th className="cl-th th-check">
                        <button className={`cl-cb${allSel ? ' on' : ''}`} onClick={toggleAll}>
                          {allSel ? <FiCheck size={9}/> : <FiMinus size={9} style={{ opacity: .25 }}/>}
                        </button>
                      </th>
                      <th className="cl-th th-sortable" onClick={() => sortToggle('name')}>Client <SortIco col="name"/></th>
                      <th className="cl-th th-sortable" onClick={() => sortToggle('company')}>Company <SortIco col="company"/></th>
                      <th className="cl-th th-sortable" onClick={() => sortToggle('status')}>Status <SortIco col="status"/></th>
                      <th className="cl-th th-sortable" onClick={() => sortToggle('tier')}>Tier <SortIco col="tier"/></th>
                      <th className="cl-th th-sortable" onClick={() => sortToggle('health')}>Health <SortIco col="health"/></th>
                      <th className="cl-th">Payment</th>
                      <th className="cl-th th-sortable" onClick={() => sortToggle('revenue')}>Revenue <SortIco col="revenue"/></th>
                      <th className="cl-th th-sortable" onClick={() => sortToggle('updatedAt')}>Last Active <SortIco col="updatedAt"/></th>
                      <th className="cl-th">Contract</th>
                      <th className="cl-th th-actions"/>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const revenue  = c.revenue || c.totalRevenue || 0;
                      const paidInv  = c.paidInvoices || 0;
                      const totalInv = c.invoiceCount || c.totalInvoices || 0;
                      const isSel    = selected.has(c._id);
                      const isActive = detail?._id === c._id;
                      const score    = healthScore(c);
                      const tier     = clientTier(c);
                      const tierCfg  = TIER_CFG[tier];
                      const hasDue   = reminders[c._id];
                      const isArchived = c.status === 'Archived';

                      return (
                        <tr key={c._id}
                          className={`cl-tr${isSel ? ' sel' : ''}${isActive ? ' active' : ''}${isArchived ? ' archived-row' : ''}`}
                          style={{ animationDelay: `${i * .018}s` }}
                          onClick={() => { setDetail(c); setDetailTab('profile'); }}>

                          <td className="cl-td td-check" onClick={e => { e.stopPropagation(); toggleSel(c._id); }}>
                            <button className={`cl-cb${isSel ? ' on' : ''}`}>{isSel && <FiCheck size={9}/>}</button>
                          </td>

                          <td className="cl-td td-client">
                            <div className="cl-client-cell">
                              <div style={{ position: 'relative' }}>
                                <Avatar name={c.name} size={34}/>
                                {hasDue && <span className="cl-reminder-dot" title="Follow-up today"/>}
                              </div>
                              <div className="cl-client-info">
                                <span className="cl-client-name">{c.name}</span>
                                {c.email && <span className="cl-client-email">{c.email}</span>}
                                {arr(c.tags).length > 0 && (
                                  <div className="cl-tags-row">
                                    {arr(c.tags).slice(0, 2).map((t, j) => <span key={j} className="cl-tag sm">{t}</span>)}
                                    {arr(c.tags).length > 2 && <span className="cl-tag-more">+{arr(c.tags).length - 2}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="cl-td td-company">
                            {c.company
                              ? <span className="cl-company"><FiBriefcase size={11}/>{c.company}</span>
                              : <span className="cl-dash">—</span>}
                          </td>

                          <td className="cl-td td-status" onClick={e => e.stopPropagation()}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <StatusPill status={c.status || 'Active'}
                                onClick={e => { e.stopPropagation(); setStatusMenu(statusMenu === c._id ? null : c._id); }}/>
                              {statusMenu === c._id && (
                                <div className="cl-status-dd" onClick={e => e.stopPropagation()}>
                                  {Object.keys(STATUS).map(s => (
                                    <button key={s} className="cl-status-opt" style={{ color: STATUS[s].c }}
                                      onClick={() => patchStatus(c, s)}>
                                      <span className="cl-pill-dot" style={{ background: STATUS[s].c }}/>{s}
                                      {c.status === s && <FiCheck size={10} style={{ marginLeft: 'auto' }}/>}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="cl-td">
                            <span className="cl-tier-badge" style={{ color: tierCfg.color, background: tierCfg.bg }}>
                              {tier} · {tierCfg.label}
                            </span>
                          </td>

                          <td className="cl-td"><HealthScore score={score}/></td>
                          <td className="cl-td"><HealthBar paid={paidInv} total={totalInv}/></td>

                          <td className="cl-td td-rev">
                            {revenue > 0
                              ? <span className="cl-rev-val">{fmt$(revenue)}</span>
                              : <span className="cl-dash">—</span>}
                          </td>

                          <td className="cl-td"><Recency date={c.updatedAt || c.lastActivity}/></td>

                          <td className="cl-td">
                            {c.contractStatus && c.contractStatus !== 'None'
                              ? <span className="cl-contract-badge"
                                  style={{ color: (CONTRACT_STATUS[c.contractStatus]||CONTRACT_STATUS.None).c, background: `${(CONTRACT_STATUS[c.contractStatus]||CONTRACT_STATUS.None).c}14` }}>
                                  {c.contractStatus}
                                </span>
                              : <span className="cl-dash">—</span>}
                          </td>

                          <td className="cl-td td-actions" onClick={e => e.stopPropagation()}>
                            <div className="cl-row-acts">
                              <button className="cl-row-btn" title="Edit" onClick={() => openEdit(c)}><FiEdit3 size={13}/></button>
                              <button className="cl-row-btn" title="Email" onClick={() => { setEmailModal(c); setEmailForm({ subject: `Re: ${c.company || c.name}`, body: '' }); }}><FiMail size={13}/></button>
                              {isArchived
                                ? <button className="cl-row-btn" title="Restore" onClick={() => unarchive(c)}><FiRepeat size={13}/></button>
                                : <button className="cl-row-btn" title="Archive" onClick={() => setArchiveTarget(c)}><FiArchive size={13}/></button>}
                              <button className="cl-row-btn danger" title="Delete" onClick={() => setDelTarget(c)}><FiTrash2 size={13}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="cl-table-foot">
                  {filtered.length} client{filtered.length !== 1 ? 's' : ''}
                  {selected.size > 0 && ` · ${selected.size} selected`}
                  {showArchived && ' · Showing archived'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CARDS VIEW ═══════════════════════════════ */}
        {viewMode === 'cards' && (
          <div className="cl-table-section">
            {!filtered.length
              ? <div className="cl-empty"><FiUsers size={38}/><strong>No clients found</strong></div>
              : (
                <div className="cl-cards-grid">
                  {filtered.map(c => {
                    const score   = healthScore(c);
                    const tier    = clientTier(c);
                    const tierCfg = TIER_CFG[tier];
                    const revenue = c.revenue || c.totalRevenue || 0;
                    const isSel   = selected.has(c._id);
                    return (
                      <div key={c._id} className={`cl-client-card${isSel ? ' sel' : ''}`}
                        onClick={() => { setDetail(c); setDetailTab('profile'); }}>
                        <div className="cl-card-top">
                          <div className="cl-card-check" onClick={e => { e.stopPropagation(); toggleSel(c._id); }}>
                            <button className={`cl-cb sm${isSel ? ' on' : ''}`}>{isSel && <FiCheck size={8}/>}</button>
                          </div>
                          <span className="cl-tier-badge sm" style={{ color: tierCfg.color, background: tierCfg.bg }}>{tier}</span>
                          <HealthScore score={score}/>
                          <button className="cl-row-btn sm" onClick={e => { e.stopPropagation(); openEdit(c); }}><FiEdit3 size={11}/></button>
                        </div>
                        <div className="cl-card-identity">
                          <Avatar name={c.name} size={44}/>
                          <div>
                            <div className="cl-card-name">{c.name}</div>
                            {c.company && <div className="cl-card-co">{c.company}</div>}
                            <StatusPill status={c.status || 'Active'} size="sm" onClick={() => {}}/>
                          </div>
                        </div>
                        <div className="cl-card-stats">
                          <div className="cl-card-stat"><span>{fmt$(revenue)}</span><label>Revenue</label></div>
                          <div className="cl-card-stat"><span><Recency date={c.updatedAt}/></span><label>Last Active</label></div>
                        </div>
                        {arr(c.tags).length > 0 && (
                          <div className="cl-tags-row">
                            {arr(c.tags).slice(0, 3).map((t, i) => <span key={i} className="cl-tag sm">{t}</span>)}
                          </div>
                        )}
                        <div className="cl-card-actions">
                          {c.email && <button className="cl-qact sm" onClick={e => { e.stopPropagation(); setEmailModal(c); setEmailForm({ subject: `Re: ${c.company||c.name}`, body: '' }); }}><FiMail size={11}/></button>}
                          <button className="cl-qact sm" onClick={e => { e.stopPropagation(); navigate(`/invoices?clientId=${c._id}`); }}><FiFileText size={11}/></button>
                          <button className="cl-qact sm" onClick={e => { e.stopPropagation(); copyPortalLink(c); }}>
                            {portalCopied === c._id ? <FiCheck size={11}/> : <FiLink size={11}/>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* ═══ KANBAN VIEW ══════════════════════════════ */}
        {viewMode === 'kanban' && (
          <div className="cl-table-section">
            <div className="cl-kanban">
              {kanbanCols.map(({ status, clients: colClients }) => {
                const s          = STATUS[status];
                const colRevenue = colClients.reduce((sum, c) => sum + (c.revenue || 0), 0);
                return (
                  <div className="cl-kanban-col" key={status}>
                    <div className="cl-kanban-hdr" style={{ borderColor: s.c }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span className="cl-pill-dot" style={{ background: s.c, width: 8, height: 8 }}/>
                        <span style={{ color: s.c, fontWeight: 600, fontSize: 12 }}>{status}</span>
                        <span className="cl-kanbadge">{colClients.length}</span>
                      </div>
                      {colRevenue > 0 && <span style={{ fontSize: 11, color: 'var(--cl-tm)' }}>{fmt$(colRevenue)}</span>}
                    </div>
                    <div className="cl-kanban-cards">
                      {colClients.length === 0 && <div className="cl-kanban-empty">No clients</div>}
                      {colClients.map(c => {
                        const tier    = clientTier(c);
                        const tierCfg = TIER_CFG[tier];
                        return (
                          <div key={c._id} className="cl-kanban-card"
                            onClick={() => { setDetail(c); setDetailTab('profile'); }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <Avatar name={c.name} size={32}/>
                              <div style={{ minWidth: 0 }}>
                                <div className="cl-card-name" style={{ fontSize: 13 }}>{c.name}</div>
                                {c.company && <div className="cl-card-co">{c.company}</div>}
                              </div>
                              <span className="cl-tier-badge sm" style={{ color: tierCfg.color, background: tierCfg.bg, marginLeft: 'auto' }}>{tier}</span>
                            </div>
                            {(c.revenue || 0) > 0 && (
                              <div style={{ fontSize: 12, color: 'var(--cl-gold)', fontWeight: 600, marginBottom: 5 }}>{fmt$(c.revenue || 0)}</div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Recency date={c.updatedAt}/>
                              <HealthScore score={healthScore(c)}/>
                            </div>
                          </div>
                        );
                      })}
                      <button className="cl-kanban-add"
                        onClick={() => { openNew(); setForm(f => ({ ...f, status })); }}>
                        <FiPlus size={12}/> Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ DETAIL PANEL ═════════════════════════════ */}
        {detail && (
          <div className="cl-detail">
            {/* Header */}
            <div className="cl-detail-hdr">
              <div className="cl-detail-id">
                <Avatar name={detail.name} size={48}/>
                <div>
                  <h3 className="cl-detail-name">{detail.name}</h3>
                  {detail.company && <p className="cl-detail-co"><FiBriefcase size={11}/> {detail.company}</p>}
                  <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusPill status={detail.status || 'Active'} onClick={() => {}}/>
                    <TierBadge tier={clientTier(detail)}/>
                  </div>
                </div>
              </div>
              <div className="cl-detail-hdr-btns">
                <button className="cl-icon-btn sm" title="Edit" onClick={() => openEdit(detail)}><FiEdit3 size={13}/></button>
                <button className="cl-icon-btn sm" title="Set reminder"
                  onClick={() => { setReminderModal(detail); setReminderDate(reminders[detail._id] || ''); }}>
                  <FiClock size={13}/>
                </button>
                <button className="cl-icon-btn sm" title="Copy portal link" onClick={() => copyPortalLink(detail)}>
                  {portalCopied === detail._id ? <FiCheck size={13}/> : <FiLink size={13}/>}
                </button>
                <button className="cl-icon-btn sm" title="Close" onClick={() => setDetail(null)}><FiX size={13}/></button>
              </div>
            </div>

            {/* Health bar */}
            <div className="cl-detail-health">
              <div className="cl-dhealth-labels">
                <span>Health Score</span>
                <span style={{ color: healthScore(detail) >= 70 ? '#4caf82' : healthScore(detail) >= 40 ? '#e8a030' : '#e05c5c', fontWeight: 700 }}>
                  {healthScore(detail)}/100
                </span>
              </div>
              <div className="cl-dhealth-track">
                <div className="cl-dhealth-fill" style={{
                  width: `${healthScore(detail)}%`,
                  background: healthScore(detail) >= 70 ? '#4caf82' : healthScore(detail) >= 40 ? '#e8a030' : '#e05c5c',
                }}/>
              </div>
            </div>

            {/* Quick actions */}
            <div className="cl-detail-acts">
              <button className="cl-qact" onClick={() => navigate(`/invoices?clientId=${detail._id}&clientName=${encodeURIComponent(detail.name)}`)}><FiFileText size={12}/> Invoice</button>
              <button className="cl-qact" onClick={() => navigate(`/tasks?clientId=${detail._id}`)}><FiCheckCircle size={12}/> Task</button>
              {detail.email && <button className="cl-qact" onClick={() => { setEmailModal(detail); setEmailForm({ subject: `Hi ${detail.name?.split(' ')[0]}`, body: '' }); }}><FiMail size={12}/> Email</button>}
              {detail.phone && <a className="cl-qact" href={`tel:${detail.phone}`}><FiPhone size={12}/> Call</a>}
              {isPremium && <button className="cl-qact premium" onClick={openForecast} disabled={detailLoad}><FiTrendingUp size={12}/> Forecast</button>}
              <button className="cl-qact" onClick={() => setArchiveTarget(detail)}><FiArchive size={12}/> Archive</button>
              <button className="cl-qact danger" onClick={() => setDelTarget(detail)}><FiTrash2 size={12}/> Delete</button>
            </div>

            {/* Tabs */}
            <div className="cl-detail-tabs">
              {[
                ['profile',  'Profile',  null],
                ['invoices', 'Invoices', detailInv.length || null],
                ['tasks',    'Tasks',    detailTasks.length || null],
                ['log',      'Log',      commLog.length || null],
                ['notes',    'Notes',    null],
                ['ai',       isPremium ? '✦ AI' : '✦ AI', null],
                ['timeline', 'Timeline', null],
              ].map(([t, label, count]) => (
                <button key={t} className={`cl-dtab${detailTab === t ? ' on' : ''}${t === 'ai' ? ' ai-tab' : ''}`}
                  onClick={() => setDetailTab(t)}>
                  {label}
                  {count !== null && <span className="cl-dtab-n">{count}</span>}
                </button>
              ))}
            </div>

            <div className="cl-detail-body">
              {detailLoad && <div className="cl-detail-loading"><div className="cl-spin sm"/></div>}

              {/* ── PROFILE ── */}
              {!detailLoad && detailTab === 'profile' && (
                <div className="cl-profile">
                  <div className="cl-section">
                    <h4 className="cl-section-hd">Contact Info</h4>
                    {[
                      { icon: <FiMail size={12}/>,   val: detail.email,   href: `mailto:${detail.email}`,   label: 'Email'    },
                      { icon: <FiPhone size={12}/>,  val: detail.phone,   href: `tel:${detail.phone}`,       label: 'Phone'    },
                      { icon: <FiGlobe size={12}/>,  val: detail.website, href: detail.website,              label: 'Website'  },
                      { icon: <FiMapPin size={12}/>, val: detail.address, href: null,                         label: 'Location' },
                      { icon: <FiArrowUpRight size={12}/>, val: detail.source, href: null,                   label: 'Source'   },
                    ].filter(r => r.val).map((row, i) => (
                      <div className="cl-contact-row" key={i}>
                        <span className="cl-contact-ico">{row.icon}</span>
                        <span className="cl-contact-lbl">{row.label}</span>
                        {row.href
                          ? <a href={row.href} target="_blank" rel="noreferrer" className="cl-contact-val link">{row.val}</a>
                          : <span className="cl-contact-val">{row.val}</span>}
                      </div>
                    ))}
                    {!detail.email && !detail.phone && !detail.website && !detail.address && (
                      <p style={{ fontSize: 12, color: 'var(--cl-tm)', fontStyle: 'italic' }}>No contact info saved.</p>
                    )}
                  </div>

                  <div className="cl-section">
                    <h4 className="cl-section-hd">Financials</h4>
                    <div className="cl-fin-grid">
                      {[
                        { label: 'Revenue',       val: fmt$(detail.revenue || detail.totalRevenue || 0) },
                        { label: 'Outstanding',   val: fmt$(detail.outstanding || detail.unpaidRevenue || 0) },
                        { label: 'Hourly Rate',   val: detail.hourlyRate ? fmt$(detail.hourlyRate) + '/hr' : '—' },
                        { label: 'Project Budget',val: detail.projectBudget ? fmt$(detail.projectBudget) : '—' },
                        { label: 'Contract Value',val: detail.contractValue ? fmt$(detail.contractValue) : '—' },
                      ].map(({ label, val }) => (
                        <div className="cl-fin-item" key={label}>
                          <span className="cl-fin-lbl">{label}</span>
                          <span className="cl-fin-val">{val}</span>
                        </div>
                      ))}
                    </div>
                    {(detail.paidInvoices || 0) + (detail.invoiceCount || 0) > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div className="cl-dhealth-labels" style={{ marginBottom: 5 }}>
                          <span>Payment health</span>
                          <span>{detail.paidInvoices || 0}/{detail.invoiceCount || 0} invoices paid</span>
                        </div>
                        <HealthBar paid={detail.paidInvoices || 0} total={detail.invoiceCount || 0}/>
                      </div>
                    )}
                  </div>

                  {detail.contractStatus && detail.contractStatus !== 'None' && (
                    <div className="cl-section">
                      <h4 className="cl-section-hd">Contract</h4>
                      <div className="cl-contract-row">
                        <span className="cl-contract-badge lg"
                          style={{ color: (CONTRACT_STATUS[detail.contractStatus]||CONTRACT_STATUS.None).c, background: (CONTRACT_STATUS[detail.contractStatus]||CONTRACT_STATUS.None).bg }}>
                          {detail.contractStatus}
                        </span>
                        {detail.contractExpiry && (
                          <span style={{ fontSize: 12, color: dLeft(detail.contractExpiry) < 14 ? '#e05c5c' : 'var(--cl-ts)' }}>
                            <FiCalendar size={11}/> Expires {fmtDate(detail.contractExpiry)}
                            {dLeft(detail.contractExpiry) < 14 && dLeft(detail.contractExpiry) >= 0 && (
                              <span className="cl-expiry-warn"> · Expiring soon!</span>
                            )}
                            {dLeft(detail.contractExpiry) < 0 && (
                              <span className="cl-expiry-warn"> · Expired!</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="cl-section">
                    <div className="cl-section-hdr-row">
                      <h4 className="cl-section-hd">Tags</h4>
                      <button className="cl-add-tag-btn" onClick={() => setAddingTag(true)}><FiPlus size={10}/> Add</button>
                    </div>
                    <div className="cl-tags" style={{ gap: 6 }}>
                      {arr(detail.tags).map((tag, i) => (
                        <span key={i} className="cl-tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {tag}
                          <button onClick={() => removeTagInline(tag)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: .6, fontSize: 10, padding: 0, lineHeight: 1 }}>✕</button>
                        </span>
                      ))}
                      {addingTag && (
                        <div className="cl-tag-input-row">
                          <input autoFocus className="cl-tag-input" value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addTagInline(); if (e.key === 'Escape') { setAddingTag(false); setNewTag(''); } }}
                            placeholder="New tag…"/>
                          <button className="cl-btn-gold sm" onClick={addTagInline}><FiCheck size={10}/></button>
                          <button className="cl-btn-ghost sm" onClick={() => { setAddingTag(false); setNewTag(''); }}><FiX size={10}/></button>
                        </div>
                      )}
                      {!arr(detail.tags).length && !addingTag && (
                        <span style={{ fontSize: 12, color: 'var(--cl-tm)', fontStyle: 'italic' }}>No tags yet</span>
                      )}
                    </div>
                  </div>

                  {reminders[detail._id] && (
                    <div className="cl-section">
                      <h4 className="cl-section-hd">Follow-up Reminder</h4>
                      <div className="cl-contact-row">
                        <span className="cl-contact-ico"><FiClock size={12}/></span>
                        <span className="cl-contact-val">{fmtDate(reminders[detail._id])}</span>
                        <button style={{ background: 'none', border: 'none', color: 'var(--cl-tm)', cursor: 'pointer', fontSize: 11, marginLeft: 'auto' }}
                          onClick={() => clearReminder(detail._id)}>Clear</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── INVOICES ── */}
              {!detailLoad && detailTab === 'invoices' && (
                <div className="cl-linked">
                  {!detailInv.length ? (
                    <div className="cl-linked-empty">
                      <FiFileText size={22}/>
                      <p>No invoices for this client</p>
                      <button className="cl-qact" onClick={() => navigate(`/invoices?clientId=${detail._id}&clientName=${encodeURIComponent(detail.name)}`)}><FiPlus size={11}/> Create Invoice</button>
                    </div>
                  ) : (
                    <>
                      <div className="cl-linked-sum">
                        <span>{fmt$(detailInv.reduce((s,i) => s+(i.total||0),0))} total</span>
                        <span>{detailInv.filter(i=>i.status==='paid').length}/{detailInv.length} paid</span>
                      </div>
                      {isPremium && (
                        <div className="cl-sparkline-row">
                          <span style={{ fontSize: 11, color: 'var(--cl-tm)' }}>Revenue trend</span>
                          <Sparkline values={clientSparkline(detail)} color="#c9a84c" width={80} height={26}/>
                        </div>
                      )}
                      {detailInv.map(inv => {
                        const left = dLeft(inv.dueDate);
                        const isOverdue = inv.status !== 'paid' && left !== null && left < 0;
                        return (
                          <div key={inv._id} className="cl-linked-row" onClick={() => navigate('/invoices')}>
                            <div className="cl-lr-left">
                              <span className="cl-lr-title">#{inv.invoiceNumber || inv._id?.slice(-5)}</span>
                              <span className="cl-lr-sub">{inv.dueDate ? fmtDateShort(inv.dueDate) : 'No due date'}</span>
                            </div>
                            <div className="cl-lr-right">
                              <span className="cl-lr-amount">{fmt$(inv.amount || inv.total || 0)}</span>
                              <span className={`cl-lr-status${isOverdue ? ' overdue' : ' ' + (inv.status || 'pending')}`}>
                                {isOverdue ? 'Overdue' : inv.status || 'Pending'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {/* ── TASKS ── */}
              {!detailLoad && detailTab === 'tasks' && (
                <div className="cl-linked">
                  {!detailTasks.length ? (
                    <div className="cl-linked-empty">
                      <FiCheckCircle size={22}/><p>No tasks for this client</p>
                      <button className="cl-qact" onClick={() => navigate(`/tasks?clientId=${detail._id}`)}><FiPlus size={11}/> Create Task</button>
                    </div>
                  ) : detailTasks.map(task => {
                    const due  = task.deadline || task.dueDate;
                    const done = task.status === 'done' || task.completed;
                    const left = dLeft(due);
                    return (
                      <div key={task._id} className={`cl-linked-row${done ? ' done' : ''}`} onClick={() => navigate('/tasks')}>
                        <div className="cl-lr-left">
                          <span className="cl-lr-title">{task.title || task.name}</span>
                          <span className="cl-lr-sub">
                            {due ? fmtDateShort(due) : 'No deadline'}
                            {!done && left !== null && left < 0 && <span className="cl-overdue-flag"> · Overdue</span>}
                          </span>
                        </div>
                        <div className="cl-lr-right">
                          {task.priority && <span className={`cl-pri-badge ${(task.priority || '').toLowerCase()}`}>{task.priority}</span>}
                          <span className={`cl-lr-status ${done ? 'paid' : 'pending'}`}>{done ? 'Done' : 'Open'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── COMMUNICATION LOG ── */}
              {!detailLoad && detailTab === 'log' && (
                <div className="cl-log-tab">
                  {!addingComm ? (
                    <button className="cl-qact" style={{ marginBottom: 14 }} onClick={() => setAddingComm(true)}>
                      <FiPlus size={11}/> Log Interaction
                    </button>
                  ) : (
                    <div className="cl-add-comm">
                      <div className="cl-comm-type-row">
                        {COMM_TYPES.map(t => (
                          <button key={t.id}
                            className={`cl-comm-type-btn${newComm.type === t.id ? ' active' : ''}`}
                            style={newComm.type === t.id ? { borderColor: t.color, background: `${t.color}15`, color: t.color } : {}}
                            onClick={() => setNewComm(c => ({ ...c, type: t.id }))}>
                            {t.icon} {t.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
                        <label style={{ fontSize: 10.5, color: 'var(--cl-tm)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' }}>Date</label>
                        <input type="date" value={newComm.date}
                          onChange={e => setNewComm(c => ({ ...c, date: e.target.value }))}
                          style={{ background: 'var(--cl-raised)', border: '1px solid var(--cl-border)', borderRadius: 6, padding: '5px 9px', color: 'var(--cl-text)', fontFamily: 'inherit', fontSize: 12, outline: 'none' }}/>
                      </div>
                      <textarea className="cl-notes-editor" rows={3} value={newComm.note}
                        onChange={e => setNewComm(c => ({ ...c, note: e.target.value }))}
                        placeholder="What was discussed? Any action items or decisions…"/>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="cl-btn-ghost sm" onClick={() => setAddingComm(false)}>Cancel</button>
                        <button className="cl-btn-gold sm" onClick={addCommEntry} disabled={!newComm.note.trim()}>
                          <FiCheck size={11}/> Save
                        </button>
                      </div>
                    </div>
                  )}

                  {commLog.length === 0 && !addingComm ? (
                    <div className="cl-linked-empty" style={{ marginTop: 16 }}>
                      <FiMessageSquare size={22}/>
                      <p>No interactions logged yet</p>
                      <span style={{ fontSize: 12, color: 'var(--cl-tm)' }}>Log calls, emails and meetings to track your relationship.</span>
                    </div>
                  ) : commLog.map(entry => {
                    const ct = COMM_TYPES.find(t => t.id === entry.type) || COMM_TYPES[0];
                    return (
                      <div key={entry.id} className="cl-comm-entry">
                        <div className="cl-comm-entry-top">
                          <span className="cl-comm-type-chip" style={{ color: ct.color, background: `${ct.color}14` }}>
                            {ct.icon} {ct.label}
                          </span>
                          <span className="cl-comm-date">{fmtDate(entry.date || entry.ts)}</span>
                          <button className="cl-comm-del" onClick={() => delCommEntry(entry.id)}><FiX size={10}/></button>
                        </div>
                        <p className="cl-comm-note">{entry.note}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── NOTES ── */}
              {!detailLoad && detailTab === 'notes' && (
                <div className="cl-notes-tab">
                  {!editingNote ? (
                    <>
                      {detail.notes
                        ? <p className="cl-notes-body">{detail.notes}</p>
                        : <p style={{ fontSize: 13, color: 'var(--cl-tm)', fontStyle: 'italic' }}>No notes. Add context, preferences, how you met…</p>}
                      <button className="cl-qact" style={{ marginTop: 12 }} onClick={() => setEditingNote(true)}>
                        <FiEdit3 size={11}/> {detail.notes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                    </>
                  ) : (
                    <>
                      <textarea className="cl-notes-editor" rows={10} value={inlineNote}
                        onChange={e => setInlineNote(e.target.value)}
                        placeholder="Project context, working preferences, how you met, next steps, boundaries, budget notes…"
                        maxLength={2000}/>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 10.5, color: 'var(--cl-tm)', marginRight: 'auto' }}>{inlineNote.length}/2000</span>
                        <button className="cl-btn-ghost sm" onClick={() => setEditingNote(false)}>Cancel</button>
                        <button className="cl-btn-gold sm" onClick={saveNote}><FiCheck size={11}/> Save</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── AI INSIGHTS (premium) ── */}
              {!detailLoad && detailTab === 'ai' && (
                <div className="cl-ai-tab">
                  <div className="cl-ai-header">
                    <FiZap size={14} style={{ color: '#c9a84c' }}/>
                    <span className="cl-ai-title">AI Client Intelligence</span>
                    <span className="cl-ai-badge">Premium</span>
                  </div>
                  {!isPremium ? (
                    <div className="cl-ai-locked">
                      <FiLock size={24}/>
                      <strong>Premium Feature</strong>
                      <p>Get an AI-powered analysis of your client relationship — health summary, risk flags, and specific next actions. Powered by Claude.</p>
                      <button className="cl-btn-gold" onClick={() => navigate('/atelier')}>
                        <FiStar size={12}/> Upgrade to Premium
                      </button>
                    </div>
                  ) : !aiInsight && !aiLoading ? (
                    <div className="cl-ai-idle">
                      <p style={{ fontSize: 13, color: 'var(--cl-ts)', marginBottom: 14 }}>
                        Analyse <strong>{detail.name}</strong>'s relationship health, payment patterns, and get specific recommended actions — powered by Claude AI.
                      </p>
                      <button className="cl-btn-gold" onClick={generateInsight}>
                        <FiZap size={12}/> Analyse This Client
                      </button>
                      {aiError && <p style={{ fontSize: 12, color: '#e05c5c', marginTop: 10 }}>{aiError}</p>}
                    </div>
                  ) : aiLoading ? (
                    <div className="cl-ai-loading">
                      <div className="cl-spin"/>
                      <span>Analysing client relationship…</span>
                    </div>
                  ) : (
                    <div className="cl-ai-result">
                      {/* Sentiment badge */}
                      {aiInsight.sentiment && (
                        <div className="cl-ai-sentiment" style={{
                          color: aiInsight.sentiment === 'positive' ? '#4caf82' : aiInsight.sentiment === 'negative' ? '#e05c5c' : '#e8a030',
                          background: aiInsight.sentiment === 'positive' ? 'rgba(76,175,130,.1)' : aiInsight.sentiment === 'negative' ? 'rgba(224,92,92,.1)' : 'rgba(232,160,48,.1)',
                        }}>
                          {aiInsight.sentiment === 'positive' ? '▲ Positive relationship' : aiInsight.sentiment === 'negative' ? '▼ Needs attention' : '● Neutral relationship'}
                        </div>
                      )}

                      {/* Summary */}
                      {aiInsight.summary && (
                        <div className="cl-ai-section">
                          <h5>Analysis</h5>
                          <p>{aiInsight.summary}</p>
                        </div>
                      )}

                      {/* Risks */}
                      {arr(aiInsight.risks).length > 0 && (
                        <div className="cl-ai-section">
                          <h5><FiAlertCircle size={12} style={{ color: '#e8a030' }}/> Risk Flags</h5>
                          <ul className="cl-ai-list risks">
                            {arr(aiInsight.risks).map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      {arr(aiInsight.actions).length > 0 && (
                        <div className="cl-ai-section">
                          <h5><FiCheckCircle size={12} style={{ color: '#4caf82' }}/> Recommended Actions</h5>
                          <ul className="cl-ai-list actions">
                            {arr(aiInsight.actions).map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      )}

                      <button className="cl-btn-ghost sm" style={{ marginTop: 12 }}
                        onClick={() => { setAiInsight(null); setAiError(''); }}>
                        <FiRepeat size={11}/> Re-analyse
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── TIMELINE ── */}
              {!detailLoad && detailTab === 'timeline' && (
                <div className="cl-timeline">
                  <p style={{ fontSize: 12, color: 'var(--cl-tm)', marginBottom: 14, fontStyle: 'italic' }}>
                    Complete interaction history — invoices, tasks, notes, and logged communications.
                  </p>
                  {[
                    ...detailInv.map(i => ({ type: 'invoice', date: i.createdAt, label: `Invoice #${i.invoiceNumber || i._id?.slice(-5)}`, sub: fmt$(i.total || 0) + ' · ' + (i.status || 'pending'), color: '#4a90d9' })),
                    ...detailTasks.map(t => ({ type: 'task', date: t.createdAt, label: t.title || 'Task', sub: t.status || 'open', color: t.status === 'done' ? '#4caf82' : '#9b72e8' })),
                    ...commLog.map(e => { const ct = COMM_TYPES.find(t => t.id === e.type) || COMM_TYPES[0]; return { type: 'comm', date: e.date || e.ts, label: `${ct.icon} ${ct.label}`, sub: e.note.slice(0, 60) + (e.note.length > 60 ? '…' : ''), color: ct.color }; }),
                    ...(detail.notes ? [{ type: 'note', date: detail.updatedAt, label: 'Notes updated', sub: detail.notes.slice(0, 50) + '…', color: '#e8a030' }] : []),
                  ].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item, i) => (
                    <div key={i} className="cl-tl-item">
                      <div className="cl-tl-dot" style={{ background: item.color }}/>
                      <div className="cl-tl-body">
                        <div className="cl-tl-label">{item.label}</div>
                        <div className="cl-tl-sub">{item.sub}</div>
                        <div className="cl-tl-date">{item.date ? fmtDate(item.date) : ''}</div>
                      </div>
                    </div>
                  ))}
                  {!detailInv.length && !detailTasks.length && !commLog.length && (
                    <div className="cl-linked-empty"><FiActivity size={22}/><p>No activity yet</p></div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ CREATE/EDIT DRAWER ══════════════════════════ */}
      {drawer && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && setDrawer(false)}>
          <div className="cl-drawer">
            <div className="cl-drawer-hdr">
              <h3>{editing ? `Edit · ${editing.name}` : 'New Client'}</h3>
              <button onClick={() => setDrawer(false)}><FiX size={15}/></button>
            </div>

            {/* Duplicate warning */}
            {dupWarn && (
              <div className="cl-dup-warn">
                <FiAlertCircle size={13}/>
                <span>A client with this email already exists: <strong>{dupWarn.name}</strong></span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="cl-btn-ghost sm" onClick={() => setDupWarn(null)}>Cancel</button>
                  <button className="cl-btn-gold sm" onClick={save}>Save Anyway</button>
                </div>
              </div>
            )}

            <form className="cl-drawer-form" onSubmit={save}>
              <div className="cl-f2">
                <div className="cl-field"><label>Name *</label><input autoFocus required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name or business name" maxLength={200}/></div>
                <div className="cl-field"><label>Company</label><input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="Organisation name" maxLength={200}/></div>
              </div>
              <div className="cl-f2">
                <div className="cl-field"><label>Email</label><input type="email" value={form.email} onChange={e=>{setForm(f=>({...f,email:e.target.value}));setDupWarn(null);}} placeholder="client@example.com" maxLength={200}/></div>
                <div className="cl-field"><label>Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+1 555 000 0000" maxLength={50}/></div>
              </div>
              <div className="cl-f2">
                <div className="cl-field"><label>Website</label><input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://example.com" maxLength={200}/></div>
                <div className="cl-field"><label>Location</label><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="City, Country" maxLength={200}/></div>
              </div>
              <div className="cl-f2">
                <div className="cl-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {Object.keys(STATUS).filter(s=>s!=='Archived').map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="cl-field">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                    <option>High</option><option>Normal</option><option>Low</option>
                  </select>
                </div>
              </div>
              <div className="cl-f2">
                <div className="cl-field"><label>Source</label><input value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} placeholder="Referral, LinkedIn, Cold outreach…" maxLength={100}/></div>
                <div className="cl-field"><label>Tags <span className="cl-hint">(comma-separated)</span></label><input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="design, retainer, vip" maxLength={300}/></div>
              </div>
              <div className="cl-f3">
                <div className="cl-field"><label>Hourly Rate ($)</label><input type="number" min="0" max="99999" value={form.hourlyRate} onChange={e=>setForm(f=>({...f,hourlyRate:e.target.value}))} placeholder="0"/></div>
                <div className="cl-field"><label>Project Budget ($)</label><input type="number" min="0" max="9999999" value={form.projectBudget} onChange={e=>setForm(f=>({...f,projectBudget:e.target.value}))} placeholder="0"/></div>
                <div className="cl-field"><label>Contract Value ($)</label><input type="number" min="0" max="9999999" value={form.contractValue} onChange={e=>setForm(f=>({...f,contractValue:e.target.value}))} placeholder="0"/></div>
              </div>
              <div className="cl-f2">
                <div className="cl-field">
                  <label>Contract Status</label>
                  <select value={form.contractStatus} onChange={e=>setForm(f=>({...f,contractStatus:e.target.value}))}>
                    {Object.keys(CONTRACT_STATUS).map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="cl-field"><label>Contract Expiry</label><input type="date" value={form.contractExpiry} onChange={e=>setForm(f=>({...f,contractExpiry:e.target.value}))}/></div>
              </div>
              <div className="cl-field">
                <label>Notes <span className="cl-hint">(private — not shared with client)</span></label>
                <textarea rows={4} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} maxLength={2000} placeholder="Project context, preferences, how you met, next steps…"/>
              </div>
              <div className="cl-drawer-foot">
                <button type="button" className="cl-btn-ghost" onClick={() => setDrawer(false)}>Cancel</button>
                <button type="submit" className="cl-btn-gold" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ EMAIL MODAL ══════════════════════════════════ */}
      {emailModal && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && setEmailModal(null)}>
          <div className="cl-modal" style={{ maxWidth: 500 }}>
            <div className="cl-modal-hdr">
              <h3><FiMail size={14}/> Email {emailModal.name}</h3>
              <button onClick={() => setEmailModal(null)}><FiX size={14}/></button>
            </div>
            <div className="cl-field" style={{ margin: '14px 0 10px' }}>
              <label>Subject</label>
              <input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subject line" maxLength={200}/>
            </div>
            <div className="cl-field">
              <label>Message</label>
              <textarea rows={6} value={emailForm.body}
                onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Your message…" maxLength={5000}
                style={{ width: '100%', background: 'var(--cl-raised)', border: '1px solid var(--cl-border)', borderRadius: 6, padding: '9px 11px', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--cl-text)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}/>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cl-tm)', margin: '8px 0 0' }}>To: {emailModal.email}</div>
            <div className="cl-modal-foot" style={{ marginTop: 14 }}>
              <button className="cl-btn-ghost" onClick={() => setEmailModal(null)}>Cancel</button>
              <button className="cl-btn-gold" onClick={sendEmail} disabled={!emailForm.body.trim()}><FiSend size={12}/> Send</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REMINDER MODAL ═══════════════════════════════ */}
      {reminderModal && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && setReminderModal(null)}>
          <div className="cl-modal">
            <div className="cl-modal-hdr">
              <h3><FiClock size={14}/> Reminder — {reminderModal.name}</h3>
              <button onClick={() => setReminderModal(null)}><FiX size={14}/></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--cl-tm)', margin: '12px 0' }}>
              A banner will appear at the top of the Clients page on the selected date to remind you to follow up.
            </p>
            <div className="cl-field"><label>Reminder Date</label><input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}/></div>
            <div className="cl-modal-foot" style={{ marginTop: 16 }}>
              {reminders[reminderModal._id] && (
                <button className="cl-btn-ghost" onClick={() => { clearReminder(reminderModal._id); setReminderModal(null); }}>Clear</button>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="cl-btn-ghost" onClick={() => setReminderModal(null)}>Cancel</button>
                <button className="cl-btn-gold" onClick={saveReminder} disabled={!reminderDate}><FiCheck size={12}/> Set Reminder</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REVENUE FORECAST MODAL (premium) ════════════ */}
      {forecastModal && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && setForecastModal(null)}>
          <div className="cl-modal" style={{ maxWidth: 440 }}>
            <div className="cl-modal-hdr">
              <h3><FiTrendingUp size={14}/> Revenue Forecast — {forecastModal.client.name}</h3>
              <button onClick={() => setForecastModal(null)}><FiX size={14}/></button>
            </div>
            <div className="cl-forecast-body">
              {forecastModal.forecast !== null ? (
                <>
                  <div className="cl-forecast-num">
                    <span className="cl-forecast-label">Projected Next Month</span>
                    <span className="cl-forecast-val">{fmt$(forecastModal.forecast)}</span>
                  </div>
                  <Sparkline
                    values={arr(forecastModal.invoices.filter(i => i.status === 'paid')).slice(-6).map(i => i.total || 0)}
                    color="#c9a84c" width={320} height={60}/>
                  <p style={{ fontSize: 12, color: 'var(--cl-tm)', marginTop: 12, lineHeight: 1.6 }}>
                    Based on {forecastModal.invoices.filter(i => i.status === 'paid').length} paid invoices. Projection uses linear trend from monthly revenue averages. Actual results may vary.
                  </p>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--cl-tm)', fontSize: 13 }}>
                  Not enough paid invoice history to forecast. Need at least 2 paid invoices.
                </div>
              )}
            </div>
            <div className="cl-modal-foot" style={{ marginTop: 14 }}>
              <button className="cl-btn-gold" onClick={() => setForecastModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ IMPORT MODAL ═════════════════════════════════ */}
      {importModal && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && setImportModal(false)}>
          <div className="cl-modal">
            <div className="cl-modal-hdr"><h3><FiUpload size={14}/> Import Clients</h3><button onClick={() => setImportModal(false)}><FiX size={14}/></button></div>
            <div className="cl-import-opts">
              <div className="cl-import-opt">
                <FiUpload size={20} style={{ color: 'var(--cl-gold)' }}/>
                <strong>CSV File</strong>
                <p>Upload a CSV with columns: Name, Email, Company, Status, Phone, Tags</p>
                <input type="file" accept=".csv" style={{ fontSize: 12, color: 'var(--cl-tm)' }}
                  onChange={() => { showToast('CSV upload coming soon.'); setImportModal(false); }}/>
              </div>
              <div className="cl-import-opt">
                <FiGlobe size={20} style={{ color: '#0a66c2' }}/>
                <strong>LinkedIn Export</strong>
                <p>Upload your LinkedIn connections export CSV to sync.</p>
                <input type="file" accept=".csv" style={{ fontSize: 12, color: 'var(--cl-tm)' }}
                  onChange={() => { showToast('LinkedIn import coming soon.'); setImportModal(false); }}/>
              </div>
            </div>
            <div className="cl-modal-foot" style={{ marginTop: 16 }}>
              <button className="cl-btn-ghost" onClick={() => setImportModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ARCHIVE MODAL ════════════════════════════════ */}
      {archiveTarget && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && setArchiveTarget(null)}>
          <div className="cl-modal">
            <div className="cl-modal-hdr"><h3>Archive Client</h3><button onClick={() => setArchiveTarget(null)}><FiX size={14}/></button></div>
            <p className="cl-modal-body">
              Archive <strong>{archiveTarget.name}</strong>? They'll be hidden from your active list but all data is preserved. You can restore them at any time.
            </p>
            <div className="cl-modal-foot">
              <button className="cl-btn-ghost" onClick={() => setArchiveTarget(null)}>Cancel</button>
              <button className="cl-btn-gold" onClick={() => archiveClient(archiveTarget)}><FiArchive size={12}/> Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DELETE MODAL ═════════════════════════════════ */}
      {delTarget && (
        <div className="cl-overlay" onClick={e => e.target === e.currentTarget && setDelTarget(null)}>
          <div className="cl-modal">
            <div className="cl-modal-hdr"><h3>Delete Client</h3><button onClick={() => setDelTarget(null)}><FiX size={14}/></button></div>
            <p className="cl-modal-body">
              Permanently delete <strong>{delTarget.name}</strong>? All associated data will be removed and cannot be recovered. Consider archiving instead.
            </p>
            <div className="cl-modal-foot">
              <button className="cl-btn-ghost" onClick={() => setArchiveTarget(delTarget) || setDelTarget(null)}>
                <FiArchive size={12}/> Archive Instead
              </button>
              <button className="cl-btn-danger" onClick={confirmDelete}><FiTrash2 size={12}/> Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}