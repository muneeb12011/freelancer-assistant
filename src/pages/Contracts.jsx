// src/pages/Contracts.jsx — signed milestone contracts between a client and a freelancer.
//   /contracts       everything you're working on or hiring for
//   /contracts/:id   one contract: draft → both sign (scope locks) → deliver → approve → paid → received
// Money moves directly between the two people. Aurelance keeps the record, and the record feeds
// both report cards.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiLock, FiPaperclip, FiCheck, FiCopy, FiEye, FiZap, FiAlertTriangle, FiStar } from 'react-icons/fi';
import api, { askAI, request } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Navbar';
import Badges from '../components/Badges';
import Modal from '../components/Modal';
import { ClientLine, FreelancerLine } from '../components/ReportCard';
import { money, ago, day, plural, fileToDataUrl } from '../lib/format';
import '../styles/Contracts.css';

const STATUS = { draft: ['Draft — not signed', 'chip-ochre'], active: ['Active', 'chip-sage'], completed: ['Completed', 'chip-gilt'], ended: ['Ended', ''] };
const M_STATUS = {
  open: ['In progress', ''], submitted: ['Delivered — awaiting review', 'chip-slate'], approved: ['Approved — payment due', 'chip-ochre'],
  paid: ['Marked paid — awaiting confirmation', 'chip-heather'], received: ['Paid and confirmed', 'chip-sage'],
};
const PAY_METHODS = [['bank', 'Bank transfer'], ['payoneer', 'Payoneer'], ['wise', 'Wise'], ['card', 'Card transfer'], ['other', 'Other']];

async function openFile(id) {
  const res = await request('GET', `/messages/attachments/${id}?download=1`, undefined, { raw: true });
  if (!res.ok) throw new Error('That file isn’t available');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60e3);
}

async function upload(contractId, file) {
  if (file.size > 2 * 1024 * 1024) throw new Error('Files can be up to 2 MB. Share a link for bigger files.');
  const data = await fileToDataUrl(file);
  const r = await api.post(`/engagements/${contractId}/files`, { name: file.name, type: file.type || 'application/octet-stream', data });
  return r.file;
}

