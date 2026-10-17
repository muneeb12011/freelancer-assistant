// src/pages/Talent.jsx — find people by their record, and the squads they form.
//   /talent              people (filters: verified ID, verified payout type, availability, rate)
//   /talent?tab=squads   browse squads
//   /talent?tab=mine     your squads and invitations
//   /squads/:id          a squad
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiPlus, FiArrowLeft, FiMessageSquare, FiUsers, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Navbar';
import Badges from '../components/Badges';
import Modal from '../components/Modal';
import ReportButton from '../components/ReportButton';
import { FreelancerLine } from '../components/ReportCard';
import { money } from '../lib/format';
import '../styles/Talent.css';

export const PAYOUT_LABEL = { bank: 'Bank transfer', payoneer: 'Payoneer', wise: 'Wise', card: 'Visa / Mastercard' };

export function PayTags({ types }) {
  if (!types?.length) return null;
  return <span className="pay-tags">{types.map((t) => <span key={t} className="pay-tag is-verified"><FiCheck aria-hidden="true" /> {PAYOUT_LABEL[t] || t}</span>)}</span>;
}

function PersonCard({ p }) {
  return (
    <article className="tl-card">
      <Link to={`/profile/${p._id}`} className="person">
        <Avatar user={p} size={48} />
        <span>
          <strong>{p.name}<Badges badges={p.badges} size={13} /></strong>
          <small>{p.title || 'Freelancer'}{p.location ? ` · ${p.location}` : ''}</small>
        </span>
      </Link>
      <p className="tl-rate">{p.hourlyRate ? <><span className="money">{money(p.hourlyRate)}</span>/hr</> : 'Rate on request'}<span className={`tl-avail is-${p.availability || 'available'}`}>{p.availability === 'busy' ? 'Busy' : 'Available'}</span></p>
      {p.bio && <p className="tl-bio">{p.bio}</p>}
      {p.skills?.length > 0 && <p className="jb-skills">{p.skills.slice(0, 6).map((s) => <span key={s}>{s}</span>)}</p>}
      <FreelancerLine rep={p.reputation} />
      <PayTags types={p.payoutTypes} />
      <div className="tl-card-foot">
        <Link to={`/profile/${p._id}`} className="btn btn-sm">View record</Link>
        <Link to={`/messages?user=${p._id}`} className="btn btn-sm btn-ghost"><FiMessageSquare /> Message</Link>
      </div>
    </article>
  );
}

function SquadCard({ s }) {
  return (
    <article className="tl-card tl-squad">
      <Link to={`/squads/${s._id}`} className="tl-squad-head">
        <span className="tl-stack" aria-hidden="true">{s.members.slice(0, 4).map((m) => <Avatar key={m.user._id} user={m.user} size={32} />)}</span>
        <span><strong>{s.name}</strong><small>{s.tagline || `${s.stats.members} people`}</small></span>
      </Link>
      <p className="tl-roles">{s.members.filter((m) => m.status === 'active').map((m) => `${m.user.name.split(' ')[0]}${m.role ? ` (${m.role})` : ''}`).join(' · ')}</p>
      {s.skills?.length > 0 && <p className="jb-skills">{s.skills.slice(0, 6).map((k) => <span key={k}>{k}</span>)}</p>}
      <p className="muted-sm">{s.stats.verified} of {s.stats.members} ID-verified · {s.stats.completed} contracts finished between them{s.hourlyRate ? ` · from ${money(s.hourlyRate)}/hr` : ''}</p>
      <div className="tl-card-foot"><Link to={`/squads/${s._id}`} className="btn btn-sm">See the squad</Link></div>
    </article>
  );
}

function NewSquad({ onClose, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', tagline: '', skills: '', role: '', about: '', hourlyRate: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api.post('/squads', f); onDone(r.squad); } catch (err) { toast.err(err); }
    setBusy(false);
  };
  return (
    <Modal title="Start a squad" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <p className="muted">2–5 people who take on bigger jobs together — say a designer, a developer and a copywriter. You’ll be the lead: you apply and sign for the squad.</p>
        <label className="field"><span>Squad name</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required minLength={3} maxLength={60} placeholder="e.g. Ravi Studio" /></label>
        <label className="field"><span>One line about what you do together</span><input className="input" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} maxLength={140} placeholder="Shopify stores, designed and built end to end" /></label>
        <label className="field"><span>Your role</span><input className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} maxLength={60} placeholder="Development" /></label>
        <label className="field"><span>Skills <small>comma separated</small></span><input className="input" value={f.skills} onChange={(e) => setF({ ...f, skills: e.target.value })} placeholder="Figma, Shopify, Copywriting" /></label>
        <label className="field"><span>Starting rate (USD/hr) <small>optional</small></span><input className="input" type="number" min="0" value={f.hourlyRate} onChange={(e) => setF({ ...f, hourlyRate: e.target.value })} /></label>
        <button type="submit" className="btn btn-gilt" disabled={busy}>{busy ? <span className="spinner" /> : 'Create squad'}</button>
      </form>
    </Modal>
  );
}

