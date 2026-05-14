// src/pages/Tasks.jsx — Production v2
// ─────────────────────────────────────────────────────────────
//  Views:   Kanban · List · Timeline (Gantt) · Calendar
//  Backend: subtasks/comments/time via real API (no localStorage)
//  Features:
//    WIP limits · Column collapse · Task aging · Burndown widget
//    Keyboard shortcuts (n=new  /=search  esc=close)
//    Sprint management · Quick filter presets
//    Manual time log modal · Task templates
//    Task number (TK-0001) · Client link · CSV export
//    Recurring flag · Task dependencies UI
//    Column metrics (hours, % done)
// ─────────────────────────────────────────────────────────────
import React, {
  useReducer, useEffect, useCallback, useRef, useState, useMemo,
} from 'react';
import { useAuth }    from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Tasks.css';
import {
  FiPlus, FiSearch, FiX, FiCheck, FiCheckCircle,
  FiClock, FiAlertCircle, FiCalendar, FiList,
  FiColumns, FiFilter, FiChevronDown, FiChevronUp,
  FiEdit3, FiTrash2, FiRefreshCw, FiTag,
  FiMessageSquare, FiPlay, FiPause, FiMoreVertical,
  FiBarChart2, FiLayers,
  FiCopy, FiDownload, FiRepeat,
} from 'react-icons/fi';

