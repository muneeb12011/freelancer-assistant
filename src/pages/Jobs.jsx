// src/pages/Jobs.jsx — the jobs board.
//   /jobs                 browse + tabs (saved, applications, my posts)
//   /jobs/new             post a job
//   /jobs/:id             detail — apply, or manage applicants if it's yours
//   /jobs/:id/edit        edit your job
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FiBookmark, FiSearch, FiX, FiMapPin, FiClock, FiUsers, FiEye, FiMessageSquare, FiPlus, FiExternalLink, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Navbar';
import Badges from '../components/Badges';
import '../styles/Jobs.css';

const TABS = [
  { id: 'browse', label: 'Find work' },
  { id: 'saved', label: 'Saved' },
  { id: 'applications', label: 'My applications' },
  { id: 'posted', label: 'My job posts' },
];
const APP_STATUS = {
  submitted: ['Sent', ''], shortlisted: ['Shortlisted', 'chip-gilt'], rejected: ['Not selected', 'chip-wax'],
  hired: ['Hired', 'chip-sage'], withdrawn: ['Withdrawn', ''],
};
const JOB_STATUS = { open: ['Open', 'chip-sage'], closed: ['Closed', ''], filled: ['Filled', 'chip-gilt'] };
const LOCATION = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };

const money = (n, cur = 'USD') => new Intl.NumberFormat(cur === 'PKR' ? 'en-PK' : 'en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n || 0);
export const budgetText = (j) => {
  const per = j.budgetType === 'hourly' ? '/hr' : '';
  if (j.budgetMin && j.budgetMax && j.budgetMin !== j.budgetMax) return `${money(j.budgetMin, j.currency)}–${money(j.budgetMax, j.currency).replace(/^[^\d]+/, '')}${per}`;
  if (j.budgetMax || j.budgetMin) return `${money(j.budgetMax || j.budgetMin, j.currency)}${per}`;
  return 'Budget open';
};
const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)} d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/* ── A job row on the board ───────────────────────────────── */
function JobRow({ job, onSave, extra }) {
  return (
    <article className="jb-row">
      <div className="jb-row-main">
        <h3><Link to={`/jobs/${job._id}`}>{job.title}</Link></h3>
        <p className="jb-row-meta">
          <span>{job.category}</span>
          <span><FiMapPin aria-hidden="true" /> {LOCATION[job.locationType]}{job.location ? `, ${job.location}` : ''}</span>
          <span><FiClock aria-hidden="true" /> {job.duration}</span>
          <span>{job.experience}</span>
        </p>
        <p className="jb-row-desc">{job.description.slice(0, 220)}{job.description.length > 220 ? '…' : ''}</p>
        {job.skills?.length > 0 && <p className="jb-skills">{job.skills.slice(0, 6).map((s) => <span key={s}>{s}</span>)}</p>}
        <p className="jb-row-by">
          {job.poster ? <><Avatar user={job.poster} size={20} /> {job.poster.name}<Badges badges={job.poster.badges} size={12} /></> : 'Deleted account'}
          <span className="jb-dim">posted {ago(job.createdAt)}</span>
          <span className="jb-dim"><FiUsers aria-hidden="true" /> {job.applicationsCount} applied</span>
        </p>
      </div>
      <div className="jb-row-side">
        <span className="jb-budget money">{budgetText(job)}</span>
        <span className="jb-dim">{job.budgetType === 'hourly' ? 'Hourly' : 'Fixed price'}</span>
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
  const [f, setF] = useState({ q: '', category: '', budgetType: '', locationType: '', experience: '', sort: 'newest' });
  const [qDraft, setQDraft] = useState('');
  const [data, setData] = useState({ jobs: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="jb">
      <header className="ledger-title jb-head">
        <div>
          <h1>Jobs</h1>
          <p>Work posted by clients and other freelancers on Aurelance. Apply with a short pitch and your price; the poster replies in Messages.</p>
        </div>
        <Link to="/jobs/new" className="btn btn-gilt"><FiPlus /> Post a job</Link>
      </header>

      <nav className="jb-tabs" role="tablist" aria-label="Jobs sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-on' : ''}
            onClick={() => setParams(t.id === 'browse' ? {} : { tab: t.id })}>{t.label}</button>
        ))}
        {lim && (
          <span className="jb-limits">
            {lim.applicationsPerMonth === null ? 'Unlimited applications' : `${Math.max(0, lim.applicationsPerMonth - lim.applicationsUsed)} of ${lim.applicationsPerMonth} applications left this month`}
          </span>
        )}
      </nav>

      {tab === 'browse' && (
        <div className="jb-browse">
          <aside className="jb-filters" aria-label="Filters">
            <label className="jb-search">
              <FiSearch aria-hidden="true" />
              <input value={qDraft} onChange={(e) => setQDraft(e.target.value)} placeholder="Skill, keyword or title" aria-label="Search jobs" />
              {qDraft && <button type="button" onClick={() => setQDraft('')} aria-label="Clear"><FiX /></button>}
            </label>
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
              <div className="jb-empty">
                <h3>No jobs match yet</h3>
                <p>Clear a filter, or post the work you need yourself — other freelancers on Aurelance will see it right away.</p>
                <Link to="/jobs/new" className="btn">Post a job</Link>
              </div>
            )}
            {page < data.pages && <button type="button" className="btn btn-block jb-more" onClick={() => setPage((p) => p + 1)} disabled={loading}>{loading ? <span className="spinner" /> : 'Show more jobs'}</button>}
          </section>
        </div>
      )}

      {tab === 'saved' && (
        <section className="jb-results">
          {list.map((j) => <JobRow key={j._id} job={j} onSave={toggleSave} extra={j.status !== 'open' && <span className="chip">{JOB_STATUS[j.status][0]}</span>} />)}
          {!loading && !list.length && <div className="jb-empty"><h3>Nothing saved</h3><p>Use Save on a job to keep it here while you write your pitch.</p></div>}
        </section>
      )}

      {tab === 'applications' && (
        <section className="jb-results">
          {list.map((a) => a.job && (
            <JobRow key={a._id} job={a.job} extra={(
              <>
                <span className={`chip ${APP_STATUS[a.status][1]}`}>{APP_STATUS[a.status][0]}</span>
                <span className="jb-dim">Your bid {money(a.bid, a.job.currency)}{a.job.budgetType === 'hourly' ? '/hr' : ''}</span>
                {a.conversation && <Link className="btn btn-sm" to={`/messages/${a.conversation}`}><FiMessageSquare /> Messages</Link>}
              </>
            )} />
          ))}
          {!loading && !list.length && <div className="jb-empty"><h3>No applications yet</h3><p>When you apply to a job, its status — sent, shortlisted, hired — shows here.</p><button type="button" className="btn" onClick={() => setParams({})}>Find work</button></div>}
        </section>
      )}

      {tab === 'posted' && (
        <section className="jb-results">
          {lim && <p className="jb-dim jb-note">{lim.openJobsUsed} of {lim.openJobs} open job posts used.</p>}
          {list.map((j) => (
            <JobRow key={j._id} job={j} extra={(
              <>
                <span className={`chip ${JOB_STATUS[j.status][1]}`}>{JOB_STATUS[j.status][0]}</span>
                <span className="jb-dim"><FiEye aria-hidden="true" /> {j.views} views</span>
                <Link className="btn btn-sm" to={`/jobs/${j._id}`}>Applicants ({j.applicationsCount})</Link>
              </>
            )} />
          ))}
          {!loading && !list.length && <div className="jb-empty"><h3>You haven’t posted a job</h3><p>Need a designer, a writer or an extra pair of hands? Post it and freelancers can apply.</p><Link to="/jobs/new" className="btn btn-gilt">Post a job</Link></div>}
        </section>
      )}
    </div>
  );
}

