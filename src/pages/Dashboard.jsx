// src/pages/Dashboard.jsx
import React from 'react';
import '../styles/Dashboard.css';
import {
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import gsap from 'gsap';
import { debounce } from 'lodash';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiStar,
  FiZap,
  FiTarget,
  FiActivity,
  FiBell,
  FiFileText,
  FiCalendar,
  FiAward,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiPlusCircle,
  FiX,
  FiEye,
} from 'react-icons/fi';

/* ─── localStorage helper ─── */
const loadLS = (key, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
};

/* ─────────────────────────────────────────────────────────
   KPI STRIP
   Uses: clients, recentActivity (both live props)
───────────────────────────────────────────────────────── */
class KPIStripSection extends React.Component {
  render() {
    const { clients, recentActivity } = this.props;
    const activeClients   = clients.filter(c => c.active).length;
    const completedTasks  = recentActivity.filter(a => a.status === 'Completed').length;
    const pendingTasks    = recentActivity.filter(a => a.status === 'Pending').length;
    const inProgressTasks = recentActivity.filter(a => a.status === 'In Progress').length;
    const score = recentActivity.length
      ? Math.round((completedTasks / recentActivity.length) * 100)
      : 0;

    const kpis = [
      { label:'Active Clients',     value:activeClients,        delta:'+2 this week',               trend:'up',   icon:<FiUsers size={20}/>,      color:'#4a90d9' },
      { label:'Tasks Completed',    value:completedTasks,       delta:`${completedTasks} total`,     trend:'up',   icon:<FiCheckCircle size={20}/>, color:'#4caf82' },
      { label:'Pending Tasks',      value:pendingTasks,         delta:`${inProgressTasks} in progress`, trend:'down', icon:<FiClock size={20}/>,  color:'#e8a030' },
      { label:'Productivity Score', value:`${score}%`,          delta:'+3% this week',              trend:'up',   icon:<FiTrendingUp size={20}/>,  color:'#9b72e8' },
    ];

    return (
      <div className="kpi-strip">
        {kpis.map((kpi, i) => (
          <div className="kpi-item" key={i}>
            <div className="kpi-icon-row">
              <span className="kpi-icon" style={{ color:kpi.color, background:`${kpi.color}18` }}>{kpi.icon}</span>
              <span className={`kpi-delta ${kpi.trend}`}>
                {kpi.trend === 'up' ? <FiArrowUp size={11}/> : <FiArrowDown size={11}/>}
                {kpi.delta}
              </span>
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   CLIENT DETAIL DIALOG  — replaces the alert() call
───────────────────────────────────────────────────────── */
class ClientDetailDialog extends React.Component {
  render() {
    const { open, client, onClose } = this.props;
    if (!client) return null;
    const rows = [
      ['Name',    client.name],
      ['Project', client.project],
      ['Status',  client.status],
      ['Active',  client.active ? 'Yes' : 'No'],
      ['Added',   client.addedAt || '—'],
    ];
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span className="client-avatar large">{client.name.charAt(0)}</span>
            {client.name}
          </div>
        </DialogTitle>
        <DialogContent>
          <div className="client-detail-grid">
            {rows.map(([label, value]) => (
              <div key={label} className="client-detail-row">
                <span className="cd-label">{label}</span>
                <span className="cd-value">{value}</span>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   CLIENT MANAGEMENT
───────────────────────────────────────────────────────── */
class ClientManagementSection extends React.Component {
  statusPill(status) {
    const map = { 'In Progress':'pill-inprogress', 'Completed':'pill-completed' };
    return <span className={`status-pill ${map[status] || ''}`}>{status}</span>;
  }
  activePill(active) {
    return <span className={`status-pill ${active ? 'pill-active' : 'pill-inactive'}`}>{active ? 'Active' : 'Inactive'}</span>;
  }

  render() {
    const {
      clients, searchTerm, statusFilter, debouncedSearch,
      setStatusFilter, onEdit, onDelete, onViewDetails,
      onSortChange, onToggleActive, onAddClientButtonClick, isMobile,
    } = this.props;

    const filtered = clients.filter(c => {
      const name   = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const status = statusFilter ? c.status === statusFilter : true;
      return name && status;
    });

    return (
      <Box className="client-management">
        <div className="section-header-row">
          <Typography variant="h4">Client Management</Typography>
          <span className="section-count-badge">{filtered.length} clients</span>
        </div>

        <Box sx={{ display:'flex', flexDirection:isMobile?'column':'row', justifyContent:'space-between', alignItems:'center', mb:2, gap:1.5 }}>
          <TextField placeholder="Search clients…" fullWidth defaultValue={searchTerm}
            onChange={e => debouncedSearch(e.target.value)} />
          <Button variant="contained" color="primary" onClick={onAddClientButtonClick}
            startIcon={<FiPlusCircle/>} sx={{ whiteSpace:'nowrap', minWidth:'fit-content' }}>
            Add Client
          </Button>
        </Box>

        <Box sx={{ display:'flex', gap:1.5, mb:2, flexWrap:'wrap' }}>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} displayEmpty sx={{ minWidth:160 }}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
          <Select defaultValue="" onChange={e => onSortChange(e.target.value)} displayEmpty sx={{ minWidth:160 }}>
            <MenuItem value="">Sort By</MenuItem>
            <MenuItem value="nameAsc">Name (A–Z)</MenuItem>
            <MenuItem value="nameDesc">Name (Z–A)</MenuItem>
          </Select>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length > 0 ? filtered.map((client, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span className="client-avatar">{client.name.charAt(0)}</span>
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell>{client.project}</TableCell>
                  <TableCell>{this.statusPill(client.status)}</TableCell>
                  <TableCell>{this.activePill(client.active)}</TableCell>
                  <TableCell>
                    <Button onClick={() => onViewDetails(client)}  variant="outlined" size="small" sx={{ mr:0.5 }}><FiEye size={13}/></Button>
                    <Button onClick={() => onEdit(client, idx)}    variant="outlined" size="small" sx={{ mr:0.5 }}>Edit</Button>
                    <Button onClick={() => onToggleActive(idx)}    variant="outlined" size="small" sx={{ mr:0.5 }}>
                      {client.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button onClick={() => onDelete(idx)} variant="outlined" size="small" color="error">Delete</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} align="center">No clients found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   REVENUE OVERVIEW
   Reads real data from at_invoices + at_expenses (Atelier)
   Falls back to static demo data if empty
───────────────────────────────────────────────────────── */
class RevenueOverviewSection extends React.Component {
  buildData() {
    const invoices = loadLS('at_invoices', []);
    const expenses = loadLS('at_expenses', []);
    const now = new Date();
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const live = Array.from({ length:6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const rev = invoices.filter(inv => inv.status === 'paid' && (inv.date||'').startsWith(key))
                          .reduce((s, inv) => s + (inv.total||0), 0);
      const exp = expenses.filter(ex => (ex.date||'').startsWith(key))
                          .reduce((s, ex)  => s + (ex.amount||0), 0);
      return { month:MONTHS[d.getMonth()], revenue:rev, expenses:exp };
    });

    const hasData = live.some(d => d.revenue > 0 || d.expenses > 0);
    return hasData ? live : [
      { month:'Jan', revenue:3200, expenses:1800 },
      { month:'Feb', revenue:4100, expenses:2100 },
      { month:'Mar', revenue:3800, expenses:1900 },
      { month:'Apr', revenue:5200, expenses:2400 },
      { month:'May', revenue:4800, expenses:2200 },
      { month:'Jun', revenue:6100, expenses:2600 },
    ];
  }

  render() {
    const data     = this.buildData();
    const totalRev = data.reduce((s, d) => s + d.revenue, 0);
    const totalExp = data.reduce((s, d) => s + d.expenses, 0);
    const net      = totalRev - totalExp;

    return (
      <Box className="revenue-overview">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiDollarSign style={{ color:'#c9a84c', marginRight:8 }}/>Revenue Overview
          </Typography>
          <span className="ai-badge">Live Data</span>
        </div>

        <div className="revenue-summary-row">
          <div className="revenue-summary-card">
            <span className="rscard-label">Total Revenue</span>
            <span className="rscard-value">${totalRev.toLocaleString()}</span>
            <span className="rscard-delta up"><FiArrowUp size={11}/> 6-month total</span>
          </div>
          <div className="revenue-summary-card">
            <span className="rscard-label">Total Expenses</span>
            <span className="rscard-value">${totalExp.toLocaleString()}</span>
            <span className="rscard-delta down"><FiArrowDown size={11}/> 6-month total</span>
          </div>
          <div className="revenue-summary-card highlight">
            <span className="rscard-label">Net Profit</span>
            <span className="rscard-value">${net.toLocaleString()}</span>
            <span className={`rscard-delta ${net >= 0 ? 'up' : 'down'}`}>
              {net >= 0 ? <FiArrowUp size={11}/> : <FiArrowDown size={11}/>} net 6 months
            </span>
          </div>
        </div>

        <div className="chart-container" style={{ height:280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top:10, right:20, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#c9a84c" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#c9a84c" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#9b72e8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#9b72e8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="month" stroke="#4a4843" tick={{ fill:'#4a4843', fontSize:11 }}/>
              <YAxis stroke="#4a4843" tick={{ fill:'#4a4843', fontSize:11 }}/>
              <RechartsTooltip
                contentStyle={{ background:'#18181d', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, fontFamily:'DM Sans' }}
                itemStyle={{ color:'#e8c97a' }}
                labelStyle={{ color:'#4a4843', textTransform:'uppercase', fontSize:10 }}
              />
              <Area type="monotone" dataKey="revenue"  stroke="#c9a84c" strokeWidth={2.5} fill="url(#gradRevenue)"
                dot={{ r:4, fill:'#c9a84c', strokeWidth:2, stroke:'#0a0a0c' }}/>
              <Area type="monotone" dataKey="expenses" stroke="#9b72e8" strokeWidth={2} fill="url(#gradExpenses)"
                dot={{ r:3, fill:'#9b72e8', strokeWidth:2, stroke:'#0a0a0c' }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend-row">
          <span className="legend-item"><span className="legend-dot" style={{ background:'#c9a84c' }}/>Revenue</span>
          <span className="legend-item"><span className="legend-dot" style={{ background:'#9b72e8' }}/>Expenses</span>
        </div>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   PRODUCTIVITY CHART
   Computes from real recentActivity prop (weekly buckets)
   Falls back to demo data if no activity
───────────────────────────────────────────────────────── */
class ProductivityChartSection extends React.Component {
  buildData() {
    const activity = this.props.recentActivity || [];
    if (!activity.length) return [
      { name:'Week 1', productivity:65 },
      { name:'Week 2', productivity:78 },
      { name:'Week 3', productivity:90 },
      { name:'Week 4', productivity:82 },
      { name:'Week 5', productivity:95 },
    ];
    const perWeek = Math.ceil(activity.length / 5) || 1;
    return Array.from({ length:5 }, (_, i) => {
      const slice = activity.slice(i * perWeek, (i + 1) * perWeek);
      const done  = slice.filter(a => a.status === 'Completed').length;
      return { name:`Week ${i+1}`, productivity: slice.length ? Math.round((done / slice.length) * 100) : 0 };
    });
  }

  render() {
    const data = this.buildData();
    return (
      <Box className="chart-section">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiActivity style={{ color:'#4a90d9', marginRight:8 }}/>Productivity Analytics
          </Typography>
        </div>
        <div className="chart-container" style={{ height:280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top:10, right:20, left:0, bottom:0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="name" stroke="#4a4843" tick={{ fill:'#4a4843', fontSize:11 }}/>
              <YAxis stroke="#4a4843" tick={{ fill:'#4a4843', fontSize:11 }} domain={[0,100]}/>
              <RechartsTooltip
                contentStyle={{ background:'#18181d', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, fontFamily:'DM Sans' }}
                itemStyle={{ color:'#e8c97a' }}
                labelStyle={{ color:'#4a4843', textTransform:'uppercase', fontSize:10 }}
                formatter={v => [`${v}%`, 'Productivity']}
              />
              <Bar dataKey="productivity" radius={[6,6,0,0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.productivity >= 90 ? '#e8c97a' : entry.productivity >= 80 ? '#c9a84c' : '#9b7a2a'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="productivity-legend">
          <span className="prod-legend-item"><span style={{ background:'#e8c97a' }}/>90%+ Excellent</span>
          <span className="prod-legend-item"><span style={{ background:'#c9a84c' }}/>80–89% Good</span>
          <span className="prod-legend-item"><span style={{ background:'#9b7a2a' }}/>Below 80%</span>
        </div>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   GOAL TRACKER
   Was: hardcoded static numbers
   Now: reads from live clients, recentActivity, localStorage
───────────────────────────────────────────────────────── */
class GoalTrackerSection extends React.Component {
  render() {
    const { clients, recentActivity } = this.props;
    const invoices      = loadLS('at_invoices', []);
    const tasks         = loadLS('tasks', []);
    const earned        = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total||0), 0);
    const completed     = recentActivity.filter(a => a.status === 'Completed').length;
    const activeClients = clients.filter(c => c.active).length;
    const taskDonePct   = tasks.length ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;

    const goals = [
      { label:'Monthly Revenue Target', current:earned,        target:25000, color:'#c9a84c', icon:<FiDollarSign size={16}/>, prefix:'$' },
      { label:'Active Clients',         current:activeClients, target:10,    color:'#4caf82', icon:<FiUsers size={16}/>,      prefix:''  },
      { label:'Tasks Completed',        current:completed,     target:Math.max(recentActivity.length, 1), color:'#4a90d9', icon:<FiCheckCircle size={16}/>, prefix:'' },
      { label:'Task Completion Rate',   current:taskDonePct,   target:100,   color:'#9b72e8', icon:<FiStar size={16}/>,       prefix:'',  suffix:'%' },
    ];

    return (
      <Box className="goal-tracker">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiTarget style={{ color:'#c9a84c', marginRight:8 }}/>Goal Tracker
          </Typography>
          <span className="ai-badge teal">Live</span>
        </div>
        <div className="goals-grid">
          {goals.map((goal, i) => {
            const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
            return (
              <div className="goal-card" key={i}>
                <div className="goal-card-header">
                  <span className="goal-icon" style={{ color:goal.color, background:`${goal.color}18` }}>{goal.icon}</span>
                  <span className="goal-pct" style={{ color:goal.color }}>{pct}%</span>
                </div>
                <div className="goal-label">{goal.label}</div>
                <div className="goal-values">
                  <span className="goal-current" style={{ color:goal.color }}>
                    {goal.prefix}{typeof goal.current === 'number' && goal.current > 999 ? goal.current.toLocaleString() : goal.current}{goal.suffix||''}
                  </span>
                  <span className="goal-sep">/</span>
                  <span className="goal-target">
                    {goal.prefix}{typeof goal.target === 'number' && goal.target > 999 ? goal.target.toLocaleString() : goal.target}{goal.suffix||''}
                  </span>
                </div>
                <div className="goal-bar-bg">
                  <div className="goal-bar-fill" style={{ width:`${pct}%`, background:goal.color }}/>
                </div>
              </div>
            );
          })}
        </div>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   INVOICE TRACKER
   Was: hardcoded static invoices + pie data
   Now: reads from at_invoices (Atelier localStorage)
───────────────────────────────────────────────────────── */
class InvoiceTrackerSection extends React.Component {
  statusPill(status) {
    const map = { Paid:'pill-completed', Pending:'pill-inprogress', Overdue:'pill-overdue' };
    return <span className={`status-pill ${map[status] || ''}`}>{status}</span>;
  }

  render() {
    const raw  = loadLS('at_invoices', []);
    const now  = new Date();

    // Normalise status and derive overdue
    const invoices = raw.slice(0, 8).map(inv => ({
      id:     inv.invoiceNum || String(inv.id),
      client: inv.client || 'Unknown',
      amount: inv.total  || 0,
      due:    inv.dueDate || inv.date || '—',
      status: inv.status === 'paid'   ? 'Paid'
            : inv.dueDate && new Date(inv.dueDate) < now ? 'Overdue'
            : 'Pending',
    }));

    // Fall back to demo data if Atelier is empty
    const display = invoices.length ? invoices : [
      { id:'INV-001', client:'Acme Corp',         amount:3200, due:'2025-07-15', status:'Paid' },
      { id:'INV-002', client:'Globex Industries', amount:1800, due:'2025-07-01', status:'Overdue' },
      { id:'INV-003', client:'Wayne Enterprises', amount:5500, due:'2025-07-20', status:'Pending' },
      { id:'INV-004', client:'Stark Solutions',   amount:2200, due:'2025-07-10', status:'Paid' },
      { id:'INV-005', client:'Umbrella Co.',       amount:900,  due:'2025-07-05', status:'Overdue' },
    ];

    const total   = display.reduce((s, i) => s + i.amount, 0);
    const paid    = display.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
    const pending = display.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0);
    const overdue = display.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);

    const pieData = [
      { name:'Paid',    value:paid    || 1, color:'#4caf82' },
      { name:'Pending', value:pending || 1, color:'#e8a030' },
      { name:'Overdue', value:overdue || 1, color:'#e05c5c' },
    ];

    return (
      <Box className="invoice-tracker">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiFileText style={{ color:'#e8a030', marginRight:8 }}/>Invoice Tracker
          </Typography>
          <span className="ai-badge amber">Live from Atelier</span>
        </div>

        <div className="invoice-overview-row">
          <div className="invoice-pie-wrap">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent"/>)}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ background:'#18181d', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10 }}
                  itemStyle={{ color:'#e8c97a' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-center-label">
              <span className="pie-total">${total >= 1000 ? (total/1000).toFixed(1)+'k' : total}</span>
              <span className="pie-total-label">Total</span>
            </div>
          </div>

          <div className="invoice-stats-col">
            {pieData.map((d, i) => (
              <div className="invoice-stat-row" key={i}>
                <span className="inv-stat-dot" style={{ background:d.color }}/>
                <span className="inv-stat-name">{d.name}</span>
                <span className="inv-stat-val" style={{ color:d.color }}>${d.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="invoice-collection-rate">
              <span className="icr-label">Collection Rate</span>
              <span className="icr-value">{total > 0 ? Math.round((paid / total) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        <TableContainer component={Paper} sx={{ mt:2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {display.map((inv, i) => (
                <TableRow key={i}>
                  <TableCell>{inv.id}</TableCell>
                  <TableCell>{inv.client}</TableCell>
                  <TableCell>${inv.amount.toLocaleString()}</TableCell>
                  <TableCell>{inv.due}</TableCell>
                  <TableCell>{this.statusPill(inv.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   DEADLINE TRACKER
   Now: lifts state up via onDeadlinesChange so Dashboard
   can pass real deadlines to AIInsightsSection
───────────────────────────────────────────────────────── */
class DeadlineTrackerSection extends React.Component {
  constructor(props) {
    super(props);
    // Merge tasks-with-deadlines from localStorage + stored manual deadlines
    const tasks    = loadLS('tasks', []);
    const fromTasks = tasks
      .filter(t => t.deadline && !t.completed)
      .slice(0, 5)
      .map(t => ({
        id:        String(t.id),
        title:     t.name,
        dueDate:   t.deadline,
        priority:  t.priority || 'Medium',
        completed: !!t.completed,
        source:    'task',
      }));
    const stored = loadLS('db_deadlines', []);
    const initial = fromTasks.length ? fromTasks : stored.length ? stored : [
      { id:'d1', title:'Submit Proposal — Client A',  dueDate:'2025-08-08', priority:'High',   completed:false },
      { id:'d2', title:'Design Review — Wayne Ent.',  dueDate:'2025-08-10', priority:'Medium', completed:false },
      { id:'d3', title:'Invoice Follow-up',            dueDate:'2025-08-05', priority:'High',   completed:true  },
      { id:'d4', title:'Onboarding Call — Stark',      dueDate:'2025-08-12', priority:'Low',    completed:false },
      { id:'d5', title:'Quarterly Report Draft',       dueDate:'2025-08-15', priority:'Medium', completed:false },
    ];
    this.state = { deadlines:initial, newTitle:'', newDue:'', newPriority:'Medium', showForm:false };
  }

  save(deadlines) {
    this.setState({ deadlines });
    localStorage.setItem('db_deadlines', JSON.stringify(deadlines));
    // Notify parent so AIInsightsSection has real data
    if (this.props.onDeadlinesChange) this.props.onDeadlinesChange(deadlines);
  }

  toggle(id) { this.save(this.state.deadlines.map(d => d.id === id ? { ...d, completed:!d.completed } : d)); }

  del(id) { this.save(this.state.deadlines.filter(d => d.id !== id)); }

  addDeadline() {
    const { newTitle, newDue, newPriority, deadlines } = this.state;
    if (!newTitle.trim() || !newDue) return;
    this.save([...deadlines, { id:String(Date.now()), title:newTitle.trim(), dueDate:newDue, priority:newPriority, completed:false }]);
    this.setState({ newTitle:'', newDue:'', showForm:false });
  }

  daysLeft(dueDate) { return Math.ceil((new Date(dueDate) - new Date()) / (1000*60*60*24)); }

  render() {
    const { deadlines, showForm, newTitle, newDue, newPriority } = this.state;
    const priorityColor = { High:'#e05c5c', Medium:'#e8a030', Low:'#4caf82' };
    const done  = deadlines.filter(d => d.completed).length;
    const total = deadlines.length;

    return (
      <Box className="deadline-tracker">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiCalendar style={{ color:'#4a90d9', marginRight:8 }}/>Deadline Tracker
          </Typography>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span className="deadline-progress-mini">
              <span style={{ color:'#4caf82', fontWeight:700 }}>{done}</span>
              <span style={{ color:'#4a4843' }}>/{total} done</span>
            </span>
            <button className="refresh-btn" onClick={() => this.setState({ showForm:!showForm })}>
              <FiPlusCircle size={13}/> Add
            </button>
          </div>
        </div>

        {showForm && (
          <div className="dl-add-form">
            <input className="dl-input" placeholder="Deadline title…" value={newTitle}
              onChange={e => this.setState({ newTitle:e.target.value })}/>
            <input className="dl-input" type="date" value={newDue}
              onChange={e => this.setState({ newDue:e.target.value })}/>
            <select className="dl-select" value={newPriority}
              onChange={e => this.setState({ newPriority:e.target.value })}>
              {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="dl-save-btn" onClick={() => this.addDeadline()}>Save</button>
          </div>
        )}

        <div className="deadline-completion-bar">
          <div className="dcbar-fill" style={{ width:`${total ? (done/total)*100 : 0}%` }}/>
        </div>

        <div className="deadline-list">
          {deadlines.map(dl => {
            const left = this.daysLeft(dl.dueDate);
            return (
              <div key={dl.id}
                className={`deadline-item ${dl.completed ? 'completed' : ''} ${left < 0 && !dl.completed ? 'overdue' : ''}`}>
                <div className="dl-check" onClick={() => this.toggle(dl.id)}>
                  {dl.completed ? <FiCheckCircle size={18} color="#4caf82"/> : <div className="dl-circle"/>}
                </div>
                <div className="dl-body" onClick={() => this.toggle(dl.id)}>
                  <span className="dl-title">{dl.title}</span>
                  <div className="dl-meta">
                    <span className="dl-date"><FiCalendar size={11}/> {dl.dueDate}</span>
                    <span className="dl-priority"
                      style={{ color:priorityColor[dl.priority], borderColor:`${priorityColor[dl.priority]}40`, background:`${priorityColor[dl.priority]}12` }}>
                      {dl.priority}
                    </span>
                  </div>
                </div>
                <div className="dl-days">
                  {dl.completed
                    ? <span className="dl-done-tag">Done</span>
                    : left < 0
                      ? <span className="dl-overdue-tag">Overdue</span>
                      : <span className="dl-days-left"
                          style={{ color:left <= 2 ? '#e05c5c' : left <= 5 ? '#e8a030' : '#8e8a82' }}>
                          {left}d left
                        </span>}
                </div>
                <button className="dl-del-btn" onClick={() => this.del(dl.id)}><FiX size={12}/></button>
              </div>
            );
          })}
          {deadlines.length === 0 && <p className="empty-state">No deadlines. Click + Add above.</p>}
        </div>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   ACTIVITY FEED
   Was: static array, Refresh button had no onClick
   Now: reads recentActivity prop; Refresh re-reads localStorage
───────────────────────────────────────────────────────── */
class ActivityFeedSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = { activities: this.build(props.recentActivity) };
    this.handleRefresh = this.handleRefresh.bind(this);
  }

  build(activity = []) {
    if (!activity.length) return [
      { icon:<FiCheckCircle size={16}/>, color:'#4caf82', text:'Task "Design Homepage" marked complete',         time:'2 min ago',  type:'task' },
      { icon:<FiDollarSign size={16}/>,  color:'#c9a84c', text:'Invoice INV-004 paid by Stark — $2,200',          time:'1 hr ago',   type:'invoice' },
      { icon:<FiUsers size={16}/>,       color:'#4a90d9', text:'New client "Acme Corp" added to pipeline',        time:'3 hrs ago',  type:'client' },
      { icon:<FiAlertCircle size={16}/>, color:'#e05c5c', text:'Invoice INV-002 is 5 days overdue',               time:'5 hrs ago',  type:'alert' },
      { icon:<FiStar size={16}/>,        color:'#9b72e8', text:'Productivity score reached 87% — personal best!', time:'Yesterday',  type:'milestone' },
      { icon:<FiBell size={16}/>,        color:'#e8a030', text:'Deadline "Submit Proposal" due in 2 days',        time:'Yesterday',  type:'reminder' },
    ];
    return activity.slice(0, 8).map(a => ({
      icon:  a.status === 'Completed'  ? <FiCheckCircle size={16}/>
           : a.status === 'In Progress'? <FiActivity size={16}/>
           : <FiClock size={16}/>,
      color: a.status === 'Completed'  ? '#4caf82'
           : a.status === 'In Progress'? '#e8a030'
           : '#4a90d9',
      text: `${a.title} — ${a.status}`,
      time: a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : 'recently',
      type: (a.status || '').toLowerCase().replace(/\s+/g, '-'),
    }));
  }

  // Refresh: re-reads from localStorage so changes from Tasks page appear live
  handleRefresh() {
    const fresh = loadLS('recentActivity', []);
    this.setState({ activities: this.build(fresh) });
  }

  render() {
    const { activities } = this.state;
    return (
      <Box className="activity-feed">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiActivity style={{ color:'#9b72e8', marginRight:8 }}/>Activity Feed
          </Typography>
          {/* FiRefreshCw is now wired to a real handler */}
          <button className="refresh-btn" onClick={this.handleRefresh}>
            <FiRefreshCw size={14}/> Refresh
          </button>
        </div>
        <div className="activity-list">
          {activities.map((act, i) => (
            <div className="activity-row" key={i}>
              <div className="activity-icon-wrap" style={{ color:act.color, background:`${act.color}16` }}>
                {act.icon}
              </div>
              <div className="activity-text-col">
                <span className="activity-text">{act.text}</span>
                <span className="activity-time">{act.time}</span>
              </div>
              <span className={`activity-type-badge type-${act.type}`}>{act.type}</span>
            </div>
          ))}
        </div>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   CLIENT DISTRIBUTION PIE
   Uses: clients prop (live)
───────────────────────────────────────────────────────── */
class ClientDistributionSection extends React.Component {
  render() {
    const { clients } = this.props;
    const data = [
      { name:'In Progress', value:clients.filter(c => c.status === 'In Progress').length || 1, color:'#e8a030' },
      { name:'Completed',   value:clients.filter(c => c.status === 'Completed').length  || 1, color:'#4caf82' },
      { name:'Inactive',    value:clients.filter(c => !c.active).length                 || 1, color:'#4a4843' },
    ];
    return (
      <Box className="client-distribution">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiAward style={{ color:'#4caf82', marginRight:8 }}/>Client Distribution
          </Typography>
        </div>
        <div className="dist-chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={80} paddingAngle={4} dataKey="value">
                {data.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent"/>)}
              </Pie>
              <RechartsTooltip
                contentStyle={{ background:'#18181d', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10 }}
                itemStyle={{ color:'#e8c97a' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="dist-legend">
          {data.map((d, i) => (
            <div className="dist-legend-row" key={i}>
              <span className="dist-dot" style={{ background:d.color }}/>
              <span className="dist-name">{d.name}</span>
              <span className="dist-val" style={{ color:d.color }}>{d.value}</span>
            </div>
          ))}
        </div>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   AI INSIGHTS
   Was: received deadlines prop but Dashboard passed []
   Now: receives live deadlines lifted from DeadlineTracker
   Also reads real invoices + tasks from localStorage
───────────────────────────────────────────────────────── */
class AIInsightsSection extends React.Component {
  computeInsights() {
    const { clients, deadlines } = this.props;
    const invoices     = loadLS('at_invoices', []);
    const tasks        = loadLS('tasks', []);
    const activeC      = clients.filter(c => c.active).length;
    const pendingDL    = deadlines.filter(d => !d.completed).length;
    const overdueDL    = deadlines.filter(d => !d.completed && d.dueDate && new Date(d.dueDate) < new Date()).length;
    const unpaidInv    = invoices.filter(i => i.status !== 'paid').length;
    const overdueTasks = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
    const earned       = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total||0), 0);
    const out = [];
    if (activeC > 0)      out.push(`You have ${activeC} active client${activeC > 1 ? 's' : ''}. Schedule weekly check-ins to improve retention.`);
    if (pendingDL > 0)    out.push(`${pendingDL} deadline${pendingDL > 1 ? 's' : ''} pending${overdueDL > 0 ? ` — ${overdueDL} already overdue` : ''}. Prioritise these first.`);
    if (unpaidInv > 0)    out.push(`${unpaidInv} unpaid invoice${unpaidInv > 1 ? 's' : ''}. A polite reminder typically recovers payment within 48 hours.`);
    if (earned > 0)       out.push(`You've earned $${earned.toLocaleString()} in tracked invoices. Consider raising your rate by 10–15%.`);
    if (overdueTasks > 0) out.push(`${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} past deadline. Clear these to keep your productivity score high.`);
    if (!out.length)      out.push('Add clients, tasks, and invoices in Atelier to start seeing personalised AI insights here.');
    return out;
  }

  render() {
    const insights = this.computeInsights();
    const icons = [<FiUsers size={15}/>, <FiClock size={15}/>, <FiTrendingUp size={15}/>, <FiAlertCircle size={15}/>];
    return (
      <Box className="ai-insights">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiZap style={{ color:'#38bdf8', marginRight:8 }}/>AI Insights
          </Typography>
          <span className="ai-badge teal">✦ Live</span>
        </div>
        <div className="insights-grid">
          {insights.map((insight, i) => (
            <div className="insight-card" key={i}>
              <span className="insight-icon">{icons[i % icons.length]}</span>
              <span className="insight-text">{insight}</span>
            </div>
          ))}
        </div>
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   AI ASSISTANT
   Was: setTimeout fake response
   Now: real Anthropic API call with business context
───────────────────────────────────────────────────────── */
class AIAssistantSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = { query:'', response:'', loading:false, error:'' };
    this.handleAskAI = this.handleAskAI.bind(this);
  }

  async handleAskAI() {
    const { query } = this.state;
    if (!query.trim()) return;

    const clients  = loadLS('clients', []);
    const invoices = loadLS('at_invoices', []);
    const tasks    = loadLS('tasks', []);
    const earned   = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total||0), 0);
    const context  = `Freelancer context: ${clients.length} clients (${clients.filter(c=>c.active).length} active), ${tasks.length} tasks (${tasks.filter(t=>t.completed).length} completed), $${earned.toLocaleString()} earned in tracked invoices.`;

    this.setState({ loading:true, response:'', error:'' });
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a concise freelance business advisor embedded in Aurelance, a freelancer dashboard. Give practical, specific advice in 2–4 sentences. ${context}`,
          messages: [{ role:'user', content:query }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || '').join('') || 'No response received.';
      this.setState({ loading:false, response:text });
    } catch {
      this.setState({ loading:false, error:'Could not reach AI. Please check your connection.' });
    }
  }

  render() {
    const { query, response, loading, error } = this.state;
    return (
      <Box className="ai-assistant">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiZap style={{ color:'#9b72e8', marginRight:8 }}/>AI Assistant
          </Typography>
          <span className="ai-badge purple">✦ AI</span>
        </div>
        <p className="ai-section-subtext">Ask anything about your freelance business:</p>
        <div className="ai-input-row">
          <TextField fullWidth placeholder="e.g. How can I improve client retention?"
            value={query} onChange={e => this.setState({ query:e.target.value })}
            onKeyDown={e => e.key === 'Enter' && this.handleAskAI()}/>
          <Button variant="contained" color="primary" onClick={this.handleAskAI}
            disabled={loading} sx={{ minWidth:100, ml:1 }}>
            {loading ? '…' : 'Ask AI'}
          </Button>
        </div>
        {response && (
          <div className="ai-response-box">
            <span className="ai-response-icon"><FiZap size={14}/></span>
            <Typography variant="body1">{response}</Typography>
          </div>
        )}
        {error && <p style={{ color:'#ef4444', fontSize:13, marginTop:8 }}>{error}</p>}
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   AI PROJECT PLANNER
   Was: setTimeout with hardcoded fake plan
   Now: real Anthropic API call
───────────────────────────────────────────────────────── */
class AIProjectPlannerSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = { projectDesc:'', planResponse:'', loading:false, error:'' };
    this.handleGeneratePlan = this.handleGeneratePlan.bind(this);
  }

  async handleGeneratePlan() {
    const { projectDesc } = this.state;
    if (!projectDesc.trim()) return;
    this.setState({ loading:true, planResponse:'', error:'' });
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are a project planning expert for freelancers. Generate a numbered week-by-week milestone plan. Be concise — 5 to 8 milestones max. Format each line as: "1. Milestone name (Week X)" with no extra text before or after.',
          messages: [{ role:'user', content:`Create a project milestone plan for: ${projectDesc}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || '').join('') || '';
      this.setState({ loading:false, planResponse:text });
    } catch {
      this.setState({ loading:false, error:'Could not reach AI. Please check your connection.' });
    }
  }

  render() {
    const { projectDesc, planResponse, loading, error } = this.state;
    const steps = planResponse ? planResponse.split('\n').filter(Boolean) : [];
    return (
      <Box className="ai-project-planner">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiTarget style={{ color:'#e8a030', marginRight:8 }}/>AI Project Planner
          </Typography>
          <span className="ai-badge amber">✦ AI</span>
        </div>
        <p className="ai-section-subtext">Describe your project and get an AI milestone plan:</p>
        <TextField fullWidth multiline rows={3}
          placeholder="e.g. Build a mobile app for a fitness startup with user profiles, workout tracking…"
          value={projectDesc} onChange={e => this.setState({ projectDesc:e.target.value })}
          sx={{ mb:1.5 }}/>
        <Button variant="contained" color="primary" onClick={this.handleGeneratePlan} disabled={loading}>
          {loading ? 'Generating…' : 'Generate Plan'}
        </Button>
        {planResponse && (
          <div className="ai-response-box amber">
            <div className="plan-steps">
              {steps.map((step, i) => (
                <div className="plan-step" key={i}>
                  <span className="plan-step-text">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <p style={{ color:'#ef4444', fontSize:13, marginTop:8 }}>{error}</p>}
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   AI TASK PRIORITIZER
   Was: setTimeout that just sorted by status (no AI)
   Now: real Anthropic API call with actual task list
───────────────────────────────────────────────────────── */
class AITaskPrioritizerSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = { prioritizedTasks:[], loading:false, error:'' };
    this.handlePrioritizeTasks = this.handlePrioritizeTasks.bind(this);
  }

  async handlePrioritizeTasks() {
    const tasks = loadLS('tasks', this.props.recentActivity || []);
    if (!tasks.length) {
      this.setState({ error:'No tasks found. Add tasks in the Tasks section first.' });
      return;
    }
    this.setState({ loading:true, error:'' });

    const taskList = tasks.slice(0, 20).map((t, i) =>
      `${i+1}. ${t.name || t.title} [${t.priority || 'Medium'} priority, ${t.completed ? 'Done' : t.status || 'Pending'}${t.deadline ? `, due ${t.deadline}` : ''}]`
    ).join('\n');

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are a task prioritisation assistant for a freelancer. Re-order the provided tasks by urgency and impact. Return ONLY a numbered list. After each task name, add a short parenthetical reason. No intro, no outro.',
          messages: [{ role:'user', content:`Prioritise these tasks by urgency and impact:\n${taskList}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || '').join('') || '';
      const lines = text.split('\n').filter(Boolean);
      // Map first 3 → High, next 3 → Medium, rest → Low
      const prioritized = lines.map((line, i) => ({
        title:  line,
        status: i < 3 ? 'High' : i < 6 ? 'Medium' : 'Low',
      }));
      this.setState({ loading:false, prioritizedTasks:prioritized });
    } catch {
      this.setState({ loading:false, error:'Could not reach AI. Please check your connection.' });
    }
  }

  render() {
    const { prioritizedTasks, loading, error } = this.state;
    const priorityColors = { High:'#e05c5c', Medium:'#e8a030', Low:'#4caf82' };
    return (
      <Box className="ai-task-prioritizer">
        <div className="section-header-row">
          <Typography variant="h4">
            <FiZap style={{ color:'#4caf82', marginRight:8 }}/>AI Task Prioritizer
          </Typography>
          <span className="ai-badge green">✦ AI</span>
        </div>
        <p className="ai-section-subtext">Let AI sort your real tasks by urgency and impact:</p>
        <Button variant="contained" color="primary" onClick={this.handlePrioritizeTasks} disabled={loading}>
          {loading ? 'Prioritizing…' : 'Prioritize My Tasks'}
        </Button>
        {prioritizedTasks.length > 0 && (
          <div className="ai-response-box green">
            <p className="ai-response-subhead">AI-sorted by urgency and impact:</p>
            <div className="task-priority-list">
              {prioritizedTasks.map((task, i) => (
                <div className="task-priority-item" key={i}>
                  <span className="task-priority-num">{String(i+1).padStart(2,'0')}</span>
                  <span className="task-priority-title">{task.title}</span>
                  <span className="task-priority-badge"
                    style={{ color:priorityColors[task.status], background:`${priorityColors[task.status]}16`, borderColor:`${priorityColors[task.status]}30` }}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && <p style={{ color:'#ef4444', fontSize:13, marginTop:8 }}>{error}</p>}
      </Box>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   DIALOGS
───────────────────────────────────────────────────────── */
class DeleteConfirmationDialog extends React.Component {
  render() {
    const { open, onClose, onConfirm, itemType } = this.props;
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this {itemType}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancel</Button>
          <Button onClick={onConfirm} color="primary" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

class AddClientDialog extends React.Component {
  render() {
    const { open, onClose, newClient, setNewClient, onAddClient } = this.props;
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Client</DialogTitle>
        <DialogContent>
          <TextField label="Client Name" fullWidth margin="normal" value={newClient.name}
            onChange={e => setNewClient({ ...newClient, name:e.target.value.trimStart() })}/>
          <TextField label="Project" fullWidth margin="normal" value={newClient.project}
            onChange={e => setNewClient({ ...newClient, project:e.target.value.trimStart() })}/>
          <Select fullWidth sx={{ mt:1.5 }} value={newClient.status} displayEmpty
            onChange={e => setNewClient({ ...newClient, status:e.target.value })}>
            <MenuItem value="" disabled>Select Status</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
          <Select fullWidth sx={{ mt:1.5 }} value={newClient.active ? 'Active' : 'Inactive'}
            onChange={e => setNewClient({ ...newClient, active:e.target.value === 'Active' })}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancel</Button>
          <Button onClick={onAddClient} color="primary" variant="contained">Save Client</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

class EditClientDialog extends React.Component {
  render() {
    const { open, onClose, editedClient, setEditedClient, onSaveClient } = this.props;
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Client</DialogTitle>
        <DialogContent>
          <TextField label="Client Name" fullWidth margin="normal" value={editedClient.name}
            onChange={e => setEditedClient({ ...editedClient, name:e.target.value })}/>
          <TextField label="Project" fullWidth margin="normal" value={editedClient.project}
            onChange={e => setEditedClient({ ...editedClient, project:e.target.value })}/>
          <Select fullWidth sx={{ mt:1.5 }} value={editedClient.status}
            onChange={e => setEditedClient({ ...editedClient, status:e.target.value })}>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </Select>
          <Select fullWidth sx={{ mt:1.5 }} value={editedClient.active ? 'Active' : 'Inactive'}
            onChange={e => setEditedClient({ ...editedClient, active:e.target.value === 'Active' })}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancel</Button>
          <Button onClick={onSaveClient} color="primary">Save Changes</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

/* ─────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────── */
export default class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    const storedClients  = loadLS('clients',       []);
    const storedActivity = loadLS('recentActivity', []);
    const storedDL       = loadLS('db_deadlines',  []);

    this.state = {
      clients: storedClients.length ? storedClients : [
        { name:'Client A',  project:'Website Development', status:'In Progress', active:true,  addedAt:new Date().toLocaleDateString() },
        { name:'Client B',  project:'Mobile App Design',   status:'Completed',   active:false, addedAt:new Date().toLocaleDateString() },
        { name:'Acme Corp', project:'Brand Redesign',       status:'In Progress', active:true,  addedAt:new Date().toLocaleDateString() },
      ],
      // deadlines is now lifted from DeadlineTrackerSection so AIInsights receives real data
      deadlines: storedDL,
      recentActivity: storedActivity.length ? storedActivity : [
        { title:'Completed Project Alpha milestone', status:'Completed',   priority:'High',   timestamp:new Date() },
        { title:'Updated profile on platform',       status:'Pending',     priority:'Medium', timestamp:new Date() },
        { title:'Client onboarding call',            status:'In Progress', priority:'High',   timestamp:new Date() },
      ],
      searchTerm:               '',
      statusFilter:             '',
      snackbarOpen:             false,
      snackbarMsg:              'Action successful',
      error:                    '',
      newClientDialog:          false,
      editingClientDialog:      false,
      deleteConfirmationDialog: false,
      clientDetailDialog:       false,
      clientToView:             null,
      clientToDelete:           null,
      newClient:    { name:'', project:'', status:'', active:true },
      editedClient: { name:'', project:'', status:'', active:true, index:null },
      isMobile: window.matchMedia('(max-width:768px)').matches,
    };

    this.debouncedSearch          = debounce(this.handleSearch.bind(this), 300);
    this.handleSearch             = this.handleSearch.bind(this);
    this.setStatusFilter          = this.setStatusFilter.bind(this);
    this.handleAddClient          = this.handleAddClient.bind(this);
    this.handleEditClient         = this.handleEditClient.bind(this);
    this.handleToggleClientActive = this.handleToggleClientActive.bind(this);
    this.handleViewClientDetails  = this.handleViewClientDetails.bind(this);
    this.confirmDeleteClient      = this.confirmDeleteClient.bind(this);
    this.handleDeleteClient       = this.handleDeleteClient.bind(this);
    this.handleSortClients        = this.handleSortClients.bind(this);
    this.handleResize             = this.handleResize.bind(this);
    this.handleCloseSnackbar      = this.handleCloseSnackbar.bind(this);
    this.handleDeadlinesChange    = this.handleDeadlinesChange.bind(this);
  }

  componentDidMount() {
    // Animate KPI strip items — selector matches actual class name
    gsap.from('.kpi-item', {
      opacity:0, y:30, duration:0.6, stagger:0.1, ease:'power2.out',
    });
    // Animate all section cards — selectors match actual class names used below
    gsap.from([
      '.revenue-overview', '.chart-section', '.goal-tracker',
      '.invoice-tracker',  '.deadline-tracker', '.activity-feed',
      '.ai-insights',      '.ai-assistant',     '.ai-project-planner',
      '.ai-task-prioritizer', '.client-distribution', '.client-management',
    ], {
      opacity:0, y:40, duration:0.7, stagger:0.08, delay:0.3, ease:'power2.out',
    });
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() { window.removeEventListener('resize', this.handleResize); }

  handleResize()   { this.setState({ isMobile:window.matchMedia('(max-width:768px)').matches }); }
  handleSearch(v)  { this.setState({ searchTerm:v }); }
  setStatusFilter(v) { this.setState({ statusFilter:v }); }
  handleCloseSnackbar() { this.setState({ snackbarOpen:false, error:'' }); }

  // Lifted from DeadlineTrackerSection so AIInsightsSection receives live deadlines
  handleDeadlinesChange(deadlines) { this.setState({ deadlines }); }

  persistClients(clients, msg = 'Action successful') {
    this.setState({ clients, snackbarOpen:true, snackbarMsg:msg });
    localStorage.setItem('clients', JSON.stringify(clients));
  }

  handleAddClient() {
    const { newClient, clients } = this.state;
    if (!newClient.name.trim() || !newClient.project.trim() || !newClient.status) {
      this.setState({ error:'All client fields are required.' }); return;
    }
    this.persistClients(
      [...clients, { ...newClient, name:newClient.name.trim(), project:newClient.project.trim(), addedAt:new Date().toLocaleDateString() }],
      'Client added'
    );
    this.setState({ newClient:{ name:'', project:'', status:'', active:true }, newClientDialog:false });
  }

  handleEditClient() {
    const { editedClient, clients } = this.state;
    if (!editedClient.name.trim() || !editedClient.project.trim() || !editedClient.status) {
      this.setState({ error:'All fields are required.' }); return;
    }
    const updated = [...clients];
    updated[editedClient.index] = {
      name:     editedClient.name.trim(),
      project:  editedClient.project.trim(),
      status:   editedClient.status,
      active:   editedClient.active,
      addedAt:  clients[editedClient.index]?.addedAt,
    };
    this.persistClients(updated, 'Client updated');
    this.setState({ editedClient:{ name:'', project:'', status:'', active:true, index:null }, editingClientDialog:false });
  }

  handleToggleClientActive(index) {
    const updated = [...this.state.clients];
    updated[index].active = !updated[index].active;
    this.persistClients(updated, `Client ${updated[index].active ? 'activated' : 'deactivated'}`);
  }

  // Was: alert() — now opens a proper Dialog
  handleViewClientDetails(client) {
    this.setState({ clientToView:client, clientDetailDialog:true });
  }

  confirmDeleteClient(index) { this.setState({ clientToDelete:index, deleteConfirmationDialog:true }); }

  handleDeleteClient() {
    const updated = this.state.clients.filter((_, i) => i !== this.state.clientToDelete);
    this.persistClients(updated, 'Client deleted');
    this.setState({ deleteConfirmationDialog:false });
  }

  handleSortClients(sortOrder) {
    const sorted = [...this.state.clients];
    if (sortOrder === 'nameAsc')  sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortOrder === 'nameDesc') sorted.sort((a, b) => b.name.localeCompare(a.name));
    this.persistClients(sorted, 'Sorted');
  }

  render() {
    const {
      clients, deadlines, recentActivity, searchTerm, statusFilter,
      snackbarOpen, snackbarMsg, error,
      newClientDialog, editingClientDialog, deleteConfirmationDialog,
      clientDetailDialog, clientToView,
      newClient, editedClient, isMobile,
    } = this.state;

    return (
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <Typography variant="h3" sx={{ fontSize:isMobile ? '1.75rem' : '2.5rem' }}>
              Dashboard
            </Typography>
            <span className="dashboard-header-sub">Welcome back — here's your overview</span>
          </div>
          <div className="dashboard-header-right">
            <span className="header-date-badge">
              <FiCalendar size={13}/>
              {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
            </span>
            <span className="header-plan-badge"><FiStar size={12}/> Premium</span>
          </div>
        </div>

        {/* KPI Strip */}
        <KPIStripSection clients={clients} recentActivity={recentActivity}/>

        <div className="dashboard-body">
          {/* Client Management */}
          <div className="dashboard-row full">
            <ClientManagementSection
              clients={clients} searchTerm={searchTerm} statusFilter={statusFilter}
              debouncedSearch={this.debouncedSearch} setStatusFilter={this.setStatusFilter}
              onEdit={(client, idx) => this.setState({ editedClient:{ ...client, index:idx }, editingClientDialog:true })}
              onDelete={this.confirmDeleteClient}
              onViewDetails={this.handleViewClientDetails}
              onSortChange={this.handleSortClients}
              onToggleActive={this.handleToggleClientActive}
              onAddClientButtonClick={() => this.setState({ newClientDialog:true })}
              isMobile={isMobile}
            />
          </div>

          {/* Revenue + Distribution */}
          <div className="dashboard-row split-7-3">
            <RevenueOverviewSection/>
            <ClientDistributionSection clients={clients}/>
          </div>

          {/* Productivity + Goals */}
          <div className="dashboard-row split-6-4">
            <ProductivityChartSection recentActivity={recentActivity}/>
            <GoalTrackerSection clients={clients} recentActivity={recentActivity}/>
          </div>

          {/* Invoice Tracker */}
          <div className="dashboard-row full">
            <InvoiceTrackerSection/>
          </div>

          {/* Deadlines + Activity — onDeadlinesChange lifts state so AIInsights gets real data */}
          <div className="dashboard-row split-5-5">
            <DeadlineTrackerSection onDeadlinesChange={this.handleDeadlinesChange}/>
            <ActivityFeedSection recentActivity={recentActivity}/>
          </div>

          {/* AI Insights — now receives live deadlines from state */}
          <div className="dashboard-row full">
            <AIInsightsSection clients={clients} deadlines={deadlines}/>
          </div>

          {/* AI Tools */}
          <div className="dashboard-row split-5-5">
            <AIAssistantSection/>
            <AIProjectPlannerSection/>
          </div>

          <div className="dashboard-row full">
            <AITaskPrioritizerSection recentActivity={recentActivity}/>
          </div>
        </div>

        {/* All Dialogs */}
        <ClientDetailDialog
          open={clientDetailDialog} client={clientToView}
          onClose={() => this.setState({ clientDetailDialog:false })}
        />
        <AddClientDialog
          open={newClientDialog} newClient={newClient}
          setNewClient={data => this.setState({ newClient:data })}
          onAddClient={this.handleAddClient}
          onClose={() => this.setState({ newClientDialog:false })}
        />
        <EditClientDialog
          open={editingClientDialog} editedClient={editedClient}
          setEditedClient={data => this.setState({ editedClient:data })}
          onSaveClient={this.handleEditClient}
          onClose={() => this.setState({ editingClientDialog:false })}
        />
        <DeleteConfirmationDialog
          open={deleteConfirmationDialog} itemType="client"
          onConfirm={this.handleDeleteClient}
          onClose={() => this.setState({ deleteConfirmationDialog:false })}
        />

        <Snackbar open={snackbarOpen} autoHideDuration={3000} message={snackbarMsg} onClose={this.handleCloseSnackbar}/>
        {error && <Snackbar open={!!error} autoHideDuration={3000} message={error} onClose={this.handleCloseSnackbar}/>}
      </div>
    );
  }
}