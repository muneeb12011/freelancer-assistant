// src/components/ReportCard.jsx — what someone is like to work with, from their record on Aurelance.
//   <ClientLine rep={user.reputation} />            one line under a job post or poster
//   <ReportCard rep={user.reputation} as="client" /> the full ruled card on profiles
import React from 'react';
import { FiStar } from 'react-icons/fi';

const fmt1 = (n) => (n === null || n === undefined ? null : Number(n).toFixed(1).replace(/\.0$/, ''));

export function Stars({ value, label }) {
  if (!value) return null;
  return (
    <span className="rc-stars" aria-label={`${label ? `${label}: ` : ''}${fmt1(value)} out of 5`}>
      <FiStar aria-hidden="true" /> {fmt1(value)}
    </span>
  );
}

/** One line that answers "will this client answer me and pay me?" */
export function ClientLine({ rep, compact = false }) {
  const c = rep?.asClient;
  if (!c || (!c.applicationsDue && !c.milestonesPaid && !c.reviews)) {
    return <span className="rc-line rc-new">New client · no record yet</span>;
  }
  const bits = [];
  if (c.responseRate !== null && c.responseRate !== undefined) bits.push(<span key="r" className={c.responseRate >= 70 ? 'is-good' : c.responseRate < 40 ? 'is-bad' : ''}>Answers {c.responseRate}% of applicants</span>);
  if (c.avgPayDays !== null && c.avgPayDays !== undefined) bits.push(<span key="p" className={c.avgPayDays <= 3 ? 'is-good' : c.avgPayDays > 10 ? 'is-bad' : ''}>Pays {c.avgPayDays <= 0.5 ? 'same day' : `in ${fmt1(c.avgPayDays)} days`}</span>);
  if (c.ghosted > 0) bits.push(<span key="g" className="is-bad">Left {c.ghosted} applicant{c.ghosted > 1 ? 's' : ''} with no answer</span>);
  if (c.openDisputes > 0) bits.push(<span key="d" className="is-bad">{c.openDisputes} unpaid dispute{c.openDisputes > 1 ? 's' : ''}</span>);
  if (c.reviews) bits.push(<span key="s"><Stars value={c.payment} label="Payment" /> payment ({c.reviews})</span>);
  if (!bits.length) bits.push(<span key="n">{c.applicationsDue ? `Answered ${c.applicationsAnswered} of ${c.applicationsDue} applicants` : `${c.jobsPosted} job${c.jobsPosted === 1 ? '' : 's'} posted`}</span>);
  return <span className="rc-line">{bits}</span>;
}

/** One line for a freelancer in search results and applicant lists. */
export function FreelancerLine({ rep }) {
  const f = rep?.asFreelancer;
  if (!f || (!f.contracts && !f.reviews)) return <span className="rc-line rc-new">No contracts on Aurelance yet</span>;
  const bits = [];
  if (f.completed) bits.push(<span key="c">{f.completed} completed</span>);
  if (f.onTimeRate !== null && f.onTimeRate !== undefined) bits.push(<span key="o" className={f.onTimeRate >= 85 ? 'is-good' : f.onTimeRate < 60 ? 'is-bad' : ''}>{f.onTimeRate}% on time</span>);
  if (f.reviews) bits.push(<span key="q"><Stars value={f.quality} label="Quality" /> ({f.reviews})</span>);
  if (f.workAgainRate !== null && f.workAgainRate !== undefined) bits.push(<span key="w">{f.workAgainRate}% would rehire</span>);
  return <span className="rc-line">{bits}</span>;
}

const row = (label, value, note, tone) => ({ label, value, note, tone });

