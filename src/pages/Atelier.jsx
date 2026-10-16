// src/pages/Atelier.jsx — PRODUCTION v2
// ─────────────────────────────────────────────────────────────
//  Freelance Power Studio — 11 tools, 3 views, tier system
//
//  FREE TOOLS:
//   Quick Notes      — pinnable notes, search, export
//   Rate Calculator  — with tax/buffer, save to profile
//   Time Tracker     — timer + session log + CSV export
//   Expense Tracker  — log/categorise/export expenses
//   Brand Kit        — colours, fonts, identity preview
//   Project Estimator— quote builder with breakdown
//
//  PREMIUM TOOLS:
//   Invoice Generator— create/manage/download invoices
//   Smart Contracts  — 3 templates, sign, download
//   Proposal Builder — structured multi-section proposals
//   Earnings Analytics— monthly chart, client breakdown
//   Tax Summary      — annual report with deductions
// ─────────────────────────────────────────────────────────────

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import {
  FiZap, FiLock, FiStar, FiCheckCircle, FiClock,
  FiFileText, FiDollarSign, FiBarChart2, FiShield,
  FiClipboard, FiList, FiPlus, FiTrash2, FiEdit3,
  FiDownload, FiSave, FiX, FiCheck, FiSearch,
  FiCopy, FiAlertCircle, FiPenTool,
  FiPaperclip, FiPackage, 
  FiSliders, FiChevronRight, FiExternalLink,
  FiSend, FiCpu, FiGrid, FiArrowRight, FiTarget,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import '../styles/Atelier.css';

import api, { errorMessage } from '../services/api';
import PremiumLock from '../components/PremiumLock';
import useCloudState from '../lib/useCloudState';
/* ── API ─────────────────────────────────────────────────── */


/* ── localStorage helpers ────────────────────────────────── */
const ls = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

/* ── Helpers ─────────────────────────────────────────────── */
const fmt$   = n  => "$" + Number(n||0).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });
const today  = ()  => new Date().toISOString().split("T")[0];
const arr    = v  => Array.isArray(v) ? v : [];
const canAccess = (tier, plan) => tier === "free" || plan === "premium";

/* ── Toast system ────────────────────────────────────────── */
function useToast() {
  const [toast, setToast] = useState({ show:false, msg:"", err:false });
  const show = useCallback((msg, err=false) => {
    setToast({ show:true, msg, err });
    setTimeout(() => setToast(t => ({...t, show:false})), 3000);
  }, []);
  return [toast, show];
}

function Toast({ toast }) {
  if (!toast.show) return null;
  return (
    <div className={`at-toast${toast.err ? " err":""}`}>
      {toast.err ? <FiAlertCircle size={13}/> : <FiCheck size={13}/>}
      {toast.msg}
    </div>
  );
}

