// src/pages/Jobs.jsx — find work and hire.
//   /jobs                 browse + tabs (saved, applications, my posts)
//   /jobs/new             post a job or a paid trial
//   /jobs/:id             detail — apply (alone or as a squad), or manage applicants if it's yours
//   /jobs/:id/edit        edit your job
// Trust built in: every post shows the client's report card, risky posts carry the scam-shield
// warning, every application shows Viewed / Shortlisted / Declined, and unanswered jobs close after 14 days.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiBookmark, FiSearch, FiX, FiMapPin, FiClock, FiUsers, FiEye, FiMessageSquare, FiPlus, FiExternalLink, FiArrowLeft, FiAlertTriangle, FiZap, FiShield } from 'react-icons/fi';
import api, { askAI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Navbar';
import Badges from '../components/Badges';
import Modal from '../components/Modal';
import ReportButton from '../components/ReportButton';
import { ClientLine, FreelancerLine, ReportCard } from '../components/ReportCard';
import { money, ago, day, plural } from '../lib/format';
import '../styles/Jobs.css';

const TABS = [
  { id: 'browse', label: 'Browse' },
  { id: 'saved', label: 'Saved' },
  { id: 'applications', label: 'My applications' },
  { id: 'posted', label: 'My job posts' },
];
export const APP_STATUS = {
  submitted: ['Sent', ''], viewed: ['Viewed', 'chip-slate'], shortlisted: ['Shortlisted', 'chip-gilt'], rejected: ['Declined', 'chip-wax'],
  trial: ['Paid trial', 'chip-heather'], hired: ['Hired', 'chip-sage'], withdrawn: ['Withdrawn', ''], closed: ['Closed — no reply', 'chip-wax'],
};
const DECLINE = { budget: 'Budget didn’t fit', skills: 'Needed different skills', experience: 'Needed more experience', chose_other: 'Went with someone else', not_hiring: 'No longer hiring', other: 'Other reason' };
const JOB_STATUS = { open: ['Open', 'chip-sage'], closed: ['Closed', ''], filled: ['Filled', 'chip-gilt'], review: ['In review', 'chip-ochre'] };
const LOCATION = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };
const appKey = (a) => (a.status === 'submitted' && a.viewedAt ? 'viewed' : a.status);

export const budgetText = (j) => {
  const per = j.budgetType === 'hourly' ? '/hr' : '';
  if (j.budgetMin && j.budgetMax && j.budgetMin !== j.budgetMax) return `${money(j.budgetMin, j.currency)}–${money(j.budgetMax, j.currency).replace(/^[^\d]+/, '')}${per}`;
  if (j.budgetMax || j.budgetMin) return `${money(j.budgetMax || j.budgetMin, j.currency)}${per}`;
  return 'Budget open';
};