/** The full card. `as` = 'client' or 'freelancer'. */
export function ReportCard({ rep, as = 'client' }) {
  const c = as === 'client' ? rep?.asClient : rep?.asFreelancer;
  const empty = !c || (as === 'client' ? !c.applicationsDue && !c.milestonesPaid && !c.reviews && !c.jobsPosted : !c.contracts && !c.reviews);
  const rows = [];
  if (!empty && as === 'client') {
    rows.push(row('Answers applicants', c.responseRate === null ? '—' : `${c.responseRate}%`, c.responseRate === null ? 'Not enough applications yet' : `${c.applicationsAnswered} of ${c.applicationsDue} answered within 7 days`, c.responseRate >= 70 ? 'good' : c.responseRate !== null && c.responseRate < 40 ? 'bad' : ''));
    rows.push(row('Typical reply', c.medianResponseHours === null ? '—' : c.medianResponseHours < 24 ? `${c.medianResponseHours} h` : `${Math.round(c.medianResponseHours / 24)} d`, 'Median time to a first answer'));
    rows.push(row('Jobs closed with no reply', c.ghosted, 'Applicants left without an answer for 14 days', c.ghosted > 0 ? 'bad' : 'good'));
    rows.push(row('Pays after approving work', c.avgPayDays === null ? '—' : c.avgPayDays <= 0.5 ? 'Same day' : `${fmt1(c.avgPayDays)} days`, c.milestonesPaid ? `${c.paidOnTimeRate}% paid within a week · ${c.milestonesPaid} milestones` : 'No paid milestones yet', c.avgPayDays !== null && c.avgPayDays <= 3 ? 'good' : c.avgPayDays > 10 ? 'bad' : ''));
    rows.push(row('Unpaid right now', c.overduePayments + c.openDisputes, `${c.overduePayments} approved over 14 days ago · ${c.openDisputes} disputed`, c.overduePayments + c.openDisputes > 0 ? 'bad' : 'good'));
    if (c.reviews) {
      rows.push(row('Pays as agreed', `${fmt1(c.payment)} / 5`, `${c.reviews} freelancer review${c.reviews > 1 ? 's' : ''}`));
      rows.push(row('Respects the scope', `${fmt1(c.scope)} / 5`, 'No “one more small thing” for free'));
      rows.push(row('Respect and communication', `${fmt1((c.respect + c.communication) / 2)} / 5`, `${c.workAgainRate}% would work for them again`));
    }
  }
  if (!empty && as === 'freelancer') {
    rows.push(row('Contracts finished', c.completed, `${c.active} active now${c.trials ? ` · ${c.trials} paid trial${c.trials > 1 ? 's' : ''}` : ''}`));
    rows.push(row('Delivered on time', c.onTimeRate === null ? '—' : `${c.onTimeRate}%`, `${c.milestonesDelivered} milestones delivered`, c.onTimeRate >= 85 ? 'good' : c.onTimeRate !== null && c.onTimeRate < 60 ? 'bad' : ''));
    rows.push(row('Revisions per delivery', c.avgRevisions === null ? '—' : fmt1(c.avgRevisions), 'How often clients asked for changes'));
    if (c.reviews) {
      rows.push(row('Quality of work', `${fmt1(c.quality)} / 5`, `${c.reviews} client review${c.reviews > 1 ? 's' : ''}`));
      rows.push(row('Meets deadlines', `${fmt1(c.deadlines)} / 5`, ''));
      rows.push(row('Communication', `${fmt1(c.communication)} / 5`, `${c.workAgainRate}% would hire again`));
    }
  }
  return (
    <section className="rc" aria-label={as === 'client' ? 'Record as a client' : 'Record as a freelancer'}>
      <h3>{as === 'client' ? 'As a client' : 'As a freelancer'}</h3>
      {empty ? (
        <p className="rc-empty">{as === 'client' ? 'Hasn’t hired on Aurelance yet. The record fills in from real jobs, payments and reviews.' : 'No contracts on Aurelance yet. Every delivery, payment and review adds to this record.'}</p>
      ) : (
        <dl>
          {rows.map((r) => (
            <div key={r.label} className={r.tone ? `is-${r.tone}` : ''}>
              <dt>{r.label}{r.note && <small>{r.note}</small>}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export default ReportCard;