/* ── API ───────────────────────────────────────────────────── */
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tok  = () => localStorage.getItem('authToken');
const hdrs = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` });
const api  = {
  get:    url      => fetch(`${BASE}${url}`,  { headers:hdrs() }).then(r => r.json()),
  post:   (url,b)  => fetch(`${BASE}${url}`,  { method:'POST',  headers:hdrs(), body:JSON.stringify(b) }).then(r => r.json()),
  patch:  (url,b)  => fetch(`${BASE}${url}`,  { method:'PATCH', headers:hdrs(), body:JSON.stringify(b) }).then(r => r.json()),
  delete: url      => fetch(`${BASE}${url}`,  { method:'DELETE',headers:hdrs() }).then(r => r.json()),
};

/* ── Constants ─────────────────────────────────────────────── */
const STATUSES = [
  { id:'todo',        label:'To Do',       color:'#8e8a82', bg:'rgba(142,138,130,.14)', wip: 0 },
  { id:'in-progress', label:'In Progress', color:'#4a90d9', bg:'rgba(74,144,217,.14)',  wip: 5 },
  { id:'review',      label:'Review',      color:'#9b72e8', bg:'rgba(155,114,232,.14)', wip: 3 },
  { id:'done',        label:'Done',        color:'#4caf82', bg:'rgba(76,175,130,.14)',  wip: 0 },
];

const PRIORITIES = [
  { id:'Low',    label:'Low',    color:'#38bdf8', icon:'↓', order:0 },
  { id:'Medium', label:'Medium', color:'#e8a030', icon:'→', order:1 },
  { id:'High',   label:'High',   color:'#e05c5c', icon:'↑', order:2 },
  { id:'Urgent', label:'Urgent', color:'#c0392b', icon:'⚡', order:3 },
];

const CATEGORIES = ['General','Development','Design','Marketing','Finance','Client Work','Admin','Research'];

const QUICK_FILTERS = [
  { id:'today',       label:'Today',       filter:{ deadline:'today' } },
  { id:'this-week',   label:'This Week',   filter:{ deadline:'week'  } },
  { id:'overdue',     label:'Overdue',     filter:{ overdue:true     } },
  { id:'no-deadline', label:'No Deadline', filter:{ noDeadline:true  } },
  { id:'high-urgent', label:'High+',       filter:{ priority:'high_urgent' } },
];

const TEMPLATES = [
  { id:'bug',     label:'Bug Fix',     form:{ category:'Development', priority:'High',   tags:['bug']         } },
  { id:'feature', label:'Feature',     form:{ category:'Development', priority:'Medium', tags:['feature']     } },
  { id:'design',  label:'Design Task', form:{ category:'Design',      priority:'Medium', tags:['design']      } },
  { id:'meeting', label:'Meeting',     form:{ category:'Admin',       priority:'Low',    estimatedHours:1     } },
  { id:'client',  label:'Client Task', form:{ category:'Client Work', priority:'High',   tags:['client-work'] } },
];

const stCfg  = id => STATUSES.find(s  => s.id === id)   || STATUSES[0];
const priCfg = id => PRIORITIES.find(p => p.id === id)  || PRIORITIES[1];

/* ── Helpers ───────────────────────────────────────────────── */
const arr     = v => Array.isArray(v) ? v : [];
const todayStr= () => new Date().toISOString().split('T')[0];
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';
const fmtFull = d => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
const dLeft   = d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;
const daysAgo = d => d ? Math.floor((Date.now()-new Date(d))/86400000) : null;
const fmtMins = m => { const h=Math.floor(m/60),mn=m%60; return h>0 ? `${h}h${mn>0?' '+mn+'m':''}` : `${mn}m`; };

const isToday = d => {
  if (!d) return false;
  const t=new Date(d), n=new Date();
  return t.getFullYear()===n.getFullYear() && t.getMonth()===n.getMonth() && t.getDate()===n.getDate();
};
const isThisWeek = d => {
  if (!d) return false;
  const t=new Date(d), n=new Date();
  const weekEnd=new Date(n); weekEnd.setDate(n.getDate()+7);
  return t >= n && t <= weekEnd;
};

/* ── Inline icons ──────────────────────────────────────────── */
const Sq = ({ size=14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
  </svg>
);
const ChevL = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevR = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const Drag  = () => <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" opacity=".35"><circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>;

/* ── Blank task form ───────────────────────────────────────── */
const blankTask = (o={}) => ({
  title:'', description:'', status:'todo', priority:'Medium',
  category:'General', tags:[], deadline:'', estimatedHours:0,
  sprint:'', recurring:false, clientId:'', ...o,
});

/* ══════════════════════════════════════════════════════════════
   REDUCER
══════════════════════════════════════════════════════════════ */
const init = {
  tasks:[], clients:[], stats:null, loading:true,
  view:'kanban',
  drawerTask:null,
  modalOpen:false, modalForm:null, editingId:null,
  timeLogModal:null,
  filters:{ status:'', priority:'', category:'', sprint:'', tag:'', overdue:false, noDeadline:false, search:'', quick:'' },
  filtersOpen:false,
  sort:{ by:'deadline', dir:'asc' },
  group:'status',
  selected:new Set(),
  collapsed:new Set(),      // collapsed kanban columns
  toast:{ msg:'', type:'success' },
  timer:{ taskId:null, start:null, elapsed:0 },
};

function reducer(s, a) {
  switch(a.type) {
    case 'LOAD_OK':       return { ...s, tasks:a.tasks, loading:false };
    case 'LOAD_CLIENTS':  return { ...s, clients:a.clients };
    case 'LOAD_STATS':    return { ...s, stats:a.stats };
    case 'LOADING':       return { ...s, loading:true };
    case 'SET_VIEW':      return { ...s, view:a.v };
    case 'OPEN_DRAWER':   return { ...s, drawerTask:a.task };
    case 'CLOSE_DRAWER':  return { ...s, drawerTask:null };
    case 'OPEN_MODAL':    return { ...s, modalOpen:true, modalForm:a.form||blankTask(), editingId:a.eid||null };
    case 'CLOSE_MODAL':   return { ...s, modalOpen:false, modalForm:null, editingId:null };
    case 'PATCH_FORM':    return { ...s, modalForm:{ ...s.modalForm, ...a.p } };
    case 'OPEN_TIME_LOG': return { ...s, timeLogModal:a.task };
    case 'CLOSE_TIME_LOG':return { ...s, timeLogModal:null };
    case 'ADD_TASK':      return { ...s, tasks:[a.task,...s.tasks] };
    case 'UPD_TASK':      return {
      ...s,
      tasks:s.tasks.map(t => t._id===a.task._id ? a.task : t),
      drawerTask:s.drawerTask?._id===a.task._id ? a.task : s.drawerTask,
    };
    case 'DEL_TASK':      return {
      ...s,
      tasks:s.tasks.filter(t => t._id!==a.id),
      drawerTask:s.drawerTask?._id===a.id ? null : s.drawerTask,
      selected:new Set([...s.selected].filter(x => x!==a.id)),
    };
    case 'REORDER':       return { ...s, tasks:a.tasks };
    case 'SET_FILTER':    return { ...s, filters:{ ...s.filters, [a.k]:a.v } };
    case 'SET_QUICK':     return { ...s, filters:{ ...init.filters, quick:a.id, ...(a.overrides||{}) } };
    case 'CLR_FILTERS':   return { ...s, filters:init.filters };
    case 'TOGGLE_FBAR':   return { ...s, filtersOpen:!s.filtersOpen };
    case 'SET_SORT':      return { ...s, sort:{ by:a.by, dir:a.dir } };
    case 'SET_GROUP':     return { ...s, group:a.g };
    case 'SEL_TOGGLE': {
      const ns=new Set(s.selected); ns.has(a.id)?ns.delete(a.id):ns.add(a.id); return { ...s, selected:ns };
    }
    case 'SEL_ALL':       return { ...s, selected:new Set(a.ids) };
    case 'SEL_CLR':       return { ...s, selected:new Set() };
    case 'COL_TOGGLE': {
      const nc=new Set(s.collapsed); nc.has(a.id)?nc.delete(a.id):nc.add(a.id); return { ...s, collapsed:nc };
    }
    case 'SET_TIMER':     return { ...s, timer:{ ...s.timer, ...a.p } };
    case 'TOAST':         return { ...s, toast:{ msg:a.msg, type:a.t||'success' } };
    case 'CLR_TOAST':     return { ...s, toast:{ msg:'', type:'success' } };
    default: return s;
  }
}

/* ══════════════════════════════════════════════════════════════
   ROOT COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Tasks() {
  useAuth(); // keep AuthContext connected (user not needed here)
  const navigate      = useNavigate();
  const [s, d]        = useReducer(reducer, init);
  const timerRef      = useRef(null);
  const searchRef     = useRef(null);

  /* ── Load ─────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    d({ type:'LOADING' });
    const [tr, cr, sr] = await Promise.allSettled([
      api.get('/tasks?limit=500'),
      api.get('/clients?limit=100'),
      api.get('/tasks/stats'),
    ]);
    if (tr.status==='fulfilled') d({ type:'LOAD_OK',    tasks:arr(tr.value.tasks||tr.value) });
    else                         d({ type:'LOAD_OK',    tasks:[] });
    if (cr.status==='fulfilled') d({ type:'LOAD_CLIENTS', clients:arr(cr.value.clients||cr.value) });
    if (sr.status==='fulfilled') d({ type:'LOAD_STATS',   stats:sr.value });
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Timer tick ───────────────────────────────────────────── */
  useEffect(() => {
    if (s.timer.taskId && s.timer.start) {
      timerRef.current = setInterval(() => {
        d({ type:'SET_TIMER', p:{ elapsed:Math.floor((Date.now()-s.timer.start)/1000) } });
      }, 1000);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [s.timer.taskId, s.timer.start]);

  /* ── Keyboard shortcuts ───────────────────────────────────── */
  useEffect(() => {
    const handler = e => {
      if (e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
      if (e.key==='n' && !e.ctrlKey && !s.modalOpen && !s.drawerTask) {
        e.preventDefault(); d({ type:'OPEN_MODAL' });
      }
      if (e.key==='/' && !s.filtersOpen) {
        e.preventDefault();
        d({ type:'TOGGLE_FBAR' });
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key==='Escape') {
        if (s.drawerTask)   d({ type:'CLOSE_DRAWER' });
        if (s.modalOpen)    d({ type:'CLOSE_MODAL' });
        if (s.timeLogModal) d({ type:'CLOSE_TIME_LOG' });
      }
      if (e.key==='k' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); d({ type:'SET_VIEW', v:'kanban' }); }
      if (e.key==='l' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); d({ type:'SET_VIEW', v:'list' }); }
      if (e.key==='t' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); d({ type:'SET_VIEW', v:'timeline' }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [s.modalOpen, s.drawerTask, s.timeLogModal, s.filtersOpen]);

  /* ── Toast ────────────────────────────────────────────────── */
  const toast = useCallback((msg, t='success') => {
    d({ type:'TOAST', msg, t });
    setTimeout(() => d({ type:'CLR_TOAST' }), 3200);
  }, []);

  /* ── Timer controls ───────────────────────────────────────── */
  const startTimer = useCallback(id => d({ type:'SET_TIMER', p:{ taskId:id, start:Date.now(), elapsed:0 } }), []);

  const stopTimer = useCallback(async () => {
    if (!s.timer.taskId) return;
    const mins = Math.round(s.timer.elapsed/60);
    d({ type:'SET_TIMER', p:{ taskId:null, start:null, elapsed:0 } });
    if (mins < 1) return;
    try {
      const r = await api.post(`/tasks/${s.timer.taskId}/time`, { minutes:mins, note:'Timer session' });
      d({ type:'UPD_TASK', task:r.task });
      toast(`+${fmtMins(mins)} logged`);
      // refresh stats
      api.get('/tasks/stats').then(sr => d({ type:'LOAD_STATS', stats:sr })).catch(()=>{});
    } catch {}
  }, [s.timer, toast]);

  /* ── CRUD ─────────────────────────────────────────────────── */
  const createTask = useCallback(async form => {
    try {
      const r = await api.post('/tasks', form);
      d({ type:'ADD_TASK', task:r.task||r });
      toast('Task created.');
      api.get('/tasks/stats').then(sr => d({ type:'LOAD_STATS', stats:sr })).catch(()=>{});
    } catch { toast('Failed.','error'); }
    d({ type:'CLOSE_MODAL' });
  }, [toast]);

  const updateTask = useCallback(async (id, patch) => {
    try {
      const r = await api.patch(`/tasks/${id}`, patch);
      d({ type:'UPD_TASK', task:r.task||{ ...s.tasks.find(t=>t._id===id), ...patch } });
      if (patch.status || patch.completed) {
        api.get('/tasks/stats').then(sr => d({ type:'LOAD_STATS', stats:sr })).catch(()=>{});
      }
    } catch { toast('Update failed.','error'); }
  }, [s.tasks, toast]);

  const deleteTask = useCallback(async id => {
    try {
      await api.delete(`/tasks/${id}`);
      d({ type:'DEL_TASK', id });
      toast('Deleted.');
      api.get('/tasks/stats').then(sr => d({ type:'LOAD_STATS', stats:sr })).catch(()=>{});
    } catch { toast('Delete failed.','error'); }
  }, [toast]);

  const duplicateTask = useCallback(async task => {
    try {
      const r = await api.post(`/tasks/${task._id}/duplicate`, {});
      d({ type:'ADD_TASK', task:r.task });
      toast(`Duplicated as ${r.task?.taskNumber}`);
    } catch { toast('Duplicate failed.','error'); }
  }, [toast]);

  const bulkStatus = useCallback(async status => {
    const ids = [...s.selected];
    await Promise.all(ids.map(id => updateTask(id,{status})));
    d({ type:'SEL_CLR' });
    toast(`${ids.length} tasks → ${stCfg(status).label}`);
  }, [s.selected, updateTask, toast]);

  const bulkDelete = useCallback(async () => {
    const ids = [...s.selected];
    await Promise.all(ids.map(id => deleteTask(id)));
    d({ type:'SEL_CLR' });
  }, [s.selected, deleteTask]);

  /* ── DnD drop ─────────────────────────────────────────────── */
  const handleDrop = useCallback(async (colStatus, draggedId, targetId) => {
    const dragged = s.tasks.find(t => t._id===draggedId);
    if (!dragged) return;
    let list = s.tasks.filter(t => t._id!==draggedId);
    const updated = { ...dragged, status:colStatus };
    if (targetId) {
      const ti = list.findIndex(t => t._id===targetId);
      list.splice(ti, 0, updated);
    } else { list.push(updated); }
    const reordered = list.map((t,i) => ({ ...t, order:i }));
    d({ type:'REORDER', tasks:reordered });
    try {
      await api.patch(`/tasks/${draggedId}`, { status:colStatus });
      api.get('/tasks/stats').then(sr => d({ type:'LOAD_STATS', stats:sr })).catch(()=>{});
    } catch {}
  }, [s.tasks]);

  /* ── Quick filter apply ───────────────────────────────────── */
  const applyQuickFilter = useCallback(qf => {
    const isActive = s.filters.quick === qf.id;
    if (isActive) { d({ type:'CLR_FILTERS' }); return; }
    const overrides = {};
    if (qf.id==='overdue')     overrides.overdue = true;
    if (qf.id==='no-deadline') overrides.noDeadline = true;
    if (qf.id==='high-urgent') overrides.priority = 'High';
    d({ type:'SET_QUICK', id:qf.id, overrides });
  }, [s.filters.quick]);

  /* ── Filtered + sorted list ───────────────────────────────── */
  const filtered = useMemo(() => {
    const { status, priority, category, sprint, tag, overdue, noDeadline, search } = s.filters;
    return s.tasks.filter(t => {
      if (status   && t.status!==status)             return false;
      if (priority && t.priority!==priority && !(priority==='High' && (t.priority==='High'||t.priority==='Urgent'))) return false;
      if (category && (t.category||'General')!==category) return false;
      if (sprint   && (t.sprint||'')!==sprint)       return false;
      if (tag      && !arr(t.tags).includes(tag))    return false;
      if (overdue) {
        const l=dLeft(t.deadline||t.dueDate);
        if (l===null||l>=0||t.status==='done') return false;
      }
      if (noDeadline && (t.deadline||t.dueDate))     return false;
      if (s.filters.quick==='today')     { if (!isToday(t.deadline||t.dueDate)) return false; }
      if (s.filters.quick==='this-week') { if (!isThisWeek(t.deadline||t.dueDate)) return false; }
      if (search) {
        const q=search.toLowerCase();
        return (t.title||'').toLowerCase().includes(q)
          ||(t.description||'').toLowerCase().includes(q)
          ||(t.taskNumber||'').toLowerCase().includes(q)
          ||arr(t.tags).some(tg=>tg.toLowerCase().includes(q));
      }
      return true;
    }).sort((a,b) => {
      const { by, dir } = s.sort;
      let va=a[by], vb=b[by];
      if (by==='deadline'||by==='dueDate') { va=new Date(va||'9999'); vb=new Date(vb||'9999'); }
      if (by==='priority') { const o=['Low','Medium','High','Urgent']; va=o.indexOf(va); vb=o.indexOf(vb); }
      if (va<vb) return dir==='asc'?-1:1;
      if (va>vb) return dir==='asc'?1:-1;
      return 0;
    });
  }, [s.tasks, s.filters, s.sort]);

  /* ── CSV export ───────────────────────────────────────────── */
  const exportCSV = useCallback(() => {
    const rows = filtered.map(t => [
      t.taskNumber||'', t.title||'', t.status||'', t.priority||'',
      t.category||'', fmtDate(t.deadline), t.sprint||'',
      fmtMins(t.trackedMinutes||0), t.estimatedHours||0,
      arr(t.tags).join(';'),
    ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
    const csv = ['Task#,Title,Status,Priority,Category,Deadline,Sprint,Tracked,Est Hours,Tags',...rows].join('\n');
    const a = Object.assign(document.createElement('a'),{
      href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})),
      download: `tasks-${todayStr()}.csv`,
    }); a.click();
    toast(`${filtered.length} tasks exported.`);
  }, [filtered, toast]);

  /* ── Derived stats ────────────────────────────────────────── */
  const stats = s.stats?.counts || {};
  const allTags    = useMemo(() => { const set=new Set(); s.tasks.forEach(t=>arr(t.tags).forEach(tg=>set.add(tg))); return [...set]; }, [s.tasks]);
  const allSprints = useMemo(() => [...new Set(s.tasks.map(t=>t.sprint).filter(Boolean))], [s.tasks]);
  const activeFilters = Object.values(s.filters).filter(v => v && v!=='' && v!==false).length;

  /* ── Timer display ────────────────────────────────────────── */
  const timerStr = () => {
    const e=s.timer.elapsed, m=Math.floor(e/60), sc=e%60;
    return `${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
  };

  /* ══ RENDER ══════════════════════════════════════════════════ */
  return (
    <div className="tk-root">

      {s.toast.msg && (
        <div className={`tk-toast tk-toast-${s.toast.type}`}>
          {s.toast.type==='success'?<FiCheck size={13}/>:<FiAlertCircle size={13}/>} {s.toast.msg}
        </div>
      )}

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="tk-topbar">
        <div className="tk-topbar-left">
          <div className="tk-page-title">
            <FiLayers size={17} style={{color:'var(--gold)'}}/>
            <span>Task Workspace</span>
            {s.timer.taskId && (
              <div className="tk-timer-pill">
                <span className="tk-timer-dot"/>
                <span>{timerStr()}</span>
                <button onClick={stopTimer} title="Stop timer"><FiPause size={10}/></button>
              </div>
            )}
          </div>
        </div>
        <div className="tk-topbar-right">
          <div className="tk-search-wrap">
            <FiSearch size={12} className="tk-search-icon"/>
            <input ref={searchRef} className="tk-search" placeholder="Search tasks… (press /)"
              value={s.filters.search}
              onChange={e => d({type:'SET_FILTER',k:'search',v:e.target.value})}/>
            {s.filters.search && <button className="tk-search-clear" onClick={()=>d({type:'SET_FILTER',k:'search',v:''})}><FiX size={11}/></button>}
          </div>
          <button className={`tk-icon-btn${s.filtersOpen?' active':''}`}
            onClick={()=>d({type:'TOGGLE_FBAR'})} title="Filters">
            <FiFilter size={13}/>
            {activeFilters>0 && <span className="tk-badge">{activeFilters}</span>}
          </button>
          <button className="tk-icon-btn" onClick={exportCSV} title="Export CSV"><FiDownload size={13}/></button>
          <button className="tk-icon-btn" onClick={load} title="Refresh"><FiRefreshCw size={13}/></button>
          <div className="tk-view-sw">
            {[['kanban','Board',<FiColumns size={12}/>],['list','List',<FiList size={12}/>],['timeline','Timeline',<FiBarChart2 size={12}/>],['calendar','Calendar',<FiCalendar size={12}/>]].map(([v,tip,ico])=>(
              <button key={v} className={`tk-vsw${s.view===v?' active':''}`}
                onClick={()=>d({type:'SET_VIEW',v})} title={tip}>{ico}</button>
            ))}
          </div>
          <button className="tk-new-btn" onClick={()=>d({type:'OPEN_MODAL'})}><FiPlus size={13}/> New Task <span className="tk-kb-hint">N</span></button>
        </div>
      </div>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <div className="tk-stats-bar">
        {[
          { label:'Total',       val:s.tasks.length, color:'var(--text-secondary)', action:null },
          { label:'To Do',       val:stats.todo||0,    color:'#8e8a82', action:()=>d({type:'SET_FILTER',k:'status',v:'todo'}) },
          { label:'In Progress', val:stats.inProgress||0, color:'#4a90d9', action:()=>d({type:'SET_FILTER',k:'status',v:'in-progress'}) },
          { label:'Review',      val:stats.review||0,  color:'#9b72e8', action:()=>d({type:'SET_FILTER',k:'status',v:'review'}) },
          { label:'Done',        val:stats.done||0,    color:'#4caf82', action:()=>d({type:'SET_FILTER',k:'status',v:'done'}) },
          { label:'Overdue',     val:stats.overdue||0, color:'#e05c5c', action:()=>d({type:'SET_QUICK',id:'overdue',overrides:{overdue:true}}) },
          { label:'Hours Logged',val:s.stats?.time?.totalHours||'0', color:'var(--gold)', action:null, suffix:'h' },
        ].map((st,i)=>(
          <div key={i} className="tk-stat" onClick={st.action} style={{cursor:st.action?'pointer':'default'}}>
            <span className="tk-stat-val" style={{color:st.color}}>{st.val}{st.suffix||''}</span>
            <span className="tk-stat-lbl">{st.label}</span>
          </div>
        ))}
        {/* Mini burndown */}
        {s.stats?.velocity && (
          <div className="tk-burndown-mini">
            {s.stats.velocity.slice(-7).map((v,i) => (
              <div key={i} className="tk-bd-col">
                <div className="tk-bd-bar done"  style={{height:`${Math.min((v.done||0)*8,40)}px`}}/>
                <div className="tk-bd-bar created" style={{height:`${Math.min((v.created||0)*4,20)}px`}}/>
              </div>
            ))}
            <div className="tk-bd-label">7d velocity</div>
          </div>
        )}
      </div>

      {/* ── QUICK FILTERS ───────────────────────────────────── */}
      <div className="tk-quick-filters">
        {QUICK_FILTERS.map(qf => (
          <button key={qf.id}
            className={`tk-qf-btn${s.filters.quick===qf.id?' active':''}`}
            onClick={() => applyQuickFilter(qf)}>
            {qf.label}
          </button>
        ))}
        {allSprints.length>0 && allSprints.map(sp => (
          <button key={sp}
            className={`tk-qf-btn sprint${s.filters.sprint===sp?' active':''}`}
            onClick={() => d({type:'SET_FILTER',k:'sprint',v:s.filters.sprint===sp?'':sp})}>
            <FiRepeat size={9}/> {sp}
          </button>
        ))}
        <span className="tk-kb-row">
          <span className="tk-kb-hint">N</span> new
          <span className="tk-kb-hint">/</span> search
          <span className="tk-kb-hint">ESC</span> close
        </span>
      </div>

      {/* ── FILTER BAR ──────────────────────────────────────── */}
      {s.filtersOpen && (
        <div className="tk-filters-bar">
          {[
            ['status',  'Status',   STATUSES.map(x=>({v:x.id,l:x.label}))],
            ['priority','Priority', PRIORITIES.map(x=>({v:x.id,l:x.label}))],
            ['category','Category', CATEGORIES.map(c=>({v:c,l:c}))],
            ...(allSprints.length?[['sprint','Sprint', allSprints.map(s=>({v:s,l:s}))]]: []),
            ...(allTags.length?[['tag','Tag', allTags.map(t=>({v:t,l:t}))]]: []),
          ].map(([k,lbl,opts]) => (
            <div key={k} className="tk-fg">
              <label>{lbl}</label>
              <select value={s.filters[k]||''} onChange={e=>d({type:'SET_FILTER',k,v:e.target.value})}>
                <option value="">All</option>
                {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div className="tk-fg">
            <label>Sort By</label>
            <select value={s.sort.by} onChange={e=>d({type:'SET_SORT',by:e.target.value,dir:s.sort.dir})}>
              <option value="deadline">Deadline</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="createdAt">Created</option>
              <option value="title">Title</option>
            </select>
          </div>
          <div className="tk-fg">
            <label>Group By</label>
            <select value={s.group} onChange={e=>d({type:'SET_GROUP',g:e.target.value})}>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="category">Category</option>
              <option value="sprint">Sprint</option>
              <option value="none">None</option>
            </select>
          </div>
          <label className="tk-fcheck">
            <input type="checkbox" checked={s.filters.overdue} onChange={e=>d({type:'SET_FILTER',k:'overdue',v:e.target.checked})}/>
            Overdue only
          </label>
          <label className="tk-fcheck">
            <input type="checkbox" checked={s.filters.noDeadline} onChange={e=>d({type:'SET_FILTER',k:'noDeadline',v:e.target.checked})}/>
            No deadline
          </label>
          <button className="tk-f-clear" onClick={()=>d({type:'CLR_FILTERS'})}><FiX size={11}/> Clear all</button>
        </div>
      )}

      {/* ── BULK BAR ────────────────────────────────────────── */}
      {s.selected.size>0 && (
        <div className="tk-bulk-bar">
          <span><FiCheckCircle size={12}/> {s.selected.size} selected</span>
          <div className="tk-bulk-acts">
            {STATUSES.map(st=>(
              <button key={st.id} className="tk-bulk-btn"
                style={{color:st.color,borderColor:st.color+'40',background:st.color+'10'}}
                onClick={()=>bulkStatus(st.id)}>→ {st.label}</button>
            ))}
            <button className="tk-bulk-btn red" onClick={bulkDelete}><FiTrash2 size={11}/> Delete</button>
            <button className="tk-bulk-btn ghost" onClick={()=>d({type:'SEL_CLR'})}><FiX size={11}/></button>
          </div>
        </div>
      )}

      {/* ── BODY ────────────────────────────────────────────── */}
      <div className="tk-body">
        {s.loading ? (
          <div className="tk-loading"><div className="tk-spinner"/><span>Loading workspace…</span></div>
        ) : s.view==='kanban' ? (
          <KanbanView tasks={filtered} selected={s.selected} dispatch={d}
            collapsed={s.collapsed}
            onUpdate={updateTask} onDelete={deleteTask}
            onDuplicate={duplicateTask}
            onDrop={handleDrop}
            onOpen={t=>d({type:'OPEN_DRAWER',task:t})}
            onTimer={startTimer} activeTimer={s.timer.taskId}
            onNew={status=>d({type:'OPEN_MODAL',form:blankTask({status})})}
            onTimeLog={t=>d({type:'OPEN_TIME_LOG',task:t})}/>
        ) : s.view==='list' ? (
          <ListView tasks={filtered} selected={s.selected} dispatch={d}
            onUpdate={updateTask} onDelete={deleteTask}
            onDuplicate={duplicateTask}
            onOpen={t=>d({type:'OPEN_DRAWER',task:t})}
            onTimer={startTimer} activeTimer={s.timer.taskId}
            sort={s.sort} group={s.group}
            onSort={by=>d({type:'SET_SORT',by,dir:s.sort.by===by&&s.sort.dir==='asc'?'desc':'asc'})}
            onNew={()=>d({type:'OPEN_MODAL'})}
            onTimeLog={t=>d({type:'OPEN_TIME_LOG',task:t})}/>
        ) : s.view==='timeline' ? (
          <TimelineView tasks={filtered}
            onOpen={t=>d({type:'OPEN_DRAWER',task:t})}
            onUpdate={updateTask}/>
        ) : (
          <CalendarView tasks={filtered}
            onOpen={t=>d({type:'OPEN_DRAWER',task:t})}
            onNew={date=>d({type:'OPEN_MODAL',form:blankTask({deadline:date})})}/>
        )}
      </div>

      {/* ── DRAWER ──────────────────────────────────────────── */}
      {s.drawerTask && (
        <TaskDrawer task={s.drawerTask}
          onClose={()=>d({type:'CLOSE_DRAWER'})}
          onUpdate={updateTask} onDelete={deleteTask}
          onDuplicate={duplicateTask}
          onTimer={startTimer} stopTimer={stopTimer}
          activeTimer={s.timer.taskId} timerStr={timerStr()}
          onTimeLog={t=>d({type:'OPEN_TIME_LOG',task:t})}
          clients={s.clients}
          navigate={navigate}/>
      )}

      {/* ── CREATE/EDIT MODAL ───────────────────────────────── */}
      {s.modalOpen && s.modalForm && (
        <TaskModal form={s.modalForm} editingId={s.editingId}
          dispatch={d} onCreate={createTask} onUpdate={updateTask}
          clients={s.clients} allSprints={allSprints}/>
      )}

      {/* ── TIME LOG MODAL ──────────────────────────────────── */}
      {s.timeLogModal && (
        <TimeLogModal task={s.timeLogModal}
          onClose={()=>d({type:'CLOSE_TIME_LOG'})}
          onSave={async (mins,note) => {
            try {
              const r = await api.post(`/tasks/${s.timeLogModal._id}/time`,{minutes:mins,note});
              d({ type:'UPD_TASK', task:r.task });
              toast(`+${fmtMins(mins)} logged`);
              api.get('/tasks/stats').then(sr=>d({type:'LOAD_STATS',stats:sr})).catch(()=>{});
            } catch { toast('Failed.','error'); }
            d({ type:'CLOSE_TIME_LOG' });
          }}/>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KANBAN VIEW
══════════════════════════════════════════════════════════════ */
function KanbanView({ tasks, selected, dispatch, collapsed, onUpdate, onDelete, onDuplicate, onDrop, onOpen, onTimer, activeTimer, onNew, onTimeLog }) {
  const dragId = useRef(null);
  const [over, setOver] = useState({ col:null, tid:null });

  return (
    <div className="tk-kanban">
      {STATUSES.map(col => {
        const colTasks   = tasks.filter(t => t.status===col.id);
        const isCollapsed= collapsed.has(col.id);
        const totalMins  = colTasks.reduce((s,t) => s+(t.trackedMinutes||0), 0);
        const totalEst   = colTasks.reduce((s,t) => s+(t.estimatedHours||0)*60, 0);
        const doneSubs   = colTasks.reduce((s,t) => s+arr(t.subtasks).filter(st=>st.done).length, 0);
        const totalSubs  = colTasks.reduce((s,t) => s+arr(t.subtasks).length, 0);
        const wipExceeded= col.wip>0 && colTasks.length>col.wip;

        return (
          <div key={col.id}
            className={`tk-col${over.col===col.id?' tk-col-over':''}${isCollapsed?' collapsed':''}${wipExceeded?' wip-exceeded':''}`}
            onDragOver={e=>{e.preventDefault();if(!isCollapsed)setOver({col:col.id,tid:null});}}
            onDrop={e=>{e.preventDefault();if(dragId.current&&!isCollapsed){onDrop(col.id,dragId.current,null);dragId.current=null;}setOver({col:null,tid:null});}}>

            {/* Column header */}
            <div className="tk-col-hdr" style={{borderTopColor:col.color}}>
              <div className="tk-col-hdr-left">
                <span className="tk-col-dot" style={{background:col.color}}/>
                <span className="tk-col-name" style={{color:col.color}}>{col.label}</span>
                <span className={`tk-col-cnt${wipExceeded?' wip-warn':''}`} title={wipExceeded?`WIP limit: ${col.wip}`:''}>
                  {colTasks.length}{col.wip>0?`/${col.wip}`:''}
                </span>
              </div>
              <div className="tk-col-hdr-right">
                {!isCollapsed && <button className="tk-col-add" onClick={()=>onNew(col.id)} title="Add task"><FiPlus size={12}/></button>}
                <button className="tk-col-collapse" onClick={()=>dispatch({type:'COL_TOGGLE',id:col.id})} title={isCollapsed?'Expand':'Collapse'}>
                  {isCollapsed?<FiChevronDown size={12}/>:<FiChevronUp size={12}/>}
                </button>
              </div>
            </div>

            {/* Column metrics */}
            {!isCollapsed && (totalMins>0||totalEst>0||totalSubs>0) && (
              <div className="tk-col-metrics">
                {totalMins>0 && <span><FiClock size={9}/> {fmtMins(totalMins)}</span>}
                {totalEst>0  && <span title="Estimated">~{(totalEst/60).toFixed(1)}h est</span>}
                {totalSubs>0 && <span><FiCheckCircle size={9}/> {doneSubs}/{totalSubs}</span>}
              </div>
            )}

            {/* Cards */}
            {!isCollapsed && (
              <div className="tk-col-body">
                {colTasks.length===0 ? (
                  <div className="tk-col-empty"
                    onDragOver={e=>{e.preventDefault();setOver({col:col.id,tid:null});}}
                    onDrop={e=>{e.preventDefault();if(dragId.current){onDrop(col.id,dragId.current,null);dragId.current=null;}setOver({col:null,tid:null});}}>
                    Drop tasks here
                  </div>
                ) : colTasks.map(task => (
                  <KanbanCard key={task._id} task={task}
                    isSel={selected.has(task._id)}
                    isDragTarget={over.tid===task._id}
                    isTimerOn={activeTimer===task._id}
                    onDragStart={e=>{dragId.current=task._id;e.dataTransfer.effectAllowed='move';}}
                    onDragOver={e=>{e.preventDefault();setOver({col:col.id,tid:task._id});}}
                    onDrop={e=>{e.preventDefault();if(dragId.current){onDrop(col.id,dragId.current,task._id);dragId.current=null;}setOver({col:null,tid:null});}}
                    onClick={()=>onOpen(task)}
                    onToggleSel={()=>dispatch({type:'SEL_TOGGLE',id:task._id})}
                    onUpdate={onUpdate} onDelete={onDelete} onDuplicate={onDuplicate}
                    onTimer={()=>onTimer(task._id)} onTimeLog={()=>onTimeLog(task)}/>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task, isSel, isDragTarget, isTimerOn, onDragStart, onDragOver, onDrop, onClick, onToggleSel, onUpdate, onDelete, onDuplicate, onTimer, onTimeLog }) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  const dl      = dLeft(task.deadline||task.dueDate);
  const pri     = priCfg(task.priority);
  const st      = stCfg(task.status);
  const isOver  = dl!==null && dl<0 && task.status!=='done';
  const age     = task.stateChangedAt ? daysAgo(task.stateChangedAt) : null;
  const doneST  = arr(task.subtasks).filter(s=>s.done).length;
  const totalST = arr(task.subtasks).length;
  const stPct   = totalST>0 ? Math.round(doneST/totalST*100) : null;

  useEffect(()=>{
    const h=e=>{if(menuRef.current&&!menuRef.current.contains(e.target))setMenu(false);};
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);

  return (
    <div className={`tk-card${isSel?' sel':''}${isDragTarget?' drag-over':''}${isOver?' overdue':''}${task.priority==='Urgent'?' urgent':''}`}
      draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      onClick={onClick}>

      {/* Drag handle + select */}
      <div className="tk-card-top">
        <span className="tk-drag-handle"><Drag/></span>
        <button className="tk-card-cb" onClick={e=>{e.stopPropagation();onToggleSel();}}
          style={{color:isSel?'var(--gold)':'var(--border)'}}>
          {isSel?<FiCheckCircle size={13}/>:<Sq size={13}/>}
        </button>
        <span className="tk-card-num">{task.taskNumber||''}</span>
        {task.recurring && <FiRepeat size={9} style={{color:'var(--gold)',marginLeft:'auto'}} title="Recurring"/>}
        <div className="tk-card-menu-wrap" ref={menuRef} onClick={e=>e.stopPropagation()}>
          <button className="tk-card-menu-btn" onClick={()=>setMenu(o=>!o)}><FiMoreVertical size={12}/></button>
          {menu && (
            <div className="tk-card-menu">
              <div className="tk-menu-section">Move to</div>
              {STATUSES.map(s=>(
                <button key={s.id} onClick={()=>{onUpdate(task._id,{status:s.id});setMenu(false);}}
                  style={{color:s.color}} className={task.status===s.id?'active':''}>
                  <span className="tk-dd-dot" style={{background:s.color}}/> {s.label}
                </button>
              ))}
              <div className="tk-menu-sep"/>
              <button onClick={()=>{onDuplicate(task);setMenu(false);}} style={{color:'var(--blue)'}}>
                <FiCopy size={10}/> Duplicate
              </button>
              <button onClick={()=>{onTimer();setMenu(false);}} style={{color:isTimerOn?'var(--red)':'var(--gold)'}}>
                {isTimerOn?<><FiPause size={10}/> Stop Timer</>:<><FiPlay size={10}/> Start Timer</>}
              </button>
              <button onClick={()=>{onTimeLog();setMenu(false);}}>
                <FiClock size={10}/> Log Time
              </button>
              <div className="tk-menu-sep"/>
              <button onClick={()=>{onDelete(task._id);setMenu(false);}} style={{color:'var(--red)'}}><FiTrash2 size={10}/> Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className={`tk-card-title${task.status==='done'?' done':''}`}>{task.title}</p>

      {/* Tags */}
      {arr(task.tags).length>0 && (
        <div className="tk-card-tags">{arr(task.tags).slice(0,3).map(t=><span key={t} className="tk-tag">{t}</span>)}</div>
      )}

      {/* Subtask progress bar */}
      {stPct!==null && (
        <div className="tk-card-sub-prog">
          <div className="tk-csp-bar"><div className="tk-csp-fill" style={{width:`${stPct}%`}}/></div>
          <span>{doneST}/{totalST}</span>
        </div>
      )}

      {/* Footer */}
      <div className="tk-card-foot">
        <span className="tk-card-pri" style={{color:pri.color,background:pri.color+'14'}}>{pri.icon} {pri.label}</span>
        <span className="tk-card-cat-chip">{task.category||'General'}</span>
        {(task.deadline||task.dueDate) && (
          <span className="tk-card-dl" style={{color:isOver?'var(--red)':dl===0?'#e8a030':'var(--text-muted)'}}>
            <FiCalendar size={8}/>
            {isOver?`${Math.abs(dl)}d late`:dl===0?'Today':`${dl}d`}
          </span>
        )}
        {(task.trackedMinutes>0||isTimerOn) && (
          <span className="tk-card-time" style={{color:isTimerOn?'#4caf82':'var(--text-muted)'}}>
            <FiClock size={8}/>{fmtMins(task.trackedMinutes||0)}
          </span>
        )}
        {age!==null && age>2 && task.status!=='done' && (
          <span className="tk-card-age" title={`${age}d in ${st.label}`}>{age}d</span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   LIST VIEW
══════════════════════════════════════════════════════════════ */
function ListView({ tasks, selected, dispatch, onUpdate, onDelete, onDuplicate, onOpen, onTimer, activeTimer, sort, group, onSort, onNew, onTimeLog }) {
  const [editId, setEditId] = useState(null);
  const [editVal,setEditVal]= useState('');
  const editRef             = useRef(null);
  useEffect(()=>{ if(editId&&editRef.current) editRef.current.focus(); },[editId]);

  const commitEdit = async id => {
    if (editVal.trim()) await onUpdate(id,{title:editVal.trim()});
    setEditId(null);
  };

  const grouped = useMemo(()=>{
    if (group==='none')     return [{key:'',label:'All Tasks',color:'',tasks}];
    if (group==='status')   return STATUSES.map(s=>({key:s.id,label:s.label,color:s.color,tasks:tasks.filter(t=>t.status===s.id)}));
    if (group==='priority') return PRIORITIES.sort((a,b)=>b.order-a.order).map(p=>({key:p.id,label:p.label,color:p.color,tasks:tasks.filter(t=>t.priority===p.id)}));
    if (group==='category') {
      const cats=[...new Set(tasks.map(t=>t.category||'General'))];
      return cats.map(c=>({key:c,label:c,color:'',tasks:tasks.filter(t=>(t.category||'General')===c)}));
    }
    if (group==='sprint') {
      const sprints=[...new Set(tasks.map(t=>t.sprint||'').filter(Boolean))];
      const res = sprints.map(sp=>({key:sp,label:`Sprint: ${sp}`,color:'var(--gold)',tasks:tasks.filter(t=>t.sprint===sp)}));
      const noSprint=tasks.filter(t=>!t.sprint);
      if (noSprint.length) res.push({key:'no-sprint',label:'No Sprint',color:'var(--text-muted)',tasks:noSprint});
      return res;
    }
    return [{key:'',label:'All Tasks',color:'',tasks}];
  },[tasks,group]);

  const allIds = tasks.map(t=>t._id);
  const allSel = allIds.length>0 && allIds.every(id=>selected.has(id));

  const SortBtn = ({by,label}) => (
    <button className="tk-th-sort" onClick={()=>onSort(by)}>
      {label}
      {sort.by===by ? sort.dir==='asc'?<FiChevronUp size={9}/>:<FiChevronDown size={9}/> : <FiChevronDown size={9} style={{opacity:.2}}/>}
    </button>
  );

  if (!tasks.length) return (
    <div className="tk-empty">
      <FiLayers size={36}/><strong>No tasks found</strong>
      <p>Adjust filters or create a new task.</p>
      <button className="tk-new-btn" onClick={onNew}><FiPlus size={13}/> New Task</button>
    </div>
  );

  return (
    <div className="tk-list-wrap">
      <table className="tk-table">
        <thead>
          <tr>
            <th className="tk-th-check">
              <button className="tk-cb" onClick={()=>allSel?dispatch({type:'SEL_CLR'}):dispatch({type:'SEL_ALL',ids:allIds})}>
                {allSel?<FiCheckCircle size={13} style={{color:'var(--gold)'}}/>:<Sq size={13}/>}
              </button>
            </th>
            <th className="tk-th-num">#</th>
            <th><SortBtn by="title" label="Task"/></th>
            <th><SortBtn by="status" label="Status"/></th>
            <th><SortBtn by="priority" label="Priority"/></th>
            <th>Category</th>
            <th>Sprint</th>
            <th><SortBtn by="deadline" label="Deadline"/></th>
            <th>Time</th>
            <th className="tk-th-r">Actions</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map(grp=>(
            <React.Fragment key={grp.key}>
              {group!=='none' && grp.tasks.length>0 && (
                <tr className="tk-grp-row">
                  <td colSpan={10}>
                    <div className="tk-grp-inner">
                      <span className="tk-grp-dot" style={{background:grp.color||'var(--border)'}}/>
                      <span className="tk-grp-lbl" style={{color:grp.color||'var(--text-muted)'}}>{grp.label}</span>
                      <span className="tk-grp-cnt">{grp.tasks.length}</span>
                      <span className="tk-grp-hours">{fmtMins(grp.tasks.reduce((s,t)=>s+(t.trackedMinutes||0),0))}</span>
                    </div>
                  </td>
                </tr>
              )}
              {grp.tasks.map(task=>{
                const dl      = dLeft(task.deadline||task.dueDate);
                const st      = stCfg(task.status);
                const pr      = priCfg(task.priority);
                const isOv    = dl!==null&&dl<0&&task.status!=='done';
                const isSel   = selected.has(task._id);
                const age     = task.stateChangedAt ? daysAgo(task.stateChangedAt) : null;
                const doneST  = arr(task.subtasks).filter(s=>s.done).length;
                const totalST = arr(task.subtasks).length;

                return (
                  <tr key={task._id} className={`tk-row${isSel?' sel':''}${isOv?' overdue':''}`}
                    onClick={()=>onOpen(task)}>
                    <td className="tk-td-check" onClick={e=>{e.stopPropagation();dispatch({type:'SEL_TOGGLE',id:task._id});}}>
                      <button className="tk-cb" style={{color:isSel?'var(--gold)':'var(--text-muted)'}}>
                        {isSel?<FiCheckCircle size={13}/>:<Sq size={13}/>}
                      </button>
                    </td>
                    <td className="tk-td-num">
                      <span className="tk-task-num">{task.taskNumber}</span>
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div className="tk-title-cell">
                        {editId===task._id ? (
                          <input ref={editRef} className="tk-inline-edit" value={editVal}
                            onChange={e=>setEditVal(e.target.value)}
                            onBlur={()=>commitEdit(task._id)}
                            onKeyDown={e=>{if(e.key==='Enter')commitEdit(task._id);if(e.key==='Escape')setEditId(null);}}/>
                        ) : (
                          <span className={`tk-ttitle${task.status==='done'?' done':''}`} onClick={()=>onOpen(task)}>
                            {task.title}
                            {task.recurring && <FiRepeat size={9} style={{marginLeft:5,color:'var(--gold)'}}/>}
                          </span>
                        )}
                        {totalST>0 && <span className="tk-st-mini">{doneST}/{totalST}</span>}
                        {arr(task.tags).length>0 && (
                          <div className="tk-row-tags">{arr(task.tags).slice(0,2).map(t=><span key={t} className="tk-tag sm">{t}</span>)}</div>
                        )}
                      </div>
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <select className="tk-status-sel" value={task.status}
                        style={{color:st.color,background:st.bg,borderColor:st.color+'44'}}
                        onChange={e=>onUpdate(task._id,{status:e.target.value})}>
                        {STATUSES.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className="tk-pri-chip" style={{color:pr.color,background:pr.color+'14'}}>{pr.icon} {pr.label}</span>
                    </td>
                    <td><span className="tk-cat-chip">{task.category||'General'}</span></td>
                    <td>
                      {task.sprint
                        ? <span className="tk-sprint-chip"><FiRepeat size={9}/> {task.sprint}</span>
                        : <span style={{color:'var(--text-muted)',fontSize:11}}>—</span>}
                    </td>
                    <td>
                      {(task.deadline||task.dueDate) ? (
                        <div className="tk-dl-cell">
                          <span style={{fontSize:12,color:isOv?'var(--red)':dl===0?'#e8a030':'var(--text-muted)',fontWeight:600}}>
                            {fmtDate(task.deadline||task.dueDate)}
                          </span>
                          {isOv && <span className="tk-overdue-badge">{Math.abs(dl)}d late</span>}
                          {!isOv && dl!==null && dl<=3 && <span className="tk-due-soon">soon</span>}
                        </div>
                      ) : <span style={{color:'var(--text-muted)',fontSize:11}}>—</span>}
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div className="tk-time-info">
                        <span className={`tk-time-cell${activeTimer===task._id?' active':''}`}>
                          <FiClock size={9}/>{(task.trackedMinutes||0)>0?fmtMins(task.trackedMinutes||0):task.estimatedHours>0?`~${task.estimatedHours}h`:'—'}
                        </span>
                        {age!==null&&age>2&&task.status!=='done'&&<span className="tk-age-cell">{age}d</span>}
                      </div>
                    </td>
                    <td className="tk-td-r" onClick={e=>e.stopPropagation()}>
                      <div className="tk-row-acts">
                        <button className="tk-act" title="Edit title" onClick={()=>{setEditId(task._id);setEditVal(task.title);}}><FiEdit3 size={11}/></button>
                        <button className="tk-act" title="Duplicate"  onClick={()=>onDuplicate(task)}><FiCopy size={11}/></button>
                        <button className={`tk-act${activeTimer===task._id?' timer-on':''}`} title="Start timer" onClick={()=>onTimer(task._id)}><FiPlay size={11}/></button>
                        <button className="tk-act" title="Log time" onClick={()=>onTimeLog(task)}><FiClock size={11}/></button>
                        <button className="tk-act del" title="Delete" onClick={()=>onDelete(task._id)}><FiTrash2 size={11}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TIMELINE VIEW — Gantt-style
══════════════════════════════════════════════════════════════ */
function TimelineView({ tasks, onOpen, onUpdate }) {
  const [zoom, setZoom]   = useState('month');   // 'week' | 'month' | 'quarter'
  const [offset, setOff]  = useState(0);         // shift in days
  const today = new Date();

  const zoomDays = { week:14, month:45, quarter:90 };
  const days     = zoomDays[zoom] || 45;
  const start    = new Date(today); start.setDate(start.getDate() - Math.floor(days/4) + offset);
  const end      = new Date(start); end.setDate(start.getDate() + days);

  const startStr = start.toDateString();
  const endStr   = end.toDateString();

  const cols = useMemo(() => {
    const arr2 = [];
    const d    = new Date(start);
    while (d <= end) { arr2.push(new Date(d)); d.setDate(d.getDate()+1); }
    return arr2;
  }, [startStr, days]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only tasks with a deadline in view range
  const visibleTasks = useMemo(() =>
    tasks.filter(t => {
      if (!t.deadline && !t.dueDate) return false;
      const dl = new Date(t.deadline||t.dueDate);
      return dl >= start && dl <= end;
    }).sort((a,b) => new Date(a.deadline||a.dueDate) - new Date(b.deadline||b.dueDate)),
  [tasks, startStr, endStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const tasksWithoutDl = tasks.filter(t => !t.deadline && !t.dueDate && t.status!=='done');

  const datePos = d => {
    const diff = (new Date(d) - start) / 86400000;
    return (diff / cols.length) * 100;
  };
  const taskWidth = t => {
    const created = new Date(t.createdAt||t.deadline||t.dueDate);
    const dl      = new Date(t.deadline||t.dueDate);
    const spanDays= Math.max(1, (dl - created) / 86400000);
    return Math.max((spanDays / cols.length) * 100, 1.5);
  };
  const taskLeft = t => {
    const created = new Date(t.createdAt||t.deadline||t.dueDate);
    const effectiveStart = created < start ? start : created;
    return datePos(effectiveStart);
  };

  const todayPos = datePos(today);

  // Week markers
  const weekMarkers = cols.filter(d => d.getDay()===1);
  // Month markers
  const monthMarkers = cols.filter((d,i) => i===0 || d.getDate()===1);

  return (
    <div className="tk-timeline">
      {/* Controls */}
      <div className="tk-tl-controls">
        <div className="tk-tl-nav">
          <button onClick={()=>setOff(o=>o-Math.floor(days/2))}><ChevL/></button>
          <button className="tk-tl-today" onClick={()=>setOff(0)}>Today</button>
          <button onClick={()=>setOff(o=>o+Math.floor(days/2))}><ChevR/></button>
        </div>
        <span className="tk-tl-range">
          {start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} — {end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
        </span>
        <div className="tk-tl-zoom">
          {['week','month','quarter'].map(z=>(
            <button key={z} className={`tk-tl-zm${zoom===z?' active':''}`} onClick={()=>setZoom(z)}>
              {z.charAt(0).toUpperCase()+z.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="tk-tl-outer">
        {/* Task labels */}
        <div className="tk-tl-labels">
          <div className="tk-tl-label-hdr">Task</div>
          {visibleTasks.map(t => (
            <div key={t._id} className="tk-tl-label" onClick={()=>onOpen(t)}>
              <span className="tk-task-num-sm">{t.taskNumber}</span>
              <span className="tk-tl-label-title">{t.title}</span>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="tk-tl-chart" style={{position:'relative',overflow:'auto'}}>
          {/* Date header */}
          <div className="tk-tl-date-hdr" style={{position:'sticky',top:0,zIndex:10}}>
            {monthMarkers.map((d,i)=>(
              <div key={i} className="tk-tl-month-marker"
                style={{left:`${datePos(d)}%`}}>
                {d.toLocaleDateString('en-US',{month:'short'})}
              </div>
            ))}
            {weekMarkers.map((d,i)=>(
              <div key={i} className="tk-tl-week-marker"
                style={{left:`${datePos(d)}%`}}>
                {d.getDate()}
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="tk-tl-grid" style={{position:'relative',minHeight:`${Math.max(visibleTasks.length,3)*44+40}px`}}>
            {weekMarkers.map((d,i)=>(
              <div key={i} className="tk-tl-grid-line" style={{left:`${datePos(d)}%`}}/>
            ))}

            {/* Today line */}
            {todayPos>=0 && todayPos<=100 && (
              <div className="tk-tl-today-line" style={{left:`${todayPos}%`}}>
                <div className="tk-tl-today-label">Today</div>
              </div>
            )}

            {/* Task bars */}
            {visibleTasks.map((t,i) => {
              const p    = priCfg(t.priority);
              const sc   = stCfg(t.status);
              const left = taskLeft(t);
              const w    = Math.min(taskWidth(t), 100-left);
              const dl   = dLeft(t.deadline||t.dueDate);
              const over = dl!==null&&dl<0&&t.status!=='done';

              return (
                <div key={t._id} className={`tk-tl-bar${over?' overdue':''}`}
                  style={{
                    top:  `${44+i*44}px`,
                    left: `${Math.max(0,left)}%`,
                    width:`${Math.max(w,1.5)}%`,
                    background: over ? 'rgba(224,92,92,.25)' : sc.bg,
                    borderColor: over ? '#e05c5c' : sc.color,
                  }}
                  onClick={()=>onOpen(t)}
                  title={`${t.title} — Due ${fmtFull(t.deadline||t.dueDate)}`}>
                  <span className="tk-tl-bar-pri" style={{color:p.color}}>{p.icon}</span>
                  <span className="tk-tl-bar-label">{t.title}</span>
                  {(t.trackedMinutes||0)>0 && <span className="tk-tl-bar-time"><FiClock size={8}/>{fmtMins(t.trackedMinutes)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks without deadline */}
      {tasksWithoutDl.length>0 && (
        <div className="tk-tl-unscheduled">
          <div className="tk-tl-unsched-hdr">
            <FiAlertCircle size={12} style={{color:'var(--amber)'}}/> {tasksWithoutDl.length} task{tasksWithoutDl.length!==1?'s':''} with no deadline
          </div>
          <div className="tk-tl-unsched-list">
            {tasksWithoutDl.slice(0,6).map(t=>(
              <div key={t._id} className="tk-tl-unsched-task" onClick={()=>onOpen(t)}>
                <span className="tk-dd-dot" style={{background:priCfg(t.priority).color}}/>
                <span>{t.title}</span>
              </div>
            ))}
            {tasksWithoutDl.length>6 && <span style={{color:'var(--text-muted)',fontSize:12}}>+{tasksWithoutDl.length-6} more</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CALENDAR VIEW
══════════════════════════════════════════════════════════════ */
function CalendarView({ tasks, onOpen, onNew }) {
  const [cur, setCur] = useState(new Date());
  const year=cur.getFullYear(), month=cur.getMonth();
  const firstDay  = new Date(year,month,1).getDay();
  const daysInMo  = new Date(year,month+1,0).getDate();
  const cells     = [...Array(firstDay).fill(null), ...Array.from({length:daysInMo},(_,i)=>i+1)];
  const todayDate = new Date();
  const isToday2  = d => d&&todayDate.getFullYear()===year&&todayDate.getMonth()===month&&todayDate.getDate()===d;

  const byDay = useMemo(()=>{
    const m={};
    tasks.forEach(t=>{
      const dl=t.deadline||t.dueDate;
      if(!dl) return;
      const dd=new Date(dl);
      if(dd.getFullYear()===year&&dd.getMonth()===month){
        const k=dd.getDate(); if(!m[k]) m[k]=[]; m[k].push(t);
      }
    });
    return m;
  },[tasks,year,month]);

  return (
    <div className="tk-calendar">
      <div className="tk-cal-nav">
        <button onClick={()=>setCur(new Date(year,month-1,1))}><ChevL/></button>
        <span className="tk-cal-month">{cur.toLocaleString('default',{month:'long',year:'numeric'})}</span>
        <button onClick={()=>setCur(new Date(year,month+1,1))}><ChevR/></button>
        <button className="tk-cal-today-btn" onClick={()=>setCur(new Date())}>Today</button>
      </div>
      <div className="tk-cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
          <div key={d} className="tk-cal-dow">{d}</div>
        ))}
        {cells.map((d,i)=>{
          const dt=byDay[d]||[];
          const hasOverdue=dt.some(t=>{const l=dLeft(t.deadline||t.dueDate);return l!==null&&l<0&&t.status!=='done';});
          return (
            <div key={i} className={`tk-cal-cell${!d?' empty':''}${isToday2(d)?' today':''}${hasOverdue?' has-overdue':''}`}
              onClick={()=>d&&onNew(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)}>
              {d&&<span className="tk-cal-day">{d}</span>}
              {dt.slice(0,3).map(t=>(
                <div key={t._id} className="tk-cal-task"
                  style={{borderLeftColor:stCfg(t.status).color,background:t.status==='done'?'rgba(76,175,130,.07)':'rgba(255,255,255,.04)'}}
                  onClick={e=>{e.stopPropagation();onOpen(t);}}>
                  <span style={{color:priCfg(t.priority).color,fontSize:8,marginRight:2}}>{priCfg(t.priority).icon}</span>
                  {t.title}
                </div>
              ))}
              {dt.length>3&&<div className="tk-cal-more">+{dt.length-3}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TASK DRAWER — API-backed
══════════════════════════════════════════════════════════════ */
function TaskDrawer({ task, onClose, onUpdate, onDelete, onDuplicate, onTimer, stopTimer, activeTimer, timerStr, onTimeLog, clients, navigate }) {
  const [tab,    setTab]  = useState('details');
  const [editing,setEd]   = useState(false);
  const [eTitle, setET]   = useState(task.title);
  const [eDesc,  setED]   = useState(task.description||'');
  const [newST,  setNST]  = useState('');
  const [newCmt, setNC]   = useState('');
  const [newTag, setNT]   = useState('');
  const [saving, setSav]  = useState(false);
  const isActive= activeTimer===task._id;
  const dl      = dLeft(task.deadline||task.dueDate);
  const isOv    = dl!==null&&dl<0&&task.status!=='done';
  const doneST  = arr(task.subtasks).filter(s=>s.done).length;
  const totalST = arr(task.subtasks).length;
  const stPct   = totalST>0?Math.round(doneST/totalST*100):null;
  const age     = task.stateChangedAt ? daysAgo(task.stateChangedAt) : null;

  const upd = patch => onUpdate(task._id, patch);

  /* Subtasks — via API */
  const addST = async () => {
    if (!newST.trim()) return;
    setSav(true);
    try {
      const r = await api.post(`/tasks/${task._id}/subtasks`, { title:newST.trim() });
      onUpdate(task._id, r.task);
    } catch {}
    setNST(''); setSav(false);
  };
  const togST = async sid => {
    const sub = arr(task.subtasks).find(s => s._id===sid);
    if (!sub) return;
    try {
      const r = await api.patch(`/tasks/${task._id}/subtasks/${sid}`, { done:!sub.done });
      onUpdate(task._id, r.task);
    } catch {}
  };
  const delST = async sid => {
    try {
      const r = await api.delete(`/tasks/${task._id}/subtasks/${sid}`);
      onUpdate(task._id, r.task);
    } catch {}
  };

  /* Comments — via API */
  const addCmt = async () => {
    if (!newCmt.trim()) return;
    try {
      const r = await api.post(`/tasks/${task._id}/comments`, { text:newCmt.trim() });
      onUpdate(task._id, r.task);
    } catch {}
    setNC('');
  };
  const delCmt = async cid => {
    try {
      const r = await api.delete(`/tasks/${task._id}/comments/${cid}`);
      onUpdate(task._id, r.task);
    } catch {}
  };

  /* Tags */
  const addTag = () => {
    const tag=newTag.trim().toLowerCase(); if(!tag) return;
    upd({tags:[...new Set([...arr(task.tags),tag])]}); setNT('');
  };
  const remTag = tag => upd({tags:arr(task.tags).filter(t=>t!==tag)});

  /* Save title/desc edit */
  const saveEdit = () => {
    if (eTitle.trim()) upd({title:eTitle.trim(),description:eDesc});
    setEd(false);
  };

  const TABS = [
    ['details', 'Details'],
    ['subtasks', `Subtasks${totalST?` (${totalST})`:'`'}`],
    ['comments', `Comments${arr(task.comments).length?` (${arr(task.comments).length})`:'`'}`],
    ['time',     'Time Log'],
    ['activity', 'Activity'],
  ];

  return (
    <div className="tk-drawer-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="tk-drawer">

        {/* Header */}
        <div className="tk-dwr-hdr" style={{borderTopColor:stCfg(task.status).color}}>
          <div className="tk-dwr-row1">
            <span className="tk-dwr-num">{task.taskNumber}</span>
            <select className="tk-dwr-status" value={task.status}
              style={{color:stCfg(task.status).color,background:stCfg(task.status).bg}}
              onChange={e=>upd({status:e.target.value})}>
              {STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {task.sprint && <span className="tk-dwr-sprint"><FiRepeat size={9}/> {task.sprint}</span>}
            {age!==null&&age>1&&task.status!=='done'&&<span className="tk-dwr-age">{age}d in status</span>}
            <div className="tk-dwr-acts">
              {isActive ? (
                <button className="tk-dwr-act-timer" onClick={stopTimer}><FiPause size={11}/> {timerStr}</button>
              ) : (
                <button className="tk-dwr-act" onClick={()=>onTimer(task._id)} title="Start timer"><FiPlay size={11}/></button>
              )}
              <button className="tk-dwr-act" onClick={()=>onTimeLog(task)} title="Log time"><FiClock size={11}/></button>
              <button className="tk-dwr-act" onClick={()=>onDuplicate(task)} title="Duplicate"><FiCopy size={11}/></button>
              <button className="tk-dwr-act-del" onClick={()=>{onDelete(task._id);onClose();}}><FiTrash2 size={11}/></button>
              <button className="tk-dwr-close" onClick={onClose}><FiX size={15}/></button>
            </div>
          </div>

          {editing ? (
            <div className="tk-dwr-edit">
              <input className="tk-dwr-title-inp" value={eTitle} onChange={e=>setET(e.target.value)} autoFocus
                onKeyDown={e=>e.key==='Enter'&&saveEdit()}/>
              <textarea className="tk-dwr-desc-inp" value={eDesc} onChange={e=>setED(e.target.value)} rows={3} placeholder="Add description…"/>
              <div className="tk-dwr-edit-acts">
                <button className="tk-btn-save-sm" onClick={saveEdit}><FiCheck size={11}/> Save</button>
                <button className="tk-btn-cancel-sm" onClick={()=>setEd(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="tk-dwr-title-row" onClick={()=>setEd(true)}>
                <h2 className={`tk-dwr-title${task.status==='done'?' done':''}`}>{task.title}</h2>
                <FiEdit3 size={12} className="tk-dwr-title-ico"/>
              </div>
              {task.description && <p className="tk-dwr-desc" onClick={()=>setEd(true)}>{task.description}</p>}
            </>
          )}

          {/* Subtask progress */}
          {stPct!==null && (
            <div className="tk-dwr-prog">
              <div className="tk-dp-bar"><div className="tk-dp-fill" style={{width:`${stPct}%`}}/></div>
              <span>{doneST}/{totalST} subtasks · {stPct}%</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tk-dwr-tabs">
          {TABS.map(([t,l])=>(
            <button key={t} className={`tk-dwr-tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>
              {l.replace('`','')}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="tk-dwr-body">

          {/* ── DETAILS ── */}
          {tab==='details'&&(
            <div className="tk-dwr-details">
              <div className="tk-meta-grid">
                {[
                  ['Priority', <select className="tk-meta-sel" value={task.priority}
                    onChange={e=>upd({priority:e.target.value})}>
                    {PRIORITIES.map(p=><option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}</select>],
                  ['Deadline', <div className="tk-dl-wrap">
                    <input type="date" className="tk-meta-date"
                      value={(task.deadline||task.dueDate||'').split('T')[0]}
                      onChange={e=>upd({deadline:e.target.value})}/>
                    {isOv&&<span className="tk-overdue-badge">{Math.abs(dl)}d overdue</span>}
                  </div>],
                  ['Category', <select className="tk-meta-sel" value={task.category||'General'}
                    onChange={e=>upd({category:e.target.value})}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>],
                  ['Sprint',   <input className="tk-meta-text" placeholder="Sprint name…"
                    value={task.sprint||''} onChange={e=>upd({sprint:e.target.value})}/>],
                  ['Client',   clients.length>0 ? <select className="tk-meta-sel" value={task.clientId||task.client?._id||''}
                    onChange={e=>upd({clientId:e.target.value||null})}>
                    <option value="">— None —</option>
                    {clients.map(c=><option key={c._id} value={c._id}>{c.name||c.clientName}</option>)}
                  </select> : <span className="tk-meta-val" style={{color:'var(--text-muted)',fontSize:12}}>
                    <button style={{color:'var(--blue)',background:'none',border:'none',cursor:'pointer',fontSize:12}} onClick={()=>navigate('/clients')}>+ Add client first</button>
                  </span>],
                  ['Est. Hours', <input type="number" className="tk-meta-num" min="0" step="0.5"
                    value={task.estimatedHours||0} onChange={e=>upd({estimatedHours:+e.target.value})}/>],
                  ['Tracked',  <span className="tk-meta-val">{fmtMins(task.trackedMinutes||0)}{task.estimatedHours>0&&<span style={{color:'var(--text-muted)',fontSize:10,marginLeft:4}}>/ {task.estimatedHours}h est.</span>}</span>],
                  ['Recurring', <label style={{cursor:'pointer',display:'flex',alignItems:'center',gap:7}}>
                    <input type="checkbox" checked={task.recurring||false} onChange={e=>upd({recurring:e.target.checked})} style={{accentColor:'var(--gold)',width:13,height:13}}/>
                    <span style={{fontSize:12,color:'var(--text-secondary)'}}>Recurring task</span>
                  </label>],
                ].map(([l,v],i)=>(
                  <div key={i} className="tk-meta-row">
                    <span className="tk-meta-lbl">{l}</span>
                    <span className="tk-meta-v">{v}</span>
                  </div>
                ))}
              </div>

              <div className="tk-dwr-sec">
                <h4><FiTag size={11}/> Tags</h4>
                <div className="tk-tags-wrap">
                  {arr(task.tags).map(t=>(
                    <span key={t} className="tk-tag editable">{t}
                      <button onClick={()=>remTag(t)}><FiX size={9}/></button>
                    </span>
                  ))}
                  <input className="tk-tag-inp" placeholder="Add tag…" value={newTag}
                    onChange={e=>setNT(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()}/>
                  <button className="tk-tag-add-btn" onClick={addTag}><FiPlus size={11}/></button>
                </div>
              </div>

              {/* Time tracker widget */}
              <div className="tk-dwr-sec">
                <h4><FiClock size={11}/> Time Tracker</h4>
                <div className="tk-tracker">
                  {isActive ? (
                    <div className="tk-tracker-run">
                      <div className="tk-tracker-dot"/>
                      <span className="tk-tracker-time">{timerStr}</span>
                      <button className="tk-tracker-stop" onClick={stopTimer}><FiPause size={12}/> Stop & Save</button>
                    </div>
                  ) : (
                    <div style={{display:'flex',gap:8}}>
                      <button className="tk-tracker-start" onClick={()=>onTimer(task._id)}><FiPlay size={12}/> Start Timer</button>
                      <button className="tk-tracker-start" onClick={()=>onTimeLog(task)} style={{background:'rgba(74,144,217,.1)',borderColor:'rgba(74,144,217,.3)',color:'#4a90d9'}}><FiEdit3 size={12}/> Log Manually</button>
                    </div>
                  )}
                  {(task.trackedMinutes||0)>0&&(
                    <p className="tk-tracker-total">Total: <strong>{fmtMins(task.trackedMinutes)}</strong>
                      {task.estimatedHours>0&&<span style={{color:'var(--text-muted)',marginLeft:8,fontSize:11}}>
                        {Math.round((task.trackedMinutes/60/task.estimatedHours)*100)}% of estimate
                      </span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SUBTASKS ── */}
          {tab==='subtasks'&&(
            <div className="tk-dwr-subtasks">
              <div className="tk-st-add">
                <input className="tk-st-inp" placeholder="Add subtask… (Enter to save)"
                  value={newST} onChange={e=>setNST(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&addST()}/>
                <button className="tk-st-add-btn" onClick={addST} disabled={saving}><FiPlus size={13}/></button>
              </div>
              {arr(task.subtasks).length===0 ? (
                <div className="tk-dwr-empty">No subtasks yet. Break the task down into smaller steps.</div>
              ) : (
                <>
                  {stPct!==null&&<div style={{fontSize:11,color:'var(--text-muted)',marginBottom:10}}>{stPct}% complete · {doneST} of {totalST} done</div>}
                  <div className="tk-st-list">
                    {arr(task.subtasks).map(sub=>(
                      <div key={sub._id} className={`tk-st-row${sub.done?' done':''}`}>
                        <button className="tk-st-cb" onClick={()=>togST(sub._id)}>
                          {sub.done?<FiCheckCircle size={14} style={{color:'var(--green)'}}/>:<Sq size={14}/>}
                        </button>
                        <span>{sub.title}</span>
                        {sub.doneAt&&<span style={{fontSize:10,color:'var(--text-muted)',marginLeft:'auto'}}>{fmtDate(sub.doneAt)}</span>}
                        <button className="tk-st-del" onClick={()=>delST(sub._id)}><FiX size={11}/></button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── COMMENTS ── */}
          {tab==='comments'&&(
            <div className="tk-dwr-comments">
              <textarea className="tk-cmt-inp" placeholder="Write a comment…" rows={3}
                value={newCmt} onChange={e=>setNC(e.target.value)}/>
              <button className="tk-cmt-btn" onClick={addCmt} disabled={!newCmt.trim()}>
                <FiMessageSquare size={12}/> Add Comment
              </button>
              {arr(task.comments).length===0 ? (
                <div className="tk-dwr-empty">No comments yet.</div>
              ) : (
                <div className="tk-cmt-list">
                  {arr(task.comments).map(c=>(
                    <div key={c._id} className="tk-cmt">
                      <div className="tk-cmt-meta">
                        <span className="tk-cmt-who">You</span>
                        <span className="tk-cmt-when">{new Date(c.createdAt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                        <button className="tk-cmt-del" onClick={()=>delCmt(c._id)}><FiX size={10}/></button>
                      </div>
                      <p className="tk-cmt-txt">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TIME LOG ── */}
          {tab==='time'&&(
            <div className="tk-dwr-timelog">
              <div className="tk-timelog-summary">
                <div className="tk-tls-item">
                  <span className="tk-tls-val">{fmtMins(task.trackedMinutes||0)}</span>
                  <span className="tk-tls-lbl">Tracked</span>
                </div>
                <div className="tk-tls-item">
                  <span className="tk-tls-val">{task.estimatedHours||0}h</span>
                  <span className="tk-tls-lbl">Estimated</span>
                </div>
                <div className="tk-tls-item">
                  <span className="tk-tls-val" style={{color:task.trackedMinutes>(task.estimatedHours||0)*60?'var(--red)':'var(--green)'}}>
                    {task.estimatedHours>0?`${Math.round((task.trackedMinutes/60/task.estimatedHours)*100)}%`:'—'}
                  </span>
                  <span className="tk-tls-lbl">% of Est.</span>
                </div>
              </div>
              <button className="tk-tracker-start" style={{marginBottom:14}} onClick={()=>onTimeLog(task)}>
                <FiPlus size={12}/> Log Time Entry
              </button>
              {arr(task.timeEntries).length===0 ? (
                <div className="tk-dwr-empty">No time entries yet.</div>
              ) : (
                <div className="tk-te-list">
                  {arr(task.timeEntries).map(e=>(
                    <div key={e._id} className="tk-te-row">
                      <FiClock size={11} style={{color:'var(--gold)',flexShrink:0}}/>
                      <span className="tk-te-mins">{fmtMins(e.minutes)}</span>
                      {e.note&&<span className="tk-te-note">{e.note}</span>}
                      <span className="tk-te-date">{fmtDate(e.loggedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {tab==='activity'&&(
            <div className="tk-dwr-activity">
              {arr(task.activity).length===0 ? (
                <div className="tk-dwr-empty">No activity logged yet.</div>
              ) : (
                <div className="tk-act-list">
                  {arr(task.activity).map((a,i)=>(
                    <div key={a._id||i} className="tk-act-row">
                      <div className="tk-act-dot"/>
                      <div>
                        <span className="tk-act-txt">{a.text}</span>
                        <span className="tk-act-ts">{new Date(a.createdAt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TASK MODAL
══════════════════════════════════════════════════════════════ */
function TaskModal({ form, editingId, dispatch, onCreate, onUpdate, clients, allSprints }) {
  const [tagInput, setTI]  = useState('');
  const [template, setTpl] = useState('');
  const setF = (k,v) => dispatch({ type:'PATCH_FORM', p:{ [k]:v } });

  const applyTemplate = tid => {
    const tpl = TEMPLATES.find(t => t.id===tid);
    if (tpl) dispatch({ type:'PATCH_FORM', p:tpl.form });
    setTpl(tid);
  };

  const addTag = () => {
    const t=tagInput.trim().toLowerCase(); if(!t) return;
    setF('tags',[...new Set([...arr(form.tags),t])]); setTI('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editingId) onUpdate(editingId, form);
    else onCreate(form);
  };

  return (
    <div className="tk-modal-overlay" onClick={e=>e.target===e.currentTarget&&dispatch({type:'CLOSE_MODAL'})}>
      <div className="tk-modal">
        <div className="tk-modal-hdr">
          <h3>{editingId?'Edit Task':'New Task'}</h3>
          <button onClick={()=>dispatch({type:'CLOSE_MODAL'})}><FiX size={15}/></button>
        </div>

        {/* Templates */}
        {!editingId && (
          <div className="tk-modal-templates">
            <span className="tk-modal-tpl-label">Template:</span>
            {TEMPLATES.map(tpl=>(
              <button key={tpl.id}
                className={`tk-tpl-btn${template===tpl.id?' active':''}`}
                onClick={()=>applyTemplate(tpl.id)}>
                {tpl.label}
              </button>
            ))}
          </div>
        )}

        <form className="tk-modal-body" onSubmit={handleSubmit}>
          <div className="tk-mf full">
            <label>Title *</label>
            <input value={form.title} onChange={e=>setF('title',e.target.value)}
              placeholder="What needs to be done?" required autoFocus/>
          </div>
          <div className="tk-mf full">
            <label>Description</label>
            <textarea value={form.description} onChange={e=>setF('description',e.target.value)} placeholder="Add details, context, acceptance criteria…" rows={3}/>
          </div>
          <div className="tk-mf-row">
            <div className="tk-mf">
              <label>Status</label>
              <select value={form.status} onChange={e=>setF('status',e.target.value)}>
                {STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="tk-mf">
              <label>Priority</label>
              <select value={form.priority} onChange={e=>setF('priority',e.target.value)}>
                {PRIORITIES.map(p=><option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="tk-mf-row">
            <div className="tk-mf">
              <label>Category</label>
              <select value={form.category} onChange={e=>setF('category',e.target.value)}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="tk-mf">
              <label>Deadline</label>
              <input type="date" value={form.deadline||''} onChange={e=>setF('deadline',e.target.value)}/>
            </div>
          </div>
          <div className="tk-mf-row">
            <div className="tk-mf">
              <label>Sprint / Milestone</label>
              <input value={form.sprint||''} onChange={e=>setF('sprint',e.target.value)}
                placeholder="e.g. Sprint 1, v2.0" list="tk-sprints-list"/>
              <datalist id="tk-sprints-list">{allSprints.map(sp=><option key={sp} value={sp}/>)}</datalist>
            </div>
            <div className="tk-mf">
              <label>Est. Hours</label>
              <input type="number" min="0" step="0.5" value={form.estimatedHours||0} onChange={e=>setF('estimatedHours',+e.target.value)}/>
            </div>
          </div>
          {clients.length>0 && (
            <div className="tk-mf">
              <label>Linked Client</label>
              <select value={form.clientId||''} onChange={e=>setF('clientId',e.target.value||null)}>
                <option value="">— No client —</option>
                {clients.map(c=><option key={c._id} value={c._id}>{c.name||c.clientName}</option>)}
              </select>
            </div>
          )}
          <div className="tk-mf full">
            <label>Tags</label>
            <div className="tk-tag-editor">
              {arr(form.tags).map(t=>(
                <span key={t} className="tk-tag editable">{t}<button type="button" onClick={()=>setF('tags',arr(form.tags).filter(x=>x!==t))}><FiX size={9}/></button></span>
              ))}
              <input className="tk-tag-inline" value={tagInput} placeholder="tag + Enter"
                onChange={e=>setTI(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addTag();}}}/>
            </div>
          </div>
          <div className="tk-mf">
            <label style={{cursor:'pointer',display:'flex',alignItems:'center',gap:8,userSelect:'none'}}>
              <input type="checkbox" checked={form.recurring||false} onChange={e=>setF('recurring',e.target.checked)}
                style={{accentColor:'var(--gold)',width:13,height:13}}/>
              <FiRepeat size={12}/> Recurring task
            </label>
          </div>
          <div className="tk-modal-foot">
            <button type="button" className="tk-btn-cancel" onClick={()=>dispatch({type:'CLOSE_MODAL'})}>Cancel</button>
            <button type="submit" className="tk-btn-save">
              {editingId?<><FiCheck size={12}/> Save</>:<><FiPlus size={12}/> Create Task</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TIME LOG MODAL
══════════════════════════════════════════════════════════════ */
function TimeLogModal({ task, onClose, onSave }) {
  const [h,   setH]   = useState(0);
  const [m,   setM]   = useState(30);
  const [note,setNote]= useState('');
  const [busy,setBusy]= useState(false);

  const totalMins = (+h)*60 + (+m);

  const submit = async () => {
    if (totalMins<1) return;
    setBusy(true);
    await onSave(totalMins, note);
    setBusy(false);
  };

  return (
    <div className="tk-modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="tk-modal" style={{maxWidth:380}}>
        <div className="tk-modal-hdr">
          <h3>Log Time — {task.taskNumber}</h3>
          <button onClick={onClose}><FiX size={15}/></button>
        </div>
        <div className="tk-modal-body" style={{gap:14}}>
          <div style={{fontSize:13,color:'var(--text-muted)'}}>
            Task: <strong style={{color:'var(--text-primary)'}}>{task.title}</strong>
          </div>
          <div className="tk-mf-row">
            <div className="tk-mf">
              <label>Hours</label>
              <input type="number" min="0" max="24" value={h} onChange={e=>setH(e.target.value)}/>
            </div>
            <div className="tk-mf">
              <label>Minutes</label>
              <input type="number" min="0" max="59" step="5" value={m} onChange={e=>setM(e.target.value)}/>
            </div>
          </div>
          {/* Quick presets */}
          <div className="tk-time-presets">
            {[[15,'15m'],[30,'30m'],[60,'1h'],[90,'1.5h'],[120,'2h'],[240,'4h']].map(([mins,label])=>(
              <button key={mins} className={`tk-preset${totalMins===mins?' active':''}`}
                onClick={()=>{setH(Math.floor(mins/60));setM(mins%60);}}>
                {label}
              </button>
            ))}
          </div>
          <div className="tk-mf full">
            <label>Note (optional)</label>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Code review, client call…"/>
          </div>
          <div style={{fontSize:12,color:'var(--text-muted)'}}>
            Already tracked: <strong>{fmtMins(task.trackedMinutes||0)}</strong>
            {totalMins>0&&<span style={{color:'var(--gold)'}}> + {fmtMins(totalMins)} = {fmtMins((task.trackedMinutes||0)+totalMins)}</span>}
          </div>
        </div>
        <div className="tk-modal-foot">
          <button className="tk-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="tk-btn-save" disabled={totalMins<1||busy} onClick={submit}>
            {busy?'Saving…':<><FiCheck size={12}/> Log {totalMins>0?fmtMins(totalMins):''}</>}
          </button>
        </div>
      </div>
    </div>
  );
}