/* ── A job row on the board ───────────────────────────────── */
function JobRow({ job, onSave, extra }) {
  const warn = job.safety?.verdict === 'warn';
  return (
    <article className="jb-row">
      <div className="jb-row-main">
        <p className="jb-row-tags">
          {job.kind === 'trial' && <span className="chip chip-heather"><FiZap aria-hidden="true" /> Paid trial</span>}
          {warn && <span className="chip chip-ochre"><FiAlertTriangle aria-hidden="true" /> Read the caution</span>}
        </p>
        <h3><Link to={`/jobs/${job._id}`}>{job.title}</Link></h3>
        <p className="jb-row-meta">
          <span>{job.category}</span>
          <span><FiMapPin aria-hidden="true" /> {LOCATION[job.locationType]}{job.location ? `, ${job.location}` : ''}</span>
          <span><FiClock aria-hidden="true" /> {job.duration}</span>
          <span>{job.experience}</span>
        </p>
        <p className="jb-row-desc">{job.description.slice(0, 200)}{job.description.length > 200 ? '…' : ''}</p>
        <div className="jb-row-by">
          {job.poster ? (
            <>
              <span className="jb-poster-name"><Avatar user={job.poster} size={20} /> {job.poster.name}<Badges badges={job.poster.badges} size={12} /></span>
              <ClientLine rep={job.poster.reputation} compact />
            </>
          ) : 'Deleted account'}
        </div>
      </div>
      <div className="jb-row-side">
        <span className="jb-budget money">{budgetText(job)}</span>
        <span className="jb-dim">{job.kind === 'trial' ? 'Paid trial task' : job.budgetType === 'hourly' ? 'Hourly' : 'Fixed price'} · {ago(job.createdAt)}</span>
        <span className="jb-dim"><FiUsers aria-hidden="true" /> {job.applicationsCount} applied</span>
        {extra}
        {onSave && !job.mine && (
          <button type="button" className={`jb-save${job.saved ? ' is-on' : ''}`} onClick={() => onSave(job)} aria-pressed={job.saved} aria-label={job.saved ? 'Remove from saved' : 'Save job'}>
            <FiBookmark /> {job.saved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>
    </article>
  );
}

/* ── /jobs ────────────────────────────────────────────────── */
export default function Jobs() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'browse';
  const [meta, setMeta] = useState(null);
  const [f, setF] = useState({ q: '', category: '', budgetType: '', locationType: '', experience: '', kind: '', reliable: '', sort: 'newest' });
  const [qDraft, setQDraft] = useState('');
  const [data, setData] = useState({ jobs: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { api.get('/jobs/meta').then(setMeta).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => setF((x) => ({ ...x, q: qDraft.trim() })), 350); return () => clearTimeout(t); }, [qDraft]);
  useEffect(() => setPage(1), [f]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'browse') {
        const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), page, hideMine: 'true' });
        const r = await api.get(`/jobs?${qs}`);
        setData((prev) => (page === 1 ? r : { ...r, jobs: [...prev.jobs, ...r.jobs] }));
      } else if (tab === 'saved') setList((await api.get('/jobs/saved')).jobs);
      else if (tab === 'applications') setList((await api.get('/jobs/applications/mine')).applications);
      else setList((await api.get('/jobs/mine')).jobs);
    } catch (e) { toast.err(e); }
    setLoading(false);
  }, [tab, f, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const toggleSave = async (job) => {
    try {
      if (job.saved) await api.delete(`/jobs/${job._id}/save`); else await api.post(`/jobs/${job._id}/save`);
      const flip = (j) => (j._id === job._id ? { ...j, saved: !j.saved } : j);
      setData((d) => ({ ...d, jobs: d.jobs.map(flip) }));
      setList((l) => (tab === 'saved' ? l.filter((j) => j._id !== job._id) : l));
    } catch (e) { toast.err(e); }
  };

  const lim = meta?.limits;
  const activeFilters = ['category', 'budgetType', 'locationType', 'experience', 'kind', 'reliable'].filter((k) => f[k]).length;

  return (
    <div className="jb">
      <header className="ledger-title page-head">
        <div>
          <h1>Find work</h1>
          <p>Every post shows how the client treats freelancers: how often they answer, how fast they pay, and what others said.</p>
        </div>
        <Link to="/jobs/new" className="btn btn-gilt"><FiPlus /> Post a job</Link>
      </header>

      <nav className="tabs" role="tablist" aria-label="Jobs sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-on' : ''}
            onClick={() => setParams(t.id === 'browse' ? {} : { tab: t.id })}>{t.label}</button>
        ))}
      </nav>
      {lim && tab !== 'posted' && (
        <p className="jb-limits">
          {lim.applicationsPerMonth === null ? 'Unlimited applications. No bidding credits, ever.' : `${Math.max(0, lim.applicationsPerMonth - lim.applicationsUsed)} of ${lim.applicationsPerMonth} free applications left this month. No bidding credits, ever.`}
        </p>
      )}

      {tab === 'browse' && (
        <div className="jb-browse">
          <aside className={`jb-filters${showFilters ? ' is-open' : ''}`} aria-label="Filters">
            <label className="jb-search">
              <FiSearch aria-hidden="true" />
              <input value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder="Skill, keyword or title" aria-label="Search jobs" />
              {qDraft && <button type="button" onClick={() => setQDraft('')} aria-label="Clear"><FiX /></button>}
            </label>
            <button type="button" className="btn btn-sm jb-filter-toggle" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              Filters{activeFilters ? ` (${activeFilters})` : ''}
            </button>
            <div className="jb-filter-body">
              <label className="check"><input type="checkbox" checked={f.reliable === 'true'} onChange={(e) => setF({ ...f, reliable: e.target.checked ? 'true' : '' })} /> Only clients who answer or are ID-verified</label>
              <label className="check"><input type="checkbox" checked={f.kind === 'trial'} onChange={(e) => setF({ ...f, kind: e.target.checked ? 'trial' : '' })} /> Paid trial tasks only</label>
              <label className="field"><span>Category</span>
                <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                  <option value="">All categories</option>
                  {(meta?.categories || []).map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <fieldset className="jb-radio"><legend>Pay</legend>
                {[['', 'Any'], ['fixed', 'Fixed price'], ['hourly', 'Hourly']].map(([v, l]) => (
                  <label key={l}><input type="radio" name="bt" checked={f.budgetType === v} onChange={() => setF({ ...f, budgetType: v })} /> {l}</label>
                ))}
              </fieldset>
              <fieldset className="jb-radio"><legend>Where</legend>
                {[['', 'Anywhere'], ['remote', 'Remote'], ['hybrid', 'Hybrid'], ['onsite', 'On-site']].map(([v, l]) => (
                  <label key={l}><input type="radio" name="lt" checked={f.locationType === v} onChange={() => setF({ ...f, locationType: v })} /> {l}</label>
                ))}
              </fieldset>
              <fieldset className="jb-radio"><legend>Level</legend>
                {[['', 'Any'], ['Entry', 'Entry'], ['Intermediate', 'Intermediate'], ['Expert', 'Expert']].map(([v, l]) => (
                  <label key={l}><input type="radio" name="ex" checked={f.experience === v} onChange={() => setF({ ...f, experience: v })} /> {l}</label>
                ))}
              </fieldset>
            </div>
          </aside>
          <section className="jb-results" aria-live="polite">
            <div className="jb-results-head">
              <span>{loading && page === 1 ? 'Loading…' : `${data.total} open job${data.total === 1 ? '' : 's'}`}</span>
              <label>Sort
                <select value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })}>
                  <option value="newest">Newest</option>
                  <option value="budget">Highest budget</option>
                  <option value="fewest">Fewest applicants</option>
                </select>
              </label>
            </div>
            {data.jobs.map((j) => <JobRow key={j._id} job={j} onSave={toggleSave} />)}
            {!loading && !data.jobs.length && (
              <div className="empty">
                <h3>No jobs match yet</h3>
                <p>Clear a filter, or post the work you need — people on Aurelance see it right away.</p>
                <Link to="/jobs/new" className="btn">Post a job</Link>
              </div>
            )}
            {page < data.pages && <button type="button" className="btn btn-block jb-more" onClick={() => setPage((p) => p + 1)} disabled={loading}>{loading ? <span className="spinner" /> : 'Show more jobs'}</button>}
          </section>
        </div>
      )}

      {tab === 'saved' && (
        <section className="jb-results">
          {list.map((j) => <JobRow key={j._id} job={j} onSave={toggleSave} extra={j.status !== 'open' && <span className="chip">{JOB_STATUS[j.status]?.[0]}</span>} />)}
          {!loading && !list.length && <div className="empty"><h3>Nothing saved</h3><p>Use Save on a job to keep it here while you write your pitch.</p></div>}
        </section>
      )}

      {tab === 'applications' && (
        <section className="jb-results">
          {list.map((a) => a.job && (
            <JobRow key={a._id} job={a.job} extra={(
              <>
                <span className={`chip ${APP_STATUS[appKey(a)][1]}`}>{APP_STATUS[appKey(a)][0]}</span>
                {a.status === 'rejected' && a.declineReason && <span className="jb-dim">{DECLINE[a.declineReason]}</span>}
                <span className="jb-dim">You asked {money(a.bid, a.job.currency)}{a.job.budgetType === 'hourly' ? '/hr' : ''}</span>
                {a.engagement && <Link className="btn btn-sm btn-gilt" to={`/contracts/${a.engagement}`}>Open contract</Link>}
              </>
            )} />
          ))}
          {!loading && !list.length && <div className="empty"><h3>No applications yet</h3><p>Every application shows when the client opened it and what they decided. If they don’t answer within 14 days, the job closes and it goes on their record.</p><button type="button" className="btn" onClick={() => setParams({})}>Browse jobs</button></div>}
        </section>
      )}

      {tab === 'posted' && (
        <section className="jb-results">
          {lim && <p className="jb-dim jb-note">{lim.openJobsUsed} of {lim.openJobs} open job posts used.</p>}
          {list.map((j) => (
            <JobRow key={j._id} job={j} extra={(
              <>
                <span className={`chip ${JOB_STATUS[j.status]?.[1]}`}>{JOB_STATUS[j.status]?.[0]}</span>
                <span className="jb-dim"><FiEye aria-hidden="true" /> {j.views} views</span>
                <Link className="btn btn-sm" to={`/jobs/${j._id}`}>Applicants ({j.applicationsCount})</Link>
              </>
            )} />
          ))}
          {!loading && !list.length && <div className="empty"><h3>You haven’t posted a job</h3><p>Not sure who to pick? Post a small paid trial first and hire the person whose work you like.</p><Link to="/jobs/new" className="btn btn-gilt">Post a job</Link></div>}
        </section>
      )}
    </div>
  );
}