/* ── /contracts ───────────────────────────────────────────── */
export default function Contracts() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'active';
  const [rows, setRows] = useState(null);

  useEffect(() => { api.get('/engagements').then((r) => setRows(r.contracts)).catch((e) => { toast.err(e); setRows([]); }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const g = { needs: [], active: [], draft: [], done: [] };
    (rows || []).forEach((c) => {
      const needs = c.needsSignature || c.pendingChanges > 0
        || (c.next && ((c.myRole === 'client' && ['submitted', 'approved'].includes(c.next.status)) || (c.myRole === 'freelancer' && ['open', 'paid'].includes(c.next.status)) ));
      if (needs && ['draft', 'active'].includes(c.status)) g.needs.push(c);
      if (c.status === 'active') g.active.push(c);
      if (c.status === 'draft') g.draft.push(c);
      if (['completed', 'ended'].includes(c.status)) g.done.push(c);
    });
    return g;
  }, [rows]);
  const TABS = [['needs', 'Needs you'], ['active', 'Active'], ['draft', 'Drafts'], ['done', 'Finished']];
  const list = groups[tab] || [];

  return (
    <div className="ct page">
      <header className="ledger-title">
        <h1>Contracts</h1>
        <p>Milestones you both signed. Once signed, the scope is locked — extra work needs a priced change request, so “one small thing” can’t quietly grow.</p>
      </header>
      <nav className="tabs" role="tablist">
        {TABS.map(([id, l]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setParams({ tab: id })}>
            {l}{groups[id].length > 0 && <span className={id === 'needs' ? 'count-pill' : 'ct-n'}>{groups[id].length}</span>}
          </button>
        ))}
      </nav>
      {!rows ? <span className="spinner" /> : list.length ? (
        <ul className="ct-list">
          {list.map((c) => {
            const other = c.myRole === 'client' ? c.freelancer : c.client;
            return (
              <li key={c._id}>
                <Link to={`/contracts/${c._id}`} className="ct-row">
                  <span className="ct-row-main">
                    <span className="ct-row-tags">
                      <span className={`chip ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>
                      {c.kind === 'trial' && <span className="chip chip-heather"><FiZap aria-hidden="true" /> Paid trial</span>}
                      {c.needsSignature && <span className="chip chip-gilt">Your signature needed</span>}
                      {c.pendingChanges > 0 && <span className="chip chip-gilt">{plural(c.pendingChanges, 'change request')}</span>}
                    </span>
                    <strong>{c.title}</strong>
                    <small>{c.myRole === 'client' ? 'You hired' : c.myRole === 'freelancer' ? 'Client:' : 'Squad contract with'} {other?.name || 'a deleted account'}{c.next ? ` · Next: ${c.next.title} (${M_STATUS[c.next.status][0].split(' —')[0].toLowerCase()})` : ''}</small>
                  </span>
                  <span className="ct-row-side">
                    <span className="money">{money(c.received, c.currency)} <small>of {money(c.total, c.currency)}</small></span>
                    <span className="ct-bar" aria-label={`${c.done} of ${c.milestones} milestones done`}><span style={{ width: `${c.milestones ? (c.done / c.milestones) * 100 : 0}%` }} /></span>
                    <small>{c.done}/{c.milestones} milestones · {ago(c.updatedAt)}</small>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty">
          <h3>{tab === 'needs' ? 'Nothing needs you' : tab === 'draft' ? 'No drafts' : tab === 'done' ? 'Nothing finished yet' : 'No active contracts'}</h3>
          <p>Contracts start when you hire someone from a job post, start a paid trial, or send an offer from someone’s profile.</p>
          <div className="row-wrap"><Link className="btn" to="/jobs">Find work</Link><Link className="btn" to="/talent">Find talent</Link></div>
        </div>
      )}
    </div>
  );
}

/* ── Draft editor ─────────────────────────────────────────── */
function DraftEditor({ c, onSaved }) {
  const toast = useToast();
  const [m, setM] = useState(c.milestones.map((x) => ({ title: x.title, scope: x.scope, amount: x.amount, dueDate: x.dueDate ? x.dueDate.slice(0, 10) : '' })));
  const [summary, setSummary] = useState(c.summary || '');
  const [busy, setBusy] = useState('');
  const total = m.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const upd = (i, k, v) => setM((xs) => xs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const suggest = async () => {
    setBusy('ai');
    try {
      const r = await askAI('milestone-plan', `Total budget: ${c.currency} ${total || 0}\nWork: ${c.title}\n${summary}`);
      const list = r?.milestones || [];
      if (!list.length) throw new Error('No suggestion came back. Try again.');
      setM(list.map((x) => ({ title: x.title, scope: x.scope, amount: Math.round(((x.share || 0) / 100) * total * 100) / 100 || '', dueDate: '' })));
      toast.ok('Suggested split — adjust amounts and dates');
    } catch (e) { toast.err(e); }
    setBusy('');
  };
  const save = async () => {
    setBusy('save');
    try {
      const r = await api.patch(`/engagements/${c._id}`, { summary, milestones: m.map((x) => ({ ...x, dueDate: x.dueDate || undefined })) });
      toast.ok('Draft saved. Signatures were cleared, so both of you sign this version.');
      onSaved(r.contract);
    } catch (e) { toast.err(e); }
    setBusy('');
  };
  return (
    <section className="ct-section">
      <div className="ct-section-head">
        <h2>Shape the scope</h2>
        <button type="button" className="btn btn-sm btn-ghost" onClick={suggest} disabled={busy === 'ai'}>{busy === 'ai' ? <span className="spinner" /> : <><FiZap /> Suggest a fair split</>}</button>
      </div>
      <p className="muted-sm">Either of you can change the draft. Any change clears both signatures, so nobody signs something they didn’t see.</p>
      <label className="field"><span>What this contract covers</span>
        <textarea className="input" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} maxLength={4000} />
      </label>
      <ol className="ct-edit">
        {m.map((x, i) => (
          <li key={i}>
            <div className="ct-edit-top">
              <label className="field"><span>Milestone {i + 1}</span><input className="input" value={x.title} onChange={(e) => upd(i, 'title', e.target.value)} maxLength={120} placeholder="e.g. Homepage design" /></label>
              <label className="field"><span>Amount ({c.currency})</span><input className="input" type="number" min="0" step="0.01" value={x.amount} onChange={(e) => upd(i, 'amount', e.target.value)} /></label>
              <label className="field"><span>Due</span><input className="input" type="date" value={x.dueDate} onChange={(e) => upd(i, 'dueDate', e.target.value)} /></label>
              {m.length > 1 && <button type="button" className="btn btn-sm btn-ghost ct-del" onClick={() => setM((xs) => xs.filter((_, j) => j !== i))} aria-label={`Remove milestone ${i + 1}`}><FiTrash2 /></button>}
            </div>
            <label className="field"><span>What “done” means <small>specific and checkable</small></span>
              <textarea className="input" value={x.scope} onChange={(e) => upd(i, 'scope', e.target.value)} rows={2} maxLength={3000} placeholder="e.g. Desktop + mobile design in Figma, two rounds of changes, exported assets." />
            </label>
          </li>
        ))}
      </ol>
      <div className="row-wrap ct-edit-foot">
        <button type="button" className="btn btn-sm" onClick={() => setM((xs) => [...xs, { title: '', scope: '', amount: '', dueDate: '' }])} disabled={m.length >= 20}><FiPlus /> Add milestone</button>
        <span className="ct-total">Total <strong className="money">{money(total, c.currency, 2)}</strong></span>
        <button type="button" className="btn btn-gilt" onClick={save} disabled={busy === 'save'}>{busy === 'save' ? <span className="spinner" /> : 'Save draft'}</button>
      </div>
    </section>
  );
}

/* ── Signing ──────────────────────────────────────────────── */
function SignBox({ c, me, onChange }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState('');
  const mine = c.signatures?.[c.myRole];
  const theirsRole = c.myRole === 'client' ? 'freelancer' : 'client';
  const theirs = c.signatures?.[theirsRole];
  const sign = async (e) => {
    e.preventDefault(); setBusy('sign');
    try { const r = await api.post(`/engagements/${c._id}/sign`, { name, termsVersion: c.termsVersion }); onChange(r.contract); toast.ok(r.contract.status === 'active' ? 'Signed by both — work can start' : 'Signed. Waiting for the other side.'); } catch (err) { toast.err(err); }
    setBusy('');
  };
  const decline = async () => {
    const reason = window.prompt(c.myRole === 'freelancer' ? 'Decline this offer? Add a short reason (optional):' : 'Withdraw this offer? Add a short reason (optional):', '');
    if (reason === null) return;
    try { const r = await api.post(`/engagements/${c._id}/decline`, { reason }); onChange(r.contract); } catch (err) { toast.err(err); }
  };
  return (
    <section className="ct-sign">
      <h2><FiLock aria-hidden="true" /> Sign to lock the scope</h2>
      <ul className="ct-sigs">
        <li className={c.signatures?.client?.at ? 'is-done' : ''}>Client {c.signatures?.client?.at ? `signed ${ago(c.signatures.client.at)}` : 'hasn’t signed'}</li>
        <li className={c.signatures?.freelancer?.at ? 'is-done' : ''}>Freelancer {c.signatures?.freelancer?.at ? `signed ${ago(c.signatures.freelancer.at)}` : 'hasn’t signed'}</li>
      </ul>
      {c.myRole !== 'member' && !mine && (
        <form className="stack-sm" onSubmit={sign}>
          <label className="field"><span>Type your full name — <strong>{me.name}</strong> — to sign version {c.termsVersion}</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <button type="submit" className="btn btn-gilt" disabled={busy === 'sign' || name.trim().toLowerCase() !== me.name.trim().toLowerCase()}>{busy === 'sign' ? <span className="spinner" /> : 'Sign contract'}</button>
        </form>
      )}
      {mine && !theirs && <p className="muted-sm">You signed. When they sign too, the contract becomes active.</p>}
      {c.myRole !== 'member' && <button type="button" className="btn btn-sm btn-ghost" onClick={decline}>{c.myRole === 'freelancer' ? 'Decline offer' : 'Withdraw offer'}</button>}
    </section>
  );
}

/* ── A milestone with the one action that fits ────────────── */
function Milestone({ c, m, i, onChange }) {
  const toast = useToast();
  const role = c.myRole;
  const [mode, setMode] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);
  const [pay, setPay] = useState({ method: c.sharedPayout?.type || 'bank', reference: '', proof: null });
  const [busy, setBusy] = useState(false);
  const late = m.status === 'open' && m.dueDate && new Date(m.dueDate) < new Date();
  const post = async (path, body, okText) => {
    setBusy(true);
    try { const r = await api.post(`/engagements/${c._id}/milestones/${m._id}/${path}`, body); onChange(r.contract); setMode(''); setNote(''); setFiles([]); if (okText) toast.ok(okText); } catch (e) { toast.err(e); }
    setBusy(false);
  };
  const addFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { const up = await upload(c._id, f); setFiles((xs) => [...xs, up]); } catch (err) { toast.err(err); }
  };
  const addProof = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { const up = await upload(c._id, f); setPay((p) => ({ ...p, proof: up })); } catch (err) { toast.err(err); }
  };
  const disputed = m.status === 'paid' && m.payment?.disputedAt;

  return (
    <li className={`ct-ms is-${m.status}`}>
      <header>
        <span className="ct-ms-n" aria-hidden="true">{m.status === 'received' ? <FiCheck /> : i + 1}</span>
        <div>
          <h3>{m.title}{m.source === 'change' && <span className="chip chip-heather">Added by change request</span>}</h3>
          <p className="ct-ms-meta">
            <span className={`chip ${M_STATUS[m.status][1]}`}>{M_STATUS[m.status][0]}</span>
            {m.dueDate && <span className={late ? 'is-late' : ''}>Due {day(m.dueDate)}{late ? ' — late' : ''}</span>}
            {m.revisions?.length > 0 && <span>{plural(m.revisions.length, 'revision')}</span>}
          </p>
        </div>
        <strong className="ct-ms-amt money">{money(m.amount, c.currency, 2)}</strong>
      </header>
      {m.scope && <p className="ct-ms-scope">{m.scope}</p>}

      {m.delivery?.at && (
        <div className="ct-ms-delivery">
          <small>Delivered {ago(m.delivery.at)}</small>
          <p>{m.delivery.note}</p>
          {m.delivery.files?.length > 0 && <p className="row-wrap">{m.delivery.files.map((id, k) => <button key={id} type="button" className="btn btn-sm" onClick={() => openFile(id).catch((e) => toast.err(e))}><FiPaperclip /> File {k + 1}</button>)}</p>}
        </div>
      )}
      {m.revisions?.length > 0 && m.status === 'open' && <p className="notice notice-warn">Changes asked: {m.revisions[m.revisions.length - 1].note}</p>}
      {m.payment?.markedAt && (
        <p className="ct-ms-pay">Paid via {(PAY_METHODS.find(([v]) => v === m.payment.method) || [0, m.payment.method])[1]}, ref <code>{m.payment.reference}</code> on {day(m.payment.markedAt)}{m.payment.proof && <> · <button type="button" className="ct-link" onClick={() => openFile(m.payment.proof).catch((e) => toast.err(e))}>proof</button></>}{m.payment.confirmedAt && ` · confirmed ${day(m.payment.confirmedAt)}`}</p>
      )}
      {disputed && <p className="notice notice-err">The freelancer reported this payment hasn’t arrived{m.payment.disputeNote ? `: “${m.payment.disputeNote}”` : ''}.</p>}

      {c.status === 'active' || (c.status === 'ended' && ['approved', 'paid'].includes(m.status)) ? (
        <div className="ct-ms-actions">
          {role === 'freelancer' && m.status === 'open' && c.status === 'active' && !mode && <button type="button" className="btn btn-gilt btn-sm" onClick={() => setMode('deliver')}>Deliver this milestone</button>}
          {role === 'client' && m.status === 'open' && <span className="muted-sm">Waiting for the delivery.</span>}
          {role === 'client' && m.status === 'submitted' && !mode && (
            <>
              <button type="button" className="btn btn-gilt btn-sm" disabled={busy} onClick={() => post('approve', {}, 'Approved. Payment is now due.')}>Approve</button>
              <button type="button" className="btn btn-sm" onClick={() => setMode('revise')}>Ask for changes</button>
            </>
          )}
          {role === 'freelancer' && m.status === 'submitted' && <span className="muted-sm">Waiting for the client to review.</span>}
          {role === 'client' && (m.status === 'approved' || disputed) && !mode && <button type="button" className="btn btn-gilt btn-sm" onClick={() => setMode('pay')}>{disputed ? 'Update payment details' : 'I’ve paid — record it'}</button>}
          {role === 'freelancer' && m.status === 'approved' && <span className="muted-sm">Approved. Waiting for payment{c.sharedPayout ? '' : ' — share a payout method so they know where to send it'}.</span>}
          {role === 'freelancer' && m.status === 'paid' && !disputed && !mode && (
            <>
              <button type="button" className="btn btn-gilt btn-sm" disabled={busy} onClick={() => post('received', {}, 'Confirmed. Thanks for keeping the record straight.')}>I received it</button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('dispute')}>Not received</button>
            </>
          )}
          {role === 'client' && m.status === 'paid' && !disputed && <span className="muted-sm">Waiting for the freelancer to confirm it arrived.</span>}
          {role === 'freelancer' && disputed && <button type="button" className="btn btn-sm" disabled={busy} onClick={() => post('received', {}, 'Confirmed')}>It arrived after all</button>}
        </div>
      ) : null}

      {mode === 'deliver' && (
        <div className="ct-form">
          <label className="field"><span>What you’re delivering</span><textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Link to the work, what changed, how to check it." /></label>
          <div className="row-wrap">
            <label className="btn btn-sm"><FiPaperclip /> Attach a file<input type="file" hidden onChange={addFile} /></label>
            {files.map((f) => <span key={f.id} className="chip">{f.name}</span>)}
          </div>
          <div className="row-wrap"><button type="button" className="btn btn-gilt btn-sm" disabled={busy || note.trim().length < 10} onClick={() => post('submit', { note, files: files.map((f) => f.id) }, 'Delivered. The client has been told.')}>Send delivery</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('')}>Cancel</button></div>
        </div>
      )}
      {mode === 'revise' && (
        <div className="ct-form">
          <label className="field"><span>What needs to change <small>within the signed scope — new work is a change request</small></span><textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} rows={3} /></label>
          <div className="row-wrap"><button type="button" className="btn btn-sm btn-gilt" disabled={busy || note.trim().length < 10} onClick={() => post('revise', { note }, 'Sent back with your notes')}>Send back</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('')}>Cancel</button></div>
        </div>
      )}
      {mode === 'pay' && (
        <div className="ct-form">
          <p className="muted-sm">Send {money(m.amount, c.currency, 2)} directly{c.sharedPayout ? ` to ${c.sharedPayout.display}` : ''}, then record it here so the freelancer can match it.</p>
          <div className="ct-form-grid">
            <label className="field"><span>Paid with</span><select className="input" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{PAY_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="field"><span>Transaction / reference no.</span><input className="input" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} maxLength={120} placeholder="e.g. FT2610171234" /></label>
          </div>
          <div className="row-wrap">
            <label className="btn btn-sm"><FiPaperclip /> Receipt or screenshot <small>optional</small><input type="file" accept="image/*,application/pdf" hidden onChange={addProof} /></label>
            {pay.proof && <span className="chip">{pay.proof.name}</span>}
          </div>
          <div className="row-wrap"><button type="button" className="btn btn-gilt btn-sm" disabled={busy || pay.reference.trim().length < 3} onClick={() => post('paid', { method: pay.method, reference: pay.reference, proof: pay.proof?.id }, 'Recorded. The freelancer will confirm when it arrives.')}>Record payment</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('')}>Cancel</button></div>
        </div>
      )}
      {mode === 'dispute' && (
        <div className="ct-form">
          <p className="muted-sm">Bank and Payoneer transfers can take 1–3 working days. Check the reference first. This shows on the contract until it’s confirmed.</p>
          <label className="field"><span>What you see on your side</span><textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></label>
          <div className="row-wrap"><button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => post('not-received', { note }, 'Reported. The client has been told.')}>Report not received</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('')}>Cancel</button></div>
        </div>
      )}
    </li>
  );
}

/* ── Change requests ──────────────────────────────────────── */
function Changes({ c, me, onChange }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', description: '', amount: '', dueDate: '' });
  const [busy, setBusy] = useState(false);
  const propose = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api.post(`/engagements/${c._id}/changes`, f); onChange(r.contract); setOpen(false); setF({ title: '', description: '', amount: '', dueDate: '' }); toast.ok('Proposed. It’s not part of the contract until they accept.'); } catch (err) { toast.err(err); }
    setBusy(false);
  };
  const act = async (cid, action) => {
    try { const r = await api.post(`/engagements/${c._id}/changes/${cid}/${action}`); onChange(r.contract); } catch (e) { toast.err(e); }
  };
  const list = c.changeRequests || [];
  if (c.status !== 'active' && !list.length) return null;
  return (
    <section className="ct-section">
      <div className="ct-section-head">
        <h2>Change requests</h2>
        {c.status === 'active' && c.myRole !== 'member' && <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}><FiPlus /> Propose extra work</button>}
      </div>
      {!list.length && <p className="muted-sm">Nothing outside the signed scope so far. If the client asks for something new, propose it here with a price — accepted changes become their own milestone.</p>}
      <ul className="ct-changes">
        {list.slice().reverse().map((x) => {
          const mine = String(x.by) === String(me._id);
          return (
            <li key={x._id} className={`is-${x.status}`}>
              <div><strong>{x.title}</strong> <span className="money">{money(x.amount, c.currency, 2)}</span>{x.dueDate && <small> · due {day(x.dueDate)}</small>}</div>
              {x.description && <p>{x.description}</p>}
              <div className="row-wrap">
                <span className={`chip ${x.status === 'accepted' ? 'chip-sage' : x.status === 'pending' ? 'chip-gilt' : ''}`}>{x.status === 'pending' ? (mine ? 'Waiting for them' : 'Needs your answer') : x.status}</span>
                <small className="muted-sm">{mine ? 'You proposed' : 'They proposed'} {ago(x.createdAt)}</small>
                {x.status === 'pending' && !mine && c.myRole !== 'member' && <><button type="button" className="btn btn-sm btn-gilt" onClick={() => act(x._id, 'accept')}>Accept</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => act(x._id, 'decline')}>Decline</button></>}
                {x.status === 'pending' && mine && <button type="button" className="btn btn-sm btn-ghost" onClick={() => act(x._id, 'withdraw')}>Withdraw</button>}
              </div>
            </li>
          );
        })}
      </ul>
      {open && (
        <Modal title="Propose extra work" onClose={() => setOpen(false)}>
          <form className="stack" onSubmit={propose}>
            <label className="field"><span>What’s being added</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required minLength={4} maxLength={120} placeholder="e.g. 20 more product pages" /></label>
            <label className="field"><span>Details</span><textarea className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} /></label>
            <div className="ct-form-grid">
              <label className="field"><span>Price ({c.currency})</span><input className="input" type="number" min="0" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required /></label>
              <label className="field"><span>Due <small>optional</small></span><input className="input" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></label>
            </div>
            <button type="submit" className="btn btn-gilt" disabled={busy}>{busy ? <span className="spinner" /> : 'Send proposal'}</button>
          </form>
        </Modal>
      )}
    </section>
  );
}

/* ── Payout sharing ───────────────────────────────────────── */
function PayoutPanel({ c, onChange }) {
  const toast = useToast();
  const [methods, setMethods] = useState(null);
  const [details, setDetails] = useState(null);
  const [pick, setPick] = useState('');
  useEffect(() => {
    if (c.myRole === 'freelancer') api.get('/payouts').then((r) => { const v = r.methods.filter((x) => x.status === 'verified'); setMethods(v); setPick(v.find((x) => x.isDefault)?._id || v[0]?._id || ''); }).catch(() => setMethods([]));
  }, [c.myRole]);
  if (!['active', 'completed', 'ended'].includes(c.status) || c.myRole === 'member') return null;
  const share = async () => { try { const r = await api.post(`/engagements/${c._id}/share-payout`, { method: pick }); onChange(r.contract); toast.ok('Shared with this client only'); } catch (e) { toast.err(e); } };
  const stop = async () => { try { const r = await api.delete(`/engagements/${c._id}/share-payout`); onChange(r.contract); setDetails(null); } catch (e) { toast.err(e); } };
  const reveal = async () => { try { const r = await api.get(`/engagements/${c._id}/payout`); setDetails(r.details); } catch (e) { toast.err(e); } };
  const copy = (v) => { navigator.clipboard?.writeText(v).then(() => toast.ok('Copied')).catch(() => {}); };
  const sp = c.sharedPayout;

  return (
    <section className="panel ct-side-block">
      <h2>Where to pay</h2>
      {sp ? (
        <>
          <p className="ct-payout"><span className="pay-tag is-verified"><FiCheck /> Verified</span> {sp.display}</p>
          <p className="muted-sm">Account holder: {sp.holderName}. The name matched their verified ID.</p>
          {c.myRole === 'client' && !details && <button type="button" className="btn btn-sm" onClick={reveal}><FiEye /> Show account details</button>}
          {c.myRole === 'client' && details && (
            <dl className="ct-details">
              {Object.entries(details).filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><dt>{({ iban: 'IBAN', accountNumber: 'Account no.', swift: 'SWIFT/BIC', bankName: 'Bank', branch: 'Branch', email: 'Account email', customerId: 'Customer ID', note: 'Note' })[k] || k}</dt>
                  <dd><code>{v}</code>{k !== 'note' && <button type="button" className="ct-link" onClick={() => copy(v)} aria-label={`Copy ${k}`}><FiCopy /></button>}</dd></div>
              ))}
            </dl>
          )}
          {c.myRole === 'freelancer' && <p className="muted-sm">{sp.viewedAt ? `The client viewed these details ${ago(sp.viewedAt)}.` : 'The client hasn’t opened the details yet.'}</p>}
          {c.myRole === 'freelancer' && <button type="button" className="btn btn-sm btn-ghost" onClick={stop}>Stop sharing</button>}
          {c.myRole === 'client' && <p className="muted-sm">Only you can see these, only on this contract. Viewing is logged.</p>}
        </>
      ) : c.myRole === 'freelancer' ? (
        methods === null ? <span className="spinner" /> : methods.length ? (
          <>
            <p className="muted-sm">Share one verified method with this client. Nobody else sees the numbers.</p>
            <select className="input" value={pick} onChange={(e) => setPick(e.target.value)}>{methods.map((m) => <option key={m._id} value={m._id}>{m.display}</option>)}</select>
            <button type="button" className="btn btn-sm btn-gilt" onClick={share}>Share with this client</button>
          </>
        ) : <p className="muted-sm">You don’t have a verified payout method yet. <Link to="/settings?tab=payouts">Add one</Link> — bank, Payoneer, Wise or card.</p>
      ) : <p className="muted-sm">The freelancer hasn’t shared payout details yet. Ask them in Messages, or wait — they’re told when work is approved.</p>}
    </section>
  );
}

/* ── Reviews (double-blind) ───────────────────────────────── */
function StarInput({ label, value, onChange }) {
  return (
    <div className="ct-stars" role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <span>{[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} of 5`} className={n <= value ? 'is-on' : ''} onClick={() => onChange(n)}><FiStar /></button>
      ))}</span>
    </div>
  );
}

function Reviews({ c, onChange }) {
  const toast = useToast();
  const lines = c.myRole === 'client'
    ? [['quality', 'Quality of the work'], ['communication', 'Communication'], ['deadlines', 'Met the deadlines']]
    : [['payment', 'Paid as agreed and on time'], ['scope', 'Stuck to the agreed scope'], ['communication', 'Communication'], ['respect', 'Treated me with respect']];
  const [r, setR] = useState({});
  const [again, setAgain] = useState(true);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  if (!['completed', 'ended'].includes(c.status) || c.myRole === 'member') return null;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const x = await api.post(`/engagements/${c._id}/review`, { ratings: r, wouldWorkAgain: again, comment }); onChange(x.contract); toast.ok('Review saved'); } catch (err) { toast.err(err); }
    setBusy(false);
  };
  const rv = c.review;
  return (
    <section className="ct-section">
      <h2>Reviews</h2>
      <p className="muted-sm">Double-blind: neither of you sees the other’s review until both are in, or the window closes{rv.windowEndsAt ? ` on ${day(rv.windowEndsAt)}` : ''}. No retaliation, no pressure.</p>
      {rv.mine ? (
        <p className="notice notice-ok">Your review is in.{!rv.theirs && (rv.theirsSubmitted ? ' Theirs is in too and will show in a moment.' : ' Theirs isn’t yet.')}</p>
      ) : rv.open ? (
        <form className="stack" onSubmit={submit}>
          {lines.map(([k, l]) => <StarInput key={k} label={l} value={r[k] || 0} onChange={(v) => setR({ ...r, [k]: v })} />)}
          <label className="check"><input type="checkbox" checked={again} onChange={(e) => setAgain(e.target.checked)} /> I’d work with them again</label>
          <label className="field"><span>A few words <small>optional, shown publicly</small></span><textarea className="input" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={1500} /></label>
          <button type="submit" className="btn btn-gilt" disabled={busy || lines.some(([k]) => !r[k])}>{busy ? <span className="spinner" /> : 'Submit review'}</button>
        </form>
      ) : <p className="muted-sm">The review window has closed.</p>}
      {rv.theirs && (
        <blockquote className="ct-their-review">
          <p>{rv.theirs.comment || 'No comment, just ratings.'}</p>
          <footer>{Object.entries(rv.theirs.ratings || {}).filter(([, v]) => v).map(([k, v]) => <span key={k}>{k} {v}/5</span>)}{rv.theirs.wouldWorkAgain ? <span>Would work with you again</span> : null}</footer>
        </blockquote>
      )}
    </section>
  );
}