/* ── /jobs/new and /jobs/:id/edit ─────────────────────────── */
const BLANK = { title: '', category: 'Development', description: '', skills: '', budgetType: 'fixed', budgetMin: '', budgetMax: '', currency: 'USD', duration: '1–4 weeks', experience: 'Intermediate', locationType: 'remote', location: '', applyBy: '' };

export function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => {
    api.get('/jobs/meta').then(setMeta).catch(() => {});
    if (id) {
      api.get(`/jobs/${id}`).then(({ job }) => {
        if (!job.mine) { navigate(`/jobs/${id}`, { replace: true }); return; }
        setForm({ ...BLANK, ...job, skills: (job.skills || []).join(', '), applyBy: job.applyBy ? job.applyBy.slice(0, 10) : '', budgetMin: job.budgetMin || '', budgetMax: job.budgetMax || '' });
      }).catch((e) => { toast.err(e); navigate('/jobs'); });
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) };
      const r = id ? await api.patch(`/jobs/${id}`, body) : await api.post('/jobs', body);
      toast.ok(id ? 'Job updated' : 'Job posted');
      navigate(`/jobs/${r.job._id}`);
    } catch (err) { toast.err(err); }
    setBusy(false);
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
      <Link to={id ? `/jobs/${id}` : '/jobs'} className="jb-back"><FiArrowLeft /> {id ? 'Back to the job' : 'Back to jobs'}</Link>
      <header className="ledger-title">
        <h1>{id ? 'Edit job' : 'Post a job'}</h1>
        <p>Be specific about the outcome, the deadline and the budget. Clear posts get better applicants, faster.</p>
      </header>
      <form className="jb-form" onSubmit={submit}>
        <label className="field jb-span"><span>Title</span>
          <input className="input" value={form.title} onChange={set('title')} required minLength={8} maxLength={120} placeholder="e.g. Shopify store setup for a clothing brand" />
        </label>
        <label className="field"><span>Category</span>
          <select className="input" value={form.category} onChange={set('category')}>{(meta?.categories || [form.category]).map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="field"><span>Skills <small>comma separated</small></span>
          <input className="input" value={form.skills} onChange={set('skills')} placeholder="Shopify, Liquid, Figma" />
        </label>
        <label className="field jb-span"><span>What needs doing <small>{descLen < 50 ? `${50 - descLen} more characters needed` : `${descLen} / 8000`}</small></span>
          <textarea className="input jb-desc" value={form.description} onChange={set('description')} required minLength={50} maxLength={8000}
            placeholder={'What you need, what “done” looks like, anything you already have (designs, copy, access), and how you’d like to work together.'} />
        </label>
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
        <label className="field"><span>Experience level</span>
          <select className="input" value={form.experience} onChange={set('experience')}>{['Entry', 'Intermediate', 'Expert'].map((d) => <option key={d}>{d}</option>)}</select>
        </label>
        <label className="field"><span>Where</span>
          <select className="input" value={form.locationType} onChange={set('locationType')}>{Object.entries(LOCATION).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </label>
        <label className="field"><span>City or region <small>optional</small></span><input className="input" value={form.location} onChange={set('location')} placeholder="Lahore" /></label>
        <label className="field"><span>Apply by <small>optional</small></span><input className="input" type="date" value={form.applyBy} onChange={set('applyBy')} min={new Date().toISOString().slice(0, 10)} /></label>
        <div className="jb-span jb-form-foot">
          <p className="jb-dim">Posting as {user?.name}. Applicants see your name, badges and member-since date.</p>
          <button type="submit" className="btn btn-gilt" disabled={busy}>{busy ? <span className="spinner" /> : id ? 'Save changes' : 'Post job'}</button>
        </div>
      </form>
    </div>
  );
}

