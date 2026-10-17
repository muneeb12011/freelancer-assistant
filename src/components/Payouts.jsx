// src/components/Payouts.jsx — Settings → Payouts: add and verify where you get paid.
// Bank accounts are checked (IBAN checksum) and matched to your verified name; Payoneer/Wise emails
// are confirmed with a code; an admin reviews a proof document, which is deleted after review.
// Full card numbers never leave the browser — only brand and last four digits are saved.
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiPlus, FiTrash2, FiEye, FiUpload, FiLock, FiStar } from 'react-icons/fi';
import api from '../services/api';
import { useToast } from './Toast';
import Modal from './Modal';
import { fileToDataUrl, day } from '../lib/format';

const TYPES = [
  ['bank', 'Bank account', 'IBAN or account number. Best for PKR and local transfers.'],
  ['payoneer', 'Payoneer', 'Receive USD/EUR/GBP from clients abroad.'],
  ['wise', 'Wise', 'Low-fee international transfers.'],
  ['card', 'Visa / Mastercard', 'For card transfers. Only the last 4 digits are stored.'],
];
const PROOF = {
  bank: 'A bank statement, cheque leaf or bank app screenshot showing the account title and the last digits of the account. Cover everything else.',
  payoneer: 'A screenshot of your Payoneer “Receive” or account page showing your name.',
  wise: 'A screenshot of your Wise account details page showing your name.',
  card: 'A photo of the front of the card with your name and last 4 digits visible. Cover the middle digits. Never show the back or the CVV.',
};
const STATUS = { unverified: ['Not verified', ''], pending: ['In review', 'chip-ochre'], verified: ['Verified', 'chip-sage'], rejected: ['Needs another try', 'chip-wax'] };

function AddMethod({ identityName, onClose, onAdded }) {
  const toast = useToast();
  const [type, setType] = useState('bank');
  const [f, setF] = useState({ holderName: identityName || '', bankName: '', iban: '', accountNumber: '', swift: '', branch: '', email: '', brand: 'visa', last4: '', expMonth: '', expYear: '', country: 'Pakistan', currency: 'PKR' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { type, holderName: f.holderName, country: f.country, currency: f.currency };
      if (type === 'bank') Object.assign(body, { bankName: f.bankName, iban: f.iban, accountNumber: f.accountNumber, swift: f.swift, branch: f.branch });
      if (type === 'payoneer' || type === 'wise') Object.assign(body, { email: f.email });
      if (type === 'card') Object.assign(body, { brand: f.brand, last4: f.last4, expMonth: f.expMonth, expYear: f.expYear });
      const r = await api.post('/payouts', body);
      toast.ok(r.message); onAdded();
    } catch (err) { toast.err(err); }
    setBusy(false);
  };
  return (
    <Modal title="Add a payout method" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <fieldset className="py-types">
          <legend className="visually-hidden">Type</legend>
          {TYPES.map(([v, l, d]) => (
            <label key={v} className={type === v ? 'is-on' : ''}><input type="radio" name="ptype" checked={type === v} onChange={() => setType(v)} /><strong>{l}</strong><span>{d}</span></label>
          ))}
        </fieldset>
        <label className="field"><span>Account holder name</span><input className="input" value={f.holderName} onChange={set('holderName')} required minLength={3} maxLength={120} autoComplete="name" />
          <small>{identityName ? `Must match your verified name: ${identityName}` : 'Must match the name on your ID — payouts only go to accounts in your own name.'}</small></label>
        {type === 'bank' && (
          <>
            <label className="field"><span>Bank</span><input className="input" value={f.bankName} onChange={set('bankName')} required placeholder="e.g. Meezan Bank" /></label>
            <label className="field"><span>IBAN</span><input className="input py-mono" value={f.iban} onChange={(e) => setF({ ...f, iban: e.target.value.toUpperCase() })} placeholder="PK36 SCBL 0000 0011 2345 6702" autoComplete="off" spellCheck={false} />
              <small>Pakistani IBANs are 24 characters starting with PK. We check the checksum before saving.</small></label>
            <label className="field"><span>Account number <small>only if your country has no IBAN</small></span><input className="input py-mono" value={f.accountNumber} onChange={set('accountNumber')} autoComplete="off" /></label>
            <div className="pf-two">
              <label className="field"><span>SWIFT / BIC <small>for transfers from abroad</small></span><input className="input py-mono" value={f.swift} onChange={(e) => setF({ ...f, swift: e.target.value.toUpperCase() })} placeholder="MEZNPKKA" /></label>
              <label className="field"><span>Branch <small>optional</small></span><input className="input" value={f.branch} onChange={set('branch')} /></label>
            </div>
          </>
        )}
        {(type === 'payoneer' || type === 'wise') && (
          <label className="field"><span>{type === 'payoneer' ? 'Payoneer' : 'Wise'} account email</span><input className="input" type="email" value={f.email} onChange={set('email')} required autoComplete="email" />
            <small>We’ll send a code to this address to confirm it’s yours.</small></label>
        )}
        {type === 'card' && (
          <>
            <p className="notice"><FiLock aria-hidden="true" /> Don’t type the full card number. Aurelance only keeps the brand and the last four digits.</p>
            <div className="pf-two">
              <label className="field"><span>Card</span><select className="input" value={f.brand} onChange={set('brand')}><option value="visa">Visa</option><option value="mastercard">Mastercard</option></select></label>
              <label className="field"><span>Last 4 digits</span><input className="input py-mono" inputMode="numeric" value={f.last4} onChange={(e) => setF({ ...f, last4: e.target.value.replace(/\D/g, '').slice(0, 4) })} required pattern="\d{4}" /></label>
            </div>
            <div className="pf-two">
              <label className="field"><span>Expiry month</span><input className="input" type="number" min="1" max="12" value={f.expMonth} onChange={set('expMonth')} required /></label>
              <label className="field"><span>Expiry year</span><input className="input" type="number" min={new Date().getFullYear()} max={new Date().getFullYear() + 15} value={f.expYear} onChange={set('expYear')} required /></label>
            </div>
          </>
        )}
        <div className="pf-two">
          <label className="field"><span>Country</span><input className="input" value={f.country} onChange={set('country')} /></label>
          <label className="field"><span>Currency</span><select className="input" value={f.currency} onChange={set('currency')}>{['PKR', 'USD', 'EUR', 'GBP', 'AED'].map((c) => <option key={c}>{c}</option>)}</select></label>
        </div>
        <button type="submit" className="btn btn-gilt" disabled={busy}>{busy ? <span className="spinner" /> : 'Save — encrypted'}</button>
      </form>
    </Modal>
  );
}

