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
import "../styles/Atelier.css";

/* ── API ─────────────────────────────────────────────────── */
const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const tok  = () => localStorage.getItem("authToken");
const hdrs = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${tok()}` });
const api  = {
  get:    url      => fetch(`${BASE}${url}`, { headers: hdrs() }).then(r => r.json()),
  post:   (url, b) => fetch(`${BASE}${url}`, { method:"POST",   headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  put:    (url, b) => fetch(`${BASE}${url}`, { method:"PUT",    headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  patch:  (url, b) => fetch(`${BASE}${url}`, { method:"PATCH",  headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  delete: url      => fetch(`${BASE}${url}`, { method:"DELETE", headers: hdrs() }).then(r => r.json()),
};

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

/* ── Premium Lock ────────────────────────────────────────── */
const PremiumLock = ({ onUpgrade }) => (
  <div className="at-lock">
    <div className="at-lock-icon"><FiLock size={28}/></div>
    <h3>Premium Feature</h3>
    <p>Upgrade to Premium to unlock this tool and all advanced features.</p>
    <button className="at-btn gold" onClick={onUpgrade}><FiZap size={13}/> Upgrade to Premium</button>
  </div>
);

/* ══════════════════════════════════════════════════════════
   FREE TOOLS
══════════════════════════════════════════════════════════ */

/* ── Quick Notes ─────────────────────────────────────────── */
const QuickNote = () => {
  const [toast, notify] = useToast();
  const [notes,   setNotes]   = useState(() => ls.get("at_notes", []));
  const [input,   setInput]   = useState("");
  const [search,  setSearch]  = useState("");
  const [cat,     setCat]     = useState("All");
  const [editing, setEditing] = useState(null);
  const [editTxt, setEditTxt] = useState("");

  const CATS = ["All","General","Client","Idea","Task","Finance"];

  const save = ns => { setNotes(ns); ls.set("at_notes", ns); };

  const add = () => {
    const t = input.trim(); if (!t) return;
    save([{ id:Date.now(), text:t, cat: cat==="All"?"General":cat, ts:new Date().toLocaleString(), pinned:false }, ...notes].slice(0,100));
    setInput(""); notify("Note added.");
  };

  const del = id => { save(notes.filter(n=>n.id!==id)); notify("Note deleted."); };
  const pin = id => save([...notes.map(n=>n.id===id?{...n,pinned:!n.pinned}:n)].sort((a,b)=>b.pinned-a.pinned));
  const saveEdit = id => { save(notes.map(n=>n.id===id?{...n,text:editTxt}:n)); setEditing(null); notify("Note saved."); };

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
  const [sessions, setSessions] = useState(()=>ls.get("at_sessions",[]));
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
    setSessions(u); ls.set("at_sessions",u);
    setElapsed(0); setLabel(""); notify(`Session saved: ${fmtH(elapsed)}`);
  };

  const del = id => { const u=sessions.filter(s=>s.id!==id); setSessions(u); ls.set("at_sessions",u); };

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
    }).catch(()=>setExpenses(ls.get("at_expenses",[])))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{load();},[load]);

  const add = async()=>{
    if (!f.name.trim()||!f.amount) { notify("Fill name and amount.",true); return; }
    const entry = {...f, amount:parseFloat(f.amount), type:"expense"};
    try { await api.post("/earnings",entry); load(); notify("Expense added."); }
    catch {
      const u = [{id:Date.now(),...entry},...expenses];
      setExpenses(u); ls.set("at_expenses",u); notify("Expense saved locally.");
    }
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
  const [kit, setKit] = useState(()=>ls.get("at_brand",{}));
  const upd = (k,v) => setKit(p=>({...p,[k]:v}));

  const save = ()=>{ ls.set("at_brand",kit); notify("Brand kit saved!"); };

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
                <input type="color" className="at-color-swatch-input" value={kit[k]||"#c9a84c"} onChange={e=>upd(k,e.target.value)}/>
                <input className="at-input at-input-sm" value={kit[k]||"#c9a84c"} onChange={e=>upd(k,e.target.value)} placeholder="#c9a84c"/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {kit.name&&(
        <div className="at-brand-preview" style={{fontFamily:kit.font||"inherit",borderColor:(kit.primary||"#c9a84c")+"40"}}>
          <div className="at-brand-preview-name" style={{color:kit.primary||"#c9a84c"}}>{kit.name}</div>
          {kit.tagline&&<div className="at-brand-preview-tag" style={{color:kit.secondary||"#8e8a82"}}>{kit.tagline}</div>}
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
  const [saved, setSaved] = useState(()=>ls.get("at_estimates",[]));

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
    setSaved(u); ls.set("at_estimates",u);
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
              <button className="at-icon-btn red" onClick={()=>{const u=saved.filter(s=>s.id!==e.id);setSaved(u);ls.set("at_estimates",u);}}><FiTrash2 size={11}/></button>
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
  const [goal,    setGoal]    = useState(() => ls.get("at_revenue_goal", 0));
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
    setGoal(g); ls.set("at_revenue_goal",g); setEditGoal(false);
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
              <span style={{fontSize:11,color:parseFloat(growth)>=0?"#4caf82":"#e05c5c"}}>
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
              <div className="at-breakdown-bar" style={{width:`${Math.min(100,(earned/goal)*100)}%`,background:earned>=goal?"#4caf82":"var(--at-gold)"}}/>
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

/* ── Invoice Generator — REMOVED (use dedicated Invoices page) */
const InvoiceGenerator = () => {
  const { user } = useAuth();
  const [toast, notify] = useToast();
  const [invoices, setInvoices] = useState([]);
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view, setView] = useState("list");

  const blank = ()=>({ clientId:"", clientName:"", clientEmail:"", invoiceNumber:`INV-${Date.now().toString().slice(-5)}`, issueDate:today(), dueDate:"", items:[{desc:"",qty:1,rate:""}], notes:"", taxRate:"0" });
  const [f, setF] = useState(blank);

  const load = useCallback(()=>{
    Promise.all([api.get("/invoices"),api.get("/clients")]).then(([inv,cli])=>{
      setInvoices(arr(inv?.invoices||inv)); setClients(arr(cli?.clients||cli));
    }).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{load();},[load]);

  const updItem = (i,k,v)=>setF(p=>{const items=[...p.items];items[i]={...items[i],[k]:v};return{...p,items};});
  const sub = f.items.reduce((s,i)=>s+(parseFloat(i.qty)||0)*(parseFloat(i.rate)||0),0);
  const tax = sub*((parseFloat(f.taxRate)||0)/100);
  const total = sub+tax;

  const save = async()=>{
    if (!f.clientName.trim()) { notify("Enter a client name.",true); return; }
    if (f.items.every(i=>!i.desc.trim())) { notify("Add at least one line item.",true); return; }
    try {
      await api.post("/invoices",{...f,subtotal:sub,taxAmount:tax,total,status:"draft"});
      notify("Invoice saved!"); load(); setView("list"); setF(blank());
    } catch { notify("Failed to save invoice.",true); }
  };

  const updateStatus = async(id,status)=>{ try { await api.put(`/invoices/${id}`,{status}); load(); } catch { notify("Failed.",true); } };

  const del = async id=>{ try { await api.delete(`/invoices/${id}`); load(); notify("Deleted."); } catch { notify("Failed.",true); } };

  const downloadTxt = inv=>{
    const txt=[`INVOICE ${inv.invoiceNumber}`,`From: ${user?.name||"Your Business"}`,`To: ${inv.clientName} ${inv.clientEmail||""}`,`Date: ${inv.issueDate}  Due: ${inv.dueDate||"N/A"}`,``,`ITEMS:`,
      ...(inv.items||[]).map(i=>`  ${i.desc||i.description}  ×${i.qty||i.quantity}  @$${i.rate}  = $${((parseFloat(i.qty||i.quantity)||0)*(parseFloat(i.rate)||0)).toFixed(2)}`),
      ``,`Subtotal: $${(inv.subtotal||0).toFixed(2)}`,
      inv.taxRate>0?`Tax (${inv.taxRate}%): $${(inv.taxAmount||0).toFixed(2)}`:"",
      `TOTAL: $${(inv.total||0).toFixed(2)}`,
      inv.notes?`\nNotes: ${inv.notes}`:"",
    ].filter(Boolean);
    Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([txt.join("\n")],{type:"text/plain"})),download:`${inv.invoiceNumber}.txt`}).click();
  };

  const earned  = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.total||0),0);
  const pending = invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.total||0),0);
  const overdue = invoices.filter(i=>i.status!=="paid"&&i.dueDate&&new Date(i.dueDate)<new Date()).length;

  if (loading) return <div className="at-tool"><p className="at-empty">Loading invoices…</p></div>;

  if (view==="create") return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <h3 className="at-panel-title">New Invoice</h3>
        <button className="at-btn ghost sm" onClick={()=>setView("list")}><FiX size={11}/> Cancel</button>
      </div>
      {clients.length>0&&<div className="at-field"><label>Select Client</label>
        <select className="at-select" value={f.clientId} onChange={e=>{const c=clients.find(c=>c._id===e.target.value);if(c)setF(p=>({...p,clientId:e.target.value,clientName:c.name,clientEmail:c.email||""}));else setF(p=>({...p,clientId:""}));}}>
          <option value="">— Select or enter manually —</option>
          {clients.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>}
      <div className="at-calc-grid">
        <div className="at-field"><label>Invoice #</label><input className="at-input" value={f.invoiceNumber} onChange={e=>setF(p=>({...p,invoiceNumber:e.target.value}))}/></div>
        <div className="at-field"><label>Issue Date</label><input className="at-input" type="date" value={f.issueDate} onChange={e=>setF(p=>({...p,issueDate:e.target.value}))}/></div>
        <div className="at-field"><label>Due Date</label><input className="at-input" type="date" value={f.dueDate} onChange={e=>setF(p=>({...p,dueDate:e.target.value}))}/></div>
        <div className="at-field"><label>Tax Rate (%)</label><input className="at-input" type="number" placeholder="0" value={f.taxRate} onChange={e=>setF(p=>({...p,taxRate:e.target.value}))}/></div>
      </div>
      <div className="at-field"><label>Bill To (Name)</label><input className="at-input" placeholder="Client or Company" value={f.clientName} onChange={e=>setF(p=>({...p,clientName:e.target.value}))}/></div>
      <div className="at-field"><label>Client Email</label><input className="at-input" type="email" placeholder="client@example.com" value={f.clientEmail} onChange={e=>setF(p=>({...p,clientEmail:e.target.value}))}/></div>
      <div className="at-items-table" style={{marginTop:10}}>
        <div className="at-items-head"><span>Description</span><span>Qty</span><span>Rate ($)</span><span>Total</span><span/></div>
        {f.items.map((item,i)=>(
          <div key={i} className="at-item-row">
            <input className="at-input" placeholder="Service or deliverable…" value={item.desc} onChange={e=>updItem(i,"desc",e.target.value)}/>
            <input className="at-input" type="number" placeholder="1" value={item.qty} onChange={e=>updItem(i,"qty",e.target.value)} style={{maxWidth:70}}/>
            <input className="at-input" type="number" placeholder="0.00" value={item.rate} onChange={e=>updItem(i,"rate",e.target.value)} style={{maxWidth:90}}/>
            <span className="at-item-total">{fmt$((parseFloat(item.qty)||0)*(parseFloat(item.rate)||0))}</span>
            {f.items.length>1&&<button className="at-icon-btn red" onClick={()=>setF(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}))}><FiX size={11}/></button>}
          </div>
        ))}
      </div>
      <button className="at-btn ghost sm" onClick={()=>setF(p=>({...p,items:[...p.items,{desc:"",qty:1,rate:""}]}))}><FiPlus size={11}/> Add Line</button>
      <div className="at-estimate-totals">
        <div className="at-total-row"><span>Subtotal</span><span>{fmt$(sub)}</span></div>
        {parseFloat(f.taxRate)>0&&<div className="at-total-row"><span>Tax ({f.taxRate}%)</span><span>{fmt$(tax)}</span></div>}
        <div className="at-total-row grand"><span>Total</span><strong>{fmt$(total)}</strong></div>
      </div>
      <textarea className="at-input at-ta-sm" placeholder="Notes / payment terms…" value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} rows={2}/>
      <button className="at-btn gold" onClick={save}><FiSave size={12}/> Save Invoice</button>
    </div>
  );

  return (
    <div className="at-tool">
      <Toast toast={toast}/>
      <div className="at-analytics-kpis" style={{marginBottom:14}}>
        <div className="at-kpi-chip gold"><span>{fmt$(earned)}</span><label>Earned</label></div>
        <div className="at-kpi-chip blue"><span>{fmt$(pending)}</span><label>Pending</label></div>
        {overdue>0&&<div className="at-kpi-chip red"><span>{overdue}</span><label>Overdue</label></div>}
        <div className="at-kpi-chip"><span>{invoices.length}</span><label>Total</label></div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h3 className="at-panel-title">Invoices</h3>
        <button className="at-btn gold sm" onClick={()=>setView("create")}><FiPlus size={11}/> New Invoice</button>
      </div>
      {invoices.length===0&&<p className="at-empty">No invoices yet. Create your first one.</p>}
      <ul className="at-invoice-list">
        {invoices.map(inv=>{
          const isOverdue = inv.status!=="paid"&&inv.dueDate&&new Date(inv.dueDate)<new Date();
          return (
            <li key={inv._id} className={`at-invoice-item${isOverdue?" overdue":""}`}>
              <div className="at-inv-left">
                <strong className="at-inv-num">{inv.invoiceNumber}</strong>
                <span className="at-inv-client">{inv.clientName||"No client"}</span>
                <span className="at-inv-date">{inv.issueDate}</span>
                {isOverdue&&<span className="at-overdue-badge">Overdue</span>}
              </div>
              <div className="at-inv-right">
                <span className="at-inv-amount">{fmt$(inv.total||0)}</span>
                <span className={`at-status-chip ${inv.status}`}>{inv.status}</span>
                <div className="at-inv-acts">
                  {inv.status==="draft"&&<button className="at-btn ghost sm" onClick={()=>updateStatus(inv._id,"sent")}>Send</button>}
                  {inv.status!=="paid"&&<button className="at-btn ghost sm" onClick={()=>updateStatus(inv._id,"paid")}><FiCheck size={10}/> Paid</button>}
                  <button className="at-icon-btn" onClick={()=>downloadTxt(inv)}><FiDownload size={11}/></button>
                  <button className="at-icon-btn red" onClick={()=>del(inv._id)}><FiTrash2 size={11}/></button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
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
      .catch(()=>setContracts(ls.get("at_contracts",[])))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{load();},[load]);

  const create = async()=>{
    if (!f.title.trim()) { notify("Enter a contract title.",true); return; }
    const entry = { title:f.title, content:f.content, status:"draft", signed:false, createdAt:new Date().toISOString() };
    try { await api.post("/contracts",entry); load(); }
    catch {
      const u = [{id:Date.now(),...entry},...contracts];
      setContracts(u); ls.set("at_contracts",u);
    }
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
      .catch(()=>setProposals(ls.get("at_proposals",[])))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{load();},[load]);

  const create = async()=>{
    if (!f.title.trim()) { notify("Enter a proposal title.",true); return; }
    const entry = {...f, createdAt:new Date().toISOString(), status:"draft"};
    try { await api.post("/proposals",entry); load(); }
    catch { const u=[{id:Date.now(),...entry},...proposals]; setProposals(u); ls.set("at_proposals",u); }
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

        <div className="at-tax-row"><span>Total Deductions</span><strong style={{color:"#e08888"}}>{fmt$(totalExp)}</strong></div>
        <div className="at-tax-row divider"><span>Taxable Income</span><strong style={{color:"var(--at-gold)"}}>{fmt$(taxable)}</strong></div>
        <div className="at-tax-row"><span>Estimated Tax ({taxRate}%)</span><strong style={{color:"#e08888"}}>{fmt$(estTax)}</strong></div>
        <div className="at-tax-row grand"><span>Net After Tax</span><strong style={{color:"#7fcfaa"}}>{fmt$(taxable-estTax)}</strong></div>
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
  { id:"invoice",   tier:"premium", icon:<FiFileText size={14}/>,   title:"Invoice Generator",  desc:"Create, manage and download professional invoices.",     C:InvoiceGenerator},
  { id:"contracts", tier:"premium", icon:<FiPaperclip size={14}/>,  title:"Smart Contracts",    desc:"4 contract templates — create, sign and download.",      C:SmartContracts  },
  { id:"proposals", tier:"premium", icon:<FiSend size={14}/>,       title:"Proposal Builder",   desc:"Build and export structured client proposals.",          C:ProposalBuilder },
  { id:"tax",       tier:"premium", icon:<FiShield size={14}/>,     title:"Tax Summary",        desc:"Annual tax report with deductions and estimate.",        C:TaxSummary      },
];

const PLANS = [
  { id:"free",    name:"Free",    price:"$0",  period:"forever",  color:"#4caf82",
    perks:["Quick Notes","Rate Calculator","Time Tracker","Expense Tracker","Brand Kit","Project Estimator","Unlimited tasks & clients"] },
  { id:"premium", name:"Premium",price:"$19", period:"/ month",  color:"#c9a84c", popular:true,
    perks:["Everything in Free","Earnings Analytics","Invoice Generator","Smart Contracts","Proposal Builder","Tax Summary Export","Priority support"] },
];

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Atelier() {
  const { user } = useAuth();
  const isPremium    = user?.plan==="premium";
  const [activeTab,  setActiveTab]  = useState("workspace");
  const [activeId,   setActiveId]   = useState("notes");
  const [showUpgrade,setShowUpgrade]= useState(false);
  const [sideSearch, setSideSearch] = useState("");

  const access  = t => canAccess(t.tier, user?.plan);
  const active  = TOOLS.find(t=>t.id===activeId);
  const unlocked= TOOLS.filter(t=>access(t)).length;

  const openTool = t => {
    if (!access(t)) { setShowUpgrade(true); return; }
    setActiveId(t.id); setActiveTab("workspace");
  };

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
          {!isPremium&&(
            <button className="at-btn gold" onClick={()=>setShowUpgrade(true)}><FiArrowRight size={12}/> Upgrade</button>
          )}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="at-tabs">
        {[{id:"workspace",label:"Workspace",icon:<FiList size={12}/>},{id:"tools",label:"All Tools",icon:<FiGrid size={12}/>},{id:"plans",label:"Plans",icon:<FiStar size={12}/>}].map(t=>(
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
                    <span className="at-panel-icon" style={{color:active.tier==="premium"?"var(--at-gold)":"#4caf82"}}>{active.icon}</span>
                    <div>
                      <h2 className="at-panel-title">{active.title}</h2>
                      <p className="at-panel-desc">{active.desc}</p>
                    </div>
                  </div>
                  <span className="at-tier-chip" style={{color:active.tier==="premium"?"var(--at-gold)":"#4caf82",borderColor:(active.tier==="premium"?"var(--at-gold)":"#4caf82")+"40",background:(active.tier==="premium"?"var(--at-gold)":"#4caf82")+"12"}}>
                    {active.tier.toUpperCase()}
                  </span>
                </div>
                {access(active) ? <active.C/> : <PremiumLock onUpgrade={()=>setShowUpgrade(true)}/>}
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
                  ? <><FiCheckCircle size={13} style={{color:"#4caf82"}}/> Free — Always Available</>
                  : <><FiStar size={13} style={{color:"var(--at-gold)"}}/> Premium Plan — $19/mo</>}
              </div>
              <div className="at-tools-grid">
                {TOOLS.filter(t=>t.tier===tier).map(t=>(
                  <div key={t.id} className={`at-tool-card${access(t)?" unlocked":" locked"}`} onClick={()=>openTool(t)}>
                    <div className="at-tool-card-top">
                      <span className="at-tool-card-icon" style={{color:access(t)?(tier==="premium"?"var(--at-gold)":"#4caf82"):"var(--at-tm)"}}>{t.icon}</span>
                      {access(t)
                        ? <span className="at-unlocked-badge"><FiCheckCircle size={10}/> Open</span>
                        : <span className="at-locked-badge"><FiLock size={10}/> Premium</span>}
                    </div>
                    <h3 className="at-tool-card-title">{t.title}</h3>
                    <p className="at-tool-card-desc">{t.desc}</p>
                    <div className="at-tool-card-cta">{access(t)?"Open tool":"Upgrade to unlock"} <FiChevronRight size={11}/></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ PLANS ══════════════════════════════════════ */}
      {activeTab==="plans"&&(
        <div className="at-plans-page">
          <div className="at-plans-intro">
            <h2 className="at-plans-heading">Simple, honest pricing.</h2>
            <p className="at-plans-sub">Start free forever. Upgrade when you need the full toolkit.</p>
          </div>
          <div className="at-plans-grid">
            {PLANS.map(plan=>(
              <div key={plan.id} className={`at-plan-card${plan.popular?" popular":""}${user?.plan===plan.id?" current":""}`} style={{"--plan-color":plan.color}}>
                {plan.popular&&<div className="at-popular-badge"><FiStar size={10}/> Most Popular</div>}
                <h3 className="at-plan-name" style={{color:plan.color}}>{plan.name}</h3>
                <div className="at-plan-price"><span className="at-plan-amount">{plan.price}</span><span className="at-plan-period">{plan.period}</span></div>
                <ul className="at-plan-perks">
                  {plan.perks.map(p=><li key={p}><FiCheckCircle size={11} style={{color:plan.color}}/>{p}</li>)}
                </ul>
                <button className="at-plan-cta" style={{background:user?.plan===plan.id?"transparent":plan.color,color:user?.plan===plan.id?plan.color:"#0a0a0c",borderColor:plan.color}}
                  disabled={user?.plan===plan.id} onClick={()=>user?.plan!==plan.id&&setShowUpgrade(true)}>
                  {user?.plan===plan.id?<><FiCheck size={12}/> Current Plan</>:<><FiZap size={12}/> Get {plan.name}</>}
                </button>
              </div>
            ))}
          </div>
          <p className="at-plans-note"><FiAlertCircle size={11}/> Stripe integration coming soon. Contact support to upgrade manually.</p>
        </div>
      )}

      {/* ── Upgrade Modal ───────────────────────────── */}
      {showUpgrade&&(
        <div className="at-overlay" onClick={()=>setShowUpgrade(false)}>
          <div className="at-modal" onClick={e=>e.stopPropagation()}>
            <button className="at-modal-close" onClick={()=>setShowUpgrade(false)}><FiX size={14}/></button>
            <div className="at-modal-icon"><FiStar size={26}/></div>
            <h2 className="at-modal-title">Unlock Premium</h2>
            <p className="at-modal-sub">Get access to Earnings Analytics, Invoice Generator, Smart Contracts, Proposal Builder, and Tax Summary.</p>
            <div className="at-modal-price"><span className="at-modal-amount">$19</span><span className="at-modal-period">per month · cancel anytime</span></div>
            <button className="at-btn gold" style={{width:"100%",justifyContent:"center",padding:"12px"}} onClick={()=>{setShowUpgrade(false);setActiveTab("plans");}}>
              <FiArrowRight size={13}/> View Plans & Upgrade
            </button>
            <p className="at-modal-note">Stripe integration coming soon. Contact support to upgrade manually.</p>
          </div>
        </div>
      )}
    </div>
  );
}