/* ── /jobs/:id ────────────────────────────────────────────── */
export function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [apps, setApps] = useState([]);
  const [appForm, setAppForm] = useState({ coverLetter: '', bid: '', timeline: '', links: '' });
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/jobs/${id}`);
      setJob(r.job); setApplication(r.application);
      if (r.job.mine) setApps((await api.get(`/jobs/${id}/applications`)).applications);
    } catch (e) { toast.err(e); navigate('/jobs', { replace: true }); }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const apply = async (e) => {
    e.preventDefault(); setBusy('apply');
    try {
      const r = await api.post(`/jobs/${id}/apply`, { ...appForm, links: appForm.links.split(/\s+/).filter(Boolean) });
      setApplication(r.application); toast.ok('Application sent');
      setJob((j) => ({ ...j, applicationsCount: j.applicationsCount + 1 }));
    } catch (err) { toast.err(err); }
    setBusy('');
  };
  const withdraw = async () => {
    setBusy('withdraw');
    try { await api.delete(`/jobs/${id}/apply`); toast.ok('Application withdrawn'); setApplication((a) => ({ ...a, status: 'withdrawn' })); } catch (e) { toast.err(e); }
    setBusy('');
  };
  const decide = async (appId, status) => {
    setBusy(appId);
    try {
      const r = await api.patch(`/jobs/applications/${appId}`, { status });
      setApps((xs) => xs.map((a) => (a._id === appId ? { ...a, status: r.application.status, conversation: r.application.conversation } : a)));
      toast.ok({ shortlisted: 'Shortlisted', rejected: 'Marked not selected', hired: 'Hired — they’re in your messages', submitted: 'Moved back' }[status]);
    } catch (e) { toast.err(e); }
    setBusy('');
  };
  const setStatus = async (status) => {
    try { const r = await api.post(`/jobs/${id}/status`, { status }); setJob(r.job); toast.ok(status === 'open' ? 'Job reopened' : 'Job closed'); } catch (e) { toast.err(e); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this job and its applications? This can’t be undone.')) return;
    try { await api.delete(`/jobs/${id}`); toast.ok('Job deleted'); navigate('/jobs?tab=posted'); } catch (e) { toast.err(e); }
  };
  const toggleSave = async () => {
    try { if (job.saved) await api.delete(`/jobs/${id}/save`); else await api.post(`/jobs/${id}/save`); setJob((j) => ({ ...j, saved: !j.saved })); } catch (e) { toast.err(e); }
  };

  const shownApps = useMemo(() => apps.filter((a) => filter === 'all' || a.status === filter), [apps, filter]);
  if (!job) return <div className="jb"><span className="spinner" /></div>;
  const p = job.poster;

  return (
    <div className="jb jb-detail">
      <Link to={job.mine ? '/jobs?tab=posted' : '/jobs'} className="jb-back"><FiArrowLeft /> {job.mine ? 'My job posts' : 'All jobs'}</Link>
      <div className="jb-detail-grid">
        <article className="jb-post">
          <header className="ledger-title">
            <p className="jb-row-meta"><span>{job.category}</span><span className={`chip ${JOB_STATUS[job.status][1]}`}>{JOB_STATUS[job.status][0]}</span></p>
            <h1>{job.title}</h1>
            <p className="jb-row-meta">
              <span><FiMapPin aria-hidden="true" /> {LOCATION[job.locationType]}{job.location ? `, ${job.location}` : ''}</span>
              <span><FiClock aria-hidden="true" /> {job.duration}</span>
              <span>{job.experience} level</span>
              <span>Posted {ago(job.createdAt)}</span>
            </p>
          </header>
          <dl className="jb-facts">
            <div><dt>Budget</dt><dd className="money">{budgetText(job)}</dd></div>
            <div><dt>Applicants</dt><dd>{job.applicationsCount}</dd></div>
            <div><dt>Apply by</dt><dd>{job.applyBy ? new Date(job.applyBy).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Open'}</dd></div>
          </dl>
          <div className="jb-body">{job.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}</div>
          {job.skills?.length > 0 && <p className="jb-skills">{job.skills.map((s) => <span key={s}>{s}</span>)}</p>}

          {job.mine && (
            <section className="jb-applicants" aria-labelledby="apps-h">
              <div className="jb-applicants-head">
                <h2 id="apps-h">Applicants</h2>
                <div className="jb-pills">
                  {['all', 'submitted', 'shortlisted', 'hired', 'rejected'].map((s) => (
                    <button key={s} type="button" className={filter === s ? 'is-on' : ''} onClick={() => setFilter(s)}>
                      {s === 'all' ? 'All' : APP_STATUS[s][0]} {s === 'all' ? apps.length : apps.filter((a) => a.status === s).length}
                    </button>
                  ))}
                </div>
              </div>
              {!shownApps.length && <p className="jb-dim">{apps.length ? 'No applicants with this status.' : 'No one has applied yet. Most jobs get their first applicants within a day.'}</p>}
              {shownApps.map((a) => (
                <article key={a._id} className="jb-app">
                  <header>
                    <Link to={`/profile/${a.applicant._id}`} className="jb-app-person">
                      <Avatar user={a.applicant} size={40} />
                      <span><strong>{a.applicant.name}<Badges badges={a.applicant.badges} size={13} /></strong><small>{a.applicant.title || 'Freelancer'}{a.applicant.location ? `, ${a.applicant.location}` : ''}</small></span>
                    </Link>
                    <span className="jb-app-bid money">{money(a.bid, job.currency)}{job.budgetType === 'hourly' ? '/hr' : ''}{a.timeline && <small>{a.timeline}</small>}</span>
                  </header>
                  <p className="jb-app-letter">{a.coverLetter}</p>
                  {a.links?.length > 0 && <p className="jb-app-links">{a.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow"><FiExternalLink /> {l.replace(/^https?:\/\//, '').slice(0, 40)}</a>)}</p>}
                  <footer>
                    <span className={`chip ${APP_STATUS[a.status][1]}`}>{APP_STATUS[a.status][0]}</span>
                    <span className="jb-dim">{ago(a.createdAt)}</span>
                    <span className="jb-app-actions">
                      <Link className="btn btn-sm" to={a.conversation ? `/messages/${a.conversation}` : `/messages?user=${a.applicant._id}`}><FiMessageSquare /> Message</Link>
                      {a.status !== 'hired' && a.status !== 'shortlisted' && <button type="button" className="btn btn-sm" disabled={busy === a._id} onClick={() => decide(a._id, 'shortlisted')}>Shortlist</button>}
                      {a.status !== 'hired' && a.status !== 'rejected' && <button type="button" className="btn btn-sm btn-ghost" disabled={busy === a._id} onClick={() => decide(a._id, 'rejected')}>Not a fit</button>}
                      {a.status !== 'hired' && <button type="button" className="btn btn-sm btn-gilt" disabled={busy === a._id} onClick={() => decide(a._id, 'hired')}>Hire</button>}
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
              <Link to={`/profile/${p._id}`} className="jb-app-person">
                <Avatar user={p} size={44} />
                <span><strong>{p.name}<Badges badges={p.badges} size={13} /></strong><small>{p.title || 'Aurelance member'}</small></span>
              </Link>
              <p className="jb-dim">Member since {new Date(p.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              {!p.badges?.identity && !job.mine && <p className="jb-caution">This poster hasn’t verified their ID. Agree scope and payment in writing before starting.</p>}
              {!job.mine && <Link to={`/messages?user=${p._id}`} className="btn btn-block"><FiMessageSquare /> Ask a question</Link>}
            </section>
          )}

          {job.mine ? (
            <section className="panel jb-manage">
              <h2>Manage</h2>
              <Link to={`/jobs/${id}/edit`} className="btn btn-block">Edit job</Link>
              {job.status === 'open'
                ? <button type="button" className="btn btn-block" onClick={() => setStatus('closed')}>Close to new applicants</button>
                : <button type="button" className="btn btn-block" onClick={() => setStatus('open')}>Reopen</button>}
              {job.status !== 'filled' && <button type="button" className="btn btn-block btn-ghost" onClick={() => setStatus('filled')}>Mark as filled</button>}
              <button type="button" className="btn btn-block btn-danger" onClick={remove}>Delete job</button>
              <p className="jb-dim"><FiEye aria-hidden="true" /> {job.views} view{job.views === 1 ? '' : 's'}</p>
            </section>
          ) : application && application.status !== 'withdrawn' ? (
            <section className="panel jb-applied">
              <h2>Your application</h2>
              <p><span className={`chip ${APP_STATUS[application.status][1]}`}>{APP_STATUS[application.status][0]}</span></p>
              <p className="jb-dim">Bid {money(application.bid, job.currency)}{job.budgetType === 'hourly' ? '/hr' : ''}{application.timeline ? `, ${application.timeline}` : ''}</p>
              {application.conversation && <Link to={`/messages/${application.conversation}`} className="btn btn-block btn-gilt"><FiMessageSquare /> Open conversation</Link>}
              {['submitted', 'shortlisted'].includes(application.status) && <button type="button" className="btn btn-block btn-ghost" onClick={withdraw} disabled={busy === 'withdraw'}>Withdraw</button>}
            </section>
          ) : job.status === 'open' ? (
            <form className="panel jb-apply" onSubmit={apply}>
              <h2>Apply</h2>
              <label className="field"><span>Why you’re a good fit <small>{appForm.coverLetter.trim().length < 50 ? `${50 - appForm.coverLetter.trim().length} more` : ''}</small></span>
                <textarea className="input" rows={7} value={appForm.coverLetter} onChange={(e) => setAppForm({ ...appForm, coverLetter: e.target.value })} required minLength={50} maxLength={5000}
                  placeholder="Similar work you’ve done, how you’d approach this, and any questions." />
              </label>
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
            </form>
          ) : (
            <section className="panel jb-applied"><h2>Not taking applications</h2><p className="jb-dim">The poster closed this job.</p></section>
          )}
        </aside>
      </div>
    </div>
  );
}