/* ── /talent ──────────────────────────────────────────────── */
export default function Talent() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = ['people', 'squads', 'mine'].includes(params.get('tab')) ? params.get('tab') : 'people';
  const [qDraft, setQDraft] = useState('');
  const [f, setF] = useState({ q: '', verified: '', available: '', payout: [], maxRate: '', sort: '' });
  const [people, setPeople] = useState(null);
  const [squads, setSquads] = useState(null);
  const [mine, setMine] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { const t = setTimeout(() => setF((x) => ({ ...x, q: qDraft.trim() })), 350); return () => clearTimeout(t); }, [qDraft]);

  const load = useCallback(async () => {
    try {
      if (tab === 'people') {
        const qs = new URLSearchParams(Object.fromEntries(Object.entries({ ...f, payout: f.payout.join(',') }).filter(([, v]) => v)));
        setPeople((await api.get(`/talent?${qs}`)).people);
      } else if (tab === 'squads') setSquads((await api.get(`/squads${f.q ? `?q=${encodeURIComponent(f.q)}` : ''}`)).squads);
      else setMine(await api.get('/squads/mine'));
    } catch (e) { toast.err(e); }
  }, [tab, f]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const togglePay = (t) => setF((x) => ({ ...x, payout: x.payout.includes(t) ? x.payout.filter((y) => y !== t) : [...x.payout, t] }));
  const answer = async (s, action) => {
    try { await api.post(`/squads/${s._id}/${action}`); toast.ok(action === 'accept' ? `You joined ${s.name}` : 'Invitation declined'); load(); } catch (e) { toast.err(e); }
  };

  return (
    <div className="tl page">
      <header className="ledger-title page-head">
        <div>
          <h1>Find talent</h1>
          <p>Ranked by what people have actually delivered here — finished contracts, on-time rate and reviews — not by who paid to be on top.</p>
        </div>
        {tab === 'mine' && <button type="button" className="btn btn-gilt" onClick={() => setCreating(true)}><FiPlus /> Start a squad</button>}
      </header>
      <nav className="tabs" role="tablist">
        {[['people', 'People'], ['squads', 'Squads'], ['mine', 'Your squads']].map(([id, l]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setParams(id === 'people' ? {} : { tab: id })}>
            {l}{id === 'mine' && mine?.invitations?.length > 0 && <span className="count-pill">{mine.invitations.length}</span>}
          </button>
        ))}
      </nav>

      {tab !== 'mine' && (
        <div className="tl-filters">
          <label className="jb-search">
            <FiSearch aria-hidden="true" />
            <input value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder={tab === 'people' ? 'Name, skill or title' : 'Squad name or skill'} aria-label="Search" />
            {qDraft && <button type="button" onClick={() => setQDraft('')} aria-label="Clear"><FiX /></button>}
          </label>
          {tab === 'people' && (
            <div className="tl-filter-row">
              <label className="check"><input type="checkbox" checked={f.verified === 'true'} onChange={(e) => setF({ ...f, verified: e.target.checked ? 'true' : '' })} /> ID verified</label>
              <label className="check"><input type="checkbox" checked={f.available === 'true'} onChange={(e) => setF({ ...f, available: e.target.checked ? 'true' : '' })} /> Available now</label>
              <span className="tl-pay-filter" role="group" aria-label="Verified payout method">
                <span className="muted-sm">Gets paid via</span>
                {Object.entries(PAYOUT_LABEL).map(([t, l]) => (
                  <button key={t} type="button" className={`pay-tag${f.payout.includes(t) ? ' is-verified' : ''}`} aria-pressed={f.payout.includes(t)} onClick={() => togglePay(t)}>{l}</button>
                ))}
              </span>
              <label className="tl-rate-filter"><span className="muted-sm">Max $/hr</span><input className="input" type="number" min="0" value={f.maxRate} onChange={(e) => setF({ ...f, maxRate: e.target.value })} /></label>
              <select className="input tl-sort" value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} aria-label="Sort">
                <option value="">Best record</option><option value="rate_low">Rate: low to high</option><option value="rate_high">Rate: high to low</option><option value="newest">Newest</option>
              </select>
            </div>
          )}
        </div>
      )}

      {tab === 'people' && (!people ? <span className="spinner" /> : people.length ? <div className="tl-grid">{people.map((p) => <PersonCard key={p._id} p={p} />)}</div> : <div className="empty"><h3>Nobody matches</h3><p>Loosen a filter. Payout filters only include people whose payout method passed verification.</p></div>)}
      {tab === 'squads' && (!squads ? <span className="spinner" /> : squads.length ? <div className="tl-grid">{squads.map((s) => <SquadCard key={s._id} s={s} />)}</div> : <div className="empty"><h3>No squads yet</h3><p>Bigger jobs need more than one skill. Start a squad with people you’re connected with.</p><button type="button" className="btn" onClick={() => setParams({ tab: 'mine' })}>Your squads</button></div>)}
      {tab === 'mine' && (!mine ? <span className="spinner" /> : (
        <div className="stack">
          {mine.invitations.length > 0 && (
            <section className="tl-invites">
              <h2>Invitations</h2>
              {mine.invitations.map((s) => (
                <div key={s._id} className="tl-invite">
                  <span><strong>{s.name}</strong> — {s.lead?.name} invited you{s.members.find((m) => m.status === 'invited' && m.role)?.role ? ` as ${s.members.find((m) => m.status === 'invited').role}` : ''}</span>
                  <span className="row-wrap"><button type="button" className="btn btn-sm btn-gilt" onClick={() => answer(s, 'accept')}>Join</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => answer(s, 'decline')}>Decline</button></span>
                </div>
              ))}
            </section>
          )}
          {mine.squads.length ? <div className="tl-grid">{mine.squads.map((s) => <SquadCard key={s._id} s={s} />)}</div> : (
            <div className="empty"><h3>You’re not in a squad</h3><p>Team up with 1–4 people you’re connected with and apply to bigger jobs together under one name. Each person keeps their own record.</p><button type="button" className="btn btn-gilt" onClick={() => setCreating(true)}><FiPlus /> Start a squad</button></div>
          )}
        </div>
      ))}
      {creating && <NewSquad onClose={() => setCreating(false)} onDone={(s) => { setCreating(false); navigate(`/squads/${s._id}`); }} />}
    </div>
  );
}

