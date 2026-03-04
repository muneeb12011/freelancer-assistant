// src/pages/Atelier.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  FaCrown, FaLock, FaRocket, FaBolt, FaPalette,
  FaFileContract, FaFileAlt, FaMoneyBillWave,
  FaCalendarCheck, FaDatabase, FaShieldAlt,
  FaCheckCircle, FaTimes, FaStar, FaPlus,
  FaCalculator, FaRegClock, FaStickyNote, FaLink,
  FaChartLine, FaChartBar, FaClipboardList,
  FaTrash, FaEdit, FaDownload, FaSave,
  FaSwatchbook, FaFont, FaInbox,
  FaExternalLinkAlt, FaCheck, FaPen, FaSearch,
} from "react-icons/fa";
import "../styles/Atelier.css";

const TIERS = { free: "free", basic: "basic", pro: "pro" };
const canAccess = (feat, user) => {
  if (feat === TIERS.free)  return true;
  if (feat === TIERS.basic) return user === TIERS.basic || user === TIERS.pro;
  if (feat === TIERS.pro)   return user === TIERS.pro;
  return false;
};

/* ═══════════════════════════════════════════════════
   FREE TOOLS
═══════════════════════════════════════════════════ */

const QuickNote = () => {
  const load = () => { try { return JSON.parse(localStorage.getItem("at_notes") || "[]"); } catch { return []; } };
  const [notes, setNotes] = useState(load);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const sv = arr => { setNotes(arr); localStorage.setItem("at_notes", JSON.stringify(arr)); };
  const add = () => { if (!input.trim()) return; sv([{ id: Date.now(), text: input.trim(), ts: new Date().toLocaleString(), pinned: false }, ...notes].slice(0,50)); setInput(""); };
  const del = id => sv(notes.filter(n => n.id !== id));
  const pin = id => sv([...notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)].sort((a,b) => b.pinned - a.pinned));
  const saveEdit = id => { sv(notes.map(n => n.id === id ? { ...n, text: editText } : n)); setEditing(null); };
  return (
    <div className="at-tool">
      <div className="at-tool-input-row">
        <textarea className="at-input at-textarea-sm" placeholder="Write a note… (Enter to save)" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); add(); } }} rows={3} />
        <button className="at-btn at-btn--gold" onClick={add}><FaPlus /> Add</button>
      </div>
      <p className="at-hint">{notes.length}/50 · Enter to add · Shift+Enter for new line</p>
      {notes.length === 0 && <p className="at-empty">No notes yet.</p>}
      <ul className="at-note-list">
        {notes.map(n => (
          <li key={n.id} className={`at-note-item ${n.pinned ? "pinned" : ""}`}>
            {editing === n.id ? (
              <div className="at-note-edit-row">
                <textarea className="at-input at-textarea-sm" value={editText} onChange={e => setEditText(e.target.value)} rows={2} />
                <button className="at-btn at-btn--gold" onClick={() => saveEdit(n.id)}><FaCheck /></button>
                <button className="at-btn at-btn--ghost" onClick={() => setEditing(null)}><FaTimes /></button>
              </div>
            ) : (
              <>
                <span className="at-note-text">{n.text}</span>
                <span className="at-note-meta">{n.ts}</span>
                <div className="at-note-actions">
                  <button title="Pin" onClick={() => pin(n.id)} className={`at-icon-btn ${n.pinned ? "gold" : ""}`}><FaStar /></button>
                  <button title="Edit" onClick={() => { setEditing(n.id); setEditText(n.text); }} className="at-icon-btn"><FaEdit /></button>
                  <button title="Delete" onClick={() => del(n.id)} className="at-icon-btn red"><FaTrash /></button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const RateCalc = () => {
  const [f, setF] = useState({ income:"", hours:"", weeks:"48", expenses:"", tax:"25", buffer:"20" });
  const [result, setResult] = useState(null);
  const s = (k,v) => setF(p => ({ ...p, [k]: v }));
  const calc = () => {
    const inc=parseFloat(f.income)||0, hrs=parseFloat(f.hours)||1, wks=parseFloat(f.weeks)||48;
    const exp=parseFloat(f.expenses)||0, tax=parseFloat(f.tax)/100||0, buf=parseFloat(f.buffer)/100||0;
    const base=(inc+exp)/(hrs*wks), withTax=base/(1-tax), final=withTax/(1-buf);
    setResult({ base:base.toFixed(2), withTax:withTax.toFixed(2), final:final.toFixed(2), annual:inc.toLocaleString() });
  };
  return (
    <div className="at-tool">
      <div className="at-calc-grid-2">
        {[["income","Target Annual Income ($)","60000"],["hours","Hours Per Week","40"],["weeks","Working Weeks / Year","48"],["expenses","Annual Business Expenses ($)","5000"],["tax","Tax Rate (%)","25"],["buffer","Buffer / Scope Creep (%)","20"]].map(([k,label,ph]) => (
          <div key={k} className="at-calc-field"><label className="at-calc-label">{label}</label><input className="at-input" type="number" placeholder={ph} value={f[k]} onChange={e => s(k,e.target.value)} /></div>
        ))}
      </div>
      <button className="at-btn at-btn--gold" onClick={calc}><FaCalculator /> Calculate</button>
      {result && (
        <div className="at-calc-results">
          <div className="at-calc-result-row"><span>Base rate</span><strong>${result.base}/hr</strong></div>
          <div className="at-calc-result-row"><span>After tax ({f.tax}%)</span><strong>${result.withTax}/hr</strong></div>
          <div className="at-calc-result-row highlight"><span>✦ Recommended rate</span><strong>${result.final}/hr</strong></div>
          <p className="at-hint">To earn ${result.annual}/yr after taxes and expenses</p>
        </div>
      )}
    </div>
  );
};

const SimpleTimer = () => {
  const load = () => { try { return JSON.parse(localStorage.getItem("at_sessions") || "[]"); } catch { return []; } };
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [label, setLabel] = useState("");
  const [sessions, setSessions] = useState(load);
  const ref = useRef(null);
  useEffect(() => { if (running) ref.current = setInterval(() => setElapsed(e => e+1), 1000); else clearInterval(ref.current); return () => clearInterval(ref.current); }, [running]);
  const fmt = s => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const fmtH = s => `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
  const stop = () => {
    setRunning(false); if (elapsed < 1) return;
    const sn = { id:Date.now(), label:label||"Untitled", duration:fmt(elapsed), mins:Math.ceil(elapsed/60), date:new Date().toLocaleDateString() };
    const u = [sn,...sessions].slice(0,20); setSessions(u); localStorage.setItem("at_sessions", JSON.stringify(u)); setElapsed(0); setLabel("");
  };
  const del = id => { const u = sessions.filter(s => s.id !== id); setSessions(u); localStorage.setItem("at_sessions", JSON.stringify(u)); };
  const total = sessions.reduce((a,s) => a+(s.mins||0), 0);
  return (
    <div className="at-tool">
      <input className="at-input" placeholder="What are you working on?" value={label} onChange={e => setLabel(e.target.value)} />
      <div className={`at-timer-display ${running ? "running" : ""}`}>{fmt(elapsed)}</div>
      <div className="at-timer-btns">
        {!running ? <button className="at-btn at-btn--gold" onClick={() => setRunning(true)}>▶ Start</button>
                  : <button className="at-btn at-btn--red" onClick={stop}>■ Stop & Save</button>}
        {!running && elapsed > 0 && <button className="at-btn at-btn--ghost" onClick={() => setElapsed(0)}>↺ Reset</button>}
      </div>
      {sessions.length > 0 && <>
        <div className="at-timer-total">Total tracked: <strong>{fmtH(total*60)}</strong> across {sessions.length} sessions</div>
        <ul className="at-session-list">{sessions.map(s => (
          <li key={s.id} className="at-session-item">
            <span className="at-session-label">{s.label}</span>
            <span className="at-session-dur">{s.duration}</span>
            <span className="at-session-date">{s.date}</span>
            <button className="at-icon-btn red" onClick={() => del(s.id)}><FaTrash /></button>
          </li>
        ))}</ul>
      </>}
    </div>
  );
};

const LinkVault = () => {
  const load = () => { try { return JSON.parse(localStorage.getItem("at_links") || "[]"); } catch { return []; } };
  const [links, setLinks] = useState(load);
  const [url, setUrl] = useState(""); const [lbl, setLbl] = useState(""); const [cat, setCat] = useState("General"); const [search, setSearch] = useState("");
  const CATS = ["General","Client","Resource","Tool","Reference","Brief"];
  const sv = arr => { setLinks(arr); localStorage.setItem("at_links", JSON.stringify(arr)); };
  const add = () => { if (!url.trim()) return; const href = url.startsWith("http")?url:"https://"+url; sv([{ id:Date.now(), url:href, label:lbl||href, cat, date:new Date().toLocaleDateString() },...links].slice(0,50)); setUrl(""); setLbl(""); };
  const del = id => sv(links.filter(l => l.id !== id));
  const filtered = links.filter(l => l.label.toLowerCase().includes(search.toLowerCase()) || l.url.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="at-tool">
      <div className="at-link-form">
        <input className="at-input" placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} />
        <input className="at-input" placeholder="Label (optional)" value={lbl} onChange={e => setLbl(e.target.value)} />
        <select className="at-select" value={cat} onChange={e => setCat(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
        <button className="at-btn at-btn--gold" onClick={add}><FaSave /> Save</button>
      </div>
      {links.length > 3 && <input className="at-input" placeholder="🔍 Search links…" value={search} onChange={e => setSearch(e.target.value)} />}
      {filtered.length === 0 && <p className="at-empty">No links yet.</p>}
      <ul className="at-link-list">{filtered.map(l => (
        <li key={l.id} className="at-link-item">
          <span className="at-link-cat">{l.cat}</span>
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="at-link-anchor"><FaExternalLinkAlt /> {l.label}</a>
          <span className="at-session-date">{l.date}</span>
          <button className="at-icon-btn red" onClick={() => del(l.id)}><FaTrash /></button>
        </li>
      ))}</ul>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   BASIC TOOLS
═══════════════════════════════════════════════════ */

const ExpenseTracker = () => {
  const load = () => { try { return JSON.parse(localStorage.getItem("at_expenses") || "[]"); } catch { return []; } };
  const [expenses, setExpenses] = useState(load);
  const [f, setF] = useState({ name:"", amount:"", category:"Software", date:new Date().toISOString().split("T")[0], note:"" });
  const CATS = ["Software","Hardware","Marketing","Travel","Office","Education","Contractor","Other"];
  const sv = arr => { setExpenses(arr); localStorage.setItem("at_expenses", JSON.stringify(arr)); };
  const add = () => { if (!f.name.trim() || !f.amount) return; sv([{ id:Date.now(), ...f, amount:parseFloat(f.amount) },...expenses]); setF({ name:"", amount:"", category:"Software", date:new Date().toISOString().split("T")[0], note:"" }); };
  const del = id => sv(expenses.filter(e => e.id !== id));
  const total = expenses.reduce((s,e) => s+e.amount, 0);
  const bycat = CATS.map(c => ({ cat:c, total:expenses.filter(e => e.category===c).reduce((s,e)=>s+e.amount,0) })).filter(c=>c.total>0);
  const exportCSV = () => { const csv = ["Name,Amount,Category,Date,Note",...expenses.map(e => `"${e.name}",${e.amount},"${e.category}","${e.date}","${e.note}"`)].join("\n"); const b=new Blob([csv],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download="expenses.csv"; a.click(); };
  return (
    <div className="at-tool">
      <div className="at-expense-form">
        <input className="at-input" placeholder="Expense name" value={f.name} onChange={e => setF(p=>({...p,name:e.target.value}))} />
        <input className="at-input" type="number" placeholder="Amount ($)" value={f.amount} onChange={e => setF(p=>({...p,amount:e.target.value}))} />
        <select className="at-select" value={f.category} onChange={e => setF(p=>({...p,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
        <input className="at-input" type="date" value={f.date} onChange={e => setF(p=>({...p,date:e.target.value}))} />
        <input className="at-input" placeholder="Note (optional)" value={f.note} onChange={e => setF(p=>({...p,note:e.target.value}))} />
        <button className="at-btn at-btn--gold" onClick={add}><FaPlus /> Add</button>
      </div>
      {expenses.length > 0 && <>
        <div className="at-expense-summary">
          <div className="at-stat-card gold"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
          <div className="at-stat-card"><span>Entries</span><strong>{expenses.length}</strong></div>
          {bycat.map(c => <div key={c.cat} className="at-stat-card"><span>{c.cat}</span><strong>${c.total.toFixed(2)}</strong></div>)}
        </div>
        <button className="at-btn at-btn--ghost" onClick={exportCSV}><FaDownload /> Export CSV</button>
        <ul className="at-expense-list">{expenses.map(e => (
          <li key={e.id} className="at-expense-item">
            <span className="at-link-cat">{e.category}</span>
            <span className="at-expense-name">{e.name}</span>
            <span className="at-expense-amount">${e.amount.toFixed(2)}</span>
            <span className="at-session-date">{e.date}</span>
            {e.note && <span className="at-hint-sm">{e.note}</span>}
            <button className="at-icon-btn red" onClick={() => del(e.id)}><FaTrash /></button>
          </li>
        ))}</ul>
      </>}
      {expenses.length === 0 && <p className="at-empty">No expenses logged yet.</p>}
    </div>
  );
};

const RecurringInvoices = () => {
  const load = () => { try { return JSON.parse(localStorage.getItem("at_recurring") || "[]"); } catch { return []; } };
  const [invoices, setInvoices] = useState(load);
  const [f, setF] = useState({ client:"", amount:"", frequency:"Monthly", nextDate:"", description:"" });
  const sv = arr => { setInvoices(arr); localStorage.setItem("at_recurring", JSON.stringify(arr)); };
  const add = () => { if (!f.client.trim()||!f.amount||!f.nextDate) return; sv([{ id:Date.now(), ...f, amount:parseFloat(f.amount), active:true, sent:0 },...invoices]); setF({ client:"", amount:"", frequency:"Monthly", nextDate:"", description:"" }); };
  const toggle = id => sv(invoices.map(i => i.id===id ? {...i,active:!i.active} : i));
  const del = id => sv(invoices.filter(i => i.id!==id));
  const markSent = id => sv(invoices.map(i => i.id===id ? {...i,sent:(i.sent||0)+1} : i));
  return (
    <div className="at-tool">
      <div className="at-recur-form">
        <input className="at-input" placeholder="Client name" value={f.client} onChange={e => setF(p=>({...p,client:e.target.value}))} />
        <input className="at-input" type="number" placeholder="Amount ($)" value={f.amount} onChange={e => setF(p=>({...p,amount:e.target.value}))} />
        <select className="at-select" value={f.frequency} onChange={e => setF(p=>({...p,frequency:e.target.value}))}>
          {["Weekly","Bi-weekly","Monthly","Quarterly","Annually"].map(v=><option key={v}>{v}</option>)}
        </select>
        <input className="at-input" type="date" value={f.nextDate} onChange={e => setF(p=>({...p,nextDate:e.target.value}))} />
        <input className="at-input" placeholder="Description (optional)" value={f.description} onChange={e => setF(p=>({...p,description:e.target.value}))} />
        <button className="at-btn at-btn--gold" onClick={add}><FaPlus /> Add Schedule</button>
      </div>
      {invoices.length === 0 && <p className="at-empty">No recurring schedules yet.</p>}
      <ul className="at-recur-list">{invoices.map(i => (
        <li key={i.id} className={`at-recur-item ${!i.active?"inactive":""}`}>
          <div className="at-recur-info">
            <strong>{i.client}</strong>
            <span className="at-link-cat">{i.frequency}</span>
            <span className="at-expense-amount">${parseFloat(i.amount).toFixed(2)}</span>
            <span className="at-session-date">Next: {i.nextDate}</span>
            <span className="at-hint-sm">Sent {i.sent||0}×</span>
          </div>
          {i.description && <p className="at-recur-desc">{i.description}</p>}
          <div className="at-recur-actions">
            <button className="at-btn at-btn--ghost" onClick={() => markSent(i.id)}><FaCheck /> Mark Sent</button>
            <button className={`at-btn ${i.active?"at-btn--ghost":"at-btn--gold"}`} onClick={() => toggle(i.id)}>{i.active?"Pause":"Resume"}</button>
            <button className="at-icon-btn red" onClick={() => del(i.id)}><FaTrash /></button>
          </div>
        </li>
      ))}</ul>
    </div>
  );
};

const BrandKit = () => {
  const load = () => { try { return JSON.parse(localStorage.getItem("at_brand") || "{}"); } catch { return {}; } };
  const [kit, setKit] = useState(load);
  const [saved, setSaved] = useState(false);
  const upd = (k,v) => setKit(p=>({...p,[k]:v}));
  const save = () => { localStorage.setItem("at_brand", JSON.stringify(kit)); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  return (
    <div className="at-tool">
      <div className="at-brand-grid">
        <div className="at-brand-section">
          <h4 className="at-brand-heading"><FaFont /> Identity</h4>
          {[["name","Business Name","Acme Design Co.","text"],["tagline","Tagline","Crafting digital experiences","text"],["website","Website","https://yoursite.com","text"],["email","Contact Email","hello@yoursite.com","email"]].map(([k,label,ph,type]) => (
            <div key={k}><label className="at-calc-label">{label}</label><input className="at-input" type={type} placeholder={ph} value={kit[k]||""} onChange={e => upd(k,e.target.value)} /></div>
          ))}
          <label className="at-calc-label">Primary Font</label>
          <select className="at-select" value={kit.font||"DM Sans"} onChange={e => upd("font",e.target.value)}>
            {["DM Sans","DM Serif Display","Inter","Playfair Display","Montserrat","Raleway","Poppins","Lato"].map(f=><option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="at-brand-section">
          <h4 className="at-brand-heading"><FaSwatchbook /> Colors</h4>
          {[["primary","Primary"],["secondary","Secondary"],["accent","Accent"],["bg","Background"],["text","Text"]].map(([k,label]) => (
            <div key={k} className="at-color-row">
              <label className="at-calc-label">{label}</label>
              <div className="at-color-pick-row">
                <input type="color" className="at-color-input" value={kit[k]||"#c9a84c"} onChange={e => upd(k,e.target.value)} />
                <input className="at-input at-input--sm" value={kit[k]||"#c9a84c"} onChange={e => upd(k,e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {kit.name && (
        <div className="at-brand-preview" style={{ fontFamily:kit.font, borderColor:(kit.primary||"#c9a84c")+"55", background:kit.bg||undefined }}>
          <strong style={{ color:kit.primary||"#c9a84c", fontSize:22 }}>{kit.name}</strong>
          {kit.tagline && <p style={{ color:kit.secondary||"#8e8a82" }}>{kit.tagline}</p>}
          <div className="at-brand-colors">
            {["primary","secondary","accent"].map(k => kit[k] && <span key={k} className="at-color-swatch" style={{ background:kit[k] }} title={kit[k]} />)}
          </div>
          {kit.website && <a href={kit.website} target="_blank" rel="noopener noreferrer" className="at-link-anchor" style={{ fontSize:12 }}><FaExternalLinkAlt /> {kit.website}</a>}
        </div>
      )}
      <button className={`at-btn ${saved?"at-btn--success":"at-btn--gold"}`} onClick={save}>{saved ? <><FaCheck /> Saved!</> : <><FaSave /> Save Brand Kit</>}</button>
    </div>
  );
};

const CloudBackup = () => {
  const KEYS = ["tasks","contracts","reports","at_notes","at_sessions","at_links","at_expenses","at_recurring","at_brand","at_invoices","at_proposals","at_contracts_pro"];
  const [status, setStatus] = useState("idle");
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem("at_last_backup")||null);
  const backup = () => {
    setStatus("backing");
    const data = {}; KEYS.forEach(k => { const v = localStorage.getItem(k); if (v) data[k]=v; }); data._meta = { date:new Date().toISOString(), version:"1.0" };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"}); const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`aurelance_backup_${new Date().toISOString().split("T")[0]}.json`; a.click();
    const ts = new Date().toLocaleString(); localStorage.setItem("at_last_backup",ts); setLastBackup(ts); setTimeout(()=>setStatus("done"),800);
  };
  const restore = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { try { const data=JSON.parse(ev.target.result); Object.entries(data).forEach(([k,v])=>{ if(k!=="_meta") localStorage.setItem(k,v); }); setStatus("restored"); setTimeout(()=>setStatus("idle"),2500); } catch { setStatus("error"); } };
    reader.readAsText(file);
  };
  const dataSize = KEYS.reduce((s,k)=>s+(localStorage.getItem(k)||"").length,0);
  return (
    <div className="at-tool">
      <div className="at-backup-stats">
        <div className="at-stat-card"><span>Data Size</span><strong>{(dataSize/1024).toFixed(1)} KB</strong></div>
        <div className="at-stat-card"><span>Keys Stored</span><strong>{KEYS.filter(k=>localStorage.getItem(k)).length}</strong></div>
        <div className="at-stat-card"><span>Last Backup</span><strong style={{fontSize:11}}>{lastBackup||"Never"}</strong></div>
      </div>
      <div className="at-backup-actions">
        <button className={`at-btn ${status==="done"?"at-btn--success":"at-btn--gold"}`} onClick={backup}>
          {status==="backing"?"Backing up…":status==="done"?<><FaCheck /> Downloaded!</>:<><FaDownload /> Download Backup</>}
        </button>
        <label className="at-btn at-btn--ghost" style={{cursor:"pointer"}}><FaInbox /> Restore from File<input type="file" accept=".json" style={{display:"none"}} onChange={restore} /></label>
      </div>
      {status==="restored" && <div className="at-banner-success">✓ Data restored successfully! Refresh the page to see changes.</div>}
      {status==="error"    && <div className="at-banner-error">✕ Invalid backup file. Please use a valid Aurelance backup.</div>}
      <p className="at-hint">Backup saves all your notes, tasks, invoices, contracts, and settings as a JSON file.</p>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   PRO TOOLS
═══════════════════════════════════════════════════ */

const InvoiceGenerator = () => {
  const load = () => { try { return JSON.parse(localStorage.getItem("at_invoices")||"[]"); } catch { return []; } };
  const brand = (() => { try { return JSON.parse(localStorage.getItem("at_brand")||"{}"); } catch { return {}; } })();
  const [invoices, setInvoices] = useState(load);
  const [view, setView] = useState("list");
  const blank = () => ({ client:"", clientEmail:"", clientAddress:"", invoiceNum:`INV-${Date.now().toString().slice(-5)}`, date:new Date().toISOString().split("T")[0], dueDate:"", items:[{desc:"",qty:1,rate:""}], notes:"", tax:"0" });
  const [f, setF] = useState(blank);
  const sv = arr => { setInvoices(arr); localStorage.setItem("at_invoices", JSON.stringify(arr)); };
  const addItem = () => setF(p=>({...p,items:[...p.items,{desc:"",qty:1,rate:""}]}));
  const updItem = (i,k,v) => setF(p => { const items=[...p.items]; items[i]={...items[i],[k]:v}; return {...p,items}; });
  const delItem = i => setF(p=>({...p,items:p.items.filter((_,idx)=>idx!==i)}));
  const subtotal = f.items.reduce((s,i)=>s+(parseFloat(i.qty)||0)*(parseFloat(i.rate)||0),0);
  const taxAmt = subtotal*(parseFloat(f.tax)/100||0);
  const total = subtotal+taxAmt;
  const save = () => { const inv={...f,id:Date.now(),subtotal,taxAmt,total,status:"draft",createdAt:new Date().toISOString()}; sv([inv,...invoices]); setView("list"); setF(blank()); };
  const markPaid = id => sv(invoices.map(i=>i.id===id?{...i,status:"paid"}:i));
  const del = id => sv(invoices.filter(i=>i.id!==id));
  const downloadTxt = inv => {
    const lines = [`INVOICE ${inv.invoiceNum}`,`Date: ${inv.date}  Due: ${inv.dueDate||"N/A"}`,``,`FROM: ${brand.name||"Your Business"}`,`TO: ${inv.client}  ${inv.clientEmail}`,``,`ITEMS:`,
      ...(inv.items||[]).map(it=>`  ${it.desc}  x${it.qty}  @$${it.rate}  = $${((parseFloat(it.qty)||0)*(parseFloat(it.rate)||0)).toFixed(2)}`),
      ``,`Subtotal: $${(inv.subtotal||0).toFixed(2)}`,`Tax: $${(inv.taxAmt||0).toFixed(2)}`,`TOTAL: $${(inv.total||0).toFixed(2)}`,
      inv.notes?`\nNotes: ${inv.notes}`:""
    ];
    const b=new Blob([lines.join("\n")],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=`${inv.invoiceNum}.txt`; a.click();
  };
  const totalEarned = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.total||0),0);
  const pending = invoices.filter(i=>i.status!=="paid").reduce((s,i)=>s+(i.total||0),0);

  if (view === "create") return (
    <div className="at-tool">
      <div className="at-invoice-header-row"><button className="at-btn at-btn--ghost" onClick={()=>setView("list")}><FaTimes /> Cancel</button><h3 className="at-sub-heading">New Invoice</h3></div>
      <div className="at-calc-grid-2">
        <div className="at-calc-field"><label className="at-calc-label">Invoice #</label><input className="at-input" value={f.invoiceNum} onChange={e=>setF(p=>({...p,invoiceNum:e.target.value}))} /></div>
        <div className="at-calc-field"><label className="at-calc-label">Issue Date</label><input className="at-input" type="date" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))} /></div>
        <div className="at-calc-field"><label className="at-calc-label">Due Date</label><input className="at-input" type="date" value={f.dueDate} onChange={e=>setF(p=>({...p,dueDate:e.target.value}))} /></div>
        <div className="at-calc-field"><label className="at-calc-label">Tax Rate (%)</label><input className="at-input" type="number" placeholder="0" value={f.tax} onChange={e=>setF(p=>({...p,tax:e.target.value}))} /></div>
      </div>
      <label className="at-calc-label" style={{marginTop:8}}>Bill To</label>
      <input className="at-input" placeholder="Client / Company Name" value={f.client} onChange={e=>setF(p=>({...p,client:e.target.value}))} />
      <input className="at-input" placeholder="Client Email" value={f.clientEmail} onChange={e=>setF(p=>({...p,clientEmail:e.target.value}))} />
      <input className="at-input" placeholder="Client Address (optional)" value={f.clientAddress} onChange={e=>setF(p=>({...p,clientAddress:e.target.value}))} />
      <label className="at-calc-label" style={{marginTop:8}}>Line Items</label>
      <div className="at-items-header"><span>Description</span><span>Qty</span><span>Rate ($)</span><span>Total</span><span/></div>
      {f.items.map((item,i) => (
        <div key={i} className="at-item-row">
          <input className="at-input" placeholder="Service…" value={item.desc} onChange={e=>updItem(i,"desc",e.target.value)} />
          <input className="at-input" type="number" placeholder="1" value={item.qty} onChange={e=>updItem(i,"qty",e.target.value)} />
          <input className="at-input" type="number" placeholder="0.00" value={item.rate} onChange={e=>updItem(i,"rate",e.target.value)} />
          <span className="at-item-total">${((parseFloat(item.qty)||0)*(parseFloat(item.rate)||0)).toFixed(2)}</span>
          {f.items.length>1 && <button className="at-icon-btn red" onClick={()=>delItem(i)}><FaTimes /></button>}
        </div>
      ))}
      <button className="at-btn at-btn--ghost" style={{marginBottom:8}} onClick={addItem}><FaPlus /> Add Line</button>
      <div className="at-inv-totals">
        <div className="at-inv-total-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        {parseFloat(f.tax)>0 && <div className="at-inv-total-row"><span>Tax ({f.tax}%)</span><span>${taxAmt.toFixed(2)}</span></div>}
        <div className="at-inv-total-row total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
      </div>
      <textarea className="at-input at-textarea-sm" placeholder="Notes / payment terms…" value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} rows={2} />
      <button className="at-btn at-btn--gold" onClick={save}><FaSave /> Save Invoice</button>
    </div>
  );

  return (
    <div className="at-tool">
      <div className="at-expense-summary" style={{marginBottom:12}}>
        <div className="at-stat-card gold"><span>Earned</span><strong>${totalEarned.toFixed(2)}</strong></div>
        <div className="at-stat-card"><span>Pending</span><strong>${pending.toFixed(2)}</strong></div>
        <div className="at-stat-card"><span>Total</span><strong>{invoices.length}</strong></div>
      </div>
      <div className="at-invoice-header-row">
        <h3 className="at-sub-heading">Invoices</h3>
        <button className="at-btn at-btn--gold" onClick={()=>setView("create")}><FaPlus /> New Invoice</button>
      </div>
      {invoices.length===0 && <p className="at-empty">No invoices yet.</p>}
      <ul className="at-invoice-list">{invoices.map(inv => (
        <li key={inv.id} className="at-invoice-item">
          <div className="at-invoice-meta">
            <strong>{inv.invoiceNum}</strong><span>{inv.client||"No client"}</span>
            <span className={`at-status ${inv.status}`}>{inv.status}</span>
            <span className="at-session-date">{inv.date}</span>
          </div>
          <div className="at-invoice-amount">${(inv.total||0).toFixed(2)}</div>
          <div className="at-recur-actions">
            {inv.status!=="paid" && <button className="at-btn at-btn--ghost" onClick={()=>markPaid(inv.id)}><FaCheck /> Paid</button>}
            <button className="at-btn at-btn--ghost" onClick={()=>downloadTxt(inv)}><FaDownload /></button>
            <button className="at-icon-btn red" onClick={()=>del(inv.id)}><FaTrash /></button>
          </div>
        </li>
      ))}</ul>
    </div>
  );
};

const EarningsAnalytics = () => {
  const invoices = (() => { try { return JSON.parse(localStorage.getItem("at_invoices")||"[]"); } catch { return []; } })();
  const expenses = (() => { try { return JSON.parse(localStorage.getItem("at_expenses")||"[]"); } catch { return []; } })();
  const paid = invoices.filter(i=>i.status==="paid");
  const earned = paid.reduce((s,i)=>s+(i.total||0),0);
  const spent = expenses.reduce((s,e)=>s+(e.amount||0),0);
  const net = earned - spent;
  const byMonth = {}; paid.forEach(i=>{ const m=(i.date||"").slice(0,7); byMonth[m]=(byMonth[m]||0)+(i.total||0); });
  const months = Object.entries(byMonth).sort(([a],[b])=>a.localeCompare(b)).slice(-6);
  const maxV = Math.max(...months.map(([,v])=>v),1);
  const byClient = {}; paid.forEach(i=>{ byClient[i.client||"Unknown"]=(byClient[i.client||"Unknown"]||0)+(i.total||0); });
  const topClients = Object.entries(byClient).sort(([,a],[,b])=>b-a).slice(0,5);
  return (
    <div className="at-tool">
      <div className="at-analytics-stats">
        <div className="at-stat-card gold"><span>Total Earned</span><strong>${earned.toFixed(2)}</strong></div>
        <div className="at-stat-card red"><span>Expenses</span><strong>${spent.toFixed(2)}</strong></div>
        <div className={`at-stat-card ${net>=0?"green":"red"}`}><span>Net Profit</span><strong>${net.toFixed(2)}</strong></div>
        <div className="at-stat-card"><span>Paid Invoices</span><strong>{paid.length}</strong></div>
      </div>
      {months.length>0 ? (
        <div className="at-chart-section">
          <h4 className="at-brand-heading">Monthly Revenue</h4>
          <div className="at-bar-chart">{months.map(([m,v]) => (
            <div key={m} className="at-bar-col">
              <span className="at-bar-val">${v.toFixed(0)}</span>
              <div className="at-bar" style={{height:`${(v/maxV)*100}%`}} />
              <span className="at-bar-label">{m.slice(5)}</span>
            </div>
          ))}</div>
        </div>
      ) : <p className="at-empty">No paid invoices yet. Mark invoices as paid to see analytics here.</p>}
      {topClients.length>0 && (
        <div className="at-chart-section">
          <h4 className="at-brand-heading">Top Clients by Revenue</h4>
          {topClients.map(([client,amount]) => (
            <div key={client} className="at-client-row">
              <span className="at-client-name">{client}</span>
              <div className="at-client-bar-wrap"><div className="at-client-bar" style={{width:`${(amount/topClients[0][1])*100}%`}} /></div>
              <span className="at-client-amount">${amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SmartContracts = () => {
  const TMPL = {
    "Freelance Service": `FREELANCE SERVICE AGREEMENT\nDate: [DATE]\nFreelancer: [YOUR NAME]\nClient: [CLIENT NAME]\n\n1. SERVICES\n[Describe the services to be provided]\n\n2. PAYMENT\nTotal fee: $[AMOUNT]\nPayment schedule: [e.g. 50% upfront, 50% on delivery]\n\n3. TIMELINE\nProject start: [START DATE]\nDeadline: [END DATE]\n\n4. REVISIONS\n[Number] rounds of revisions included.\n\n5. INTELLECTUAL PROPERTY\nUpon full payment, all deliverables become property of Client.\n\n6. CONFIDENTIALITY\nBoth parties agree to maintain confidentiality of proprietary information.\n\n_________________________     Date: __________\nFreelancer Signature\n\n_________________________     Date: __________\nClient Signature`,
    "NDA": `NON-DISCLOSURE AGREEMENT\nDate: [DATE]\nParty A: [YOUR NAME]\nParty B: [CLIENT NAME]\n\n1. CONFIDENTIAL INFORMATION includes any business data, technical info, or client lists shared between parties.\n\n2. OBLIGATIONS\nNeither party will disclose confidential information to third parties without written consent.\n\n3. TERM\nThis NDA is effective for [DURATION] from the date above.\n\n4. EXCEPTIONS\nThis agreement does not apply to information that is publicly known or independently developed.\n\n_________________________     Date: __________\nSignature (Party A)\n\n_________________________     Date: __________\nSignature (Party B)`,
    "Retainer": `RETAINER AGREEMENT\nDate: [DATE]\nConsultant: [YOUR NAME]\nClient: [CLIENT NAME]\n\n1. RETAINER FEE\n$[AMOUNT] per month for [HOURS] hours of availability.\n\n2. SERVICES\n[Describe scope: design, development, consulting, etc.]\n\n3. ROLLOVER\nUnused hours [do/do not] roll over to the next month.\n\n4. TERM\nBegins [START DATE], renews monthly unless cancelled with 30 days notice.\n\n_________________________     Date: __________\nConsultant Signature\n\n_________________________     Date: __________\nClient Signature`,
  };
  const load = () => { try { return JSON.parse(localStorage.getItem("at_contracts_pro")||"[]"); } catch { return []; } };
  const [contracts, setContracts] = useState(load);
  const [view, setView] = useState("list");
  const [f, setF] = useState({ title:"", content:"" });
  const sv = arr => { setContracts(arr); localStorage.setItem("at_contracts_pro", JSON.stringify(arr)); };
  const create = () => { if (!f.title.trim()) return; sv([{ id:Date.now(), ...f, status:"draft", createdAt:new Date().toISOString(), signed:false },...contracts]); setView("list"); setF({title:"",content:""}); };
  const sign = id => sv(contracts.map(c=>c.id===id?{...c,signed:true,status:"signed",signedAt:new Date().toISOString()}:c));
  const del = id => sv(contracts.filter(c=>c.id!==id));
  const download = c => { const b=new Blob([`${c.title}\n\n${c.content}`],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=`${c.title.replace(/\s+/g,"_")}.txt`; a.click(); };

  if (view==="create") return (
    <div className="at-tool">
      <button className="at-btn at-btn--ghost" onClick={()=>setView("list")}><FaTimes /> Cancel</button>
      <input className="at-input" placeholder="Contract title (e.g. Project Agreement — Acme Corp)" value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} />
      <div className="at-template-btns">
        <label className="at-calc-label" style={{alignSelf:"center"}}>Use template:</label>
        {Object.keys(TMPL).map(t => <button key={t} className="at-btn at-btn--ghost" onClick={()=>setF(p=>({...p,content:TMPL[t]}))}>{t}</button>)}
      </div>
      <textarea className="at-input at-textarea-lg" value={f.content} onChange={e=>setF(p=>({...p,content:e.target.value}))} placeholder="Write or paste contract text, or pick a template above to get started…" rows={14} />
      <button className="at-btn at-btn--gold" onClick={create}><FaSave /> Save Contract</button>
    </div>
  );

  return (
    <div className="at-tool">
      <div className="at-invoice-header-row"><h3 className="at-sub-heading">Contracts ({contracts.length})</h3><button className="at-btn at-btn--gold" onClick={()=>setView("create")}><FaPlus /> New Contract</button></div>
      {contracts.length===0 && <p className="at-empty">No contracts yet. Create one using a template or from scratch.</p>}
      <ul className="at-contract-list">{contracts.map(c => (
        <li key={c.id} className="at-contract-item">
          <div className="at-contract-info"><strong>{c.title}</strong><span className={`at-status ${c.status}`}>{c.status}</span><span className="at-session-date">{new Date(c.createdAt).toLocaleDateString()}</span></div>
          <div className="at-recur-actions">
            {!c.signed && <button className="at-btn at-btn--gold" onClick={()=>sign(c.id)}><FaPen /> Sign</button>}
            <button className="at-btn at-btn--ghost" onClick={()=>download(c)}><FaDownload /> Download</button>
            <button className="at-icon-btn red" onClick={()=>del(c.id)}><FaTrash /></button>
          </div>
        </li>
      ))}</ul>
    </div>
  );
};

const ProposalBuilder = () => {
  const load = () => { try { return JSON.parse(localStorage.getItem("at_proposals")||"[]"); } catch { return []; } };
  const [proposals, setProposals] = useState(load);
  const [view, setView] = useState("list");
  const [f, setF] = useState({ title:"", client:"", overview:"", scope:"", deliverables:"", timeline:"", price:"", terms:"" });
  const sv = arr => { setProposals(arr); localStorage.setItem("at_proposals", JSON.stringify(arr)); };
  const create = () => { if (!f.title.trim()) return; sv([{ id:Date.now(), ...f, createdAt:new Date().toISOString(), status:"draft" },...proposals]); setView("list"); };
  const del = id => sv(proposals.filter(p=>p.id!==id));
  const download = p => { const txt=[`PROPOSAL: ${p.title}`,`Prepared for: ${p.client}`,`Date: ${new Date(p.createdAt).toLocaleDateString()}`,``,`OVERVIEW`,p.overview,``,`SCOPE OF WORK`,p.scope,``,`DELIVERABLES`,p.deliverables,``,`TIMELINE`,p.timeline,``,`INVESTMENT`,p.price,``,`TERMS & CONDITIONS`,p.terms].join("\n"); const b=new Blob([txt],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=`Proposal_${p.title.replace(/\s+/g,"_")}.txt`; a.click(); };

  if (view==="create") return (
    <div className="at-tool">
      <button className="at-btn at-btn--ghost" onClick={()=>setView("list")}><FaTimes /> Cancel</button>
      <div className="at-proposal-form">
        {[["title","Proposal Title","Website Redesign for Acme Corp","input"],["client","Client Name","Acme Corp","input"],["overview","Project Overview","Brief description of the project and goals…","ta"],["scope","Scope of Work","Detailed list of everything included…","ta"],["deliverables","Deliverables","What the client receives at the end…","ta"],["timeline","Timeline","Week 1: Discovery. Week 2–3: Design…","ta"],["price","Investment","Total: $3,500. 50% upfront, 50% on delivery.","ta"],["terms","Terms","Up to 2 revision rounds. Additional changes at $X/hr.","ta"]].map(([k,label,ph,type]) => (
          <div key={k} className="at-calc-field">
            <label className="at-calc-label">{label}</label>
            {type==="input" ? <input className="at-input" placeholder={ph} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} />
              : <textarea className="at-input at-textarea-sm" placeholder={ph} value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} rows={3} />}
          </div>
        ))}
      </div>
      <button className="at-btn at-btn--gold" onClick={create}><FaSave /> Save Proposal</button>
    </div>
  );

  return (
    <div className="at-tool">
      <div className="at-invoice-header-row"><h3 className="at-sub-heading">Proposals ({proposals.length})</h3><button className="at-btn at-btn--gold" onClick={()=>{ setView("create"); setF({ title:"",client:"",overview:"",scope:"",deliverables:"",timeline:"",price:"",terms:"" }); }}><FaPlus /> New Proposal</button></div>
      {proposals.length===0 && <p className="at-empty">No proposals yet. Build your first one.</p>}
      <ul className="at-contract-list">{proposals.map(p => (
        <li key={p.id} className="at-contract-item">
          <div className="at-contract-info"><strong>{p.title}</strong><span className="at-hint-sm">For: {p.client||"—"}</span><span className="at-session-date">{new Date(p.createdAt).toLocaleDateString()}</span></div>
          <div className="at-recur-actions"><button className="at-btn at-btn--ghost" onClick={()=>download(p)}><FaDownload /> Download</button><button className="at-icon-btn red" onClick={()=>del(p.id)}><FaTrash /></button></div>
        </li>
      ))}</ul>
    </div>
  );
};

const AdvancedReports = () => {
  const invoices = (() => { try { return JSON.parse(localStorage.getItem("at_invoices")||"[]"); } catch { return []; } })();
  const expenses = (() => { try { return JSON.parse(localStorage.getItem("at_expenses")||"[]"); } catch { return []; } })();
  const tasks    = (() => { try { return JSON.parse(localStorage.getItem("tasks")||"[]"); } catch { return []; } })();
  const sessions = (() => { try { return JSON.parse(localStorage.getItem("at_sessions")||"[]"); } catch { return []; } })();
  const earned = invoices.filter(i=>i.status==="paid").reduce((s,i)=>s+(i.total||0),0);
  const spent = expenses.reduce((s,e)=>s+(e.amount||0),0);
  const hours = sessions.reduce((s,x)=>s+(x.mins||0),0)/60;
  const expCSV = (data,name) => { if (!data.length) return; const keys=Object.keys(data[0]); const csv=[keys.join(","),...data.map(r=>keys.map(k=>`"${r[k]||""}"`).join(","))].join("\n"); const b=new Blob([csv],{type:"text/csv"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=`${name}_${new Date().toISOString().split("T")[0]}.csv`; a.click(); };
  return (
    <div className="at-tool">
      <div className="at-analytics-stats">
        <div className="at-stat-card gold"><span>Revenue</span><strong>${earned.toFixed(2)}</strong></div>
        <div className="at-stat-card red"><span>Expenses</span><strong>${spent.toFixed(2)}</strong></div>
        <div className="at-stat-card green"><span>Net</span><strong>${(earned-spent).toFixed(2)}</strong></div>
        <div className="at-stat-card"><span>Invoices</span><strong>{invoices.length}</strong></div>
        <div className="at-stat-card"><span>Tasks</span><strong>{tasks.length}</strong></div>
        <div className="at-stat-card"><span>Hours</span><strong>{hours.toFixed(1)}h</strong></div>
      </div>
      <h4 className="at-brand-heading" style={{marginTop:16}}>Export as CSV</h4>
      <div className="at-export-btns">
        {[
          ["Invoices CSV", () => expCSV(invoices.map(i=>({number:i.invoiceNum,client:i.client,amount:i.total,status:i.status,date:i.date})),"invoices")],
          ["Expenses CSV", () => expCSV(expenses.map(e=>({name:e.name,amount:e.amount,category:e.category,date:e.date})),"expenses")],
          ["Tasks CSV",    () => expCSV(tasks.map(t=>({name:t.name,priority:t.priority,category:t.category,completed:t.completed,deadline:t.deadline})),"tasks")],
          ["Time Log CSV", () => expCSV(sessions.map(s=>({label:s.label,duration:s.duration,date:s.date})),"time_log")],
        ].map(([label,fn]) => <button key={label} className="at-btn at-btn--ghost" onClick={fn}><FaDownload /> {label}</button>)}
      </div>
      <p className="at-hint">CSV files open in Excel, Google Sheets, or any spreadsheet app.</p>
    </div>
  );
};

const TaxSummary = () => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const invoices = (() => { try { return JSON.parse(localStorage.getItem("at_invoices")||"[]"); } catch { return []; } })();
  const expenses = (() => { try { return JSON.parse(localStorage.getItem("at_expenses")||"[]"); } catch { return []; } })();
  const paid = invoices.filter(i=>i.status==="paid"&&(i.date||"").startsWith(year));
  const yearExp = expenses.filter(e=>(e.date||"").startsWith(year));
  const income = paid.reduce((s,i)=>s+(i.total||0),0);
  const totalExp = yearExp.reduce((s,e)=>s+(e.amount||0),0);
  const taxable = income - totalExp;
  const byCat = {}; yearExp.forEach(e=>{ byCat[e.category]=(byCat[e.category]||0)+e.amount; });
  const download = () => {
    const txt = [`TAX SUMMARY — ${year}`,`Generated: ${new Date().toLocaleDateString()}`,``,`━━━ INCOME ━━━`,`Total Revenue:  $${income.toFixed(2)}`,`Paid Invoices:  ${paid.length}`,``,`━━━ DEDUCTIBLE EXPENSES ━━━`,...Object.entries(byCat).map(([k,v])=>`  ${k}: $${v.toFixed(2)}`),`Total Expenses: $${totalExp.toFixed(2)}`,``,`━━━ NET TAXABLE INCOME ━━━`,`$${taxable.toFixed(2)}`,``,`⚠ This is an estimate. Consult a qualified tax professional.`].join("\n");
    const b=new Blob([txt],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=`tax_summary_${year}.txt`; a.click();
  };
  return (
    <div className="at-tool">
      <div className="at-calc-field" style={{maxWidth:200}}><label className="at-calc-label">Tax Year</label><select className="at-select" value={year} onChange={e=>setYear(e.target.value)}>{[2025,2024,2023,2022].map(y=><option key={y}>{y}</option>)}</select></div>
      <div className="at-tax-summary">
        <div className="at-tax-row"><span>Total Revenue ({year})</span><strong className="gold">${income.toFixed(2)}</strong></div>
        <div className="at-tax-row"><span>Paid Invoices</span><span>{paid.length}</span></div>
        {Object.keys(byCat).length>0 && <><div className="at-tax-section-label">Deductible Expenses by Category</div>{Object.entries(byCat).map(([k,v])=><div key={k} className="at-tax-row indent"><span>{k}</span><span>${v.toFixed(2)}</span></div>)}</>}
        <div className="at-tax-row"><span>Total Expenses</span><strong className="red">${totalExp.toFixed(2)}</strong></div>
        <div className="at-tax-row total"><span>Est. Taxable Income</span><strong className="gold">${taxable.toFixed(2)}</strong></div>
      </div>
      <p className="at-hint">⚠ Estimate only. Consult a tax professional for accurate filing.</p>
      <button className="at-btn at-btn--gold" onClick={download}><FaDownload /> Export Summary</button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   TOOL REGISTRY
═══════════════════════════════════════════════════ */
const ALL_TOOLS = [
  { id:"quick-note",   tier:TIERS.free,  icon:<FaStickyNote />,    title:"Quick Notes",         desc:"Capture and pin ideas, reminders, client notes.",       C:QuickNote },
  { id:"rate-calc",    tier:TIERS.free,  icon:<FaCalculator />,    title:"Rate Calculator",      desc:"Find your ideal hourly rate with tax and buffer.",       C:RateCalc },
  { id:"time-tracker", tier:TIERS.free,  icon:<FaRegClock />,      title:"Time Tracker",         desc:"Track work sessions and log billable hours.",            C:SimpleTimer },
  { id:"link-vault",   tier:TIERS.free,  icon:<FaLink />,          title:"Link Vault",           desc:"Save and categorize client links and resources.",        C:LinkVault },
  { id:"expense",      tier:TIERS.basic, icon:<FaMoneyBillWave />, title:"Expense Tracker",      desc:"Log business expenses by category and export CSV.",      C:ExpenseTracker },
  { id:"recurring",    tier:TIERS.basic, icon:<FaCalendarCheck />, title:"Recurring Invoices",   desc:"Schedule and track repeating client billing.",           C:RecurringInvoices },
  { id:"brand-kit",    tier:TIERS.basic, icon:<FaPalette />,       title:"Brand Kit",            desc:"Store your logo, colors, fonts, and contact info.",      C:BrandKit },
  { id:"backup",       tier:TIERS.basic, icon:<FaDatabase />,      title:"Data Backup",          desc:"Download or restore all your Aurelance data.",           C:CloudBackup },
  { id:"ai-invoice",   tier:TIERS.pro,   icon:<FaFileAlt />,       title:"Invoice Generator",    desc:"Create, manage and download professional invoices.",     C:InvoiceGenerator },
  { id:"analytics",    tier:TIERS.pro,   icon:<FaChartLine />,     title:"Earnings Analytics",   desc:"Monthly revenue charts and top client breakdowns.",      C:EarningsAnalytics },
  { id:"contracts",    tier:TIERS.pro,   icon:<FaFileContract />,  title:"Smart Contracts",      desc:"Create, sign and download client contracts.",            C:SmartContracts },
  { id:"proposals",    tier:TIERS.pro,   icon:<FaFileAlt />,       title:"Proposal Builder",     desc:"Build and export detailed client proposals.",            C:ProposalBuilder },
  { id:"reports",      tier:TIERS.pro,   icon:<FaChartBar />,      title:"Advanced Reports",     desc:"Export invoices, expenses, tasks, and time logs.",       C:AdvancedReports },
  { id:"tax",          tier:TIERS.pro,   icon:<FaShieldAlt />,     title:"Tax Summary",          desc:"Annual tax summary with deductible expenses export.",    C:TaxSummary },
];

const PLANS = [
  { id:TIERS.free,  name:"Free",  price:"$0",  period:"forever",  color:"#4a4843", desc:"Everything to get started.", perks:["Quick Notes","Rate Calculator","Time Tracker","Link Vault","Up to 5 active tasks"] },
  { id:TIERS.basic, name:"Basic", price:"$9",  period:"/ month",  color:"#6366f1", desc:"For freelancers ready to grow.", perks:["Everything in Free","Expense Tracker","Recurring Invoices","Brand Kit","Data Backup","Unlimited tasks"], popular:false },
  { id:TIERS.pro,   name:"Pro",   price:"$19", period:"/ month",  color:"#c9a84c", desc:"The full Aurelance experience.", perks:["Everything in Basic","Invoice Generator","Earnings Analytics","Smart Contracts","Proposal Builder","Advanced Reports","Tax Summary Export"], popular:true },
];

/* ═══════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════ */
const Atelier = () => {
  const [userTier, setUserTier] = useState(() => localStorage.getItem("aurelance_tier")||TIERS.free);
  const [activeTab, setActiveTab] = useState("workspace");
  const [activeToolId, setActiveToolId] = useState("quick-note");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const access = tool => canAccess(tool.tier, userTier);
  const activeTool = ALL_TOOLS.find(t => t.id === activeToolId);
  const unlocked = ALL_TOOLS.filter(access).length;

  const openTool = tool => {
    if (!access(tool)) { setShowUpgrade(true); return; }
    setActiveToolId(tool.id); setActiveTab("workspace");
  };

  const confirmUpgrade = planId => {
    localStorage.setItem("aurelance_tier", planId); setUserTier(planId); setShowUpgrade(false);
    const n = planId.charAt(0).toUpperCase()+planId.slice(1);
    setUpgradeMsg(`✓ Upgraded to ${n}! All ${n} tools are now unlocked.`);
    setTimeout(()=>setUpgradeMsg(""),4000);
  };

  const TIER_LABELS = { free:<><FaStar/> Free</>, basic:<><FaBolt/> Basic</>, pro:<><FaCrown/> Pro</> };
  const TIER_COLORS = { free:"#4a4843", basic:"#6366f1", pro:"#c9a84c" };

  return (
    <div className="at-page">
      {/* Header */}
      <div className="at-header">
        <div className="at-header-left">
          <div className="at-header-icon"><FaPalette /></div>
          <div>
            <h1 className="at-heading">Atelier</h1>
            <p className="at-subheading">Your freelance power studio — {unlocked}/{ALL_TOOLS.length} tools unlocked</p>
          </div>
        </div>
        <div className="at-header-right">
          <div className="at-tier-badge" data-tier={userTier}>{TIER_LABELS[userTier]}</div>
          {userTier !== TIERS.pro && <button className="at-btn at-btn--gold" onClick={()=>setShowUpgrade(true)}><FaRocket /> Upgrade</button>}
        </div>
      </div>

      {upgradeMsg && <div className="at-upgrade-msg">{upgradeMsg}</div>}

      {/* Tabs */}
      <div className="at-tabs">
        {[{id:"workspace",label:"Workspace",icon:<FaClipboardList/>},{id:"features",label:"All Tools",icon:<FaBolt/>},{id:"plans",label:"Plans",icon:<FaCrown/>}].map(t=>(
          <button key={t.id} className={`at-tab ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ══ WORKSPACE ══ */}
      {activeTab==="workspace" && (
        <div className="at-workspace">
          <div className="at-workspace-sidebar">
            {ALL_TOOLS.map(tool=>(
              <button key={tool.id}
                className={`at-tool-btn ${activeToolId===tool.id?"active":""} ${!access(tool)?"at-tool-btn--locked":""}`}
                onClick={()=>openTool(tool)}>
                <span className="at-tool-btn-icon">{tool.icon}</span>
                <span className="at-tool-btn-label">{tool.title}</span>
                {!access(tool) ? <FaLock className="at-tool-btn-lock"/>
                  : tool.tier===TIERS.free  ? <span className="at-tool-btn-free">Free</span>
                  : tool.tier===TIERS.basic ? <span className="at-tool-btn-basic">Basic</span>
                  : <span className="at-tool-btn-pro">Pro</span>}
              </button>
            ))}
          </div>
          <div className="at-workspace-main">
            {activeTool && (<>
              <div className="at-tool-header">
                <span className="at-tool-header-icon" style={{color:TIER_COLORS[activeTool.tier]}}>{activeTool.icon}</span>
                <div><h2 className="at-tool-title">{activeTool.title}</h2><p className="at-tool-desc">{activeTool.desc}</p></div>
                <span className="at-tier-chip" style={{color:TIER_COLORS[activeTool.tier],borderColor:TIER_COLORS[activeTool.tier]+"44",background:TIER_COLORS[activeTool.tier]+"11"}}>{activeTool.tier.toUpperCase()}</span>
              </div>
              <activeTool.C />
            </>)}
          </div>
        </div>
      )}

      {/* ══ ALL TOOLS ══ */}
      {activeTab==="features" && (
        <div className="at-features-page">
          {[{tier:TIERS.free,label:"Free — Always Available",color:"#10b981",icon:<FaCheckCircle style={{color:"#10b981"}}/>},
            {tier:TIERS.basic,label:"Basic Plan",color:"#6366f1",icon:<FaBolt style={{color:"#6366f1"}}/>},
            {tier:TIERS.pro,label:"Pro Plan",color:"#c9a84c",icon:<FaCrown style={{color:"#c9a84c"}}/>}].map(({tier,label,color,icon})=>(
            <div key={tier} className="at-features-section">
              <div className="at-section-label">{icon} {label}</div>
              <div className="at-tools-grid">
                {ALL_TOOLS.filter(t=>t.tier===tier).map(tool=>(
                  <div key={tool.id} className={`at-feature-card ${access(tool)?"unlocked":"locked"}`} onClick={()=>openTool(tool)}>
                    <div className="at-feature-card-top">
                      <span className="at-feature-icon" style={{color:access(tool)?color:"#4a4843"}}>{tool.icon}</span>
                      {access(tool)
                        ? <span className="at-badge at-badge--unlocked"><FaCheckCircle /> Open</span>
                        : <span className="at-badge" style={{color,borderColor:color+"44",background:color+"11"}}><FaLock /> Locked</span>}
                    </div>
                    <h3 className="at-pro-title">{tool.title}</h3>
                    <p className="at-pro-desc">{tool.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ PLANS ══ */}
      {activeTab==="plans" && (
        <div className="at-plans-page">
          <div className="at-plans-intro"><h2 className="at-plans-heading">Choose Your Plan</h2><p className="at-plans-sub">Start free. Upgrade when you're ready to scale.</p></div>
          <div className="at-plans-grid">
            {PLANS.map(plan=>(
              <div key={plan.id} className={`at-plan-card ${plan.popular?"at-plan-card--popular":""} ${userTier===plan.id?"at-plan-card--current":""}`} style={{"--plan-color":plan.color}}>
                {plan.popular && <div className="at-plan-popular-badge"><FaStar /> Most Popular</div>}
                <h3 className="at-plan-name" style={{color:plan.color}}>{plan.name}</h3>
                <div className="at-plan-price"><span className="at-plan-amount">{plan.price}</span><span className="at-plan-period">{plan.period}</span></div>
                <p className="at-plan-desc">{plan.desc}</p>
                <ul className="at-plan-perks">{plan.perks.map(p=><li key={p} className="at-plan-perk"><FaCheckCircle style={{color:plan.color}}/> {p}</li>)}</ul>
                <button className={`at-btn at-plan-cta ${userTier===plan.id?"at-plan-cta--current":"at-plan-cta--upgrade"}`}
                  style={userTier!==plan.id?{background:plan.color,color:"#0a0a0c"}:{}}
                  disabled={userTier===plan.id}
                  onClick={()=>userTier!==plan.id&&confirmUpgrade(plan.id)}>
                  {userTier===plan.id?<><FaCheckCircle/> Current Plan</>:<><FaRocket/> Get {plan.name}</>}
                </button>
              </div>
            ))}
          </div>
          <p className="at-plans-note">Connect Stripe or your payment provider for real billing. Cancel anytime. No hidden fees.</p>
        </div>
      )}

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="at-modal-overlay" onClick={()=>setShowUpgrade(false)}>
          <div className="at-modal" onClick={e=>e.stopPropagation()}>
            <button className="at-modal-close" onClick={()=>setShowUpgrade(false)}><FaTimes /></button>
            <div className="at-modal-icon"><FaRocket /></div>
            <h2 className="at-modal-title">Unlock More Tools</h2>
            <p className="at-modal-sub">Upgrade your plan to access locked Atelier features.</p>
            <div className="at-modal-plans">
              {PLANS.filter(p=>p.id!==TIERS.free).map(plan=>(
                <button key={plan.id} className={`at-modal-plan-btn ${userTier===plan.id?"current":""}`}
                  style={{borderColor:plan.color+"55"}} disabled={userTier===plan.id}
                  onClick={()=>confirmUpgrade(plan.id)}>
                  <span className="at-modal-plan-name" style={{color:plan.color}}>{plan.name}</span>
                  <span className="at-modal-plan-price">{plan.price}<span>/mo</span></span>
                  {plan.popular && <span className="at-modal-popular">Best Value</span>}
                </button>
              ))}
            </div>
            <p className="at-modal-note">⚠ Demo mode: upgrades locally. Connect your billing provider for real payments.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Atelier;