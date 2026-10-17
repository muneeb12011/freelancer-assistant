// src/pages/Home.jsx — what needs you today, whether you're working or hiring.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiAlertCircle, FiPlus } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { FreelancerLine, ClientLine } from '../components/ReportCard';
import { moneyMap, plural } from '../lib/format';
import '../styles/Home.css';

const APP_LABEL = {
  submitted: 'Sent', viewed: 'Viewed', shortlisted: 'Shortlisted', rejected: 'Declined', trial: 'Paid trial', hired: 'Hired', withdrawn: 'Withdrawn', closed: 'Closed — no reply',
};

function Setup({ setup, working }) {
  const steps = [
    { done: setup.email, label: 'Confirm your email', to: '/settings?tab=account' },
    { done: setup.profile, label: 'Add a title, skills and a short bio', to: '/profile' },
    { done: setup.identity === 'approved', label: setup.identity === 'pending' ? 'ID check in review' : 'Verify your ID', to: '/settings?tab=verification', pending: setup.identity === 'pending' },
    ...(working ? [{ done: setup.payout, label: 'Add a verified payout method', to: '/settings?tab=payouts' }] : []),
  ];
  const left = steps.filter((s) => !s.done);
  if (!left.length) return null;
  return (
    <section className="hm-setup" aria-labelledby="setup-h">
      <h2 id="setup-h">Get trusted faster</h2>
      <p className="muted-sm">Verified people get answered first. {steps.length - left.length} of {steps.length} done.</p>
      <ol>
        {steps.map((s) => (
          <li key={s.label} className={s.done ? 'is-done' : s.pending ? 'is-pending' : ''}>
            <span className="hm-tick" aria-hidden="true">{s.done ? <FiCheck /> : ''}</span>
            {s.done ? <span>{s.label}</span> : <Link to={s.to}>{s.label}</Link>}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const [d, setD] = useState(null);

  useEffect(() => { api.get('/home').then(setD).catch((e) => toast.err(e)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const first = (user?.name || '').split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (!d) return <div className="hm"><header className="ledger-title"><h1>{greet}, {first}</h1></header><span className="spinner" /></div>;

  const apps = d.freelancer.applications;
  const appTotal = Object.values(apps).reduce((a, b) => a + b, 0);
  const late = d.todo.filter((t) => t.late).length;
  const fw = d.freelancer;
  const working = appTotal > 0 || fw.activeContracts > 0 || fw.payoutMethods > 0 || Object.keys(fw.receivedThisMonth || {}).length > 0 || Object.keys(fw.awaitingPayment || {}).length > 0;
  const hiring = d.client.jobs.length > 0 || d.client.activeContracts > 0 || Object.keys(d.client.owed || {}).length > 0;
  const showWorking = working || !hiring;
  const showHiring = hiring || !working;

  return (
    <div className="hm">
      <header className="ledger-title hm-head">
        <div>
          <h1>{greet}, {first}</h1>
          <p>{d.todo.length ? `${plural(d.todo.length, 'thing')} need${d.todo.length === 1 ? 's' : ''} you${late ? `, ${late} overdue` : ''}.` : 'Nothing is waiting on you right now.'}</p>
        </div>
        <div className="row-wrap">
          <Link to="/jobs" className="btn">Find work</Link>
          <Link to="/jobs/new" className="btn btn-gilt"><FiPlus /> Post a job</Link>
        </div>
      </header>

      <div className="hm-grid">
        <section className="hm-todo" aria-labelledby="todo-h">
          <h2 id="todo-h" className="visually-hidden">Needs you</h2>
          {d.todo.length ? (
            <ul>
              {d.todo.map((t, i) => (
                <li key={`${t.kind}-${t.contract || t.to}-${i}`} className={t.late ? 'is-late' : ''}>
                  <Link to={t.to}>
                    {t.late ? <FiAlertCircle aria-hidden="true" className="hm-late-ic" /> : <span className="hm-dot" aria-hidden="true" />}
                    <span>
                      {t.text}
                      {t.kind === 'answer' && t.daysLeft !== null && <small>{t.daysLeft === 0 ? 'Closes today if nobody hears back' : `Closes in ${plural(t.daysLeft, 'day')} if nobody hears back`}</small>}
                    </span>
                    <FiArrowRight aria-hidden="true" className="hm-go" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">
              <h3>All clear</h3>
              <p>When someone applies to your job, delivers work, or pays you, it shows up here with the one thing to do next.</p>
            </div>
          )}
        </section>

        <aside className="hm-side">
          <Setup setup={d.setup} working={showWorking} />

          {showWorking && <section className="hm-card">
            <h2>Working</h2>
            <dl className="hm-figs">
              <div><dt>Received this month</dt><dd className="money">{moneyMap(d.freelancer.receivedThisMonth)}</dd></div>
              <div><dt>Approved, not paid yet</dt><dd className="money">{moneyMap(d.freelancer.awaitingPayment)}</dd></div>
              <div><dt>Active contracts</dt><dd>{d.freelancer.activeContracts}</dd></div>
            </dl>
            <p className="hm-rep"><FreelancerLine rep={d.reputation} /></p>
            {appTotal > 0 && (
              <>
                <h3>Your applications</h3>
                <ul className="hm-apps">
                  {d.freelancer.recentApplications.map((a) => a.job && (
                    <li key={a._id}>
                      <Link to={`/jobs/${a.job._id}`}>{a.job.title}</Link>
                      <span className={`chip ${a.status === 'hired' || a.status === 'trial' ? 'chip-sage' : a.status === 'shortlisted' ? 'chip-gilt' : a.status === 'rejected' || a.status === 'closed' ? 'chip-wax' : a.viewed ? 'chip-slate' : ''}`}>
                        {APP_LABEL[a.status === 'submitted' && a.viewed ? 'viewed' : a.status]}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/jobs?tab=applications" className="hm-more">All applications <FiArrowRight /></Link>
              </>
            )}
          </section>}

          {showHiring && <section className="hm-card">
            <h2>Hiring</h2>
            {d.client.jobs.length ? (
              <ul className="hm-apps">
                {d.client.jobs.map((j) => (
                  <li key={j._id}>
                    <Link to={`/jobs/${j._id}`}>{j.title}</Link>
                    <span className="muted-sm">{j.status === 'review' ? 'In review' : j.waiting ? `${j.waiting} waiting` : `${j.applications} applied`}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted-sm">No open job posts. <Link to="/jobs/new">Post one</Link> or start with a paid trial task.</p>}
            {Object.keys(d.client.owed || {}).length > 0 && <p className="hm-owed">You owe {moneyMap(d.client.owed)} for approved work.</p>}
            <p className="hm-rep"><ClientLine rep={d.reputation} /></p>
          </section>}
          {!showWorking && <p className="muted-sm">Looking for work too? <Link to="/jobs">Browse jobs</Link> — the same account works both ways.</p>}
          {!showHiring && <p className="muted-sm">Need help with something? <Link to="/jobs/new">Post a job</Link> or a small paid trial.</p>}
        </aside>
      </div>
      <p className="muted-sm hm-foot">Your full record — the one other people see — is on <Link to="/profile">your profile</Link>.</p>
    </div>
  );
}
