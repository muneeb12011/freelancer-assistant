// src/components/ReportButton.jsx — one-tap "report this" for jobs, people, messages and squads.
import React, { useState } from 'react';
import { FiFlag } from 'react-icons/fi';
import api from '../services/api';
import { useToast } from './Toast';
import Modal from './Modal';

const REASONS = [
  ['scam', 'Looks like a scam'],
  ['off_platform', 'Wants to move off Aurelance'],
  ['upfront_fee', 'Asks me to pay first'],
  ['fake', 'Fake person or company'],
  ['abuse', 'Abusive or harassing'],
  ['spam', 'Spam'],
  ['other', 'Something else'],
];

export default function ReportButton({ target, targetId, label = 'Report', className = 'btn btn-sm btn-ghost' }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('scam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api.post('/reports', { target, targetId, reason, details });
      toast.ok(r.message); setOpen(false);
    } catch (err) { toast.err(err); }
    setBusy(false);
  };
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}><FiFlag aria-hidden="true" /> {label}</button>
      {open && (
        <Modal title="Report" onClose={() => setOpen(false)}>
          <form className="stack" onSubmit={send}>
            <fieldset className="radio-list">
              <legend className="visually-hidden">Reason</legend>
              {REASONS.map(([v, l]) => (
                <label key={v}><input type="radio" name="reason" checked={reason === v} onChange={() => setReason(v)} /> {l}</label>
              ))}
            </fieldset>
            <label className="field"><span>What happened <small>optional</small></span>
              <textarea className="input" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1500} placeholder="Anything that helps us check it quickly" />
            </label>
            <p className="muted-sm">The person isn’t told who reported them. After three reports, a job post is taken down until we review it.</p>
            <button type="submit" className="btn btn-gilt" disabled={busy}>{busy ? <span className="spinner" /> : 'Send report'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