function MethodRow({ m, identity, onChange }) {
  const toast = useToast();
  const [mode, setMode] = useState('');
  const [code, setCode] = useState('');
  const [proof, setProof] = useState(null);
  const [password, setPassword] = useState('');
  const [details, setDetails] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn, ok) => { setBusy(true); try { const r = await fn(); if (ok) toast.ok(typeof ok === 'function' ? ok(r) : ok); onChange(); } catch (e) { toast.err(e); } setBusy(false); };
  const pickProof = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { toast.err('The proof must be under 1.5 MB'); return; }
    setProof({ name: file.name, data: await fileToDataUrl(file) });
  };
  const needsEmail = ['payoneer', 'wise'].includes(m.type) && !m.emailConfirmed;
  const canVerify = ['unverified', 'rejected'].includes(m.status);

  return (
    <li className={`py-row is-${m.status}`}>
      <div className="py-row-main">
        <strong>{m.display}{m.isDefault && <span className="chip chip-gilt"><FiStar aria-hidden="true" /> Default</span>}</strong>
        <small>{m.label} · {m.holderName}{m.currency ? ` · ${m.currency}` : ''}</small>
        <span className="row-wrap">
          <span className={`chip ${STATUS[m.status][1]}`}>{m.status === 'verified' && <FiCheck aria-hidden="true" />}{STATUS[m.status][0]}</span>
          {m.status === 'pending' && <span className="muted-sm">Submitted {day(m.submittedAt)} — usually within a day</span>}
          {m.status === 'rejected' && m.reviewNote && <span className="muted-sm">{m.reviewNote}</span>}
        </span>
      </div>
      <div className="py-row-actions">
        {canVerify && needsEmail && <button type="button" className="btn btn-sm btn-gilt" disabled={busy} onClick={() => run(() => api.post(`/payouts/${m._id}/email-code`), (r) => r.message).then(() => setMode('code'))}>Confirm email</button>}
        {canVerify && !needsEmail && <button type="button" className="btn btn-sm btn-gilt" onClick={() => setMode('verify')}>Verify</button>}
        {m.type !== 'card' && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('reveal')} aria-label="Show full details"><FiEye /></button>}
        {m.status === 'verified' && !m.isDefault && <button type="button" className="btn btn-sm btn-ghost" onClick={() => run(() => api.post(`/payouts/${m._id}/default`), 'Default set')}>Make default</button>}
        <button type="button" className="btn btn-sm btn-ghost" aria-label="Remove" onClick={() => { if (window.confirm(`Remove ${m.display}? It stops being shared on any contract.`)) run(() => api.delete(`/payouts/${m._id}`), 'Removed'); }}><FiTrash2 /></button>
      </div>

      {mode === 'code' && (
        <form className="py-inline" onSubmit={(e) => { e.preventDefault(); run(() => api.post(`/payouts/${m._id}/email-confirm`, { code }), 'Email confirmed').then(() => setMode('')); }}>
          <label className="field"><span>6-digit code from the email</span><input className="input py-mono" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" /></label>
          <button type="submit" className="btn btn-sm btn-gilt" disabled={code.length !== 6 || busy}>Confirm</button>
        </form>
      )}
      {mode === 'verify' && (
        <div className="py-inline">
          {identity !== 'approved' ? (
            <p className="notice notice-warn">Verify your identity first — we match the account name against it. <Link to="/settings?tab=verification">Start ID verification</Link></p>
          ) : (
            <>
              <p className="muted-sm">{PROOF[m.type]} The file is encrypted, seen only by a reviewer, and deleted when the review is done.</p>
              <div className="row-wrap">
                <label className="btn btn-sm"><FiUpload /> Choose proof<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden onChange={pickProof} /></label>
                {proof && <span className="chip">{proof.name}</span>}
                <button type="button" className="btn btn-sm btn-gilt" disabled={!proof || busy} onClick={() => run(() => api.post(`/payouts/${m._id}/verify`, { proof: proof.data, proofKind: m.type }), (r) => r.message).then(() => setMode(''))}>Submit for review</button>
              </div>
            </>
          )}
        </div>
      )}
      {mode === 'reveal' && (
        <div className="py-inline">
          {details ? (
            <dl className="ct-details">{Object.entries(details).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd><code>{v}</code></dd></div>)}</dl>
          ) : (
            <form className="row-wrap" onSubmit={async (e) => { e.preventDefault(); try { const r = await api.post(`/payouts/${m._id}/reveal`, { password }); setDetails(r.details); } catch (err) { toast.err(err); } }}>
              <input className="input py-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" aria-label="Password" />
              <button type="submit" className="btn btn-sm">Show</button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}

export default function Payouts() {
  const toast = useToast();
  const [d, setD] = useState(null);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => api.get('/payouts').then(setD).catch((e) => toast.err(e)), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  if (!d) return <span className="spinner" />;
  const req = d.requirements;
  return (
    <section className="st-section py">
      <div className="pf-sec-head"><h2>Where you get paid</h2><button type="button" className="btn btn-sm btn-gilt" onClick={() => setAdding(true)} disabled={!req.enabled}><FiPlus /> Add method</button></div>
      <p className="st-hint">Clients pay you directly. Verified methods show a badge on your profile — just the type, never the numbers — and you choose which one to share on each contract. Details are encrypted at rest.</p>
      {!req.enabled && <p className="notice notice-warn">Payout methods aren’t switched on for this server yet.</p>}
      {req.identity !== 'approved' && <p className="notice">Step 1: <Link to="/settings?tab=verification">verify your identity</Link>. Payout accounts must be in the same name.</p>}
      {d.methods.length ? <ul className="py-list">{d.methods.map((m) => <MethodRow key={m._id} m={m} identity={req.identity} onChange={load} />)}</ul> : <p className="muted-sm">No payout methods yet.</p>}
      {adding && <AddMethod identityName={req.identityName} onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load(); }} />}
    </section>
  );
}
