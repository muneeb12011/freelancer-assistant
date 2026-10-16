// src/pages/Admin.jsx — operator console (ADMIN_EMAILS only): ID review queue, tickets, totals.
import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import '../styles/Admin.css';

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
        {overview && <p>{overview.users} accounts, {overview.premium} on Premium, {overview.openTickets} open tickets, {queue.length} {status} ID checks.</p>}
      </header>
      <nav className="jb-tabs" role="tablist">
        {[['verifications', 'ID checks'], ['tickets', 'Tickets']].map(([id, l]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>{l}</button>
        ))}
      </nav>

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
