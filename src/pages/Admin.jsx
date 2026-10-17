// src/pages/Admin.jsx — operator console (ADMIN_EMAILS only): ID review queue, tickets, totals.
import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import '../styles/Admin.css';

/* Payout method review: proof + decrypted details + the verified ID name, side by side. */
function PayoutQueue() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(null);
  const [reason, setReason] = useState('');
  const load = useCallback(() => api.get('/admin/payouts').then((r) => setRows(r.payouts)).catch((e) => toast.err(e)), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  const view = async (id) => { setOpen({ loading: true }); setReason(''); try { setOpen((await api.get(`/admin/payouts/${id}`)).payout); } catch (e) { toast.err(e); setOpen(null); } };
  const decide = async (approve) => {
    try { await api.post(`/admin/payouts/${open._id}/${approve ? 'approve' : 'reject'}`, { reason }); toast.ok(approve ? 'Verified — proof deleted' : 'Rejected — proof deleted'); setOpen(null); load(); } catch (e) { toast.err(e); }
  };
  return (
    <div className="ad-grid">
      <ul className="ad-list">
        {rows.map((m) => (
          <li key={m._id}><button type="button" className={open?._id === m._id ? 'is-on' : ''} onClick={() => view(m._id)}>
            <strong>{m.user?.name}</strong><span>{m.label}: {m.display}</span><span>Holder “{m.holderName}” · ID name “{m.identity?.fullName || 'none'}”</span>
          </button></li>
        ))}
        {!rows.length && <li className="jb-dim">No payout methods waiting.</li>}
      </ul>
      <section className="ad-review">
        {!open && <p className="jb-dim">Pick one. Check the proof shows the same holder name as the verified ID, and the account digits match.</p>}
        {open?.loading && <span className="spinner" />}
        {open && !open.loading && (
          <>
            <h2>{open.display}</h2>
            <p className="jb-dim">{open.user?.name} ({open.user?.email})</p>
            <dl className="ct-details">
              <div><dt>Holder on the account</dt><dd>{open.holderName}</dd></div>
              <div><dt>Verified ID name</dt><dd>{open.identity?.fullName || '—'} ({open.identity?.country || '—'})</dd></div>
              {open.details && Object.entries(open.details).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd><code>{v}</code></dd></div>)}
            </dl>
            {open.proof && (/^data:application\/pdf/.test(open.proof)
              ? <a className="btn btn-sm" href={open.proof} download="proof.pdf">Download PDF proof</a>
              : <div className="ad-photos"><figure><img src={open.proof} alt="Proof" /><figcaption>Proof ({open.proofKind})</figcaption></figure></div>)}
            <label className="field"><span>Reason (required to reject, sent to the user)</span><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The account title on the statement doesn’t match" /></label>
            <div className="ad-actions">
              <button type="button" className="btn btn-gilt" onClick={() => decide(true)}>Verify</button>
              <button type="button" className="btn btn-danger" disabled={!reason.trim()} onClick={() => decide(false)}>Reject</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* Scam shield: posts held for review + reports. */
function SafetyQueue() {
  const toast = useToast();
  const [d, setD] = useState({ jobs: [], reports: [] });
  const load = useCallback(() => api.get('/admin/safety').then(setD).catch((e) => toast.err(e)), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  const job = async (id, decision) => { try { await api.post(`/admin/jobs/${id}/${decision}`); toast.ok(decision === 'publish' ? 'Published' : 'Removed'); load(); } catch (e) { toast.err(e); } };
  const report = async (id, status) => { try { await api.post(`/admin/reports/${id}`, { status }); load(); } catch (e) { toast.err(e); } };
  return (
    <div className="stack">
      <h2 className="ad-h">Held job posts ({d.jobs.length})</h2>
      <ul className="ad-tickets">
        {d.jobs.map((j) => (
          <li key={j._id} className="panel">
            <header><strong>{j.title}</strong><span className="chip chip-ochre">Score {j.safety?.score}</span></header>
            <p className="jb-dim">{j.postedBy?.name} &lt;{j.postedBy?.email}&gt; · ID {j.postedBy?.identity?.status || 'none'}</p>
            <ul className="ad-flags">{(j.safety?.flags || []).map((f) => <li key={f.code}>{f.label}</li>)}</ul>
            <p className="ad-msg">{j.description}</p>
            <footer><button type="button" className="btn btn-sm" onClick={() => job(j._id, 'publish')}>Looks fine — publish</button><button type="button" className="btn btn-sm btn-danger" onClick={() => job(j._id, 'remove')}>Remove</button></footer>
          </li>
        ))}
        {!d.jobs.length && <li className="jb-dim">No held posts.</li>}
      </ul>
      <h2 className="ad-h">Open reports ({d.reports.length})</h2>
      <ul className="ad-tickets">
        {d.reports.map((r) => (
          <li key={r._id} className="panel">
            <header><strong>{r.target}: {r.reason.replace('_', ' ')}</strong>{r.job && <Link to={`/jobs/${r.targetId}`}>{r.job.title}</Link>}</header>
            <p className="jb-dim">By {r.by?.name} about {r.subject ? <Link to={`/profile/${r.subject._id}`}>{r.subject.name}</Link> : 'unknown'} · {new Date(r.createdAt).toLocaleString()}</p>
            {r.details && <p className="ad-msg">{r.details}</p>}
            <footer><button type="button" className="btn btn-sm" onClick={() => report(r._id, 'actioned')}>Actioned</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => report(r._id, 'dismissed')}>Dismiss</button></footer>
          </li>
        ))}
        {!d.reports.length && <li className="jb-dim">No open reports.</li>}
      </ul>
    </div>
  );
}

const DOC = { cnic: 'CNIC', national_id: 'National ID', passport: 'Passport', driving_license: 'Driving licence' };

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('verifications');
  const [overview, setOverview] = useState(null);
  const [queue, setQueue] = useState([]);
  const [status, setStatus] = useState('pending');
  const [open, setOpen] = useState(null);
  const [reason, setReason] = useState('');
  const [tickets, setTickets] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [o, v, t] = await Promise.all([api.get('/admin/overview'), api.get(`/admin/verifications?status=${status}`), api.get('/admin/tickets?status=open')]);
      setOverview(o); setQueue(v.verifications); setTickets(t.tickets);
    } catch (e) { toast.err(e); }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (user?.isAdmin) load(); }, [load, user]);

  if (user && !user.isAdmin) return <Navigate to="/home" replace />;

  const view = async (id) => {
    setOpen({ loading: true }); setReason('');
    try { setOpen((await api.get(`/admin/verifications/${id}`)).verification); } catch (e) { toast.err(e); setOpen(null); }
  };
  const decide = async (approve) => {
    setBusy(true);
    try {
      await api.post(`/admin/verifications/${open._id}/${approve ? 'approve' : 'reject'}`, { reason });
      toast.ok(approve ? 'Approved — photos deleted' : 'Rejected — photos deleted');
      setOpen(null); load();
    } catch (e) { toast.err(e); }
    setBusy(false);
  };
  const closeTicket = async (id) => {
    try { await api.patch(`/admin/tickets/${id}`, { status: 'resolved' }); setTickets((t) => t.filter((x) => x._id !== id)); } catch (e) { toast.err(e); }
  };

  return (
    <div className="ad">
      <header className="ledger-title">
        <h1>Admin</h1>
        {overview && <p>{overview.users} accounts, {overview.premium} on Premium. Premium members are reviewed first.</p>}
      </header>
      <nav className="tabs" role="tablist">
        {[['verifications', 'ID checks', overview?.queues?.identity], ['payouts', 'Payout methods', overview?.queues?.payouts], ['safety', 'Scam shield', (overview?.queues?.jobs || 0) + (overview?.queues?.reports || 0)], ['tickets', 'Tickets', overview?.openTickets]].map(([id, l, n]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{l}{n > 0 && <span className="count-pill">{n}</span>}</button>
        ))}
      </nav>
      {tab === 'payouts' && <PayoutQueue />}
      {tab === 'safety' && <SafetyQueue />}

      {tab === 'verifications' && (
        <div className="ad-grid">
          <section>
            <div className="jb-pills">{['pending', 'approved', 'rejected'].map((s) => <button key={s} type="button" className={status === s ? 'is-on' : ''} onClick={() => setStatus(s)}>{s[0].toUpperCase() + s.slice(1)}</button>)}</div>
            <ul className="ad-list">
              {queue.map((v) => (
                <li key={v._id}>
                  <button type="button" className={open?._id === v._id ? 'is-on' : ''} onClick={() => status === 'pending' && view(v._id)} disabled={status !== 'pending'}>
                    <strong>{v.user?.name || 'Deleted user'}</strong>
                    <span>{DOC[v.docType]} from {v.country}, {new Date(v.createdAt).toLocaleString()}</span>
                    {v.reason && <span>Reason: {v.reason}</span>}
                  </button>
                </li>
              ))}
              {!queue.length && <li className="jb-dim">Nothing {status}.</li>}
            </ul>
          </section>
          <section className="ad-review">
            {!open && <p className="jb-dim">Pick a submission to review. Photos are decrypted only while this panel is open and deleted the moment you decide.</p>}
            {open?.loading && <span className="spinner" />}
            {open && !open.loading && (
              <>
                <h2>{open.fullName}</h2>
                <p className="jb-dim">Account: {open.user?.name} ({open.user?.email}), member since {new Date(open.user?.createdAt).toLocaleDateString()}</p>
                <p className="jb-dim">{DOC[open.docType]}, {open.country}</p>
                <div className="ad-photos">
                  {[['Front', open.front], ['Back', open.back], ['Selfie', open.selfie]].filter(([, src]) => src).map(([l, src]) => (
                    <figure key={l}><img src={src} alt={l} /><figcaption>{l}</figcaption></figure>
                  ))}
                </div>
                <p className="ad-check">Check: name matches the account and document, photo matches the selfie, document isn’t expired or edited.</p>
                <label className="field"><span>Reason (required to reject, sent to the user)</span>
                  <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The back of the card is blurry" />
                </label>
                <div className="ad-actions">
                  <button type="button" className="btn btn-gilt" disabled={busy} onClick={() => decide(true)}>Approve</button>
                  <button type="button" className="btn btn-danger" disabled={busy || !reason.trim()} onClick={() => decide(false)}>Reject</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setOpen(null)}>Close</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {tab === 'tickets' && (
        <ul className="ad-tickets">
          {tickets.map((t) => (
            <li key={t._id} className="panel">
              <header><strong>{t.number}: {t.subject}</strong><span className="chip">{t.category}</span>{t.priority === 'high' && <span className="chip chip-wax">High</span>}</header>
              <p className="jb-dim">{t.name} &lt;{t.email}&gt;, {new Date(t.createdAt).toLocaleString()}</p>
              <p className="ad-msg">{t.message}</p>
              <footer>
                <a className="btn btn-sm" href={`mailto:${t.email}?subject=${encodeURIComponent(`Re: [${t.number}] ${t.subject}`)}`}>Reply by email</a>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => closeTicket(t._id)}>Mark resolved</button>
              </footer>
            </li>
          ))}
          {!tickets.length && <li className="jb-dim">No open tickets.</li>}
        </ul>
      )}
    </div>
  );
}