/* ── /jobs/new and /jobs/:id/edit ─────────────────────────── */
const BLANK = { title: '', category: 'Development', description: '', skills: '', budgetType: 'fixed', budgetMin: '', budgetMax: '', currency: 'USD', duration: '1–4 weeks', experience: 'Intermediate', locationType: 'remote', location: '', applyBy: '', kind: 'standard', trialSlots: 3 };

export function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState('');
  const set = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.value }));
  const trial = form.kind === 'trial';

  useEffect(() => {
    api.get('/jobs/meta').then(setMeta).catch(() => {});
    if (id) {
      api.get(`/jobs/${id}`).then(({ job }) => {
        if (!job.mine) { navigate(`/jobs/${id}`, { replace: true }); return; }
        setForm({ ...BLANK, ...job, skills: (job.skills || []).join(', '), applyBy: job.applyBy ? job.applyBy.slice(0, 10) : '', budgetMin: job.budgetMin || '', budgetMax: job.budgetMax || '' });
      }).catch((e) => { toast.err(e); navigate('/jobs'); });
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const draft = async () => {
    if (notes.trim().length < 15) { toast.err('Write a sentence or two about what you need first'); return; }
    setBusy('ai');
    try {
      const text = await askAI('job-post', notes);
      const [first, ...rest] = String(text).split('\n');
      setForm((x) => ({ ...x, title: first.replace(/^title:\s*/i, '').trim().slice(0, 120), description: rest.join('\n').trim() }));
      toast.ok('Draft ready — check it before posting');
    } catch (e) { toast.err(e); }
    setBusy('');
  };

  const submit = async (e) => {
    e.preventDefault(); setBusy('save');
    try {
      const body = { ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) };
      if (trial) body.budgetMax = body.budgetMin = form.budgetMax || form.budgetMin;
      const r = id ? await api.patch(`/jobs/${id}`, body) : await api.post('/jobs', body);
      if (r.job.safety?.verdict === 'held') toast.err(r.message || 'Your post is waiting for review');
      else toast.ok(r.message || (id ? 'Job updated' : 'Job posted'));
      navigate(`/jobs/${r.job._id}`);
    } catch (err) { toast.err(err); }
    setBusy('');
  };

  if (!id && meta && !meta.canPost) {
    return (
      <div className="jb jb-form-wrap">
        <header className="ledger-title"><h1>Post a job</h1></header>
        <div className="notice notice-warn">Confirm your email first so applicants know the job is real. <Link to="/settings">Open Settings</Link> and choose “Send confirmation”.</div>
      </div>
    );
  }

  const descLen = form.description.trim().length;
  return (
    <div className="jb jb-form-wrap">
      <Link to={id ? `/jobs/${id}` : '/jobs?tab=posted'} className="jb-back"><FiArrowLeft /> {id ? 'Back to the job' : 'My job posts'}</Link>
      <header className="ledger-title">
        <h1>{id ? 'Edit job' : 'Post a job'}</h1>
        <p>Say what “done” looks like and what you’ll pay. Posts that ask for fees, ID copies or a move to WhatsApp are held for review.</p>
      </header>

      {!id && (
        <fieldset className="jb-kind">
          <legend className="visually-hidden">Kind of post</legend>
          <label className={!trial ? 'is-on' : ''}><input type="radio" name="kind" checked={!trial} onChange={() => setForm({ ...form, kind: 'standard' })} />
            <strong>A job</strong><span>Hire one person or squad for the full piece of work.</span></label>
          <label className={trial ? 'is-on' : ''}><input type="radio" name="kind" checked={trial} onChange={() => setForm({ ...form, kind: 'trial' })} />
            <strong>A paid trial</strong><span>A small paid test task for a few applicants. Judge real work, not reviews — fair to newcomers.</span></label>
        </fieldset>
      )}

      {!id && (
        <section className="jb-ai">
          <label className="field"><span>Describe it in your own words <small>optional — we’ll draft the post</small></span>
            <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="e.g. need someone to fix our Shopify checkout, it breaks on mobile, budget around $200, this week" />
          </label>
          <button type="button" className="btn btn-sm" onClick={draft} disabled={busy === 'ai'}>{busy === 'ai' ? <span className="spinner" /> : <><FiZap /> Draft the post</>}</button>
        </section>
      )}

      <form className="jb-form" onSubmit={submit}>
        <label className="field jb-span"><span>Title</span>
          <input className="input" value={form.title} onChange={set('title')} required minLength={8} maxLength={120} placeholder={trial ? 'e.g. Paid trial: redesign one product page' : 'e.g. Shopify store setup for a clothing brand'} />
        </label>
        <label className="field"><span>Category</span>
          <select className="input" value={form.category} onChange={set('category')}>{(meta?.categories || [form.category]).map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="field"><span>Skills <small>comma separated</small></span>
          <input className="input" value={form.skills} onChange={set('skills')} placeholder="Shopify, Liquid, Figma" />
        </label>
        <label className="field jb-span"><span>{trial ? 'The trial task' : 'What needs doing'} <small>{descLen < 50 ? `${50 - descLen} more characters needed` : `${descLen} / 8000`}</small></span>
          <textarea className="input jb-desc" value={form.description} onChange={set('description')} required minLength={50} maxLength={8000}
            placeholder={trial ? 'The small task, what you’ll judge it on, and what the full job is if it goes well.' : 'What you need, what “done” looks like, anything you already have (designs, copy, access).'} />
        </label>
        {trial ? (
          <div className="jb-budget-row jb-span">
            <label className="field"><span>Currency</span>
              <select className="input" value={form.currency} onChange={set('currency')}>{(meta?.currencies || ['USD', 'PKR']).map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="field"><span>Pay per trial</span><input className="input" type="number" min="1" value={form.budgetMax} onChange={set('budgetMax')} required placeholder="40" /></label>
            <label className="field"><span>How many people</span><input className="input" type="number" min="1" max="10" value={form.trialSlots} onChange={set('trialSlots')} /></label>
          </div>
        ) : (
          <>
            <fieldset className="jb-radio jb-inline"><legend>Pay</legend>
              {[['fixed', 'Fixed price'], ['hourly', 'Hourly rate']].map(([v, l]) => (
                <label key={v}><input type="radio" name="budgetType" checked={form.budgetType === v} onChange={() => setForm({ ...form, budgetType: v })} /> {l}</label>
              ))}
            </fieldset>
            <div className="jb-budget-row">
              <label className="field"><span>Currency</span>
                <select className="input" value={form.currency} onChange={set('currency')}>{(meta?.currencies || ['USD', 'PKR']).map((c) => <option key={c}>{c}</option>)}</select>
              </label>
              <label className="field"><span>From</span><input className="input" type="number" min="0" value={form.budgetMin} onChange={set('budgetMin')} placeholder="300" /></label>
              <label className="field"><span>To</span><input className="input" type="number" min="0" value={form.budgetMax} onChange={set('budgetMax')} placeholder="600" /></label>
            </div>
            <label className="field"><span>How long</span>
              <select className="input" value={form.duration} onChange={set('duration')}>{(meta?.durations || [form.duration]).map((d) => <option key={d}>{d}</option>)}</select>
            </label>
          </>
        )}
        <label className="field"><span>Experience level</span>
          <select className="input" value={form.experience} onChange={set('experience')}>{['Entry', 'Intermediate', 'Expert'].map((d) => <option key={d}>{d}</option>)}</select>
        </label>
        <label className="field"><span>Where</span>
          <select className="input" value={form.locationType} onChange={set('locationType')}>{Object.entries(LOCATION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label className="field"><span>City or region <small>optional</small></span><input className="input" value={form.location} onChange={set('location')} placeholder="Lahore" /></label>
        <label className="field"><span>Apply by <small>optional</small></span><input className="input" type="date" value={form.applyBy} onChange={set('applyBy')} min={new Date().toISOString().slice(0, 10)} /></label>
        <div className="jb-span jb-form-foot">
          <p className="jb-dim">Posting as {user?.name}. Applicants see your report card. Answer them within 14 days or the post closes automatically.</p>
          <button type="submit" className="btn btn-gilt" disabled={busy === 'save'}>{busy === 'save' ? <span className="spinner" /> : id ? 'Save changes' : trial ? 'Post paid trial' : 'Post job'}</button>
        </div>
      </form>
    </div>
  );
}

/* ── Applicant actions for the poster ─────────────────────── */
function DeclineButton({ onDecline, busy }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('chose_other');
  return (
    <>
      <button type="button" className="btn btn-sm btn-ghost" disabled={busy} onClick={() => setOpen(true)}>Decline</button>
      {open && (
        <Modal title="Decline this application" onClose={() => setOpen(false)}>
          <div className="stack">
            <p className="muted">They’ll get a short, polite note with the reason, so they’re not left waiting.</p>
            <fieldset className="radio-list">
              <legend className="visually-hidden">Reason</legend>
              {Object.entries(DECLINE).map(([v, l]) => <label key={v}><input type="radio" name="dr" checked={reason === v} onChange={() => setReason(v)} /> {l}</label>)}
            </fieldset>
            <button type="button" className="btn btn-gilt" onClick={() => { setOpen(false); onDecline(reason); }}>Decline and let them know</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function TrialButton({ app, job, onDone }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [t, setT] = useState({ title: `Paid trial: ${job.title}`.slice(0, 120), scope: '', amount: job.kind === 'trial' ? (job.budgetMax || job.budgetMin || '') : '', days: 3 });
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api.post(`/jobs/applications/${app._id}/trial`, t); setOpen(false); onDone(r); } catch (err) { toast.err(err); }
    setBusy(false);
  };
  return (
    <>
      <button type="button" className={`btn btn-sm${job.kind === 'trial' ? ' btn-gilt' : ''}`} onClick={() => setOpen(true)}><FiZap /> Paid trial</button>
      {open && (
        <Modal title={`Paid trial with ${app.applicant.name}`} onClose={() => setOpen(false)}>
          <form className="stack" onSubmit={send}>
            <p className="muted">A small, paid test task as its own contract. If you like the work, hire them for the rest.</p>
            <label className="field"><span>Title</span><input className="input" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} maxLength={120} /></label>
            <label className="field"><span>The task and how you’ll judge it</span><textarea className="input" value={t.scope} onChange={(e) => setT({ ...t, scope: e.target.value })} required minLength={20} placeholder="e.g. Redesign the product page for our best seller, mobile first. I’ll judge clarity and how fast it loads." /></label>
            <div className="jb-budget-row">
              <label className="field"><span>Pay ({job.currency})</span><input className="input" type="number" min="1" value={t.amount} onChange={(e) => setT({ ...t, amount: e.target.value })} required /></label>
              <label className="field"><span>Days to deliver</span><input className="input" type="number" min="1" max="14" value={t.days} onChange={(e) => setT({ ...t, days: e.target.value })} /></label>
            </div>
            <button type="submit" className="btn btn-gilt" disabled={busy}>{busy ? <span className="spinner" /> : 'Send trial contract'}</button>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ── /jobs/:id ────────────────────────────────────────────── */
export function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [apps, setApps] = useState([]);
  const [trialInfo, setTrialInfo] = useState(null);
  const [squads, setSquads] = useState([]);
  const [appForm, setAppForm] = useState({ coverLetter: '', bid: '', timeline: '', links: '', squad: '' });
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('waiting');
  const [showCard, setShowCard] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/jobs/${id}`);
      setJob(r.job); setApplication(r.application);
      if (r.job.mine) {
        const a = await api.get(`/jobs/${id}/applications`);
        setApps(a.applications); setTrialInfo(a.trial);
      } else {
        api.get('/squads/mine').then((s) => setSquads(s.squads.filter((q) => q.isLead && q.stats.members >= 2))).catch(() => {});
      }
    } catch (e) { toast.err(e); navigate('/jobs', { replace: true }); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const apply = async (e) => {
    e.preventDefault(); setBusy('apply');
    try {
      const r = await api.post(`/jobs/${id}/apply`, { ...appForm, squad: appForm.squad || undefined, links: appForm.links.split(/\s+/).filter(Boolean) });
      setApplication(r.application); toast.ok('Application sent. You’ll see when they open it.');
      setJob((j) => ({ ...j, applicationsCount: j.applicationsCount + 1 }));
    } catch (err) { toast.err(err); }
    setBusy('');
  };
  const draftLetter = async () => {
    setBusy('ai');
    try {
      const profile = `Freelancer: ${user?.name}, ${user?.title || ''}. Skills: ${(user?.skills || []).join(', ')}. Bio: ${user?.bio || ''}. Past projects: ${(user?.projects || []).map((p) => p.title || p.name).filter(Boolean).join('; ')}`;
      const text = await askAI('cover-letter', `JOB: ${job.title}\n${job.description}\n\nPROFILE: ${profile}`);
      setAppForm((f) => ({ ...f, coverLetter: String(text).trim() }));
    } catch (e) { toast.err(e); }
    setBusy('');
  };
  const withdraw = async () => {
    setBusy('withdraw');
    try { await api.delete(`/jobs/${id}/apply`); toast.ok('Application withdrawn'); setApplication((a) => ({ ...a, status: 'withdrawn' })); } catch (e) { toast.err(e); }
    setBusy('');
  };
  const decide = async (appId, status, declineReason) => {
    setBusy(appId);
    try {
      const r = await api.patch(`/jobs/applications/${appId}`, { status, declineReason });
      if (status === 'hired' && r.contract) { toast.ok('Draft contract created — set the milestones and sign'); navigate(`/contracts/${r.contract._id}`); return; }
      setApps((xs) => xs.map((a) => (a._id === appId ? { ...a, status: r.application.status, declineReason: r.application.declineReason, respondedAt: r.application.respondedAt } : a)));
      toast.ok({ shortlisted: 'Shortlisted — they’ve been told', rejected: 'Declined — they’ve been told', submitted: 'Moved back' }[status]);
    } catch (e) { toast.err(e); }
    setBusy('');
  };
  const declineRest = async () => {
    if (!window.confirm('Decline everyone you haven’t hired, shortlisted for a trial, or already answered? Each person gets a polite note.')) return;
    try { const r = await api.post(`/jobs/${id}/decline-rest`, { reason: 'chose_other' }); toast.ok(r.message); load(); } catch (e) { toast.err(e); }
  };
  const setStatus = async (status) => {
    try {
      const r = await api.post(`/jobs/${id}/status`, { status });
      setJob(r.job);
      toast.ok(status === 'open' ? 'Job reopened' : r.answered ? `Job closed. ${plural(r.answered, 'waiting applicant')} told.` : 'Job closed');
      if (r.answered) load();
    } catch (e) { toast.err(e); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this job and its applications? This can’t be undone.')) return;
    try { await api.delete(`/jobs/${id}`); toast.ok('Job deleted'); navigate('/jobs?tab=posted'); } catch (e) { toast.err(e); }
  };
  const toggleSave = async () => {
    try { if (job.saved) await api.delete(`/jobs/${id}/save`); else await api.post(`/jobs/${id}/save`); setJob((j) => ({ ...j, saved: !j.saved })); } catch (e) { toast.err(e); }
  };

  const waiting = apps.filter((a) => ['submitted', 'shortlisted'].includes(a.status) && !a.respondedAt);
  const oldestWaiting = waiting.length ? Math.min(...waiting.map((a) => new Date(a.createdAt).getTime())) : null;
  const daysLeft = oldestWaiting ? Math.max(0, 14 - Math.floor((Date.now() - oldestWaiting) / 86400e3)) : null;
  const FILTERS = [['waiting', 'Waiting'], ['shortlisted', 'Shortlisted'], ['trial', 'Trials'], ['hired', 'Hired'], ['rejected', 'Declined'], ['all', 'All']];
  const shownApps = useMemo(() => apps.filter((a) => (filter === 'all' ? true : filter === 'waiting' ? ['submitted'].includes(a.status) : a.status === filter)), [apps, filter]);
  if (!job) return <div className="jb"><span className="spinner" /></div>;
  const p = job.poster;
  const flags = job.safety?.flags || [];
  const canApply = !job.mine && job.status === 'open' && !(application && application.status !== 'withdrawn');

  return (
    <div className="jb jb-detail">
      <Link to={job.mine ? '/jobs?tab=posted' : '/jobs'} className="jb-back"><FiArrowLeft /> {job.mine ? 'My job posts' : 'All jobs'}</Link>
      <div className="jb-detail-grid">
        <article className="jb-post">
          <header className="ledger-title">
            <p className="jb-row-meta">
              <span>{job.category}</span>
              <span className={`chip ${JOB_STATUS[job.status]?.[1]}`}>{JOB_STATUS[job.status]?.[0]}</span>
              {job.kind === 'trial' && <span className="chip chip-heather"><FiZap aria-hidden="true" /> Paid trial · {job.trialSlots} {job.trialSlots === 1 ? 'person' : 'people'}</span>}
            </p>
            <h1>{job.title}</h1>
            <p className="jb-row-meta">
              <span><FiMapPin aria-hidden="true" /> {LOCATION[job.locationType]}{job.location ? `, ${job.location}` : ''}</span>
              <span><FiClock aria-hidden="true" /> {job.duration}</span>
              <span>{job.experience} level</span>
              <span>Posted {ago(job.createdAt)}</span>
            </p>
          </header>

          {job.mine && job.status === 'review' && (
            <div className="notice notice-warn jb-gap">This post is waiting for a quick review because it includes things scammers often use. Edit them out and it goes live straight away.</div>
          )}
          {flags.length > 0 && (
            <div className="safety jb-gap" role="note">
              <strong><FiAlertTriangle aria-hidden="true" /> {job.mine ? 'Applicants see this caution on your post' : 'Read this before you apply'}</strong>
              <ul>{flags.map((fl) => <li key={fl.code}>{fl.label}<small>{fl.tip}</small></li>)}</ul>
            </div>
          )}

          <dl className="jb-facts">
            <div><dt>{job.kind === 'trial' ? 'Pay per trial' : 'Budget'}</dt><dd className="money">{budgetText(job)}</dd></div>
            <div><dt>Applicants</dt><dd>{job.applicationsCount}</dd></div>
            <div><dt>Apply by</dt><dd>{job.applyBy ? day(job.applyBy) : 'Open'}</dd></div>
          </dl>
          <div className="jb-body">{job.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>
          {job.skills?.length > 0 && <p className="jb-skills">{job.skills.map((s) => <span key={s}>{s}</span>)}</p>}

          {job.mine && (
            <section className="jb-applicants" aria-labelledby="apps-h">
              <div className="jb-applicants-head">
                <h2 id="apps-h">Applicants</h2>
                {waiting.length > 0 && <button type="button" className="btn btn-sm" onClick={declineRest}>Decline everyone waiting</button>}
              </div>
              {daysLeft !== null && (
                <p className={`notice ${daysLeft <= 4 ? 'notice-warn' : ''} jb-gap`}>
                  {plural(waiting.length, 'person is', 'people are')} waiting for an answer. {daysLeft === 0 ? 'The post closes today' : `The post closes in ${plural(daysLeft, 'day')}`} if nobody hears back — and that shows on your report card.
                </p>
              )}
              {trialInfo && <p className="jb-dim jb-note">{trialInfo.used} of {trialInfo.slots} trial slots used.</p>}
              <div className="jb-pills" role="tablist">
                {FILTERS.map(([s, l]) => {
                  const n = s === 'all' ? apps.length : s === 'waiting' ? apps.filter((a) => a.status === 'submitted').length : apps.filter((a) => a.status === s).length;
                  return <button key={s} type="button" className={filter === s ? 'is-on' : ''} onClick={() => setFilter(s)}>{l} {n}</button>;
                })}
              </div>
              {!shownApps.length && <p className="jb-dim jb-gap">{apps.length ? 'Nobody in this list.' : 'No one has applied yet. Most jobs get their first applicants within a day.'}</p>}
              {shownApps.map((a) => (
                <article key={a._id} className="jb-app">
                  <header>
                    <Link to={`/profile/${a.applicant._id}`} className="person">
                      <Avatar user={a.applicant} size={40} />
                      <span><strong>{a.applicant.name}<Badges badges={a.applicant.badges} size={13} /></strong><small>{a.applicant.title || 'Freelancer'}{a.applicant.location ? `, ${a.applicant.location}` : ''}</small></span>
                    </Link>
                    <span className="jb-app-bid money">{money(a.bid, job.currency)}{job.budgetType === 'hourly' ? '/hr' : ''}{a.timeline && <small>{a.timeline}</small>}</span>
                  </header>
                  <FreelancerLine rep={a.applicant.reputation} />
                  {a.squad && (
                    <div className="jb-squad">
                      <strong>Applying as the squad “{a.squad.name}”</strong>
                      <ul>{a.squad.members.map((m) => <li key={m.user._id}><Link to={`/profile/${m.user._id}`}>{m.user.name}</Link>{m.role ? ` — ${m.role}` : ''}</li>)}</ul>
                    </div>
                  )}
                  <p className="jb-app-letter">{a.coverLetter}</p>
                  {a.links?.length > 0 && <p className="jb-app-links">{a.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow"><FiExternalLink /> {l.replace(/^https?:\/\//, '').slice(0, 40)}</a>)}</p>}
                  <footer>
                    <span className={`chip ${APP_STATUS[a.status]?.[1]}`}>{APP_STATUS[a.status]?.[0]}</span>
                    {a.status === 'rejected' && a.declineReason && <span className="jb-dim">{DECLINE[a.declineReason]}</span>}
                    <span className="jb-dim">{ago(a.createdAt)}</span>
                    <span className="jb-app-actions">
                      <Link className="btn btn-sm" to={a.conversation ? `/messages/${a.conversation}` : `/messages?user=${a.applicant._id}`}><FiMessageSquare /> Message</Link>
                      {a.engagement && <Link className="btn btn-sm btn-gilt" to={`/contracts/${a.engagement}`}>Contract</Link>}
                      {['submitted', 'shortlisted'].includes(a.status) && (
                        <>
                          {a.status === 'submitted' && <button type="button" className="btn btn-sm" disabled={busy === a._id} onClick={() => decide(a._id, 'shortlisted')}>Shortlist</button>}
                          <DeclineButton busy={busy === a._id} onDecline={(r) => decide(a._id, 'rejected', r)} />
                          <TrialButton app={a} job={job} onDone={(r) => { toast.ok('Trial contract sent'); navigate(`/contracts/${r.contract._id}`); }} />
                          {job.kind !== 'trial' && <button type="button" className="btn btn-sm btn-gilt" disabled={busy === a._id} onClick={() => decide(a._id, 'hired')}>Hire</button>}
                        </>
                      )}
                      {a.status === 'trial' && job.kind !== 'trial' && <button type="button" className="btn btn-sm btn-gilt" disabled={busy === a._id} onClick={() => decide(a._id, 'hired')}>Hire for the full job</button>}
                    </span>
                  </footer>
                </article>
              ))}
            </section>
          )}
        </article>

        <aside className="jb-side">
          {p && (
            <section className="panel jb-poster">
              <Link to={`/profile/${p._id}`} className="person">
                <Avatar user={p} size={44} />
                <span><strong>{p.name}<Badges badges={p.badges} size={13} /></strong><small>{p.title || 'Aurelance member'} · since {day(p.memberSince, { month: 'short', year: 'numeric' })}</small></span>
              </Link>
              <ClientLine rep={p.reputation} />
              {!job.mine && (
                <>
                  <button type="button" className="btn btn-sm btn-ghost jb-card-toggle" onClick={() => setShowCard((v) => !v)} aria-expanded={showCard}><FiShield /> {showCard ? 'Hide' : 'See'} their full client record</button>
                  {showCard && <ReportCard rep={p.reputation} as="client" />}
                  {!p.badges?.identity && <p className="jb-caution">This client hasn’t verified their ID yet. Don’t start until a contract is signed here.</p>}
                  <div className="row-wrap">
                    <Link to={`/messages?user=${p._id}`} className="btn btn-sm"><FiMessageSquare /> Ask a question</Link>
                    <ReportButton target="job" targetId={job._id} label="Report post" />
                  </div>
                </>
              )}
            </section>
          )}

          {job.mine ? (
            <section className="panel jb-manage">
              <h2>Manage</h2>
              <Link to={`/jobs/${id}/edit`} className="btn btn-block">Edit job</Link>
              {job.status === 'open' && <button type="button" className="btn btn-block" onClick={() => setStatus('closed')}>Close and tell applicants</button>}
              {['closed', 'filled'].includes(job.status) && <button type="button" className="btn btn-block" onClick={() => setStatus('open')}>Reopen</button>}
              {job.status === 'open' && <button type="button" className="btn btn-block btn-ghost" onClick={() => setStatus('filled')}>Mark as filled</button>}
              <button type="button" className="btn btn-block btn-danger" onClick={remove}>Delete job</button>
              <p className="jb-dim"><FiEye aria-hidden="true" /> {plural(job.views, 'view')}</p>
            </section>
          ) : application && application.status !== 'withdrawn' ? (
            <section className="panel jb-applied">
              <h2>Your application</h2>
              <ol className="jb-track">
                <li className="is-done">Sent {ago(application.createdAt)}</li>
                <li className={application.viewedAt ? 'is-done' : ''}>{application.viewedAt ? `Opened ${ago(application.viewedAt)}` : 'Not opened yet'}</li>
                <li className={application.respondedAt ? 'is-done' : ''}>
                  {application.respondedAt ? `${APP_STATUS[application.status]?.[0]}${application.status === 'rejected' && application.declineReason ? ` — ${DECLINE[application.declineReason]}` : ''}` : application.status === 'closed' ? 'Closed without an answer' : 'Waiting for a decision (max 14 days)'}
                </li>
              </ol>
              <p className="jb-dim">You asked {money(application.bid, job.currency)}{job.budgetType === 'hourly' ? '/hr' : ''}{application.timeline ? `, ${application.timeline}` : ''}</p>
              {application.engagement && <Link to={`/contracts/${application.engagement}`} className="btn btn-block btn-gilt">Open the contract</Link>}
              {application.conversation && <Link to={`/messages/${application.conversation}`} className="btn btn-block"><FiMessageSquare /> Conversation</Link>}
              {['submitted', 'shortlisted'].includes(application.status) && <button type="button" className="btn btn-block btn-ghost" onClick={withdraw} disabled={busy === 'withdraw'}>Withdraw</button>}
            </section>
          ) : canApply ? (
            <form className="panel jb-apply" onSubmit={apply}>
              <h2>Apply</h2>
              {squads.length > 0 && (
                <label className="field"><span>Apply as</span>
                  <select className="input" value={appForm.squad} onChange={(e) => setAppForm({ ...appForm, squad: e.target.value })}>
                    <option value="">Just me</option>
                    {squads.map((s) => <option key={s._id} value={s._id}>Squad: {s.name} ({s.stats.members})</option>)}
                  </select>
                </label>
              )}
              <label className="field"><span>Why you’re a good fit <small>{appForm.coverLetter.trim().length < 50 ? `${50 - appForm.coverLetter.trim().length} more` : ''}</small></span>
                <textarea className="input" rows={7} value={appForm.coverLetter} onChange={(e) => setAppForm({ ...appForm, coverLetter: e.target.value })} required minLength={50} maxLength={5000}
                  placeholder="Similar work you’ve done, the first milestone you’d deliver, and one question." />
              </label>
              <button type="button" className="btn btn-sm btn-ghost" onClick={draftLetter} disabled={busy === 'ai'}>{busy === 'ai' ? <span className="spinner" /> : <><FiZap /> Draft from my profile</>}</button>
              <label className="field"><span>{job.budgetType === 'hourly' ? `Your rate (${job.currency}/hr)` : `Your price (${job.currency})`}</span>
                <input className="input" type="number" min="1" value={appForm.bid} onChange={(e) => setAppForm({ ...appForm, bid: e.target.value })} required />
              </label>
              <label className="field"><span>Timeline <small>optional</small></span>
                <input className="input" value={appForm.timeline} onChange={(e) => setAppForm({ ...appForm, timeline: e.target.value })} placeholder="2 weeks" maxLength={120} />
              </label>
              <label className="field"><span>Links <small>portfolio, past work</small></span>
                <input className="input" value={appForm.links} onChange={(e) => setAppForm({ ...appForm, links: e.target.value })} placeholder="https://…" />
              </label>
              <button type="submit" className="btn btn-gilt btn-block" disabled={busy === 'apply'}>{busy === 'apply' ? <span className="spinner" /> : 'Send application'}</button>
              <button type="button" className={`btn btn-block btn-ghost${job.saved ? ' is-on' : ''}`} onClick={toggleSave}><FiBookmark /> {job.saved ? 'Saved' : 'Save for later'}</button>
              <p className="muted-sm">Never pay to apply, and never share OTP codes or your CNIC in chat. Agree everything in a contract here.</p>
            </form>
          ) : (
            <section className="panel jb-applied"><h2>Not taking applications</h2><p className="jb-dim">{job.closedReason === 'no_response' ? 'This job closed because the client didn’t answer applicants for 14 days.' : 'The client closed this job.'}</p></section>
          )}
        </aside>
      </div>
    </div>
  );
}
