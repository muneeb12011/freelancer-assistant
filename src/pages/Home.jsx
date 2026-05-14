// src/pages/Home.jsx — Production Final
// ─────────────────────────────────────────────────────────────
//  Welcome hub / personal launchpad.
//  Dashboard = deep analytics command centre.
//  Home      = greeting, onboarding, orientation, quick access.
//
//  Sections:
//   1. HERO              – greeting · avatar · date · plan badge
//   2. SNAPSHOT STRIP    – 3 live numbers (month revenue, pending
//                          tasks, overdue invoices) — orientation only
//   3. ONBOARDING        – 4-step setup checklist (real API checks)
//                          hides once all 4 complete
//   4. UPGRADE BANNER    – free users · dismissible · localStorage
//   5. AI DAILY FOCUS    – [PREMIUM] personalised one-click brief
//   6. QUICK LAUNCH      – 6 nav cards with live badges
//   7. RECENT ACTIVITY   – last 3 invoices + tasks (not a full feed)
//   8. WHAT'S NEW        – curated feature updates (static, accurate)
//   9. REFERRAL          – copy invite link
//  10. UPGRADE CTA       – free users only
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiDollarSign, FiCheckCircle, FiCalendar,
  FiActivity, FiFileText, FiStar, FiZap, FiTool,
  FiCopy, FiCheck, FiArrowRight, FiTrendingUp, FiLock,
  FiSettings, FiGift, FiUser, FiShield, FiGrid,
  FiMessageSquare, FiBarChart2, FiCpu, FiRefreshCw,
  FiAlertCircle, FiClock,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