/* ── /squads/:id ──────────────────────────────────────────── */
export function SquadDetail() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [connections, setConnections] = useState([]);
  const [invite, setInvite] = useState({ userId: '', role: '' });
  const [edit, setEdit] = useState(null);

  const load = useCallback(() => api.get(`/squads/${id}`).then((r) => setS(r.squad)).catch((e) => { toast.err(e); navigate('/talent?tab=squads'); }), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (s?.isLead) api.get('/connections').then((r) => setConnections((r.connections || []).filter((c) => c.linkedUser))).catch(() => {}); }, [s?.isLead]);

  const act = async (fn, ok) => { try { const r = await fn(); if (r?.squad) setS(r.squad); if (ok) toast.ok(ok); } catch (e) { toast.err(e); } };
  if (!s) return <div className="tl page"><span className="spinner" /></div>;
  const memberIds = new Set(s.members.map((m) => String(m.user._id)));
  const invitable = connections.filter((c) => !memberIds.has(String(c.linkedUser)));

  return (
    <div className="tl page-narrow">
      <Link to={s.myStatus ? '/talent?tab=mine' : '/talent?tab=squads'} className="jb-back"><FiArrowLeft /> Squads</Link>
      <header className="ledger-title">
        <p className="row-wrap"><span className="chip"><FiUsers aria-hidden="true" /> {s.stats.members} {s.stats.members === 1 ? 'person' : 'people'}</span>{s.availability === 'busy' && <span className="chip chip-ochre">Busy</span>}</p>
        <h1>{s.name}</h1>
        {s.tagline && <p>{s.tagline}</p>}
      </header>

      {s.about && <p className="tl-about">{s.about}</p>}
      {s.skills?.length > 0 && <p className="jb-skills">{s.skills.map((k) => <span key={k}>{k}</span>)}</p>}

      <section className="tl-members">
        <h2>Who’s in it</h2>
        <ul>
          {s.members.map((m) => (
            <li key={m.user._id}>
              <Link to={`/profile/${m.user._id}`} className="person"><Avatar user={m.user} size={40} /><span><strong>{m.user.name}<Badges badges={m.user.badges} size={12} /></strong><small>{m.role || m.user.title || 'Member'}{String(s.lead?._id) === String(m.user._id) ? ' · Lead' : ''}{m.status === 'invited' ? ' · Invited' : ''}</small></span></Link>
              <FreelancerLine rep={m.user.reputation} />
              {s.isLead && String(s.lead?._id) !== String(m.user._id) && <button type="button" className="btn btn-sm btn-ghost" onClick={() => act(() => api.delete(`/squads/${id}/members/${m.user._id}`), 'Removed')}>Remove</button>}
            </li>
          ))}
        </ul>
      </section>

      {s.isLead && (
        <section className="tl-lead">
          <h2>Lead tools</h2>
          {s.members.length < 5 && (
            <form className="tl-invite-form" onSubmit={(e) => { e.preventDefault(); act(() => api.post(`/squads/${id}/invite`, invite), 'Invitation sent in Messages'); setInvite({ userId: '', role: '' }); }}>
              <label className="field"><span>Invite someone you’re connected with</span>
                <select className="input" value={invite.userId} onChange={(e) => setInvite({ ...invite, userId: e.target.value })} required>
                  <option value="">Choose a connection</option>
                  {invitable.map((c) => <option key={c._id} value={c.linkedUser}>{c.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Their role</span><input className="input" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} maxLength={60} placeholder="Design" /></label>
              <button type="submit" className="btn btn-gilt" disabled={!invite.userId}>Invite</button>
            </form>
          )}
          {!invitable.length && s.members.length < 5 && <p className="muted-sm">Connect with people first in <Link to="/network">your network</Link> — squads are for people who know each other.</p>}
          <div className="row-wrap">
            <button type="button" className="btn btn-sm" onClick={() => setEdit({ name: s.name, tagline: s.tagline, about: s.about, skills: s.skills.join(', '), hourlyRate: s.hourlyRate || '', availability: s.availability })}>Edit squad</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => { if (window.confirm('Disband this squad?')) act(async () => { await api.delete(`/squads/${id}`); navigate('/talent?tab=mine'); }, 'Squad disbanded'); }}>Disband</button>
          </div>
        </section>
      )}
      {s.myStatus === 'active' && !s.isLead && <button type="button" className="btn btn-sm btn-ghost" onClick={() => act(async () => { await api.post(`/squads/${id}/leave`); navigate('/talent?tab=mine'); }, 'You left the squad')}>Leave squad</button>}
      {s.myStatus === 'invited' && <div className="row-wrap"><button type="button" className="btn btn-gilt" onClick={() => act(() => api.post(`/squads/${id}/accept`), 'Joined')}>Join this squad</button><button type="button" className="btn btn-ghost" onClick={() => act(async () => { await api.post(`/squads/${id}/decline`); navigate('/talent?tab=mine'); })}>Decline</button></div>}
      {!s.myStatus && (
        <div className="row-wrap">
          <Link to={`/messages?user=${s.lead?._id}`} className="btn btn-gilt"><FiMessageSquare /> Message the lead</Link>
          <ReportButton target="squad" targetId={s._id} />
        </div>
      )}

      {edit && (
        <Modal title="Edit squad" onClose={() => setEdit(null)}>
          <form className="stack" onSubmit={(e) => { e.preventDefault(); act(() => api.patch(`/squads/${id}`, edit), 'Saved'); setEdit(null); }}>
            <label className="field"><span>Name</span><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} minLength={3} maxLength={60} /></label>
            <label className="field"><span>Tagline</span><input className="input" value={edit.tagline} onChange={(e) => setEdit({ ...edit, tagline: e.target.value })} maxLength={140} /></label>
            <label className="field"><span>About</span><textarea className="input" value={edit.about} onChange={(e) => setEdit({ ...edit, about: e.target.value })} maxLength={2000} /></label>
            <label className="field"><span>Skills</span><input className="input" value={edit.skills} onChange={(e) => setEdit({ ...edit, skills: e.target.value })} /></label>
            <label className="field"><span>Starting rate (USD/hr)</span><input className="input" type="number" min="0" value={edit.hourlyRate} onChange={(e) => setEdit({ ...edit, hourlyRate: e.target.value })} /></label>
            <label className="field"><span>Availability</span><select className="input" value={edit.availability} onChange={(e) => setEdit({ ...edit, availability: e.target.value })}><option value="available">Taking work</option><option value="busy">Busy</option></select></label>
            <button type="submit" className="btn btn-gilt">Save</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
