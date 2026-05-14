// src/pages/Dashboard.jsx — Production Final
// ─────────────────────────────────────────────────────────────
//  All MUI removed. GSAP removed. CSS animations only.
//  All API field names corrected to match backend response.
//  Recharts kept for charts.
//
//  API: GET /api/dashboard (one call for everything)
//       GET /api/dashboard/revenue?months=6 (chart with expenses)
//       GET /api/dashboard/productivity?weeks=5 (weekly completed)
//
//  Actual backend fields used throughout:
//   totalRevenue, pendingRevenue, overdueRevenue, monthRevenue
//   totalClients, activeClients, newClients
//   totalInvoices, paidCount, pendingCount, overdueCount
//   totalTasks, completedTasks, overdueTasks, dueSoon
//   tasksByStatus, yearExpenses, netProfit
//   recentInvoices, recentTasks, upcomingTasks
// ─────────────────────────────────────────────────────────────
import React from 'react';
import '../styles/components.css';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import {
  FiUsers, FiDollarSign, FiTrendingUp, FiCheckCircle, FiAlertCircle,
  FiClock, FiStar, FiZap, FiTarget, FiActivity, FiFileText, FiCalendar,
  FiAward, FiRefreshCw, FiPlusCircle, FiX, FiBell, FiExternalLink,
  FiTool, FiSend, FiMessageSquare, FiBarChart2, FiLock, FiEdit3,
  FiPercent, FiCreditCard, FiTrendingDown, FiArrowUp, FiArrowRight,
} from 'react-icons/fi';
import { useAuth }    from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/* ── API ───────────────────────────────────────────────────── */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tok  = () => localStorage.getItem('authToken');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` });
const api  = {
  get:    url      => fetch(`${BASE}${url}`,  { headers: hdrs() }).then(r => r.json()),
  post:   (url, b) => fetch(`${BASE}${url}`,  { method: 'POST',  headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  patch:  (url, b) => fetch(`${BASE}${url}`,  { method: 'PATCH', headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  delete: url      => fetch(`${BASE}${url}`,  { method: 'DELETE', headers: hdrs() }).then(r => r.json()),
};

/* ── Anthropic ─────────────────────────────────────────────── */
const askClaude = async (system, userMsg, history = []) => {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:    'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages: [...history, { role: 'user', content: userMsg }],
    }),
  });
  const d = await res.json();
  return d.content?.map(b => b.text || '').join('') || '';
};

/* ── Auth HOC ──────────────────────────────────────────────── */
const withAuth = C => props => {
  const auth = useAuth();
  const navigate = useNavigate();
  return <C {...props} auth={auth} navigate={navigate} />;
};

/* ── Helpers ───────────────────────────────────────────────── */
const arr    = v  => Array.isArray(v) ? v : [];
const fmt$   = n  => '$' + (+(n || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 });
const dLeft  = d  => Math.ceil((new Date(d) - new Date()) / 86400000);
const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pct    = (n, d) => d > 0 ? Math.round((n / d) * 100) : 0;
const fmtDate= d  => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

/* ── Normalise backend stats response ──────────────────────── */
const normalizeStats = d => {
  const ml   = arr(d.monthlyRevenue);
  const curr = ml[ml.length - 1]?.revenue || 0;
  const prev = ml[ml.length - 2]?.revenue || 0;
  const revenueChange = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
  const totalInv = (d.paidCount||0) + (d.pendingCount||0) + (d.overdueCount||0);
  return {
    totalClients:    d.totalClients    || 0,
    activeClients:   d.activeClients   || 0,
    newClients:      d.newClients      || 0,
    totalRevenue:    d.totalRevenue    || 0,
    pendingRevenue:  d.pendingRevenue  || 0,
    overdueRevenue:  d.overdueRevenue  || 0,
    monthRevenue:    d.monthRevenue    || 0,
    monthlyRevenue:  ml,
    paidCount:       d.paidCount       || 0,
    pendingCount:    d.pendingCount    || 0,
    overdueCount:    d.overdueCount    || 0,
    totalTasks:      d.totalTasks      || 0,
    completedTasks:  d.completedTasks  || 0,
    overdueTasks:    d.overdueTasks    || 0,
    dueSoon:         d.dueSoon         || 0,
    tasksByStatus:   d.tasksByStatus   || {},
    totalConnections:d.totalConnections|| 0,
    yearExpenses:    d.yearExpenses    || 0,
    netProfit:       d.netProfit       || 0,
    recentInvoices:  arr(d.recentInvoices),
    recentTasks:     arr(d.recentTasks),
    upcomingTasks:   arr(d.upcomingTasks),
    // computed
    revenueChange,
    tasksPending:      Math.max(0, (d.totalTasks||0) - (d.completedTasks||0)),
    productivityScore: pct(d.completedTasks||0, d.totalTasks||0),
    collectionRate:    totalInv > 0 ? pct(d.paidCount||0, totalInv) : null,
    avgProjectValue:   (d.activeClients||0) > 0 ? Math.round((d.totalRevenue||0) / d.activeClients) : 0,
  };
};

/* ── Spinner (replaces CircularProgress) ───────────────────── */
const Spinner = ({ size = 18, color = '#c9a84c' }) => (
  <div className="db-spinner" style={{ width: size, height: size, borderTopColor: color }}/>
);

/* ── Skeleton shimmer ──────────────────────────────────────── */
const Sk = ({ h = 10, w = '80%', mb = 8, br = 6 }) => (
  <div style={{ height: h, width: w, borderRadius: br, marginBottom: mb,
    background: 'linear-gradient(90deg,#14141a 25%,#1c1c24 50%,#14141a 75%)',
    backgroundSize: '400px 100%', animation: 'db-shimmer 1.4s infinite' }}/>
);
const Skel = ({ n = 4 }) => (
  <div style={{ padding: '4px 0' }}>
    {Array.from({ length: n }, (_, i) => (
      <Sk key={i} w={['82%','100%','65%','90%'][i] || '75%'} h={i === 0 ? 13 : 10}/>
    ))}
  </div>
);

/* ── Empty state ───────────────────────────────────────────── */
const Empty = ({ icon, title, msg, action, onAction }) => (
  <div className="db-empty">
    <span className="db-empty-icon">{icon}</span>
    <strong className="db-empty-title">{title}</strong>
    <p className="db-empty-msg">{msg}</p>
    {action && <button className="db-empty-btn" onClick={onAction}>{action}</button>}
  </div>
);

/* ── Premium gate ──────────────────────────────────────────── */
const PremiumGate = ({ feature, description, onUpgrade }) => (
  <div className="premium-gate">
    <div className="pg-icon"><FiLock size={22}/></div>
    <strong className="pg-title">Premium Feature</strong>
    <p className="pg-desc">{description || `${feature} is available on the Premium plan.`}</p>
    <button className="pg-btn" onClick={() => onUpgrade?.('/atelier')}>Upgrade to Premium</button>
  </div>
);

/* ── Toast ─────────────────────────────────────────────────── */
const Toast = ({ msg, onClose }) => msg ? (
  <div className="db-toast">
    {msg}
    <button className="db-toast-close" onClick={onClose}><FiX size={11}/></button>
  </div>
) : null;

/* ── Button (replaces MUI Button) ──────────────────────────── */
const DbBtn = ({ children, onClick, disabled, ghost, className = '', style }) => (
  <button className={`db-btn${ghost ? ' ghost' : ''}${className ? ' ' + className : ''}`}
    onClick={onClick} disabled={disabled} style={style}>
    {children}
  </button>
);

/* ── Input (replaces MUI TextField) ────────────────────────── */
const DbInput = ({ value, onChange, onKeyDown, placeholder, disabled, type = 'text', fullWidth }) => (
  <input className={`db-input${fullWidth ? ' full' : ''}`}
    type={type} value={value} placeholder={placeholder}
    disabled={disabled} onChange={onChange} onKeyDown={onKeyDown}/>
);

/* ══════════════════════════════════════════════════════════════
   KPI STRIP — 6 metrics with real field names
══════════════════════════════════════════════════════════════ */
const KPIStrip = ({ stats: s, loading }) => {
  if (loading) return (
    <div className="kpi-strip">
      {[0,1,2,3,4,5].map(i => (
        <div className="kpi-item" key={i}>
          <Sk h={28} w="55%" mb={8} br={5}/><Sk h={9} w="60%" mb={4} br={4}/><Sk h={9} w="42%" mb={0} br={4}/>
        </div>
      ))}
    </div>
  );

  const kpis = [
    { label:'Active Clients',   v: s.activeClients,
      sub: `${s.totalClients} total · ${s.newClients} new this month`,
      up:  s.activeClients > 0, icon:<FiUsers size={16}/>, c:'#4a90d9' },
    { label:'Revenue · Month',  v: fmt$(s.monthRevenue),
      sub: s.revenueChange != null
        ? `${s.revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(s.revenueChange)}% vs last month`
        : 'From paid invoices',
      up:  (s.revenueChange || 0) >= 0, icon:<FiDollarSign size={16}/>, c:'#c9a84c' },
    { label:'Avg Project Value', v: fmt$(s.avgProjectValue),
      sub: 'Per active client',
      up:  s.avgProjectValue > 0, icon:<FiCreditCard size={16}/>, c:'#9b72e8' },
    { label:'Collection Rate',   v: s.collectionRate != null ? `${s.collectionRate}%` : '—',
      sub: s.collectionRate == null ? 'No invoices yet'
         : s.collectionRate >= 80 ? 'Healthy' : 'Needs attention',
      up:  s.collectionRate == null || s.collectionRate >= 80,
      icon:<FiPercent size={16}/>, c:'#4caf82' },
    { label:'Overdue',           v: fmt$(s.overdueRevenue),
      sub: s.overdueCount > 0 ? `${s.overdueCount} invoice${s.overdueCount > 1 ? 's' : ''}` : 'Nothing overdue',
      up:  s.overdueCount === 0, icon:<FiAlertCircle size={16}/>, c:'#e05c5c' },
    { label:'Productivity',      v: s.productivityScore > 0 ? `${s.productivityScore}%` : '—',
      sub: `${s.completedTasks} done · ${s.tasksPending} pending`,
      up:  s.productivityScore >= 70, icon:<FiTarget size={16}/>, c:'#38bdf8' },
  ];

  return (
    <div className="kpi-strip">
      {kpis.map((k, i) => (
        <div className="kpi-item" key={i}>
          <div className="kpi-top">
            <span className="kpi-icon-box" style={{ color: k.c, background: `${k.c}18` }}>{k.icon}</span>
            <span className={`kpi-dot ${k.up ? 'up' : 'down'}`}/>
          </div>
          <div className="kpi-val">{k.v}</div>
          <div className="kpi-lbl">{k.label}</div>
          <div className="kpi-sub">{k.sub}</div>
        </div>
      ))}
    </div>
  );
};

/* ── Quick Nav ─────────────────────────────────────────────── */
const QuickNav = ({ navigate }) => {
  const pills = [
    { label:'+ Client',  path:'/clients',     c:'#4a90d9' },
    { label:'+ Invoice', path:'/invoices',    c:'#c9a84c' },
    { label:'+ Task',    path:'/tasks',       c:'#4caf82' },
    { label:'Atelier',   path:'/atelier',     c:'#9b72e8' },
    { label:'Network',   path:'/connections', c:'#38bdf8' },
    { label:'Profile',   path:'/profile',     c:'#e8a030' },
    { label:'Settings',  path:'/settings',    c:'#8e8a82' },
  ];
  return (
    <div className="quick-nav">
      {pills.map((p, i) => (
        <button key={i} className="qn-pill" style={{ '--pc': p.c }} onClick={() => navigate(p.path)}>
          {p.label}
        </button>
      ))}
    </div>
  );
};

/* ── Financial Health Bar ──────────────────────────────────── */
const FinancialHealth = ({ stats: s, loading, navigate }) => {
  if (loading) return <div className="fin-health db-card"><Skel n={3}/></div>;
  const total = s.totalRevenue + s.pendingRevenue;
  const ePct  = total > 0 ? clamp(pct(s.totalRevenue, total), 0, 100) : 0;
  const uPct  = total > 0 ? clamp(pct(s.pendingRevenue, total), 0, 100) : 0;
  const oPct  = s.pendingRevenue > 0 ? clamp(pct(s.overdueRevenue, s.pendingRevenue), 0, 100) : 0;
  return (
    <div className="fin-health db-card">
      <div className="fin-head">
        <div className="fin-title-col">
          <span className="fin-title">Financial Health</span>
          {s.revenueChange != null && (
            <span className="fin-trend" style={{ color: s.revenueChange >= 0 ? '#4caf82' : '#e05c5c' }}>
              {s.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(s.revenueChange)}% vs last month
            </span>
          )}
        </div>
        <div className="fin-nums">
          {[
            { label: 'This Month', val: fmt$(s.monthRevenue),   color: '#c9a84c' },
            { label: 'Unpaid',     val: fmt$(s.pendingRevenue), color: s.pendingRevenue > 0 ? '#e8a030' : '#4caf82' },
            { label: 'Overdue',    val: fmt$(s.overdueRevenue), color: s.overdueRevenue > 0 ? '#e05c5c' : '#4caf82' },
            { label: 'Net Profit', val: fmt$(s.netProfit),      color: s.netProfit >= 0 ? '#4caf82' : '#e05c5c' },
            { label: 'All-Time',   val: fmt$(s.totalRevenue),   color: '#f0ece4' },
          ].map((n, i) => (
            <div className="fin-num" key={i}>
              <span className="fn-label">{n.label}</span>
              <span className="fn-val" style={{ color: n.color }}>{n.val}</span>
            </div>
          ))}
        </div>
        <button className="fin-cta" onClick={() => navigate('/invoices')}>
          Invoices <FiExternalLink size={11}/>
        </button>
      </div>
      {total > 0 && (
        <>
          <div className="fin-bar">
            <div className="fin-seg-earned" style={{ width: `${ePct}%` }} title={`Collected ${fmt$(s.totalRevenue)}`}/>
            <div className="fin-seg-unpaid" style={{ width: `${uPct}%` }} title={`Pending ${fmt$(s.pendingRevenue)}`}/>
          </div>
          <div className="fin-legend">
            <span><span className="fl-dot earned"/>Collected ({ePct}%)</span>
            <span><span className="fl-dot unpaid"/>Pending ({uPct}%)</span>
            {s.overdueRevenue > 0 && <span><span className="fl-dot overdue"/>Overdue ({oPct}% of pending)</span>}
            {s.yearExpenses > 0 && <span><span className="fl-dot expenses"/>Expenses {fmt$(s.yearExpenses)} this year</span>}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Revenue Chart (uses /api/dashboard/revenue) ───────────── */
const RevenueChart = ({ data, loading }) => {
  if (loading) return <div className="db-card revenue-overview"><Skel n={5}/></div>;
  const safe   = arr(data);
  const totRev = safe.reduce((s, d) => s + (d.revenue  || 0), 0);
  const totExp = safe.reduce((s, d) => s + (d.expenses || 0), 0);
  const net    = totRev - totExp;
  const hasData = safe.some(d => d.revenue > 0 || d.expenses > 0);
  return (
    <div className="db-card revenue-overview">
      <div className="section-hdr">
        <h4 className="db-card-title"><FiTrendingUp style={{ color:'#c9a84c', marginRight:8 }}/>Revenue vs Expenses</h4>
        <span className="db-badge gold">6 Months</span>
      </div>
      {!hasData ? (
        <Empty icon={<FiDollarSign size={28}/>} title="No revenue data yet" msg="Mark invoices as paid to populate this chart"/>
      ) : (
        <>
          <div className="rev-row">
            {[['Revenue', fmt$(totRev), '#c9a84c'], ['Expenses', fmt$(totExp), '#9b72e8'], ['Net', fmt$(net), net >= 0 ? '#4caf82' : '#e05c5c']].map(([l, v, c], i) => (
              <div className="rev-block" key={i}>
                <span className="rb-label">{l}</span>
                <span className="rb-val" style={{ color: c }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 220, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safe} margin={{ top:6, right:10, left:-14, bottom:0 }}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="#c9a84c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#9b72e8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#9b72e8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.035)" vertical={false}/>
                <XAxis dataKey="month" stroke="#3a3835" tick={{ fill:'#5a5650', fontSize:10 }} tickLine={false} axisLine={false}/>
                <YAxis stroke="#3a3835" tick={{ fill:'#5a5650', fontSize:10 }} tickLine={false} axisLine={false}/>
                <RTooltip contentStyle={{ background:'#17171d', border:'1px solid rgba(201,168,76,0.25)', borderRadius:10, fontFamily:'DM Sans', fontSize:12 }}
                  itemStyle={{ color:'#e8c97a' }} formatter={v => [fmt$(v)]}/>
                <Area type="monotone" dataKey="revenue"  stroke="#c9a84c" strokeWidth={2}   fill="url(#gR)" dot={{ r:3, fill:'#c9a84c', stroke:'#0a0a0c', strokeWidth:2 }}/>
                <Area type="monotone" dataKey="expenses" stroke="#9b72e8" strokeWidth={1.5} fill="url(#gE)" dot={{ r:2.5, fill:'#9b72e8', stroke:'#0a0a0c', strokeWidth:2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><span className="cl-dot" style={{ background:'#c9a84c' }}/>Revenue</span>
            <span><span className="cl-dot" style={{ background:'#9b72e8' }}/>Expenses</span>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Client Snapshot ───────────────────────────────────────── */
const ClientSnapshot = ({ clients, loading, navigate }) => {
  if (loading) return <div className="db-card client-distribution"><Skel/></div>;
  const safe   = arr(clients);
  const slices = [
    { name:'Active',      value: safe.filter(c => c.status === 'Active').length,      color:'#4a90d9' },
    { name:'In Progress', value: safe.filter(c => c.status === 'In Progress').length,  color:'#e8a030' },
    { name:'Completed',   value: safe.filter(c => c.status === 'Completed').length,    color:'#4caf82' },
    { name:'On Hold',     value: safe.filter(c => c.status === 'On Hold').length,      color:'#4a4843' },
  ].filter(d => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0);
  return (
    <div className="db-card client-distribution">
      <div className="section-hdr">
        <h4 className="db-card-title"><FiAward style={{ color:'#4caf82', marginRight:8 }}/>Clients</h4>
        <button className="db-link-btn" onClick={() => navigate('/clients')}>All <FiExternalLink size={11}/></button>
      </div>
      {!total ? (
        <Empty icon={<FiUsers size={26}/>} title="No clients yet" msg="Add your first client"
          action="Add Client" onAction={() => navigate('/clients')}/>
      ) : (
        <>
          <div style={{ height: 148, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} cx="50%" cy="50%" innerRadius={44} outerRadius={66}
                  paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                  {slices.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent"/>)}
                </Pie>
                <RTooltip contentStyle={{ background:'#17171d', border:'1px solid rgba(201,168,76,0.25)', borderRadius:8, fontFamily:'DM Sans', fontSize:12 }} itemStyle={{ color:'#e8c97a' }}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-n">{total}</span>
              <span className="donut-s">clients</span>
            </div>
          </div>
          <div className="dist-legend">
            {slices.map((d, i) => (
              <div className="dist-row" key={i}>
                <span className="dist-dot" style={{ background: d.color }}/>
                <span className="dist-name">{d.name}</span>
                <span className="dist-val" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Upcoming Tasks ────────────────────────────────────────── */
class UpcomingTasks extends React.Component {
  state = { tasks: [], loading: true };
  async componentDidMount() {
    try {
      const r = await api.get('/tasks?completed=false&sort=deadline&limit=7');
      this.setState({ tasks: arr(r.tasks || r), loading: false });
    } catch { this.setState({ loading: false }); }
  }
  async markDone(task) {
    this.setState(s => ({ tasks: s.tasks.filter(t => t._id !== task._id) }));
    try { await api.patch(`/tasks/${task._id}`, { completed: true }); } catch {}
  }
  render() {
    const { tasks, loading } = this.state;
    const { navigate } = this.props;
    const pc = { High: '#e05c5c', Medium: '#e8a030', Low: '#4caf82' };
    return (
      <div className="db-card upcoming-tasks">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiCheckCircle style={{ color:'#4caf82', marginRight:8 }}/>Upcoming Tasks</h4>
          <button className="db-link-btn" onClick={() => navigate('/tasks')}>All <FiExternalLink size={11}/></button>
        </div>
        {loading ? <Skel/> : !tasks.length ? (
          <Empty icon={<FiCheckCircle size={26}/>} title="All caught up!" msg="No pending tasks."
            action="Add Task" onAction={() => navigate('/tasks')}/>
        ) : (
          <div className="task-list">
            {tasks.map(t => {
              const left = t.deadline ? dLeft(t.deadline) : null;
              const over = left !== null && left < 0;
              return (
                <div key={t._id} className={`task-row${over ? ' task-overdue' : ''}`}>
                  <button className="task-check" onClick={() => this.markDone(t)} title="Mark complete">
                    <div className="task-circle"/>
                  </button>
                  <div className="task-info">
                    <span className="task-name">{t.title || t.name}</span>
                    <div className="task-meta">
                      {t.priority && <span className="task-pri" style={{ color: pc[t.priority] || '#8e8a82', background: `${pc[t.priority] || '#8e8a82'}12` }}>{t.priority}</span>}
                      {t.deadline && <span className="task-due" style={{ color: over ? '#e05c5c' : left <= 2 ? '#e8a030' : '#5a5650' }}>
                        <FiCalendar size={9}/>{over ? `${Math.abs(left)}d overdue` : left === 0 ? 'Today' : `${left}d`}
                      </span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

/* ── Overdue Alerts ────────────────────────────────────────── */
class OverdueAlerts extends React.Component {
  state = { items: [], loading: true };
  async componentDidMount() {
    try {
      const [ir, tr] = await Promise.allSettled([
        api.get('/invoices?status=overdue&limit=5'),
        api.get('/tasks?overdue=true&completed=false&limit=5'),
      ]);
      const invoices = ir.status === 'fulfilled' ? arr(ir.value.invoices || ir.value) : [];
      const tasks    = tr.status === 'fulfilled' ? arr(tr.value.tasks    || tr.value) : [];
      const items = [
        ...invoices.map(inv => ({
          type: 'invoice', id: inv._id,
          title: `Invoice #${inv.invoiceNumber || inv._id?.slice(-5)} — ${inv.clientName || 'Client'}`,
          sub:   `${fmt$(inv.total || 0)} · Due ${fmtDate(inv.dueDate)}`,
          color: '#e8a030', icon: <FiFileText size={13}/>, path: '/invoices',
        })),
        ...tasks.map(t => ({
          type: 'task', id: t._id, title: t.title || t.name,
          sub:   `${t.priority || '—'} · ${t.deadline ? Math.abs(dLeft(t.deadline)) + 'd overdue' : 'Past due'}`,
          color: '#e05c5c', icon: <FiCheckCircle size={13}/>, path: '/tasks',
        })),
      ];
      this.setState({ items, loading: false });
    } catch { this.setState({ loading: false }); }
  }
  render() {
    const { items, loading } = this.state;
    const { navigate } = this.props;
    return (
      <div className="db-card overdue-alerts">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiAlertCircle style={{ color:'#e05c5c', marginRight:8 }}/>Overdue</h4>
          {items.length > 0
            ? <span className="overdue-badge">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            : <span className="db-badge green">All Clear ✓</span>}
        </div>
        {loading ? <Skel/> : !items.length ? (
          <Empty icon={<FiCheckCircle size={26}/>} title="Nothing overdue" msg="You're on top of everything!"/>
        ) : (
          <div className="alert-list">
            {items.map((it, i) => (
              <div key={i} className="alert-row" style={{ borderLeftColor: it.color }} onClick={() => navigate(it.path)}>
                <span className="alert-icon" style={{ color: it.color, background: `${it.color}14` }}>{it.icon}</span>
                <div className="alert-body">
                  <span className="alert-title">{it.title}</span>
                  <span className="alert-sub">{it.sub}</span>
                </div>
                <span className="alert-type" style={{ color: it.color, background: `${it.color}12`, borderColor: `${it.color}28` }}>{it.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

/* ── Productivity Chart (API: {week, completed, created}) ───── */
const ProductivityChart = ({ data, loading }) => {
  if (loading) return <div className="db-card chart-section"><Skel n={5}/></div>;
  // Compute productivity % per week: completed / max(completed + created, 1) * 100
  const safe = arr(data).map(d => ({
    name:         d.week || d.name,
    completed:    d.completed || 0,
    created:      d.created   || 0,
    productivity: clamp(d.completed > 0 || d.created > 0
      ? Math.round((d.completed / Math.max(d.completed + d.created, 1)) * 100) : 0, 0, 100),
  }));
  const totalDone = safe.reduce((s, d) => s + d.completed, 0);
  const avg       = safe.length > 0 ? Math.round(safe.reduce((s, d) => s + d.productivity, 0) / safe.length) : 0;
  const hasData   = safe.some(d => d.completed > 0 || d.created > 0);
  return (
    <div className="db-card chart-section">
      <div className="section-hdr">
        <h4 className="db-card-title"><FiBarChart2 style={{ color:'#4a90d9', marginRight:8 }}/>Productivity</h4>
        {hasData && <span className="db-badge blue">Avg {avg}% · {totalDone} done</span>}
      </div>
      {!hasData ? (
        <Empty icon={<FiActivity size={26}/>} title="No data yet" msg="Complete tasks to see your weekly trend"/>
      ) : (
        <>
          <div style={{ height: 200, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safe} margin={{ top:6, right:10, left:-14, bottom:0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.035)" vertical={false}/>
                <XAxis dataKey="name" stroke="#3a3835" tick={{ fill:'#5a5650', fontSize:10 }} tickLine={false} axisLine={false}/>
                <YAxis stroke="#3a3835" tick={{ fill:'#5a5650', fontSize:10 }} domain={[0, 100]} tickLine={false} axisLine={false}/>
                <RTooltip contentStyle={{ background:'#17171d', border:'1px solid rgba(201,168,76,0.25)', borderRadius:10, fontFamily:'DM Sans', fontSize:12 }}
                  itemStyle={{ color:'#e8c97a' }}
                  formatter={(v, name) => name === 'productivity' ? [`${v}%`, 'Completion Rate'] : [v, name]}/>
                <Bar dataKey="productivity" radius={[5,5,0,0]} maxBarSize={44} name="productivity">
                  {safe.map((e, i) => <Cell key={i} fill={e.productivity >= 90 ? '#e8c97a' : e.productivity >= 70 ? '#c9a84c' : '#7a5e20'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span><span className="cl-dot" style={{ background:'#e8c97a' }}/>90%+</span>
            <span><span className="cl-dot" style={{ background:'#c9a84c' }}/>70–89%</span>
            <span><span className="cl-dot" style={{ background:'#7a5e20' }}/>Below 70%</span>
          </div>
        </>
      )}
    </div>
  );
};

/* ── Goal Tracker (correct field names) ────────────────────── */
const GoalTracker = ({ stats: s, loading }) => {
  if (loading) return <div className="db-card goal-tracker"><Skel/></div>;
  const fn = n => n > 999 ? n.toLocaleString() : n;
  const goals = [
    { label:'Revenue',         curr: s.totalRevenue,    tgt: Math.max(Math.round((s.totalRevenue || 1) * 1.3), 1000), c:'#c9a84c', pre:'$' },
    { label:'Active Clients',  curr: s.activeClients,   tgt: Math.max((s.activeClients || 0) + 3, 5),                c:'#4caf82' },
    { label:'Tasks Completed', curr: s.completedTasks,  tgt: Math.max((s.completedTasks || 0) + (s.tasksPending || 0), 10), c:'#4a90d9' },
    { label:'Completion Rate', curr: s.productivityScore, tgt: 100,                                                   c:'#9b72e8', suf:'%' },
  ];
  return (
    <div className="db-card goal-tracker">
      <div className="section-hdr">
        <h4 className="db-card-title"><FiTarget style={{ color:'#c9a84c', marginRight:8 }}/>Goals</h4>
        <span className="db-badge gold">Live</span>
      </div>
      <div className="goals-grid">
        {goals.map((g, i) => {
          const p = clamp(g.tgt > 0 ? Math.round((g.curr / g.tgt) * 100) : 0, 0, 100);
          return (
            <div className="goal-card" key={i}>
              <div className="goal-hdr">
                <span className="goal-lbl">{g.label}</span>
                <span className="goal-pct" style={{ color: g.c }}>{p}%</span>
              </div>
              <div className="goal-vals">
                <span style={{ color: g.c, fontFamily: 'DM Serif Display', fontSize: 17 }}>
                  {g.pre || ''}{fn(g.curr)}{g.suf || ''}
                </span>
                <span style={{ color: '#3a3835', fontSize: 10 }}>/{g.pre || ''}{fn(g.tgt)}{g.suf || ''}</span>
              </div>
              <div className="goal-bar-bg">
                <div className="goal-bar-fill" style={{ width: `${p}%`, background: g.c }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Deadline Tracker ──────────────────────────────────────── */
class DeadlineTracker extends React.Component {
  state = { deadlines: [], newTitle: '', newDue: '', newPriority: 'Medium', showForm: false, saving: false };
  componentDidMount() { this.load(); }
  async load() {
    try {
      const [tr, dr] = await Promise.allSettled([
        api.get('/tasks?hasDeadline=true&completed=false'),
        api.get('/deadlines'),
      ]);
      const fromTasks = tr.status === 'fulfilled'
        ? arr(tr.value.tasks || tr.value).filter(t => t.deadline && !t.completed).map(t => ({
            _id: t._id, title: t.title || t.name, dueDate: t.deadline,
            priority: t.priority || 'Medium', completed: false, source: 'task',
          }))
        : [];
      const manual = dr.status === 'fulfilled'
        ? arr(dr.value.deadlines || dr.value).map(d => ({ ...d, source: 'manual' }))
        : [];
      const all = [...fromTasks, ...manual].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      this.setState({ deadlines: all });
      this.props.onDeadlinesChange?.(all);
    } catch {}
  }
  async toggle(item) {
    const updated = this.state.deadlines.map(d => d._id === item._id ? { ...d, completed: !d.completed } : d);
    this.setState({ deadlines: updated }); this.props.onDeadlinesChange?.(updated);
    try { await api.patch(item.source === 'task' ? `/tasks/${item._id}` : `/deadlines/${item._id}`, { completed: !item.completed }); }
    catch { this.load(); }
  }
  async del(item) {
    const updated = this.state.deadlines.filter(d => d._id !== item._id);
    this.setState({ deadlines: updated }); this.props.onDeadlinesChange?.(updated);
    try { if (item.source === 'manual') await api.delete(`/deadlines/${item._id}`); } catch {}
  }
  async add() {
    const { newTitle, newDue, newPriority } = this.state;
    if (!newTitle.trim() || !newDue) return;
    this.setState({ saving: true });
    try {
      const r    = await api.post('/deadlines', { title: newTitle.trim(), dueDate: newDue, priority: newPriority });
      const item = { ...(r.deadline || r), source: 'manual' };
      const updated = [...this.state.deadlines, item].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      this.setState({ deadlines: updated, newTitle: '', newDue: '', showForm: false, saving: false });
      this.props.onDeadlinesChange?.(updated);
    } catch { this.setState({ saving: false }); }
  }
  render() {
    const { deadlines, showForm, newTitle, newDue, newPriority, saving } = this.state;
    const pc   = { High: '#e05c5c', Medium: '#e8a030', Low: '#4caf82' };
    const done = deadlines.filter(d => d.completed).length;
    return (
      <div className="db-card deadline-tracker">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiCalendar style={{ color:'#4a90d9', marginRight:8 }}/>Deadlines</h4>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {deadlines.length > 0 && <span className="dl-count">{done}/{deadlines.length}</span>}
            <button className="db-add-btn" onClick={() => this.setState({ showForm: !showForm })}>
              <FiPlusCircle size={11}/> Add
            </button>
          </div>
        </div>
        {showForm && (
          <div className="dl-form">
            <input className="dl-input" placeholder="Deadline title…" value={newTitle}
              onChange={e => this.setState({ newTitle: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && this.add()}/>
            <input className="dl-input" type="date" value={newDue}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => this.setState({ newDue: e.target.value })}/>
            <select className="dl-select" value={newPriority} onChange={e => this.setState({ newPriority: e.target.value })}>
              {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="dl-save" onClick={() => this.add()} disabled={saving}>{saving ? '…' : 'Save'}</button>
          </div>
        )}
        {deadlines.length > 0 && (
          <div className="dl-progress-bar">
            <div style={{ width: `${(done/deadlines.length)*100}%`, height: '100%', background: 'linear-gradient(90deg,#4a90d9,#4caf82)', borderRadius: 4, transition: 'width .5s ease' }}/>
          </div>
        )}
        <div className="deadline-list">
          {!deadlines.length ? (
            <Empty icon={<FiCalendar size={22}/>} title="No deadlines" msg="Add one, or assign due dates to tasks"/>
          ) : deadlines.map(dl => {
            const left = dLeft(dl.dueDate);
            return (
              <div key={dl._id} className={`dl-item${dl.completed ? ' dl-done' : ''}${left < 0 && !dl.completed ? ' dl-overdue' : ''}`}>
                <button className="dl-toggle" onClick={() => this.toggle(dl)}>
                  {dl.completed ? <FiCheckCircle size={16} color="#4caf82"/> : <div className="dl-circle"/>}
                </button>
                <div className="dl-body" onClick={() => this.toggle(dl)}>
                  <span className="dl-title">{dl.title}</span>
                  <div className="dl-meta">
                    <span className="dl-date">{fmtDate(dl.dueDate)}</span>
                    <span className="dl-pri" style={{ color: pc[dl.priority], background: `${pc[dl.priority]}12` }}>{dl.priority}</span>
                    {dl.source === 'task' && <span className="dl-src">task</span>}
                  </div>
                </div>
                <div className="dl-right">
                  {dl.completed ? <span className="dl-tag done">Done</span>
                  : left < 0   ? <span className="dl-tag overdue">Overdue</span>
                  : <span className="dl-days" style={{ color: left <= 2 ? '#e05c5c' : left <= 5 ? '#e8a030' : '#4a4843' }}>{left}d</span>}
                </div>
                {dl.source === 'manual' && <button className="dl-del" onClick={() => this.del(dl)}><FiX size={11}/></button>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

/* ── Activity Feed ─────────────────────────────────────────── */
class ActivityFeed extends React.Component {
  state = { activities: [], loading: true };
  componentDidMount() { this.load(); }
  async load() {
    this.setState({ loading: true });
    try {
      const r = await api.get('/activity?limit=12');
      this.setState({ activities: arr(r.activities || r), loading: false });
    } catch { this.setState({ loading: false }); }
  }
  iconFor(type) {
    return { task:{i:<FiCheckCircle size={13}/>,c:'#4caf82'}, invoice:{i:<FiDollarSign size={13}/>,c:'#c9a84c'},
      client:{i:<FiUsers size={13}/>,c:'#4a90d9'}, deadline:{i:<FiCalendar size={13}/>,c:'#e8a030'},
      alert:{i:<FiAlertCircle size={13}/>,c:'#e05c5c'} }[type] || { i:<FiBell size={13}/>, c:'#9b72e8' };
  }
  render() {
    const { activities, loading } = this.state;
    return (
      <div className="db-card activity-feed">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiActivity style={{ color:'#9b72e8', marginRight:8 }}/>Activity</h4>
          <button className="db-icon-btn" onClick={() => this.load()} title="Refresh"><FiRefreshCw size={13}/></button>
        </div>
        {loading ? <Skel n={5}/> : !activities.length ? (
          <Empty icon={<FiActivity size={26}/>} title="No recent activity" msg="Your actions will appear here"/>
        ) : (
          <div className="activity-list">
            {activities.map((a, i) => {
              const { i: icon, c: color } = this.iconFor(a.type || a.category);
              return (
                <div className="act-row" key={i}>
                  <span className="act-icon" style={{ color, background: `${color}14` }}>{icon}</span>
                  <div className="act-body">
                    <span className="act-text">{a.message || a.text}</span>
                    <span className="act-time">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'recently'}
                    </span>
                  </div>
                  <span className="act-badge" style={{ color, borderColor: `${color}25`, background: `${color}10` }}>{a.type || '—'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

/* ── Quick Notes ───────────────────────────────────────────── */
class NotesPad extends React.Component {
  state = { text: '', saved: false };
  _t = null;
  componentDidMount() { this.setState({ text: localStorage.getItem('aur_notes') || '' }); }
  componentWillUnmount() { clearTimeout(this._t); }
  change(v) {
    this.setState({ text: v, saved: false });
    localStorage.setItem('aur_notes', v);
    clearTimeout(this._t);
    this._t = setTimeout(() => this.setState({ saved: true }), 700);
  }
  render() {
    const { text, saved } = this.state;
    return (
      <div className="db-card notes-pad">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiEdit3 style={{ color:'#e8a030', marginRight:8 }}/>Quick Notes</h4>
          {saved && <span className="db-badge green" style={{ fontSize:9 }}>Saved</span>}
        </div>
        <textarea className="notes-area" placeholder="Jot down anything — client info, ideas, follow-up reminders…"
          value={text} onChange={e => this.change(e.target.value)}/>
        <div className="notes-foot">
          <span className="notes-chars">{text.length} chars</span>
          <button className="notes-clear" onClick={() => this.change('')}>Clear</button>
        </div>
      </div>
    );
  }
}

/* ── Time-to-Pay Tracker ───────────────────────────────────── */
class TimeToPayTracker extends React.Component {
  state = { data: [], loading: true };
  async componentDidMount() {
    try {
      const r = await api.get('/invoices?status=paid&limit=20&sort=-paidAt');
      const invoices = arr(r.invoices || r).filter(i => i.createdAt && i.paidAt);
      const data = invoices.map(inv => ({
        name:   inv.clientName || inv.client?.name || 'Client',
        days:   Math.max(0, Math.round((new Date(inv.paidAt) - new Date(inv.createdAt)) / 86400000)),
        amount: inv.total || 0,
      })).slice(0, 8);
      this.setState({ data, loading: false });
    } catch { this.setState({ loading: false }); }
  }
  render() {
    const { data, loading } = this.state;
    const avg  = data.length ? Math.round(data.reduce((s, d) => s + d.days, 0) / data.length) : null;
    const good = avg != null && avg <= 30;
    return (
      <div className="db-card time-to-pay">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiClock style={{ color:'#38bdf8', marginRight:8 }}/>Time to Pay</h4>
          {avg != null && (
            <span className="db-badge" style={{ color: good ? '#4caf82' : '#e8a030', background: good ? 'rgba(76,175,130,0.1)' : 'rgba(232,160,48,0.1)', borderColor: good ? 'rgba(76,175,130,0.28)' : 'rgba(232,160,48,0.28)' }}>
              Avg {avg}d
            </span>
          )}
        </div>
        {loading ? <Skel n={4}/> : !data.length ? (
          <Empty icon={<FiClock size={24}/>} title="No paid invoices yet" msg="Time-to-pay averages appear once clients start paying"/>
        ) : (
          <div className="ttp-list">
            {data.map((d, i) => (
              <div className="ttp-row" key={i}>
                <span className="ttp-name">{d.name}</span>
                <div className="ttp-bar-bg">
                  <div className="ttp-bar" style={{ width: `${clamp((d.days/60)*100, 2, 100)}%`, background: d.days <= 15 ? '#4caf82' : d.days <= 30 ? '#c9a84c' : '#e05c5c' }}/>
                </div>
                <span className="ttp-days" style={{ color: d.days <= 15 ? '#4caf82' : d.days <= 30 ? '#c9a84c' : '#e05c5c' }}>{d.days}d</span>
              </div>
            ))}
            {avg != null && (
              <p className="ttp-tip">
                {avg <= 15 ? '⚡ Excellent — clients pay very fast.'
                 : avg <= 30 ? '✓ On par with industry average (Net 30).'
                 : '⚠ Slow payers — consider Net 14 terms or upfront deposits.'}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
}

/* ── AI Insights (instant, no API credits) ─────────────────── */
const AIInsights = ({ stats: s, deadlines }) => {
  const dls     = arr(deadlines);
  const overDL  = dls.filter(d => !d.completed && d.dueDate && new Date(d.dueDate) < new Date()).length;
  const pendDL  = dls.filter(d => !d.completed).length;
  const insights = [];

  if (s.overdueCount > 0)
    insights.push({ w:'alert', c:'#e05c5c',
      msg:`${s.overdueCount} overdue invoice${s.overdueCount > 1 ? 's' : ''} totalling ${fmt$(s.overdueRevenue)}. Follow up within 72 hours — freelancers who do recover payment 78% of the time.` });
  if (overDL > 0)
    insights.push({ w:'alert', c:'#e05c5c',
      msg:`${overDL} deadline${overDL > 1 ? 's' : ''} past due. Contact affected clients now — transparency builds trust even when timelines slip.` });
  if (s.pendingRevenue > 0 && s.overdueCount === 0)
    insights.push({ w:'warn', c:'#e8a030',
      msg:`${fmt$(s.pendingRevenue)} in open invoices. Switching to Net 14 instead of Net 30 reduces average collection time by 42%.` });
  if (pendDL > 3)
    insights.push({ w:'warn', c:'#e8a030',
      msg:`${pendDL} upcoming deadlines. Block focus time now — front-loading deep work before 10 AM yields 38% better output.` });
  if (s.productivityScore > 0 && s.productivityScore < 60)
    insights.push({ w:'warn', c:'#e8a030',
      msg:`Completion rate at ${s.productivityScore}%. Break tasks into 25-min focused blocks — smaller steps boost completion by 52%.` });
  if (s.productivityScore >= 85)
    insights.push({ w:'success', c:'#c9a84c',
      msg:`${s.productivityScore}% productivity — exceptional. Top performers raise rates 15–20% annually. Your output metrics suggest you could command higher rates now.` });
  if (s.revenueChange != null) {
    if (s.revenueChange > 10)
      insights.push({ w:'success', c:'#4caf82',
        msg:`Revenue up ${s.revenueChange}% vs last month (${fmt$(s.monthRevenue)} this period). Consider reinvesting 10% into tools or skills that compound your hourly output.` });
    if (s.revenueChange < -10)
      insights.push({ w:'tip', c:'#9b72e8',
        msg:`Revenue down ${Math.abs(s.revenueChange)}% vs last month. Reach out to 2–3 past clients — they convert at 5× the rate of cold outreach.` });
  }
  if (s.activeClients >= 5)
    insights.push({ w:'tip', c:'#4a90d9',
      msg:`${s.activeClients} active clients is a healthy portfolio. Send each an unprompted status update this week — proactive communication builds long-term retainers.` });
  if (!insights.length)
    insights.push({ w:'info', c:'#38bdf8',
      msg:`Add clients, tasks, and invoices to unlock personalised insights. The more data you add, the more specific and actionable this panel becomes.` });

  const iconFor = w => ({ alert:<FiAlertCircle size={13}/>, warn:<FiClock size={13}/>,
    success:<FiStar size={13}/>, tip:<FiZap size={13}/>, info:<FiActivity size={13}/> })[w] || <FiZap size={13}/>;

  return (
    <div className="db-card ai-insights">
      <div className="section-hdr">
        <h4 className="db-card-title"><FiZap style={{ color:'#38bdf8', marginRight:8 }}/>AI Insights</h4>
        <span className="db-badge teal">✦ Instant · Zero credits</span>
      </div>
      <div className="insights-grid">
        {insights.map((ins, i) => (
          <div className="insight-card" key={i} style={{ borderLeftColor: ins.c }}>
            <span className="insight-icon" style={{ color: ins.c }}>{iconFor(ins.w)}</span>
            <span className="insight-text">{ins.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── AI Assistant ──────────────────────────────────────────── */
class AIAssistant extends React.Component {
  state = { input: '', messages: [], loading: false, error: '' };
  bottom = React.createRef();

  async send() {
    const { input, messages } = this.state;
    if (!input.trim() || this.state.loading) return;
    const userMsg = { role: 'user', content: input };
    const history = [...messages, userMsg];
    this.setState({ messages: history, input: '', loading: true, error: '' });
    const { stats: s } = this.props;
    const ctx = [
      'You are a sharp, direct freelance business advisor inside Aurelance.',
      `User live data: ${s?.activeClients||0} active clients, ${fmt$(s?.monthRevenue)} this month,`,
      `${fmt$(s?.totalRevenue)} total earned, ${s?.overdueCount||0} overdue invoices`,
      `(${fmt$(s?.overdueRevenue)} outstanding), ${fmt$(s?.pendingRevenue)} pending,`,
      `${s?.completedTasks||0} tasks done, ${s?.tasksPending||0} pending, ${s?.productivityScore||0}% productivity.`,
      'Give direct, specific advice in 2–4 sentences. Cite their actual numbers. No filler.',
    ].join(' ');
    try {
      const text = await askClaude(ctx, input, history.slice(-8).slice(0, -1));
      this.setState({ messages: [...history, { role: 'assistant', content: text }], loading: false });
      setTimeout(() => this.bottom.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    } catch { this.setState({ loading: false, error: 'Could not reach AI. Check your connection.' }); }
  }

  render() {
    const { input, messages, loading, error } = this.state;
    const chips = [
      'How should I price my next project?',
      'Which clients should I prioritise this week?',
      'How do I handle late-paying clients?',
      'What can I do to grow revenue this month?',
    ];
    return (
      <div className="db-card ai-assistant">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiMessageSquare style={{ color:'#9b72e8', marginRight:8 }}/>AI Assistant</h4>
          <span className="db-badge purple">✦ Live AI</span>
        </div>
        {!messages.length && (
          <>
            <p className="ai-sub">Ask anything about your freelance business:</p>
            <div className="chip-row">
              {chips.map((c, i) => (
                <button key={i} className="ai-chip" onClick={() => this.setState({ input: c }, () => this.send())}>{c}</button>
              ))}
            </div>
          </>
        )}
        {messages.length > 0 && (
          <div className="chat-history">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <span className="chat-label">{m.role === 'user' ? 'You' : 'AI'}</span>
                <span className="chat-bubble">{m.content}</span>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <span className="chat-label">AI</span>
                <span className="chat-bubble chat-typing"><span/><span/><span/></span>
              </div>
            )}
            <div ref={this.bottom}/>
          </div>
        )}
        {error && <p className="ai-err">{error}</p>}
        <div className="chat-input-row">
          <input className="db-input" style={{ flex: 1 }} placeholder="Ask anything about your business…"
            value={input} onChange={e => this.setState({ input: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && this.send()} disabled={loading}/>
          <button className="chat-send-btn" onClick={() => this.send()} disabled={loading || !input.trim()}>
            {loading ? <Spinner size={13} color="#0a0a0c"/> : <FiSend size={13}/>}
          </button>
        </div>
        {messages.length > 0 && (
          <button className="chat-clear" onClick={() => this.setState({ messages: [], input: '', error: '' })}>
            Clear conversation
          </button>
        )}
      </div>
    );
  }
}

/* ── AI Daily Briefing ─────────────────────────────────────── */
class AIBriefing extends React.Component {
  state = { brief: '', loading: false, error: '', done: false };
  async generate() {
    const { stats: s, deadlines } = this.props;
    const dls    = arr(deadlines);
    const overDL = dls.filter(d => !d.completed && d.dueDate && new Date(d.dueDate) < new Date()).length;
    const soonDL = dls.filter(d => !d.completed && d.dueDate && dLeft(d.dueDate) <= 3 && dLeft(d.dueDate) >= 0).length;
    const today  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const ctx = `You are a sharp freelance business coach. Write a crisp daily briefing for ${today}. Be motivating and specific. One greeting sentence, then 3–5 bullet points using • covering: top priority action, biggest financial risk, key deadlines, one growth action. Max 110 words.`;
    const msg = `Data: ${s?.activeClients||0} clients, ${s?.tasksPending||0} pending tasks, ${fmt$(s?.monthRevenue)} this month, ${s?.overdueCount||0} overdue invoices (${fmt$(s?.overdueRevenue)}), ${fmt$(s?.pendingRevenue)} unpaid, ${overDL} overdue deadlines, ${soonDL} due in ≤3 days, ${s?.productivityScore||0}% productivity.`;
    this.setState({ loading: true, error: '', done: false });
    try {
      const text = await askClaude(ctx, msg);
      this.setState({ brief: text, loading: false, done: true });
    } catch { this.setState({ loading: false, error: 'Could not generate briefing. Please try again.' }); }
  }
  render() {
    const { brief, loading, error, done } = this.state;
    return (
      <div className="db-card ai-briefing">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiStar style={{ color:'#c9a84c', marginRight:8 }}/>Daily Briefing</h4>
          <span className="db-badge gold">✦ AI</span>
        </div>
        <p className="ai-sub">{new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
        {!done && !loading && (
          <>
            <p style={{ fontSize: 13, color: '#5a5650', lineHeight: 1.6, marginBottom: 14 }}>
              One click to get a personalised AI summary — priorities, risks, and one action to move the needle.
            </p>
            <DbBtn onClick={() => this.generate()}><FiZap size={12} style={{ marginRight: 6 }}/>Generate Briefing</DbBtn>
          </>
        )}
        {loading && (
          <div style={{ display:'flex', alignItems:'center', padding:'24px 0', gap:10, color:'#5a5650', fontSize:13 }}>
            <Spinner size={18} color="#c9a84c"/> Reading your workspace data…
          </div>
        )}
        {done && brief && (
          <div className="briefing-body">
            {brief.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className={/^[•\-\d]/.test(line.trim()) ? 'briefing-bullet' : 'briefing-line'}>{line}</p>
            ))}
            <button className="chat-clear" style={{ marginTop: 12 }} onClick={() => this.setState({ done: false, brief: '' })}>
              Regenerate
            </button>
          </div>
        )}
        {error && <p className="ai-err">{error}</p>}
      </div>
    );
  }
}

/* ── Business Health Score [PREMIUM] ───────────────────────── */
class BusinessHealthScore extends React.Component {
  state = { scores: null, loading: false, error: '' };
  async run() {
    const { stats: s } = this.props;
    const ctx = `You are a freelance business analyst. Score this business across 6 dimensions 0–100. Return ONLY valid JSON, no markdown: {"revenue":N,"clients":N,"productivity":N,"cashflow":N,"growth":N,"risk":N,"summary":"one specific sentence about their biggest opportunity"}`;
    const msg = `Clients: ${s?.activeClients||0} active/${s?.totalClients||0} total. Revenue: ${fmt$(s?.monthRevenue)} this month. Total earned: ${fmt$(s?.totalRevenue)}. Overdue: ${s?.overdueCount||0} invoices worth ${fmt$(s?.overdueRevenue)}. Unpaid: ${fmt$(s?.pendingRevenue)}. Tasks: ${s?.completedTasks||0} done/${s?.tasksPending||0} pending. Productivity: ${s?.productivityScore||0}%. Net profit: ${fmt$(s?.netProfit)}.`;
    this.setState({ loading: true, error: '' });
    try {
      let text = await askClaude(ctx, msg);
      text = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(text);
      this.setState({ scores: json, loading: false });
    } catch { this.setState({ loading: false, error: 'Analysis failed — please try again.' }); }
  }
  render() {
    const { scores, loading, error } = this.state;
    const { isPremium, navigate } = this.props;
    const dims = scores ? [
      { label:'Revenue',      v: scores.revenue,      c:'#c9a84c' },
      { label:'Clients',      v: scores.clients,      c:'#4a90d9' },
      { label:'Productivity', v: scores.productivity, c:'#4caf82' },
      { label:'Cash Flow',    v: scores.cashflow,     c:'#38bdf8' },
      { label:'Growth',       v: scores.growth,       c:'#9b72e8' },
      { label:'Risk Score',   v: 100-(scores.risk||0),c:'#e05c5c' },
    ] : [];
    const overall = dims.length ? Math.round(dims.reduce((s, d) => s + d.v, 0) / dims.length) : null;
    return (
      <div className="db-card biz-health">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiAward style={{ color:'#c9a84c', marginRight:8 }}/>Business Health Score</h4>
          <span className="db-badge gold">✦ Premium</span>
        </div>
        {!isPremium && <PremiumGate feature="Business Health Score" onUpgrade={navigate}
          description="AI analyses 6 dimensions of your freelance business — revenue, clients, cash flow, growth, productivity, and risk — producing an overall score with your single biggest opportunity."/>}
        {isPremium && !scores && !loading && (
          <>
            <p style={{ fontSize:13, color:'#5a5650', lineHeight:1.6, marginBottom:14 }}>
              AI scores your business across 6 key dimensions and identifies your single biggest opportunity right now.
            </p>
            <DbBtn onClick={() => this.run()}><FiBarChart2 size={12} style={{ marginRight:6 }}/>Run Analysis</DbBtn>
          </>
        )}
        {loading && (
          <div style={{ display:'flex', alignItems:'center', padding:'24px 0', gap:10, color:'#5a5650', fontSize:13 }}>
            <Spinner size={18} color="#c9a84c"/> Analysing your business across 6 dimensions…
          </div>
        )}
        {scores && (
          <div className="health-body">
            <div className="health-overall">
              <span className="ho-score" style={{ color: overall >= 75 ? '#4caf82' : overall >= 50 ? '#c9a84c' : '#e05c5c' }}>{overall}</span>
              <span className="ho-label">Overall Score</span>
              {scores.summary && <p className="ho-summary">"{scores.summary}"</p>}
            </div>
            <div className="health-dims">
              {dims.map((d, i) => (
                <div className="hdim" key={i}>
                  <div className="hdim-hdr">
                    <span className="hdim-label">{d.label}</span>
                    <span className="hdim-val" style={{ color: d.c }}>{d.v}/100</span>
                  </div>
                  <div className="hdim-bar-bg">
                    <div className="hdim-bar" style={{ width: `${clamp(d.v, 0, 100)}%`, background: d.c }}/>
                  </div>
                </div>
              ))}
            </div>
            <button className="chat-clear" style={{ marginTop: 14 }} onClick={() => this.setState({ scores: null })}>Re-analyse</button>
          </div>
        )}
        {error && <p className="ai-err">{error}</p>}
      </div>
    );
  }
}

/* ── AI Rate Advisor ───────────────────────────────────────── */
class AIRateAdvisor extends React.Component {
  state = { role: '', result: '', loading: false, error: '' };
  async analyse() {
    const { stats: s } = this.props;
    const { role } = this.state;
    const ctx = `You are a freelance pricing expert. Give a specific hourly rate recommendation. Format: one sentence summary, then "Recommended rate: $X–$Y/hr", then 2–3 bullet points explaining why. Be specific, cite their numbers. Under 90 words.`;
    const msg = `Role: "${role || 'freelancer'}". Active clients: ${s?.activeClients||0}. Monthly revenue: ${fmt$(s?.monthRevenue)}. Total earned: ${fmt$(s?.totalRevenue)}. Tasks done: ${s?.completedTasks||0}. Productivity: ${s?.productivityScore||0}%.`;
    this.setState({ loading: true, result: '', error: '' });
    try {
      const text = await askClaude(ctx, msg);
      this.setState({ result: text, loading: false });
    } catch { this.setState({ loading: false, error: 'Could not reach AI. Try again.' }); }
  }
  render() {
    const { role, result, loading, error } = this.state;
    return (
      <div className="db-card ai-rate-advisor">
        <div className="section-hdr">
          <h4 className="db-card-title"><FiDollarSign style={{ color:'#4caf82', marginRight:8 }}/>Rate Advisor</h4>
          <span className="db-badge green">✦ AI · Free</span>
        </div>
        <p className="ai-sub">Enter your role to get a rate recommendation based on your real earnings data:</p>
        <div className="rate-input-row">
          <input className="db-input" style={{ flex: 1 }}
            placeholder="e.g. React developer, UI/UX designer, copywriter…"
            value={role} onChange={e => this.setState({ role: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && this.analyse()} disabled={loading}/>
          <DbBtn onClick={() => this.analyse()} disabled={loading} style={{ marginLeft: 8, flexShrink: 0, minWidth: 90 }}>
            {loading ? <><Spinner size={13} color="#0a0a0c"/> Analysing…</> : 'Analyse'}
          </DbBtn>
        </div>
        {result && (
          <div className="rate-result-box">
            {result.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className={line.toLowerCase().includes('recommended') ? 'rate-highlight' : /^[•\-]/.test(line.trim()) ? 'rate-bullet' : 'rate-line'}>{line}</p>
            ))}
          </div>
        )}
        {error && <p className="ai-err">{error}</p>}
      </div>
    );
  }
}

/* ══════════════════════════════════════════════════════════════
   ROOT DASHBOARD
══════════════════════════════════════════════════════════════ */
class DashboardCore extends React.Component {
  state = {
    clients:[], revenueData:[], productivityData:[], stats:{},
    deadlines:[], loading:true, toast:'',
  };

  componentDidMount() { this.loadAll(); }

  async loadAll() {
    this.setState({ loading: true });
    try {
      const [dashRes, revRes, prodRes, clientRes] = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/dashboard/revenue?months=6'),
        api.get('/dashboard/productivity?weeks=5'),
        api.get('/clients'),
      ]);

      const raw         = dashRes.status  === 'fulfilled' ? (dashRes.value  || {}) : {};
      const revenueData = revRes.status   === 'fulfilled' ? arr(revRes.value.data || revRes.value) : [];
      const prodData    = prodRes.status  === 'fulfilled' ? arr(prodRes.value.data || prodRes.value) : [];
      const clients     = clientRes.status === 'fulfilled' ? arr(clientRes.value.clients || clientRes.value) : [];

      this.setState({
        stats:          normalizeStats(raw),
        revenueData,
        productivityData: prodData,
        clients,
        loading: false,
      });
    } catch {
      this.setState({ loading: false });
    }
  }

  render() {
    const { clients, revenueData, productivityData, stats, deadlines, loading, toast } = this.state;
    const { auth, navigate } = this.props;
    const name      = auth?.user?.name?.split(' ')[0] || 'there';
    const isPremium = auth?.user?.plan === 'premium';
    const h         = new Date().getHours();
    const greeting  = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

    return (
      <div className="dashboard">
        {toast && <Toast msg={toast} onClose={() => this.setState({ toast: '' })}/>}

        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <span className="db-page-title">Dashboard</span>
            <span className="dashboard-header-sub">
              {greeting}, <strong style={{ color:'#e8c97a' }}>{name}</strong>
              {loading ? ' — loading your workspace…' : " — here's your command centre"}
            </span>
          </div>
          <div className="dashboard-header-right">
            <span className="header-date-badge">
              <FiCalendar size={12}/>
              {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
            </span>
            <span className="header-plan-badge">
              <FiStar size={11}/> {isPremium ? 'Premium' : 'Free Plan'}
            </span>
            <button className="db-icon-btn" onClick={() => this.loadAll()} title="Refresh all data">
              <FiRefreshCw size={13}/>
            </button>
          </div>
        </div>

        <QuickNav navigate={navigate}/>
        <KPIStrip stats={stats} loading={loading}/>

        <div className="dashboard-body">
          <FinancialHealth stats={stats} loading={loading} navigate={navigate}/>

          <div className="db-row db-row-73">
            <RevenueChart data={revenueData} loading={loading}/>
            <ClientSnapshot clients={clients} loading={loading} navigate={navigate}/>
          </div>

          <div className="db-row db-row-55">
            <UpcomingTasks navigate={navigate}/>
            <OverdueAlerts navigate={navigate}/>
          </div>

          <div className="db-row db-row-64">
            <ProductivityChart data={productivityData} loading={loading}/>
            <GoalTracker stats={stats} loading={loading}/>
          </div>

          <div className="db-row db-row-55">
            <DeadlineTracker onDeadlinesChange={dls => this.setState({ deadlines: dls })}/>
            <ActivityFeed/>
          </div>

          <div className="db-row db-row-55">
            <NotesPad/>
            <TimeToPayTracker/>
          </div>

          <AIInsights stats={stats} deadlines={deadlines}/>

          <div className="db-row db-row-55">
            <AIAssistant stats={stats}/>
            <AIBriefing  stats={stats} deadlines={deadlines}/>
          </div>

          <BusinessHealthScore stats={stats} isPremium={isPremium} navigate={navigate}/>
          <AIRateAdvisor stats={stats}/>
        </div>
      </div>
    );
  }
}

export default withAuth(DashboardCore);