/* ── Quick Notes ─────────────────────────────────────────── */
const QuickNote = () => {
  const [toast, notify] = useToast();
  const [notes,   setNotes]   = useState([]);
  const [input,   setInput]   = useState("");
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState("All");
  const [editing, setEditing] = useState(null);
  const [editTxt, setEditTxt] = useState("");

  const CATS = ["All","General","Client","Idea","Task","Finance"];

  // Notes live in your account (/api/notes). Older browser-only notes are uploaded once.
  const norm = n => ({ ...n, id: n._id || n.id, ts: n.ts || new Date(n.createdAt).toLocaleString() });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const legacy = ls.get("at_notes", []);
        if (legacy.length) {
          await Promise.all(legacy.slice(0, 100).map(n => api.post("/notes", { text: n.text, cat: n.cat, pinned: n.pinned }).catch(() => {})));
          localStorage.removeItem("at_notes");
        }
        const r = await api.get("/notes?limit=100");
        if (alive) setNotes(arr(r.notes).map(norm));
      } catch (e) { if (alive) notify(errorMessage(e, "Could not load notes."), true); }
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async () => {
    const t = input.trim(); if (!t) return;
    try {
      const r = await api.post("/notes", { text: t, cat: cat==="All"?"General":cat });
      setNotes(ns => [norm(r.note), ...ns]); setInput(""); notify("Note added.");
    } catch (e) { notify(errorMessage(e), true); }
  };

  const del = async id => {
    const prev = notes; setNotes(ns => ns.filter(n=>n.id!==id));
    try { await api.delete(`/notes/${id}`); notify("Note deleted."); } catch (e) { setNotes(prev); notify(errorMessage(e), true); }
  };
  const pin = async id => {
    const n = notes.find(x=>x.id===id); if (!n) return;
    setNotes(ns => ns.map(x=>x.id===id?{...x,pinned:!x.pinned}:x).sort((a,b)=>b.pinned-a.pinned));
    try { await api.patch(`/notes/${id}`, { pinned: !n.pinned }); } catch (e) { notify(errorMessage(e), true); }
  };
  const saveEdit = async id => {
    try {
      const r = await api.patch(`/notes/${id}`, { text: editTxt });
      setNotes(ns => ns.map(n=>n.id===id?norm(r.note):n)); setEditing(null); notify("Note saved.");
    } catch (e) { notify(errorMessage(e), true); }
  };

  const exportTxt = () => {
    const txt = notes.map(n=>`[${n.cat}] ${n.text}\n${n.ts}`).join("\n\n---\n\n");
    const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([txt],{type:"text/plain"})),download:"notes.txt"});
    a.click(); notify("Notes exported.");
  };

  const filtered = notes.filter(n => {
    if (cat!=="All" && n.cat!==cat) return false;
    if (search && !n.text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div className="at-tool-top">
        <div className="at-search-mini">
          <FiSearch size={12} className="at-search-ico"/>
          <input className="at-search-input" placeholder="Search notes…" value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<button className="at-x-btn" onClick={()=>setSearch("")}><FiX size={10}/></button>}
        </div>
        <div className="at-cat-pills">
          {CATS.map(c=><button key={c} className={`at-cat-pill${cat===c?" on":""}`} onClick={()=>setCat(c)}>{c}</button>)}
        </div>
      </div>
      <div className="at-note-compose">
        <textarea className="at-input at-ta" placeholder="Write a note… (Enter to save, Shift+Enter for new line)"
          value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();add();}}} rows={3}/>
        <div className="at-compose-row">
          <span className="at-hint">{notes.length}/100 notes</span>
          <div style={{display:"flex",gap:7}}>
            <button className="at-btn ghost sm" onClick={exportTxt}><FiDownload size={11}/> Export</button>
            <button className="at-btn gold sm" onClick={add}><FiPlus size={11}/> Add Note</button>
          </div>
        </div>
      </div>
      {filtered.length===0 && <p className="at-empty">No notes found. Start typing above.</p>}
      <ul className="at-note-list">
        {filtered.map(n=>(
          <li key={n.id} className={`at-note-item${n.pinned?" pinned":""}`}>
            {editing===n.id ? (
              <div className="at-note-edit">
                <textarea className="at-input at-ta-sm" value={editTxt} onChange={e=>setEditTxt(e.target.value)} rows={2} autoFocus/>
                <div className="at-note-edit-btns">
                  <button className="at-btn gold sm" onClick={()=>saveEdit(n.id)}><FiCheck size={11}/></button>
                  <button className="at-btn ghost sm" onClick={()=>setEditing(null)}><FiX size={11}/></button>
                </div>
              </div>
            ) : (
              <>
                <div className="at-note-body">
                  <span className="at-note-cat-badge">{n.cat}</span>
                  <p className="at-note-text">{n.text}</p>
                  <span className="at-note-ts">{n.ts}</span>
                </div>
                <div className="at-note-acts">
                  <button className={`at-icon-btn${n.pinned?" gold":""}`} onClick={()=>pin(n.id)} title={n.pinned?"Unpin":"Pin"}><FiStar size={11}/></button>
                  <button className="at-icon-btn" onClick={()=>{setEditing(n.id);setEditTxt(n.text);}} title="Edit"><FiEdit3 size={11}/></button>
                  <button className="at-icon-btn" onClick={()=>{navigator.clipboard?.writeText(n.text);notify("Copied!");}} title="Copy"><FiCopy size={11}/></button>
                  <button className="at-icon-btn red" onClick={()=>del(n.id)} title="Delete"><FiTrash2 size={11}/></button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ── Rate Calculator ─────────────────────────────────────── */
const RateCalc = () => {
  const { user } = useAuth();
  const [toast, notify] = useToast();
  const [f, setF] = useState({ income:"60000", hours:"40", weeks:"48", expenses:"5000", tax:"25", buffer:"20" });
  const [result, setResult] = useState(null);

  const s = (k,v) => setF(p=>({...p,[k]:v}));

  const calc = () => {
    const inc = parseFloat(f.income)||0, hrs = parseFloat(f.hours)||1, wks = parseFloat(f.weeks)||48;
    const exp = parseFloat(f.expenses)||0, tax = parseFloat(f.tax)/100||0, buf = parseFloat(f.buffer)/100||0;
    const base = (inc+exp)/(hrs*wks);
    const withTax = base/(1-tax);
    const final = withTax/(1-buf);
    const daily = final*8;
    const monthly = inc/12;
    setResult({ base:base.toFixed(2), withTax:withTax.toFixed(2), final:final.toFixed(2), daily:daily.toFixed(2), monthly:monthly.toFixed(2), annual:inc.toLocaleString() });
  };

  const saveRate = async () => {
    if (!result) return;
    try {
      await api.patch("/auth/me", { hourlyRate: parseFloat(result.final) });
      notify("Rate saved to profile!");
    } catch { notify("Could not save rate.", true); }
  };

  const FIELDS = [
    ["income",  "Target Annual Income ($)",    "60000"],
    ["hours",   "Billable Hours / Week",        "40"],
    ["weeks",   "Working Weeks / Year",         "48"],
    ["expenses","Annual Business Expenses ($)", "5000"],
    ["tax",     "Tax Rate (%)",                 "25"],
    ["buffer",  "Buffer / Scope Creep (%)",     "20"],
  ];

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      {user?.hourlyRate>0 && (
        <div className="at-info-bar"><FiDollarSign size={13}/> Current profile rate: <strong>${user.hourlyRate}/hr</strong></div>
      )}
      <div className="at-calc-grid">
        {FIELDS.map(([k,label,ph])=>(
          <div className="at-field" key={k}>
            <label>{label}</label>
            <input className="at-input" type="number" placeholder={ph} value={f[k]} onChange={e=>s(k,e.target.value)}/>
          </div>
        ))}
      </div>
      <button className="at-btn gold" onClick={calc} style={{marginTop:4}}><FiSliders size={13}/> Calculate My Rate</button>
      {result && (
        <div className="at-result-panel">
          <div className="at-result-grid">
            <div className="at-result-item"><span>Base Rate</span><strong>${result.base}/hr</strong></div>
            <div className="at-result-item"><span>After Tax ({f.tax}%)</span><strong>${result.withTax}/hr</strong></div>
            <div className="at-result-item"><span>Daily Rate (8h)</span><strong>${result.daily}</strong></div>
            <div className="at-result-item"><span>Monthly Target</span><strong>${result.monthly}</strong></div>
          </div>
          <div className="at-result-highlight">
            <div className="at-result-main-label">Recommended Hourly Rate</div>
            <div className="at-result-main-value">${result.final}<span>/hr</span></div>
            <div className="at-result-sub">To earn ${result.annual}/yr after taxes and expenses.</div>
          </div>
          <button className="at-btn ghost" onClick={saveRate}><FiSave size={12}/> Save as My Hourly Rate</button>
        </div>
      )}
    </div>
  );
};

/* ── Time Tracker ────────────────────────────────────────── */
const TimeTracker = () => {
  const [toast, notify] = useToast();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [label,   setLabel]   = useState("");
  const [rate,    setRate]    = useState("");
  const [sessions, setSessions] = useCloudState("timeSessions", [], { legacyKey: "at_sessions" });
  const ref = useRef(null);

  useEffect(()=>{
    if (running) ref.current = setInterval(()=>setElapsed(e=>e+1),1000);
    else clearInterval(ref.current);
    return ()=>clearInterval(ref.current);
  },[running]);

  const fmt  = s => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const fmtH = s => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m}m`; };

  const stop = () => {
    setRunning(false);
    if (elapsed<5) { notify("Session too short to save.",true); setElapsed(0); return; }
    const hrs = elapsed/3600;
    const earned = rate ? (hrs * parseFloat(rate)).toFixed(2) : null;
    const sn = { id:Date.now(), label:label||"Untitled", duration:fmt(elapsed), mins:Math.ceil(elapsed/60), hrs:hrs.toFixed(2), earned, date:new Date().toLocaleDateString() };
    const u = [sn,...sessions].slice(0,50);
    setSessions(u);
    setElapsed(0); setLabel(""); notify(`Session saved: ${fmtH(elapsed)}`);
  };

  const del = id => { setSessions(sessions.filter(s=>s.id!==id)); };

  const exportCSV = ()=>{
    const csv = ["Label,Duration,Hours,Earned,Date",...sessions.map(s=>`"${s.label}","${s.duration}",${s.hrs},${s.earned||""},"${s.date}"`)].join("\n");
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:"time_log.csv"}).click();
    notify("Exported.");
  };

  const totalMins = sessions.reduce((a,s)=>a+(s.mins||0),0);
  const totalEarned = sessions.reduce((a,s)=>a+(parseFloat(s.earned)||0),0);

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div className="at-timer-setup">
        <input className="at-input" placeholder="What are you working on?" value={label} onChange={e=>setLabel(e.target.value)}/>
        <input className="at-input" type="number" placeholder="Hourly rate (optional $)" value={rate} onChange={e=>setRate(e.target.value)} style={{maxWidth:180}}/>
      </div>
      <div className={`at-timer-clock${running?" running":""}`}>{fmt(elapsed)}</div>
      <div className="at-timer-controls">
        {!running
          ? <button className="at-btn gold" onClick={()=>setRunning(true)}>▶ Start Timer</button>
          : <button className="at-btn red" onClick={stop}>■ Stop & Save</button>}
        {!running&&elapsed>0&&<button className="at-btn ghost" onClick={()=>setElapsed(0)}>↺ Reset</button>}
      </div>

      {sessions.length>0 && (
        <>
          <div className="at-timer-stats">
            <div className="at-stat-chip"><span>{fmtH(totalMins*60)}</span><label>Total Tracked</label></div>
            <div className="at-stat-chip"><span>{sessions.length}</span><label>Sessions</label></div>
            {totalEarned>0&&<div className="at-stat-chip gold"><span>{fmt$(totalEarned)}</span><label>Earned</label></div>}
            <button className="at-btn ghost sm" onClick={exportCSV} style={{marginLeft:"auto"}}><FiDownload size={11}/> CSV</button>
          </div>
          <ul className="at-session-list">
            {sessions.map(s=>(
              <li key={s.id} className="at-session-item">
                <div className="at-session-info">
                  <span className="at-session-label">{s.label}</span>
                  <span className="at-session-meta">{s.date}</span>
                </div>
                <div className="at-session-right">
                  <span className="at-session-dur">{s.duration}</span>
                  {s.earned&&<span className="at-session-earned">{fmt$(s.earned)}</span>}
                  <button className="at-icon-btn red" onClick={()=>del(s.id)}><FiTrash2 size={11}/></button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

/* ── Expense Tracker ─────────────────────────────────────── */
const ExpenseTracker = () => {
  const [toast, notify] = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [f, setF] = useState({ name:"", amount:"", category:"Software", date:today(), note:"" });
  const [filterCat, setFilterCat] = useState("All");
  const CATS = ["Software","Hardware","Marketing","Travel","Office","Education","Contractor","Subscriptions","Other"];

  const load = useCallback(()=>{
    api.get("/earnings").then(d=>{
      const all = arr(d?.earnings||d);
      setExpenses(all.filter(e=>e.type==="expense"||e.amount<0));
    }).catch(e=>notify(errorMessage(e,"Could not load expenses."),true))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{load();},[load]);

  const add = async()=>{
    if (!f.name.trim()||!f.amount) { notify("Fill name and amount.",true); return; }
    const entry = {...f, amount:parseFloat(f.amount), type:"expense"};
    try { await api.post("/earnings",entry); load(); notify("Expense added."); }
    catch (e) { notify(errorMessage(e,"Could not save the expense."),true); return; }
    setF({name:"",amount:"",category:"Software",date:today(),note:""});
  };

  const del = async id=>{
    try { await api.delete(`/earnings/${id}`); load(); }
    catch { setExpenses(p=>p.filter(e=>(e._id||e.id)!==id)); }
    notify("Deleted.");
  };

  const exportCSV = ()=>{
    const csv = ["Name,Amount,Category,Date,Note",...expenses.map(e=>`"${e.name}",${Math.abs(e.amount)},"${e.category}","${e.date}","${e.note||""}"`)].join("\n");
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:"expenses.csv"}).click();
    notify("Exported.");
  };

  const total = expenses.reduce((s,e)=>s+Math.abs(parseFloat(e.amount)||0),0);
  const byCat = CATS.map(c=>({cat:c,total:expenses.filter(e=>e.category===c).reduce((s,e)=>s+Math.abs(parseFloat(e.amount)||0),0)})).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const filtered = filterCat==="All" ? expenses : expenses.filter(e=>e.category===filterCat);

  if (loading) return <div className="at-tool"><p className="at-empty">Loading expenses…</p></div>;

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div className="at-expense-form">
        <input className="at-input" placeholder="Expense name" value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/>
        <input className="at-input" type="number" placeholder="Amount ($)" value={f.amount} onChange={e=>setF(p=>({...p,amount:e.target.value}))} style={{maxWidth:150}}/>
        <select className="at-select" value={f.category} onChange={e=>setF(p=>({...p,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
        <input className="at-input" type="date" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))} style={{maxWidth:160}}/>
        <input className="at-input" placeholder="Note (optional)" value={f.note} onChange={e=>setF(p=>({...p,note:e.target.value}))}/>
        <button className="at-btn gold" onClick={add}><FiPlus size={12}/> Add</button>
      </div>

      {expenses.length>0 && (
        <>
          <div className="at-expense-summary">
            <div className="at-stat-chip gold"><span>{fmt$(total)}</span><label>Total Spent</label></div>
            <div className="at-stat-chip"><span>{expenses.length}</span><label>Entries</label></div>
            {byCat.slice(0,3).map(c=><div key={c.cat} className="at-stat-chip"><span>{fmt$(c.total)}</span><label>{c.cat}</label></div>)}
          </div>

          {byCat.length>0&&(
            <div className="at-breakdown">
              {byCat.map(c=>(
                <div key={c.cat} className="at-breakdown-row">
                  <span className="at-breakdown-label">{c.cat}</span>
                  <div className="at-breakdown-bar-wrap"><div className="at-breakdown-bar" style={{width:`${(c.total/total)*100}%`}}/></div>
                  <span className="at-breakdown-val">{fmt$(c.total)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="at-expense-controls">
            <div className="at-cat-pills">
              <button className={`at-cat-pill${filterCat==="All"?" on":""}`} onClick={()=>setFilterCat("All")}>All</button>
              {byCat.map(c=><button key={c.cat} className={`at-cat-pill${filterCat===c.cat?" on":""}`} onClick={()=>setFilterCat(c.cat)}>{c.cat}</button>)}
            </div>
            <button className="at-btn ghost sm" onClick={exportCSV}><FiDownload size={11}/> Export</button>
          </div>

          <ul className="at-expense-list">
            {filtered.map(e=>(
              <li key={e._id||e.id} className="at-expense-item">
                <span className="at-cat-chip">{e.category}</span>
                <span className="at-expense-name">{e.name}</span>
                {e.note&&<span className="at-expense-note">{e.note}</span>}
                <div className="at-expense-right">
                  <span className="at-expense-amount">{fmt$(Math.abs(parseFloat(e.amount)||0))}</span>
                  <span className="at-expense-date">{e.date}</span>
                  <button className="at-icon-btn red" onClick={()=>del(e._id||e.id)}><FiTrash2 size={11}/></button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {expenses.length===0&&<p className="at-empty">No expenses logged yet.</p>}
    </div>
  );
};

/* ── Brand Kit ───────────────────────────────────────────── */
const BrandKit = () => {
  const [toast, notify] = useToast();
  const [savedKit, saveKit] = useCloudState("brandKit", {}, { legacyKey: "at_brand" });
  const [kit, setKit] = useState(savedKit);
  useEffect(() => { setKit(savedKit); }, [savedKit]);
  const upd = (k,v) => setKit(p=>({...p,[k]:v}));

  const save = ()=>{ saveKit(kit); notify("Brand kit saved to your account."); };

  const FONTS = ["DM Sans","DM Serif Display","Inter","Playfair Display","Montserrat","Raleway","Poppins","Lato","Space Grotesk","Sora"];
  const COLORS = [["primary","Primary Brand"],["secondary","Secondary"],["accent","Accent"],["bg","Background"],["text","Body Text"]];

  const exportKit = ()=>{
    const txt = ["BRAND KIT","=".repeat(30),"",`Business: ${kit.name||"—"}`,`Tagline:  ${kit.tagline||"—"}`,`Website:  ${kit.website||"—"}`,`Email:    ${kit.email||"—"}`,`Font:     ${kit.font||"—"}`,"",...COLORS.map(([k,l])=>`${l}: ${kit[k]||"—"}`)].join("\n");
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([txt],{type:"text/plain"})),download:"brand_kit.txt"}).click();
    notify("Exported.");
  };

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div className="at-brand-layout">
        <div className="at-brand-col">
          <h4 className="at-col-title">Identity</h4>
          {[["name","Business Name","text","Acme Design Co."],["tagline","Tagline","text","Crafting digital experiences"],["website","Website","url","https://yoursite.com"],["email","Contact Email","email","hello@yoursite.com"]].map(([k,l,t,ph])=>(
            <div className="at-field" key={k}><label>{l}</label><input className="at-input" type={t} placeholder={ph} value={kit[k]||""} onChange={e=>upd(k,e.target.value)}/></div>
          ))}
          <div className="at-field"><label>Primary Font</label>
            <select className="at-select" value={kit.font||"DM Sans"} onChange={e=>upd("font",e.target.value)}>
              {FONTS.map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div className="at-brand-col">
          <h4 className="at-col-title">Brand Colors</h4>
          {COLORS.map(([k,label])=>(
            <div className="at-color-row" key={k}>
              <label>{label}</label>
              <div className="at-color-pick">
                <input type="color" className="at-color-swatch-input" value={kit[k]||"#CFA75A"} onChange={e=>upd(k,e.target.value)}/>
                <input className="at-input at-input-sm" value={kit[k]||"#CFA75A"} onChange={e=>upd(k,e.target.value)} placeholder="#CFA75A"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {kit.name&&(
        <div className="at-brand-preview" style={{fontFamily:kit.font||"inherit",borderColor:(kit.primary||"#CFA75A")+"40"}}>
          <div className="at-brand-preview-name" style={{color:kit.primary||"#CFA75A"}}>{kit.name}</div>
          {kit.tagline&&<div className="at-brand-preview-tag" style={{color:kit.secondary||"#A9B1A3"}}>{kit.tagline}</div>}
          <div className="at-brand-swatches">
            {["primary","secondary","accent","bg","text"].map(k=>kit[k]&&<div key={k} className="at-swatch" style={{background:kit[k]}} title={`${k}: ${kit[k]}`}/>)}
          </div>
          {kit.website&&<a href={kit.website} target="_blank" rel="noopener noreferrer" className="at-brand-link"><FiExternalLink size={10}/> {kit.website.replace(/^https?:\/\//,"")}</a>}
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:4}}>
        <button className="at-btn ghost" onClick={exportKit}><FiDownload size={12}/> Export</button>
        <button className="at-btn gold" onClick={save}><FiSave size={12}/> Save Kit</button>
      </div>
    </div>
  );
};

/* ── Project Estimator ───────────────────────────────────── */
const ProjectEstimator = () => {
  const [toast, notify] = useToast();
  const [items, setItems] = useState([{id:1,task:"",hrs:"",rate:"",desc:""}]);
  const [meta, setMeta] = useState({client:"",project:"",margin:"20",currency:"USD"});
  const [saved, setSaved] = useCloudState("estimates", [], { legacyKey: "at_estimates" });

  const addItem = ()=>setItems(p=>[...p,{id:Date.now(),task:"",hrs:"",rate:"",desc:""}]);
  const updItem = (id,k,v)=>setItems(p=>p.map(i=>i.id===id?{...i,[k]:v}:i));
  const delItem = id=>setItems(p=>p.filter(i=>i.id!==id));

  const subtotal = items.reduce((s,i)=>s+(parseFloat(i.hrs)||0)*(parseFloat(i.rate)||0),0);
  const margin   = subtotal*(parseFloat(meta.margin)/100||0);
  const total    = subtotal+margin;

  const saveEst = ()=>{
    if (!meta.project.trim()) { notify("Enter a project name.",true); return; }
    const est = { id:Date.now(), ...meta, items, subtotal, margin:margin, total, date:today() };
    const u = [est,...saved].slice(0,20);
    setSaved(u);
    notify("Estimate saved!");
  };

  const exportTxt = ()=>{
    const txt = [`PROJECT ESTIMATE`,`Client:  ${meta.client||"—"}`,`Project: ${meta.project}`,`Date:    ${today()}`,``,`BREAKDOWN:`,
      ...items.filter(i=>i.task).map(i=>`  ${i.task}: ${i.hrs}h × $${i.rate}/hr = ${fmt$(i.hrs*i.rate)}`),
      ``,`Subtotal:  ${fmt$(subtotal)}`,`Margin (${meta.margin}%): ${fmt$(margin)}`,`TOTAL:     ${fmt$(total)}`,
    ].join("\n");
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([txt],{type:"text/plain"})),download:"estimate.txt"}).click();
    notify("Exported.");
  };

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div className="at-calc-grid" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>
        <div className="at-field"><label>Client Name</label><input className="at-input" placeholder="Acme Corp" value={meta.client} onChange={e=>setMeta(p=>({...p,client:e.target.value}))}/></div>
        <div className="at-field"><label>Project Name</label><input className="at-input" placeholder="Website Redesign" value={meta.project} onChange={e=>setMeta(p=>({...p,project:e.target.value}))}/></div>
        <div className="at-field"><label>Profit Margin (%)</label><input className="at-input" type="number" placeholder="20" value={meta.margin} onChange={e=>setMeta(p=>({...p,margin:e.target.value}))}/></div>
      </div>

      <div className="at-items-table">
        <div className="at-items-head">
          <span>Task / Phase</span><span>Hours</span><span>Rate ($/hr)</span><span>Total</span><span/>
        </div>
        {items.map(item=>(
          <div key={item.id} className="at-item-row">
            <input className="at-input" placeholder="e.g. UI Design" value={item.task} onChange={e=>updItem(item.id,"task",e.target.value)}/>
            <input className="at-input" type="number" placeholder="10" value={item.hrs} onChange={e=>updItem(item.id,"hrs",e.target.value)} style={{maxWidth:80}}/>
            <input className="at-input" type="number" placeholder="75" value={item.rate} onChange={e=>updItem(item.id,"rate",e.target.value)} style={{maxWidth:90}}/>
            <span className="at-item-total">{fmt$((parseFloat(item.hrs)||0)*(parseFloat(item.rate)||0))}</span>
            {items.length>1&&<button className="at-icon-btn red" onClick={()=>delItem(item.id)}><FiX size={11}/></button>}
          </div>
        ))}
      </div>
      <button className="at-btn ghost sm" onClick={addItem}><FiPlus size={11}/> Add Task</button>

      <div className="at-estimate-totals">
        <div className="at-total-row"><span>Subtotal</span><span>{fmt$(subtotal)}</span></div>
        <div className="at-total-row"><span>Profit Margin ({meta.margin}%)</span><span>{fmt$(margin)}</span></div>
        <div className="at-total-row grand"><span>Quote Total</span><strong>{fmt$(total)}</strong></div>
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button className="at-btn ghost" onClick={exportTxt}><FiDownload size={12}/> Export</button>
        <button className="at-btn gold" onClick={saveEst}><FiSave size={12}/> Save Estimate</button>
      </div>

      {saved.length>0&&(
        <div className="at-saved-estimates">
          <h4 className="at-col-title" style={{margin:"12px 0 8px"}}>Saved Estimates</h4>
          {saved.map(e=>(
            <div key={e.id} className="at-saved-row">
              <div><div className="at-saved-title">{e.project}</div><div className="at-saved-meta">{e.client||"No client"} · {e.date}</div></div>
              <strong className="at-saved-total">{fmt$(e.total)}</strong>
              <button className="at-icon-btn red" onClick={()=>{setSaved(saved.filter(s=>s.id!==e.id));}}><FiTrash2 size={11}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   PREMIUM TOOLS
══════════════════════════════════════════════════════════ */

/* ── Earnings Analytics ─────────────────────────────────── */
const EarningsAnalytics = () => {
  const [data,    setData]    = useState({ invoices:[], expenses:[] });
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("6m");
  const [goal,    setGoal]    = useCloudState("revenueGoal", 0, { legacyKey: "at_revenue_goal" });
  const [editGoal,setEditGoal]= useState(false);
  const [goalInput,setGoalInput] = useState("");

  useEffect(()=>{
    Promise.all([api.get("/invoices"),api.get("/earnings")]).then(([inv,earn])=>{
      setData({ invoices:arr(inv?.invoices||inv), expenses:arr(earn?.earnings||earn).filter(e=>e.type==="expense") });
    }).finally(()=>setLoading(false));
  },[]);

  const paid    = data.invoices.filter(i=>i.status==="paid");
  const earned  = paid.reduce((s,i)=>s+(i.total||0),0);
  const spent   = data.expenses.reduce((s,e)=>s+Math.abs(e.amount||0),0);
  const net     = earned-spent;
  const pending = data.invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.total||0),0);
  const avgInvoice = paid.length ? earned / paid.length : 0;

  const months = useMemo(() => {
    const m = {}; paid.forEach(i=>{ const k=(i.issueDate||"").slice(0,7); m[k]=(m[k]||0)+(i.total||0); });
    const entries = Object.entries(m).sort(([a],[b])=>a.localeCompare(b));
    const n = period==="3m"?3:period==="6m"?6:12;
    return entries.slice(-n);
  },[paid,period]);

  const maxV      = Math.max(...months.map(([,v])=>v),1);
  const thisMonth = months[months.length-1]?.[1] || 0;
  const lastMonth = months[months.length-2]?.[1] || 0;
  const growth    = lastMonth > 0 ? (((thisMonth-lastMonth)/lastMonth)*100).toFixed(1) : null;

  const byClient = {};
  paid.forEach(i=>{ const k=i.clientName||"Unknown"; byClient[k]=(byClient[k]||0)+(i.total||0); });
  const topClients = Object.entries(byClient).sort(([,a],[,b])=>b-a).slice(0,6);

  const exportCSV = ()=>{
    const csv = ["Month,Revenue",...months.map(([m,v])=>`${m},${v.toFixed(2)}`)].join("\n");
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:"earnings.csv"}).click();
  };

  const saveGoal = () => {
    const g = parseFloat(goalInput)||0;
    setGoal(g); setEditGoal(false);
  };

  if (loading) return <div className="at-tool"><p className="at-empty">Loading analytics…</p></div>;

  return (
    <div className="at-tool">
      <div className="at-analytics-kpis">
        {[
          {l:"Total Earned",  v:fmt$(earned),     c:"gold"},
          {l:"Net Profit",    v:fmt$(net),          c:net>=0?"green":"red"},
          {l:"Expenses",      v:fmt$(spent),        c:"red"},
          {l:"Pending",       v:fmt$(pending),      c:"blue"},
          {l:"Avg Invoice",   v:fmt$(avgInvoice),   c:""},
          {l:"Paid Invoices", v:paid.length,         c:""},
        ].map(({l,v,c})=>(
          <div key={l} className={`at-kpi-chip${c?" "+c:""}`}><span>{v}</span><label>{l}</label></div>
        ))}
      </div>

      {/* Revenue Goal */}
      <div className="at-goal-section">
        <div className="at-goal-header">
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <FiTarget size={13} style={{color:"var(--at-gold)"}}/>
            <span style={{fontSize:12,fontWeight:600,color:"var(--at-ts)"}}>Annual Revenue Goal</span>
            {goal>0&&growth!==null&&(
              <span style={{fontSize:11,color:parseFloat(growth)>=0?"#7DC39A":"#D9605A"}}>
                {parseFloat(growth)>=0?"↑":"↓"} {Math.abs(growth)}% vs last month
              </span>
            )}
          </div>
          <button className="at-btn ghost sm" onClick={()=>{setEditGoal(p=>!p);setGoalInput(goal||"");}}>
            {editGoal?"Cancel":goal>0?"Edit Goal":"Set Goal"}
          </button>
        </div>
        {editGoal&&(
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <input className="at-input" type="number" placeholder="Annual goal e.g. 50000" value={goalInput} onChange={e=>setGoalInput(e.target.value)} style={{maxWidth:220}}/>
            <button className="at-btn gold sm" onClick={saveGoal}><FiCheck size={11}/> Set</button>
          </div>
        )}
        {goal>0&&!editGoal&&(
          <div style={{marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:11,color:"var(--at-tm)"}}>
              <span>{fmt$(earned)} earned</span>
              <span>{Math.min(100,((earned/goal)*100)).toFixed(1)}% of {fmt$(goal)} goal</span>
            </div>
            <div className="at-breakdown-bar-wrap" style={{height:6}}>
              <div className="at-breakdown-bar" style={{width:`${Math.min(100,(earned/goal)*100)}%`,background:earned>=goal?"#7DC39A":"var(--at-gold)"}}/>
            </div>
          </div>
        )}
      </div>

      {months.length>0 ? (
        <div className="at-chart-section">
          <div className="at-chart-hdr">
            <h4>Monthly Revenue</h4>
            <div style={{display:"flex",gap:7}}>
              {["3m","6m","12m"].map(p=><button key={p} className={`at-period-btn${period===p?" on":""}`} onClick={()=>setPeriod(p)}>{p}</button>)}
              <button className="at-btn ghost sm" onClick={exportCSV}><FiDownload size={11}/></button>
            </div>
          </div>
          <div className="at-bar-chart">
            {months.map(([m,v])=>(
              <div key={m} className="at-bar-col">
                <span className="at-bar-val">{v>=1000?`$${(v/1000).toFixed(1)}k`:`$${v.toFixed(0)}`}</span>
                <div className="at-bar" style={{height:`${(v/maxV)*100}%`}}/>
                <span className="at-bar-label">{m.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="at-empty" style={{padding:"24px 0"}}>
          <FiBarChart2 size={28}/>
          <p>No paid invoices yet.<br/>Mark invoices as paid on the Invoices page to see your chart.</p>
        </div>
      )}

      {topClients.length>0&&(
        <div className="at-chart-section">
          <h4 style={{marginBottom:12,fontSize:13,color:"var(--at-ts)"}}>Top Clients by Revenue</h4>
          {topClients.map(([c,v])=>(
            <div key={c} className="at-client-row">
              <span className="at-client-name">{c}</span>
              <div className="at-client-bar-wrap"><div className="at-client-bar" style={{width:`${(v/topClients[0][1])*100}%`}}/></div>
              <span className="at-client-amount">{fmt$(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Smart Contracts ─────────────────────────────────────── */
const SmartContracts = () => {
  const { user } = useAuth();
  const [toast, notify] = useToast();
  const [contracts, setContracts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [view, setView]             = useState("list");
  const [f, setF]                   = useState({ title:"", content:"" });
  const [signConfirm, setSignConfirm] = useState(null); // id of contract pending sign confirm

  const me = user?.name||"[YOUR NAME]";

  const TEMPLATES = {
    "Freelance Service": `FREELANCE SERVICE AGREEMENT\nDate: ${today()}\nFreelancer: ${me}\nClient: [CLIENT NAME]\n\n1. SERVICES\n[Describe the services to be provided in detail]\n\n2. PAYMENT\nTotal fee: $[AMOUNT]\nPayment terms: 50% upfront, 50% upon delivery\n\n3. TIMELINE\nProject start: [START DATE]\nDeadline: [END DATE]\n\n4. REVISIONS\n2 rounds of revisions included. Additional revisions at $[RATE]/hr.\n\n5. INTELLECTUAL PROPERTY\nAll deliverables transfer to Client upon full payment.\n\n6. CONFIDENTIALITY\nBoth parties agree to maintain confidentiality.\n\n7. TERMINATION\nEither party may terminate with 7 days written notice. Work completed to date is billable.\n\nFreelancer: ${me}\nSignature: _________________________ Date: _________\n\nClient: [NAME]\nSignature: _________________________ Date: _________`,
    "NDA": `NON-DISCLOSURE AGREEMENT\nDate: ${today()}\nParty A: ${me}\nParty B: [CLIENT NAME]\n\n1. CONFIDENTIAL INFORMATION\nIncludes any business data, technical info, client lists, or trade secrets shared between parties.\n\n2. OBLIGATIONS\nNeither party shall disclose confidential information to third parties without prior written consent.\n\n3. TERM\nThis NDA is effective for 2 years from the date above.\n\n4. EXCEPTIONS\nDoes not apply to publicly known information or independently developed content.\n\nSignature Party A: _________________________ Date: _________\nSignature Party B: _________________________ Date: _________`,
    "Retainer": `RETAINER AGREEMENT\nDate: ${today()}\nConsultant: ${me}\nClient: [CLIENT NAME]\n\n1. RETAINER FEE\n$[AMOUNT] per month for [HOURS] hours of availability.\n\n2. SCOPE OF SERVICES\n[Describe services: design, development, consulting, etc.]\n\n3. ROLLOVER\nUnused hours do not roll over to the following month.\n\n4. TERM\nBegins [START DATE], auto-renews monthly unless cancelled with 30 days written notice.\n\n5. PAYMENT\nInvoiced on the 1st of each month, due within 15 days.\n\nConsultant: ${me}\nSignature: _________________________ Date: _________\n\nClient: [NAME]\nSignature: _________________________ Date: _________`,
    "IP Transfer": `INTELLECTUAL PROPERTY TRANSFER AGREEMENT\nDate: ${today()}\nCreator: ${me}\nClient: [CLIENT NAME]\n\nUpon receipt of full payment of $[AMOUNT], all intellectual property rights to [DESCRIPTION OF WORK] are hereby transferred to Client.\n\nCreator retains the right to display work in portfolio with Client approval.\n\nCreator: ${me}\nSignature: _________________________ Date: _________\n\nClient: [NAME]\nSignature: _________________________ Date: _________`,
  };

  const load = useCallback(()=>{
    api.get("/contracts").then(d=>setContracts(arr(d?.contracts||d)))
      .catch(e=>notify(errorMessage(e,"Could not load contracts."),true))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{load();},[load]);

  const create = async()=>{
    if (!f.title.trim()) { notify("Enter a contract title.",true); return; }
    const entry = { title:f.title, content:f.content, status:"draft", signed:false, createdAt:new Date().toISOString() };
    try { await api.post("/contracts",entry); load(); }
    catch (e) { notify(errorMessage(e,"Could not save the contract."),true); return; }
    notify("Contract saved."); setView("list"); setF({title:"",content:""});
  };

  const sign = async id=>{
    const signedAt = new Date().toISOString();
    try { await api.put(`/contracts/${id}`,{status:"signed",signed:true,signedAt}); load(); }
    catch { setContracts(p=>p.map(c=>(c._id||c.id)===id?{...c,signed:true,status:"signed",signedAt}:c)); }
    notify("Contract signed!");
  };

  const del = async id=>{
    try { await api.delete(`/contracts/${id}`); load(); }
    catch { setContracts(p=>p.filter(c=>(c._id||c.id)!==id)); }
    notify("Deleted.");
  };

  const download = c=>{
    const signed = c.signed?`\n\n[SIGNED ON: ${c.signedAt?new Date(c.signedAt).toLocaleDateString():"—"}]`:"";
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([`${c.title}\n${"=".repeat(c.title.length)}\n\n${c.content}${signed}`],{type:"text/plain"})),download:`${c.title.replace(/\s+/g,"_")}.txt`}).click();
    notify("Downloaded.");
  };

  if (loading) return <div className="at-tool"><p className="at-empty">Loading contracts…</p></div>;

  if (view==="create") return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <h3 className="at-panel-title">New Contract</h3>
        <button className="at-btn ghost sm" onClick={()=>setView("list")}><FiX size={11}/> Cancel</button>
      </div>
      <input className="at-input" placeholder="Contract title e.g. Service Agreement — Acme Corp" value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))}/>
      <div className="at-template-row">
        <span className="at-hint">Templates:</span>
        {Object.keys(TEMPLATES).map(t=>(
          <button key={t} className="at-btn ghost sm" onClick={()=>setF(p=>({...p,content:TEMPLATES[t]}))}>{t}</button>
        ))}
      </div>
      <textarea className="at-input at-ta-lg" value={f.content} onChange={e=>setF(p=>({...p,content:e.target.value}))} placeholder="Contract text, or choose a template above…" rows={16}/>
      <button className="at-btn gold" onClick={create}><FiSave size={12}/> Save Contract</button>
    </div>
  );

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 className="at-panel-title">Contracts ({contracts.length})</h3>
        <button className="at-btn gold sm" onClick={()=>setView("create")}><FiPlus size={11}/> New Contract</button>
      </div>
      {contracts.length===0&&<p className="at-empty">No contracts yet. Use a template or write from scratch.</p>}
      <ul className="at-contract-list">
        {contracts.map(c=>(
          <li key={c._id||c.id} className="at-contract-item">
            <div className="at-contract-info">
              <strong>{c.title}</strong>
              <span className={`at-status-chip ${c.status}`}>{c.status}</span>
              {c.signed&&<span className="at-signed-badge"><FiCheck size={9}/> Signed {c.signedAt?new Date(c.signedAt).toLocaleDateString():""}</span>}
              <span className="at-contract-date">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="at-contract-acts">
              {!c.signed&&(
                signConfirm===(c._id||c.id) ? (
                  <>
                    <span style={{fontSize:11,color:"var(--at-ts)"}}>Sign this contract?</span>
                    <button className="at-btn gold sm" onClick={()=>{sign(c._id||c.id);setSignConfirm(null);}}><FiCheck size={11}/> Confirm</button>
                    <button className="at-btn ghost sm" onClick={()=>setSignConfirm(null)}><FiX size={11}/> Cancel</button>
                  </>
                ) : (
                  <button className="at-btn gold sm" onClick={()=>setSignConfirm(c._id||c.id)}><FiPenTool size={11}/> Sign</button>
                )
              )}
              <button className="at-btn ghost sm" onClick={()=>download(c)}><FiDownload size={11}/> .txt</button>
              <button className="at-icon-btn red" onClick={()=>del(c._id||c.id)}><FiTrash2 size={11}/></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ── Proposal Builder ────────────────────────────────────── */
const ProposalBuilder = () => {
  const [toast, notify] = useToast();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const blank = {title:"",client:"",overview:"",scope:"",deliverables:"",timeline:"",price:"",terms:""};
  const [f, setF] = useState(blank);

  const load = useCallback(()=>{
    api.get("/proposals").then(d=>setProposals(arr(d?.proposals||d)))
      .catch(e=>notify(errorMessage(e,"Could not load proposals."),true))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{load();},[load]);

  const create = async()=>{
    if (!f.title.trim()) { notify("Enter a proposal title.",true); return; }
    const entry = {...f, createdAt:new Date().toISOString(), status:"draft"};
    try { await api.post("/proposals",entry); load(); }
    catch (e) { notify(errorMessage(e,"Could not save the proposal."),true); return; }
    notify("Proposal saved."); setView("list");
  };

  const del = async id=>{
    try { await api.delete(`/proposals/${id}`); load(); }
    catch { setProposals(p=>p.filter(x=>(x._id||x.id)!==id)); }
    notify("Deleted.");
  };

  const download = p=>{
    const sections = [["OVERVIEW",p.overview],["SCOPE OF WORK",p.scope],["DELIVERABLES",p.deliverables],["TIMELINE",p.timeline],["INVESTMENT",p.price],["TERMS",p.terms]].filter(([,v])=>v);
    const txt = [`PROPOSAL: ${p.title}`,`Prepared for: ${p.client||"—"}`,`Date: ${new Date(p.createdAt).toLocaleDateString()}`,``,...sections.flatMap(([h,v])=>[h,"─".repeat(h.length),v,``])].join("\n");
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([txt],{type:"text/plain"})),download:`Proposal_${p.title.replace(/\s+/g,"_")}.txt`}).click();
    notify("Downloaded.");
  };

  const FIELDS = [
    ["title",       "Proposal Title",    "Website Redesign for Acme Corp", "input"],
    ["client",      "Client Name",       "Acme Corp",                       "input"],
    ["overview",    "Project Overview",  "Brief description and goals…",    "ta"],
    ["scope",       "Scope of Work",     "Everything included in detail…",  "ta"],
    ["deliverables","Deliverables",      "What the client receives…",       "ta"],
    ["timeline",    "Timeline",          "Week 1: Discovery. Weeks 2–4…",   "ta"],
    ["price",       "Investment",        "Total: $3,500. 50% upfront…",     "ta"],
    ["terms",       "Terms",             "2 revisions included…",           "ta"],
  ];

  if (loading) return <div className="at-tool"><p className="at-empty">Loading proposals…</p></div>;

  if (view==="create") return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <h3 className="at-panel-title">New Proposal</h3>
        <button className="at-btn ghost sm" onClick={()=>setView("list")}><FiX size={11}/> Cancel</button>
      </div>
      {FIELDS.map(([k,label,ph,type])=>(
        <div className="at-field" key={k}>
          <label>{label}</label>
          {type==="input"
            ?<input className="at-input" placeholder={ph} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))}/>
            :<textarea className="at-input at-ta-sm" placeholder={ph} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} rows={3}/>}
        </div>
      ))}
      <button className="at-btn gold" onClick={create}><FiSave size={12}/> Save Proposal</button>
    </div>
  );

  return (
    <div className="at-tool">
      <Toast toast={toast}/>

      {/* Stats strip */}
      {proposals.length>0&&(
        <div className="at-analytics-kpis" style={{marginBottom:14}}>
          {[
            {l:"Total",    v:proposals.length, c:""},
            {l:"Sent",     v:proposals.filter(p=>p.status==="sent").length, c:"blue"},
            {l:"Accepted", v:proposals.filter(p=>p.status==="accepted").length, c:"green"},
            {l:"Win Rate", v:`${proposals.length?Math.round((proposals.filter(p=>p.status==="accepted").length/proposals.length)*100):0}%`, c:"gold"},
          ].map(({l,v,c})=>(
            <div key={l} className={`at-kpi-chip${c?" "+c:""}`}><span>{v}</span><label>{l}</label></div>
          ))}
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 className="at-panel-title">Proposals ({proposals.length})</h3>
        <button className="at-btn gold sm" onClick={()=>{setView("create");setF(blank);}}><FiPlus size={11}/> New Proposal</button>
      </div>
      {proposals.length===0&&<p className="at-empty">No proposals yet. Build your first one.</p>}
      <ul className="at-contract-list">
        {proposals.map(p=>(
          <li key={p._id||p.id} className="at-contract-item">
            <div className="at-contract-info">
              <strong>{p.title}</strong>
              <span className={`at-status-chip ${p.status||"draft"}`}>{p.status||"draft"}</span>
              <span className="at-hint-sm">For: {p.client||"—"}</span>
              <span className="at-contract-date">{new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="at-contract-acts">
              {/* Status progression */}
              {(!p.status||p.status==="draft")&&(
                <button className="at-btn ghost sm" onClick={async()=>{
                  try{await api.put(`/proposals/${p._id||p.id}`,{status:"sent"});load();}
                  catch{setProposals(x=>x.map(q=>(q._id||q.id)===(p._id||p.id)?{...q,status:"sent"}:q));}
                }}><FiSend size={10}/> Mark Sent</button>
              )}
              {p.status==="sent"&&(
                <>
                  <button className="at-btn gold sm" onClick={async()=>{
                    try{await api.put(`/proposals/${p._id||p.id}`,{status:"accepted"});load();}
                    catch{setProposals(x=>x.map(q=>(q._id||q.id)===(p._id||p.id)?{...q,status:"accepted"}:q));}
                  }}><FiCheckCircle size={10}/> Accepted</button>
                  <button className="at-btn ghost sm" onClick={async()=>{
                    try{await api.put(`/proposals/${p._id||p.id}`,{status:"declined"});load();}
                    catch{setProposals(x=>x.map(q=>(q._id||q.id)===(p._id||p.id)?{...q,status:"declined"}:q));}
                  }}><FiX size={10}/> Declined</button>
                </>
              )}
              <button className="at-btn ghost sm" onClick={()=>download(p)}><FiDownload size={11}/> Download</button>
              <button className="at-icon-btn red" onClick={()=>del(p._id||p.id)}><FiTrash2 size={11}/></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ── Tax Summary ─────────────────────────────────────────── */
const TaxSummary = () => {
  const [toast, notify] = useToast();
  const [year,    setYear]    = useState(String(new Date().getFullYear()));
  const [taxRate, setTaxRate] = useState("25");
  const [data,    setData]    = useState({ invoices:[], expenses:[] });
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.all([api.get("/invoices"),api.get("/earnings")]).then(([inv,earn])=>{
      setData({ invoices:arr(inv?.invoices||inv), expenses:arr(earn?.earnings||earn).filter(e=>e.type==="expense") });
    }).finally(()=>setLoading(false));
  },[]);

  const paid    = data.invoices.filter(i=>i.status==="paid"&&(i.issueDate||"").startsWith(year));
  const yearExp = data.expenses.filter(e=>(e.date||"").startsWith(year));
  const income  = paid.reduce((s,i)=>s+(i.total||0),0);
  const totalExp= yearExp.reduce((s,e)=>s+Math.abs(e.amount||0),0);
  const taxable = Math.max(0,income-totalExp);
  const estTax  = taxable*(parseFloat(taxRate)/100||0);
  const byCat   = {};
  yearExp.forEach(e=>{ byCat[e.category]=(byCat[e.category]||0)+Math.abs(e.amount||0); });

  // Quarterly breakdown
  const quarters = [1,2,3,4].map(q=>{
    const qPaid = paid.filter(i=>{
      const m = parseInt((i.issueDate||"").slice(5,7));
      return m>=(q-1)*3+1 && m<=q*3;
    });
    return { q, revenue: qPaid.reduce((s,i)=>s+(i.total||0),0), count: qPaid.length };
  });

  const download = ()=>{
    const txt = [
      `TAX SUMMARY — ${year}`, `Generated: ${new Date().toLocaleDateString()}`, ``,
      `━━ INCOME ━━`, `Gross Revenue: $${income.toFixed(2)}`, `Paid Invoices: ${paid.length}`, ``,
      `━━ QUARTERLY BREAKDOWN ━━`,
      ...quarters.map(q=>`  Q${q.q}: $${q.revenue.toFixed(2)} (${q.count} invoices)`), ``,
      `━━ DEDUCTIBLE EXPENSES ━━`,
      ...Object.entries(byCat).map(([k,v])=>`  ${k}: $${v.toFixed(2)}`),
      `Total Expenses: $${totalExp.toFixed(2)}`, ``,
      `━━ SUMMARY ━━`, `Taxable Income: $${taxable.toFixed(2)}`,
      `Est. Tax (${taxRate}%): $${estTax.toFixed(2)}`, `Net After Tax: $${(taxable-estTax).toFixed(2)}`, ``,
      `⚠ Estimate only. Consult a certified tax professional.`,
    ].join("\n");
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([txt],{type:"text/plain"})),download:`tax_summary_${year}.txt`}).click();
    notify("Exported.");
  };

  if (loading) return <div className="at-tool"><p className="at-empty">Loading tax data…</p></div>;

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <div className="at-field" style={{maxWidth:160}}><label>Tax Year</label>
          <select className="at-select" value={year} onChange={e=>setYear(e.target.value)}>
            {[2026,2025,2024,2023,2022].map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
        <div className="at-field" style={{maxWidth:160}}><label>Your Tax Rate (%)</label>
          <input className="at-input" type="number" value={taxRate} onChange={e=>setTaxRate(e.target.value)} placeholder="25"/>
        </div>
      </div>

      {/* Quarterly breakdown */}
      <div className="at-chart-section">
        <h4 style={{marginBottom:10,fontSize:13,color:"var(--at-ts)"}}>Quarterly Revenue — {year}</h4>
        <div className="at-analytics-kpis">
          {quarters.map(q=>(
            <div key={q.q} className={`at-kpi-chip${q.revenue>0?" gold":""}`}>
              <span>{fmt$(q.revenue)}</span>
              <label>Q{q.q} · {q.count} inv.</label>
            </div>
          ))}
        </div>
      </div>

      <div className="at-tax-summary">
        <div className="at-tax-row"><span>Gross Revenue ({year})</span><strong style={{color:"var(--at-gold)"}}>{fmt$(income)}</strong></div>
        <div className="at-tax-row"><span>Paid Invoices</span><span>{paid.length}</span></div>

        {Object.keys(byCat).length>0&&(<>
          <div className="at-tax-section-label">Deductible Expenses by Category</div>
          {Object.entries(byCat).sort(([,a],[,b])=>b-a).map(([k,v])=>(
            <div key={k} className="at-tax-row indent">
              <span>{k}</span>
              <div className="at-tax-mini-bar"><div style={{width:`${(v/totalExp)*100}%`}}/></div>
              <span>{fmt$(v)}</span>
            </div>
          ))}
        </>)}

        <div className="at-tax-row"><span>Total Deductions</span><strong style={{color:"#E89590"}}>{fmt$(totalExp)}</strong></div>
        <div className="at-tax-row divider"><span>Taxable Income</span><strong style={{color:"var(--at-gold)"}}>{fmt$(taxable)}</strong></div>
        <div className="at-tax-row"><span>Estimated Tax ({taxRate}%)</span><strong style={{color:"#E89590"}}>{fmt$(estTax)}</strong></div>
        <div className="at-tax-row grand"><span>Net After Tax</span><strong style={{color:"#A3D9B8"}}>{fmt$(taxable-estTax)}</strong></div>
      </div>

      <p className="at-warning-hint"><FiAlertCircle size={11}/> Estimate only. Consult a certified tax professional for accurate filing.</p>
      <button className="at-btn gold" onClick={download}><FiDownload size={12}/> Export Tax Summary</button>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   TOOL REGISTRY
══════════════════════════════════════════════════════════ */
const TOOLS = [
  { id:"notes",     tier:"free",    icon:<FiClipboard size={14}/>,  title:"Quick Notes",        desc:"Pinnable notes with search, categories, and export.",   C:QuickNote       },
  { id:"rate",      tier:"free",    icon:<FiSliders size={14}/>,    title:"Rate Calculator",    desc:"Find your ideal hourly rate with tax and buffer.",       C:RateCalc        },
  { id:"timer",     tier:"free",    icon:<FiClock size={14}/>,      title:"Time Tracker",       desc:"Track billable hours with earnings calculation.",        C:TimeTracker     },
  { id:"expense",   tier:"free",    icon:<FiDollarSign size={14}/>, title:"Expense Tracker",    desc:"Log, categorise and analyse business expenses.",         C:ExpenseTracker  },
  { id:"brand",     tier:"free",    icon:<FiGrid size={14}/>,       title:"Brand Kit",          desc:"Store your colours, fonts and business identity.",       C:BrandKit        },
  { id:"estimator", tier:"free",    icon:<FiPackage size={14}/>,    title:"Project Estimator",  desc:"Build project quotes with task breakdown and margin.",   C:ProjectEstimator},
  { id:"analytics", tier:"premium", icon:<FiBarChart2 size={14}/>,  title:"Earnings Analytics", desc:"Revenue charts, client breakdown and profit tracking.",  C:EarningsAnalytics},
  { id:"contracts", tier:"premium", icon:<FiPaperclip size={14}/>,  title:"Smart Contracts",    desc:"4 contract templates — create, sign and download.",      C:SmartContracts  },
  { id:"proposals", tier:"premium", icon:<FiSend size={14}/>,       title:"Proposal Builder",   desc:"Build and export structured client proposals.",          C:ProposalBuilder },
  { id:"tax",       tier:"premium", icon:<FiShield size={14}/>,     title:"Tax Summary",        desc:"Annual tax report with deductions and estimate.",        C:TaxSummary      },
];



/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Atelier() {
  const { user } = useAuth();
  const isPremium    = user?.plan==="premium";
  const [activeTab,  setActiveTab]  = useState("workspace");
  const [activeId,   setActiveId]   = useState("notes");
  const [sideSearch, setSideSearch] = useState("");

  const access  = t => canAccess(t.tier, user?.plan);
  const active  = TOOLS.find(t=>t.id===activeId);
  const unlocked= TOOLS.filter(t=>access(t)).length;

  // Locked tools still open — the panel shows what the tool does and a link to Billing.
  const openTool = t => { setActiveId(t.id); setActiveTab("workspace"); };

  const visibleTools = TOOLS.filter(t=>!sideSearch||t.title.toLowerCase().includes(sideSearch.toLowerCase()));

  return (
    <div className="at-page">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="at-header">
        <div className="at-header-left">
          <div className="at-header-icon"><FiCpu size={18}/></div>
          <div>
            <h1 className="at-heading">Atelier</h1>
            <p className="at-subheading">Freelance power studio · {unlocked}/{TOOLS.length} tools unlocked</p>
          </div>
        </div>
        <div className="at-header-right">
          <div className={`at-tier-badge${isPremium?" pro":""}`}>
            {isPremium ? <><FiStar size={11}/> Premium</> : <><FiZap size={11}/> Free Plan</>}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="at-tabs">
        {[{id:"workspace",label:"Workspace",icon:<FiList size={12}/>},{id:"tools",label:"All Tools",icon:<FiGrid size={12}/>}].map(t=>(
          <button key={t.id} className={`at-tab${activeTab===t.id?" active":""}`} onClick={()=>setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══ WORKSPACE ══════════════════════════════════ */}
      {activeTab==="workspace"&&(
        <div className="at-workspace">
          {/* Sidebar */}
          <div className="at-sidebar">
            <div className="at-sidebar-search">
              <FiSearch size={11} className="at-search-ico"/>
              <input className="at-search-input" placeholder="Find a tool…" value={sideSearch} onChange={e=>setSideSearch(e.target.value)}/>
              {sideSearch&&<button className="at-x-btn" onClick={()=>setSideSearch("")}><FiX size={10}/></button>}
            </div>
            {["free","premium"].map(tier=>(
              <div key={tier} className="at-sidebar-group">
                <div className="at-sidebar-group-label">{tier==="free"?"Free Tools":"Premium Tools"}</div>
                {visibleTools.filter(t=>t.tier===tier).map(t=>(
                  <button key={t.id} className={`at-tool-btn${activeId===t.id?" active":""}${!access(t)?" locked":""}`} onClick={()=>openTool(t)}>
                    <span className="at-tool-btn-icon">{t.icon}</span>
                    <span className="at-tool-btn-label">{t.title}</span>
                    {!access(t)
                      ? <FiLock size={10} className="at-tool-btn-lock"/>
                      : tier==="premium"
                        ? <span className="at-pro-chip">Pro</span>
                        : null}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div className="at-main-panel">
            {active&&(
              <>
                <div className="at-panel-header">
                  <div className="at-panel-header-left">
                    <span className="at-panel-icon" style={{color:active.tier==="premium"?"var(--at-gold)":"#7DC39A"}}>{active.icon}</span>
                    <div>
                      <h2 className="at-panel-title">{active.title}</h2>
                      <p className="at-panel-desc">{active.desc}</p>
                    </div>
                  </div>
                  <span className="at-tier-chip" style={{color:active.tier==="premium"?"var(--at-gold)":"#7DC39A",borderColor:(active.tier==="premium"?"var(--at-gold)":"#7DC39A")+"40",background:(active.tier==="premium"?"var(--at-gold)":"#7DC39A")+"12"}}>
                    {active.tier === 'premium' ? 'Premium' : 'Free'}
                  </span>
                </div>
                {access(active) ? <active.C/> : <PremiumLock feature={active.title} description={active.desc}/>}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ ALL TOOLS ══════════════════════════════════ */}
      {activeTab==="tools"&&(
        <div className="at-tools-page">
          {["free","premium"].map(tier=>(
            <div key={tier} className="at-tools-section">
              <div className="at-tools-section-label">
                {tier==="free"
                  ? <><FiCheckCircle size={13} style={{color:"#7DC39A"}}/> Free — Always Available</>
                  : <><FiStar size={13} style={{color:"var(--at-gold)"}}/> Premium tools</>}
              </div>
              <div className="at-tools-grid">
                {TOOLS.filter(t=>t.tier===tier).map(t=>(
                  <div key={t.id} className={`at-tool-card${access(t)?" unlocked":" locked"}`} onClick={()=>openTool(t)}>
                    <div className="at-tool-card-top">
                      <span className="at-tool-card-icon" style={{color:access(t)?(tier==="premium"?"var(--at-gold)":"#7DC39A"):"var(--at-tm)"}}>{t.icon}</span>
                      {access(t)
                        ? <span className="at-unlocked-badge"><FiCheckCircle size={10}/> Open</span>
                        : <span className="at-locked-badge"><FiLock size={10}/> Premium</span>}
                    </div>
                    <h3 className="at-tool-card-title">{t.title}</h3>
                    <p className="at-tool-card-desc">{t.desc}</p>
                    <div className="at-tool-card-cta">{access(t)?"Open tool":"See what it does"} <FiChevronRight size={11}/></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}