/* ── /contracts/:id ───────────────────────────────────────── */
export function ContractDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(() => api.get(`/engagements/${id}`).then((r) => setC(r.contract)).catch((e) => setErr(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  const end = async () => {
    const reason = window.prompt('End this contract early? Give a short reason — it stays on the record.');
    if (!reason) return;
    try { const r = await api.post(`/engagements/${id}/end`, { reason }); setC(r.contract); } catch (e) { toast.err(e); }
  };

  if (err) return <div className="ct page"><Link to="/contracts" className="jb-back"><FiArrowLeft /> Contracts</Link><div className="notice notice-err">{err}</div></div>;
  if (!c) return <div className="ct page"><span className="spinner" /></div>;
  const other = c.myRole === 'client' ? c.freelancerUser : c.clientUser;
  const draft = c.status === 'draft';

  return (
    <div className="ct ct-detail page">
      <Link to="/contracts" className="jb-back"><FiArrowLeft /> Contracts</Link>
      <header className="ledger-title">
        <p className="row-wrap">
          <span className={`chip ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>
          {c.kind === 'trial' && <span className="chip chip-heather"><FiZap aria-hidden="true" /> Paid trial</span>}
          {c.status === 'active' && <span className="chip"><FiLock aria-hidden="true" /> Scope locked {day(c.signedAt)}</span>}
        </p>
        <h1>{c.title}</h1>
        {c.summary && <p>{c.summary}</p>}
      </header>

      <div className="ct-grid">
        <div className="ct-main">
          {c.status === 'ended' && <p className="notice jb-gap">Ended {day(c.endedAt)}: {c.endReason}</p>}
          {draft && c.myRole !== 'member' && <DraftEditor key={c.termsVersion} c={c} onSaved={setC} />}
          <section className="ct-section">
            <h2>{draft ? 'What you’re signing' : 'Milestones'}</h2>
            <ol className="ct-ms-list">{c.milestones.map((m, i) => <Milestone key={m._id} c={c} m={m} i={i} onChange={setC} />)}</ol>
          </section>
          {draft && <SignBox c={c} me={user} onChange={setC} />}
          <Changes c={c} me={user} onChange={setC} />
          <Reviews c={c} onChange={setC} />
        </div>

        <aside className="ct-side">
          <section className="panel ct-side-block">
            {[['Client', c.clientUser, ClientLine], ['Freelancer', c.freelancerUser, FreelancerLine]].map(([label, u, Line]) => u && (
              <div key={label} className="ct-party">
                <small>{label}{(label === 'Client' ? c.myRole === 'client' : c.myRole === 'freelancer') ? ' (you)' : ''}</small>
                <Link to={`/profile/${u._id}`} className="person"><Avatar user={u} size={36} /><span><strong>{u.name}<Badges badges={u.badges} size={12} /></strong><small>{u.title || 'Aurelance member'}</small></span></Link>
                <Line rep={u.reputation} compact />
              </div>
            ))}
            {c.squad && (
              <div className="ct-party"><small>Squad: {c.squad.name}</small>
                <ul className="ct-squad">{c.squad.members.map((m) => m.user && <li key={m.user._id}><Link to={`/profile/${m.user._id}`}>{m.user.name}</Link>{m.role ? ` — ${m.role}` : ''}</li>)}</ul>
              </div>
            )}
            {c.conversation && other && <Link className="btn btn-sm btn-block" to={`/messages/${c.conversation}`}>Messages with {other.name.split(' ')[0]}</Link>}
          </section>

          <section className="panel ct-side-block">
            <h2>Money</h2>
            <dl className="ct-money">
              <div><dt>Contract total</dt><dd className="money">{money(c.totals.total, c.currency, 2)}</dd></div>
              <div><dt>Approved</dt><dd className="money">{money(c.totals.approved, c.currency, 2)}</dd></div>
              <div><dt>Marked paid</dt><dd className="money">{money(c.totals.paid, c.currency, 2)}</dd></div>
              <div><dt>Confirmed received</dt><dd className="money">{money(c.totals.received, c.currency, 2)}</dd></div>
            </dl>
            <p className="muted-sm">Payments go directly between you. This record is what both report cards are built from.</p>
          </section>

          <PayoutPanel c={c} onChange={setC} />

          {c.status === 'active' && c.myRole !== 'member' && (
            <section className="panel ct-side-block">
              <button type="button" className="btn btn-sm btn-danger btn-block" onClick={end}><FiAlertTriangle /> End contract early</button>
              <p className="muted-sm">Approved milestones still need to be paid after ending.</p>
            </section>
          )}

          <section className="panel ct-side-block">
            <h2>Record</h2>
            <ol className="ct-log">{c.events.map((e, i) => <li key={i}><span>{e.text}</span><small>{ago(e.at)}</small></li>)}</ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