/* ── API ───────────────────────────────────────────────────── */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tok  = () => localStorage.getItem('authToken');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` });
const api  = {
  get:  url => fetch(`${BASE}${url}`, { headers: hdrs() }).then(r => r.json()),
};

/* ── Anthropic AI (no API key needed — proxied) ────────────── */
const askClaude = async (system, msg) => {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 500,
      system,
      messages: [{ role: 'user', content: msg }],
    }),
  });
  const d = await res.json();
  return d.content?.map(b => b.text || '').join('') || '';
};

/* ── Helpers ───────────────────────────────────────────────── */
const arr  = v => Array.isArray(v) ? v : [];
const fmt$ = n => '$' + (+(n || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

/* ── What's New (static — update manually per release) ──────── */
const WHATS_NEW = [
  {
    tag: 'New',      tagColor: '#4caf82', path: '/atelier',
    title: 'Atelier Studio v2',
    desc:  '11 freelance tools in one page — Rate Calc, Time Tracker, Smart Contracts, Proposal Builder, Tax Summary, and more.',
    icon:  <FiTool size={15} />,
  },
  {
    tag: 'Improved', tagColor: '#4a90d9', path: '/atelier',
    title: 'Proposal Builder — Win Rate',
    desc:  'Track sent/accepted/declined with live win rate %. Status progression built in.',
    icon:  <FiTrendingUp size={15} />,
  },
  {
    tag: 'Improved', tagColor: '#4a90d9', path: '/atelier',
    title: 'Smart Contracts — Sign Flow',
    desc:  'Contracts now require a confirm step before signing. Signed date shown on every contract.',
    icon:  <FiShield size={15} />,
  },
  {
    tag: 'New',      tagColor: '#4caf82', path: '/atelier',
    title: 'Quarterly Tax Breakdown',
    desc:  'Tax Summary now shows Q1–Q4 revenue chips and includes quarterly data in the exported report.',
    icon:  <FiBarChart2 size={15} />,
  },
  {
    tag: 'Premium',  tagColor: '#c9a84c', path: '/atelier',
    title: 'Earnings Analytics — Goals',
    desc:  'Set an annual revenue goal and track your month-over-month growth % in real time.',
    icon:  <FiZap size={15} />,
  },
];

/* ── Spinner (replaces @mui/material CircularProgress) ──────── */
const Spinner = ({ size = 16, color = '#c9a84c' }) => (
  <div className="hm-spinner" style={{ width: size, height: size, borderTopColor: color }} />
);

/* ── Main component ────────────────────────────────────────── */
export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* state */
  const [loading,    setLoading]    = useState(true);
  const [dash,       setDash]       = useState({});   // full dashboard data
  const [counts,     setCounts]     = useState({ clients: 0, tasks: 0, invoices: 0, connections: 0 });
  const [hasProfile, setHasProfile] = useState(false);

  const [focus,      setFocus]      = useState('');
  const [focusLoad,  setFocusLoad]  = useState(false);
  const [focusDone,  setFocusDone]  = useState(false);

  const [copied,     setCopied]     = useState(false);
  const [bannerOff,  setBannerOff]  = useState(() => !!localStorage.getItem('hm_banner_off'));

  /* derived */
  const isPremium = user?.plan === 'premium';
  const firstName = user?.name?.split(' ')[0] || 'there';
  const avatar    = user?.avatar || null;

  const h        = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const today    = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  /* ── Load data ─────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [dashRes, countRes, profileRes] = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/dashboard/counts'),
        api.get('/profile'),
      ]);

      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value || {};
        setDash(d);
      }

      if (countRes.status === 'fulfilled') {
        const c = countRes.value?.counts || countRes.value || {};
        setCounts({
          clients:     c.clients     || 0,
          tasks:       c.tasks       || 0,
          invoices:    c.invoices    || 0,
          connections: c.connections || 0,
        });
      }

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value?.profile || profileRes.value || {};
        setHasProfile(!!(p.bio || p.skills?.length || p.hourlyRate));
      }

      setLoading(false);
    })();
  }, []);

  /* ── Onboarding checklist ──────────────────────────────── */
  const checklist = [
    {
      id: 'profile', icon: <FiUser size={15} />, path: '/profile',
      label: 'Complete your profile',
      desc:  'Add bio, skills, and hourly rate.',
      done:  hasProfile,
    },
    {
      id: 'client',  icon: <FiUsers size={15} />, path: '/clients',
      label: 'Add your first client',
      desc:  'Track relationships and revenue.',
      done:  counts.clients > 0,
    },
    {
      id: 'task',    icon: <FiCheckCircle size={15} />, path: '/tasks',
      label: 'Create a task',
      desc:  'Start tracking your work.',
      done:  counts.tasks > 0,
    },
    {
      id: 'invoice', icon: <FiFileText size={15} />, path: '/invoices',
      label: 'Send your first invoice',
      desc:  'Get paid in under a minute.',
      done:  counts.invoices > 0,
    },
  ];
  const checkDone  = checklist.filter(c => c.done).length;
  const allChecked = checkDone === checklist.length;

  /* ── AI Daily Focus ────────────────────────────────────── */
  const generateFocus = async () => {
    setFocusLoad(true);
    const system = `You are a freelance productivity coach. Give a crisp, personalised daily focus in exactly 2 sentences. Be direct, specific, and cite their actual numbers. No generic advice.`;
    const msg    = `Freelancer workspace: ${dash.activeClients || 0} active clients, ${dash.taskCount || counts.tasks} pending tasks, ${fmt$(dash.monthRevenue || 0)} earned this month, ${dash.overdueCount || 0} overdue invoices worth ${fmt$(dash.overdueRevenue || 0)}. What single thing should they focus on right now for maximum impact today?`;
    try {
      const text = await askClaude(system, msg);
      setFocus(text.trim());
    } catch {
      setFocus('Could not reach AI — check your connection and try again.');
    }
    setFocusDone(true);
    setFocusLoad(false);
  };

  /* ── Referral copy ─────────────────────────────────────── */
  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${user?._id?.slice(-8) || 'aurelance'}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const dismissBanner = () => {
    setBannerOff(true);
    localStorage.setItem('hm_banner_off', '1');
  };

  /* ── Quick launch cards ────────────────────────────────── */
  const quickCards = [
    { label: 'Dashboard',   sub: 'Analytics & AI',      icon: <FiBarChart2 size={20} />,   color: '#c9a84c', path: '/dashboard',   badge: null },
    { label: 'Clients',     sub: 'Manage relationships', icon: <FiUsers size={20} />,       color: '#4a90d9', path: '/clients',     badge: counts.clients     || null },
    { label: 'Tasks',       sub: 'Track your work',      icon: <FiCheckCircle size={20} />, color: '#4caf82', path: '/tasks',       badge: dash.overdueTasks  || null },
    { label: 'Invoices',    sub: 'Billing & payments',   icon: <FiFileText size={20} />,    color: '#e8a030', path: '/invoices',    badge: dash.overdueCount  || null },
    { label: 'Atelier',     sub: 'Freelance tools',      icon: <FiTool size={20} />,        color: '#9b72e8', path: '/atelier',     badge: null },
    { label: 'Connections', sub: 'Your network',         icon: <FiActivity size={20} />,    color: '#38bdf8', path: '/connections', badge: null },
  ];

  /* ── Recent activity — last 3 invoices + 3 tasks ──────── */
  const recentInvoices = arr(dash.recentInvoices).slice(0, 2);
  const recentTasks    = arr(dash.recentTasks).slice(0, 2);
  const hasActivity    = recentInvoices.length > 0 || recentTasks.length > 0;

  /* ── Snapshot data ─────────────────────────────────────── */
  const snapshots = [
    {
      icon:  <FiDollarSign size={16} />,
      label: 'This Month',
      value: loading ? '—' : fmt$(dash.monthRevenue || 0),
      sub:   'revenue',
      color: '#c9a84c',
    },
    {
      icon:  <FiCheckCircle size={16} />,
      label: 'Pending Tasks',
      value: loading ? '—' : String(counts.tasks || 0),
      sub:   dash.overdueTasks > 0 ? `${dash.overdueTasks} overdue` : 'all on track',
      color: dash.overdueTasks > 0 ? '#e05c5c' : '#4caf82',
    },
    {
      icon:  <FiFileText size={16} />,
      label: 'Overdue Invoices',
      value: loading ? '—' : String(dash.overdueCount || 0),
      sub:   dash.overdueCount > 0 ? fmt$(dash.overdueRevenue || 0) + ' outstanding' : 'all paid',
      color: dash.overdueCount > 0 ? '#e8a030' : '#4caf82',
    },
    {
      icon:  <FiUsers size={16} />,
      label: 'Active Clients',
      value: loading ? '—' : String(dash.activeClients || counts.clients || 0),
      sub:   `of ${dash.totalClients || counts.clients || 0} total`,
      color: '#4a90d9',
    },
  ];

  /* ─────────────────────────────────────────────────────── */
  return (
    <div className="hm-root">
      <div className="hm-orb hm-orb-1" />
      <div className="hm-orb hm-orb-2" />
      <div className="hm-orb hm-orb-3" />

      <div className="hm-wrap">

        {/* ─── 1. HERO ─────────────────────────────────── */}
        <section className="hm-hero">
          <div className="hm-hero-inner">
            <div className="hm-hero-left">
              {avatar
                ? <img src={avatar} alt={firstName} className="hm-avatar" />
                : <div className="hm-avatar hm-avatar-fb">{firstName[0]?.toUpperCase()}</div>}
              <div>
                <h1 className="hm-greeting">{greeting}, {firstName}.</h1>
                <p className="hm-date">
                  <FiCalendar size={11} />
                  {today}
                  <span className={`hm-plan-chip${isPremium ? ' premium' : ''}`}>
                    <FiStar size={9} />
                    {isPremium ? 'Premium' : 'Free Plan'}
                  </span>
                </p>
              </div>
            </div>
            <div className="hm-hero-btns">
              <button className="hm-icon-btn" onClick={() => navigate('/dashboard')} title="Dashboard">
                <FiBarChart2 size={14} />
              </button>
              <button className="hm-icon-btn" onClick={() => navigate('/settings')} title="Settings">
                <FiSettings size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ─── 2. SNAPSHOT STRIP ───────────────────────── */}
        <div className="hm-snapshot">
          {snapshots.map((s, i) => (
            <div key={i} className="hm-snap-card" style={{ '--sc': s.color }}>
              <div className="hm-snap-icon" style={{ color: s.color, background: s.color + '16' }}>
                {s.icon}
              </div>
              <div className="hm-snap-body">
                <div className="hm-snap-label">{s.label}</div>
                <div className="hm-snap-value">
                  {loading ? <div className="hm-skel" /> : s.value}
                </div>
                <div className="hm-snap-sub" style={{ color: s.color }}>{loading ? '' : s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── 3. ONBOARDING ───────────────────────────── */}
        {!loading && !allChecked && (
          <section className="hm-onboarding">
            <div className="hm-ob-head">
              <div>
                <h2 className="hm-ob-title">Get set up</h2>
                <p className="hm-ob-sub">Complete these steps to get the most out of Aurelance.</p>
              </div>
              <div className="hm-ob-prog-wrap">
                <div className="hm-ob-prog-track">
                  <div className="hm-ob-prog-fill" style={{ width: `${(checkDone / checklist.length) * 100}%` }} />
                </div>
                <span className="hm-ob-prog-label">{checkDone}/{checklist.length}</span>
              </div>
            </div>
            <div className="hm-ob-grid">
              {checklist.map((item, i) => (
                <div key={item.id}
                  className={`hm-ob-item${item.done ? ' done' : ''}`}
                  onClick={() => !item.done && navigate(item.path)}>
                  <div className={`hm-ob-check${item.done ? ' checked' : ''}`}>
                    {item.done ? <FiCheck size={12} /> : <span className="hm-ob-num">{i + 1}</span>}
                  </div>
                  <span className="hm-ob-icon" style={{ color: item.done ? '#4caf82' : '#5a5650' }}>
                    {item.icon}
                  </span>
                  <div className="hm-ob-text">
                    <span className="hm-ob-label">{item.label}</span>
                    <span className="hm-ob-desc">{item.desc}</span>
                  </div>
                  {!item.done && (
                    <span className="hm-ob-go">Start <FiArrowRight size={10} /></span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 4. UPGRADE BANNER ───────────────────────── */}
        {!isPremium && !bannerOff && (
          <div className="hm-banner">
            <div className="hm-banner-left">
              <FiStar size={15} className="hm-banner-star" />
              <div>
                <strong>Unlock Aurelance Premium</strong>
                <span>Earnings Analytics · Smart Contracts · Proposal Builder · Tax Summary · AI Daily Focus</span>
              </div>
            </div>
            <div className="hm-banner-right">
              <button className="hm-banner-btn" onClick={() => navigate('/atelier')}>
                Upgrade — $19/mo
              </button>
              <button className="hm-banner-close" onClick={dismissBanner} aria-label="Dismiss">✕</button>
            </div>
          </div>
        )}

        {/* ─── 5. AI DAILY FOCUS ───────────────────────── */}
        <section className="hm-focus-wrap">
          <div className="hm-focus-card">
            <div className="hm-focus-hdr">
              <div className="hm-focus-hdr-left">
                <FiZap size={14} className="hm-focus-zap" />
                <span className="hm-focus-title">AI Daily Focus</span>
                <span className={`hm-badge${isPremium ? ' teal' : ' locked'}`}>
                  {isPremium ? '✦ Premium' : '✦ Locked'}
                </span>
              </div>
              <span className="hm-focus-date">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {!isPremium ? (
              <div className="hm-focus-locked">
                <FiLock size={18} />
                <div>
                  <strong>Premium feature</strong>
                  <p>Get a sharp AI recommendation on exactly what to focus on today — based on your live workspace data. Which client to contact, which task to tackle first, which financial risk to address.</p>
                </div>
                <button className="hm-upgrade-pill" onClick={() => navigate('/atelier')}>
                  Upgrade <FiArrowRight size={11} />
                </button>
              </div>
            ) : !focusDone && !focusLoad ? (
              <div className="hm-focus-idle">
                <p>One click to get a sharp recommendation on what to focus on today — powered by your live data.</p>
                <button className="hm-focus-btn" onClick={generateFocus}>
                  <FiZap size={12} /> Generate My Focus
                </button>
              </div>
            ) : focusLoad ? (
              <div className="hm-focus-loading">
                <Spinner size={16} color="#38bdf8" />
                <span>Reading your workspace data…</span>
              </div>
            ) : (
              <div className="hm-focus-result">
                <p className="hm-focus-text">{focus}</p>
                <button className="hm-focus-regen" onClick={() => { setFocusDone(false); setFocus(''); }}>
                  <FiRefreshCw size={11} /> Regenerate
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ─── 6. QUICK LAUNCH ─────────────────────────── */}
        <section className="hm-section">
          <h2 className="hm-section-title">Quick Launch</h2>
          <div className="hm-ql-grid">
            {quickCards.map((q, i) => (
              <button key={i} className="hm-ql-card" style={{ '--qc': q.color }} onClick={() => navigate(q.path)}>
                {q.badge > 0 && (
                  <span className="hm-ql-badge">{q.badge > 99 ? '99+' : q.badge}</span>
                )}
                <span className="hm-ql-icon" style={{ color: q.color, background: q.color + '16' }}>
                  {q.icon}
                </span>
                <span className="hm-ql-label">{q.label}</span>
                <span className="hm-ql-sub">{q.sub}</span>
                <span className="hm-ql-arrow"><FiArrowRight size={11} /></span>
              </button>
            ))}
          </div>
        </section>

        {/* ─── 7. RECENT ACTIVITY ──────────────────────── */}
        {!loading && hasActivity && (
          <section className="hm-section">
            <div className="hm-ra-hdr">
              <h2 className="hm-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                Recent Activity
              </h2>
              <button className="hm-ra-more" onClick={() => navigate('/dashboard')}>
                See all <FiArrowRight size={11} />
              </button>
            </div>
            <div className="hm-ra-list">
              {recentInvoices.map((inv, i) => (
                <div key={i} className="hm-ra-row" onClick={() => navigate('/invoices')}>
                  <div className="hm-ra-icon inv">
                    <FiFileText size={13} />
                  </div>
                  <div className="hm-ra-body">
                    <span className="hm-ra-title">
                      Invoice {inv.invoiceNumber || '#—'} · {inv.clientName || 'Client'}
                    </span>
                    <span className="hm-ra-meta">{fmtDate(inv.issueDate)}</span>
                  </div>
                  <span className={`hm-ra-chip ${inv.status}`}>{inv.status}</span>
                  <span className="hm-ra-amount">{fmt$(inv.total)}</span>
                </div>
              ))}
              {recentTasks.map((task, i) => (
                <div key={i} className="hm-ra-row" onClick={() => navigate('/tasks')}>
                  <div className="hm-ra-icon task">
                    <FiCheckCircle size={13} />
                  </div>
                  <div className="hm-ra-body">
                    <span className="hm-ra-title">{task.title || 'Untitled task'}</span>
                    <span className="hm-ra-meta">
                      {task.deadline ? `Due ${fmtDate(task.deadline)}` : 'No deadline'}
                    </span>
                  </div>
                  <span className={`hm-ra-chip ${task.status || 'todo'}`}>{task.status || 'To do'}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 8. WHAT'S NEW ───────────────────────────── */}
        <section className="hm-section">
          <div className="hm-wn-hdr">
            <h2 className="hm-section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
              What's New
            </h2>
            <span className="hm-wn-live-dot" />
          </div>
          <div className="hm-wn-list">
            {WHATS_NEW.map((item, i) => (
              <div key={i} className="hm-wn-row" onClick={() => navigate(item.path)}>
                <span className="hm-wn-icon" style={{ color: item.tagColor, background: item.tagColor + '14' }}>
                  {item.icon}
                </span>
                <div className="hm-wn-body">
                  <div className="hm-wn-top">
                    <span className="hm-wn-tag" style={{ color: item.tagColor, borderColor: item.tagColor + '38', background: item.tagColor + '0e' }}>
                      {item.tag}
                    </span>
                    <span className="hm-wn-title">{item.title}</span>
                  </div>
                  <span className="hm-wn-desc">{item.desc}</span>
                </div>
                <FiArrowRight size={12} className="hm-wn-arrow" />
              </div>
            ))}
          </div>
        </section>

        {/* ─── 9. REFERRAL ─────────────────────────────── */}
        <section className="hm-referral">
          <div className="hm-ref-left">
            <div className="hm-ref-icon"><FiGift size={17} /></div>
            <div>
              <strong>Invite a Colleague</strong>
              <p>Share Aurelance with fellow freelancers.</p>
            </div>
          </div>
          <div className="hm-ref-right">
            <div className="hm-ref-link">
              <span>{window.location.origin}/register?ref={user?._id?.slice(-8) || 'aurelance'}</span>
            </div>
            <button className="hm-ref-btn" onClick={copyLink}>
              {copied
                ? <><FiCheck size={11} /> Copied!</>
                : <><FiCopy size={11} /> Copy Link</>}
            </button>
          </div>
        </section>

        {/* ─── 10. UPGRADE CTA ─────────────────────────── */}
        {!isPremium && (
          <section className="hm-upgrade-cta">
            <div className="hm-ucta-glow" />
            <div className="hm-ucta-body">
              <div className="hm-ucta-crown">✦</div>
              <h2 className="hm-ucta-title">Unlock the full power of Aurelance</h2>
              <p className="hm-ucta-sub">
                Premium tools that actively help you grow — not just track.
              </p>
              <div className="hm-ucta-features">
                {[
                  { icon: <FiBarChart2 size={13} />, label: 'Earnings Analytics' },
                  { icon: <FiShield size={13} />,    label: 'Smart Contracts'    },
                  { icon: <FiTrendingUp size={13} />,label: 'Proposal Builder'   },
                  { icon: <FiZap size={13} />,       label: 'AI Daily Focus'     },
                  { icon: <FiBarChart2 size={13} />, label: 'Tax Summary'        },
                ].map((f, i) => (
                  <div className="hm-ucta-feat" key={i}>
                    <span className="hm-ucta-feat-ico">{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>
              <button className="hm-ucta-btn" onClick={() => navigate('/atelier')}>
                <FiStar size={13} /> Upgrade to Premium — $19/mo
              </button>
              <p className="hm-ucta-note">Cancel any time · No contracts</p>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}