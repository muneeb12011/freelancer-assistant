// src/pages/Landing.jsx — public home page.
// The hero is the thing other marketplaces don't show you: a client's record — whether they answer,
// how fast they pay, whether they stick to scope — written down before you apply.
import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Landing.css';

const RECORD = [
  { label: 'Answers applicants', note: '47 of 51 within 7 days', value: '92%', tone: 'good' },
  { label: 'Pays after approving work', note: '31 milestones, all within a week', value: '1.6 days', tone: 'good' },
  { label: 'Jobs closed with no reply', note: 'Applicants left waiting 14 days', value: '0', tone: 'good' },
  { label: 'Respects the agreed scope', note: '12 freelancer reviews', value: '4.8 / 5', tone: '' },
  { label: 'Unpaid right now', note: 'Approved over 14 days ago', value: '0', tone: 'good' },
];

const PROBLEMS = [
  { title: 'Ghosted after applying', body: 'Every application shows when it was opened and what was decided. A client who leaves applicants waiting 14 days has the job closed for them — and it goes on their record.' },
  { title: '“One more small thing”', body: 'Both sides sign the milestones. After that the scope is locked: anything extra is a priced change request that becomes its own milestone only when accepted.' },
  { title: 'Not knowing if you’ll be paid', body: 'Clients mark each milestone paid with a reference number and you confirm it arrived. How fast they pay, and any payment they never made, shows on every job they post.' },
  { title: 'Scams dressed up as jobs', body: 'Posts asking for a “registration fee”, your CNIC copy or a move to WhatsApp are held for review. Risky messages get a caution, and card numbers can’t be sent in chat at all.' },
  { title: 'No reviews, so no work', body: 'Clients can post a small paid trial instead of judging by reviews, so someone new gets paid to prove themselves on real work.' },
  { title: 'Too big for one person', body: 'Form a squad of two to five people you’re connected with — design, build, copy — and apply to bigger jobs together under one name.' },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="land">
      <section className="land-hero">
        <div className="land-copy">
          <h1>See how a client treats freelancers before you apply.</h1>
          <p>Aurelance is a freelance marketplace that keeps the record: who answers, who pays on time, who sticks to what was signed. No bidding credits, and no fee taken from your pay.</p>
          <div className="land-cta">
            {isAuthenticated ? (
              <Link to="/home" className="btn btn-gilt">Open Aurelance</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-gilt">Create a free account</Link>
                <Link to="/login" className="btn">Sign in</Link>
              </>
            )}
          </div>
          <p className="land-fine">Free to apply and to hire. Payments go straight to you — by bank, Payoneer or Wise.</p>
        </div>

        <figure className="record" aria-label="Example of a client’s record">
          <header className="record-head">
            <span className="record-who">
              <span className="record-avatar" aria-hidden="true">NS</span>
              <span><strong>Northwind Studio</strong><small>ID verified · hiring since 2025</small></span>
            </span>
            <span className="record-seal">Client record</span>
          </header>
          <dl>
            {RECORD.map((r) => (
              <div key={r.label} className={r.tone ? `is-${r.tone}` : ''}>
                <dt>{r.label}<small>{r.note}</small></dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          <figcaption>Built from what happened on Aurelance — applications answered, milestones paid, reviews revealed once both sides have written theirs.</figcaption>
        </figure>
      </section>

      <section className="land-contents" aria-labelledby="contents-title">
        <h2 id="contents-title">Problems it’s built to stop</h2>
        <ul className="contents">
          {PROBLEMS.map((c) => (
            <li key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="land-close">
        <div>
          <h2>Your record goes with you.</h2>
          <p>Verify your ID and a payout method once. Clients see the verified badge and how you deliver — your account numbers stay private until you share them on a signed contract.</p>
        </div>
        <div className="land-close-cta">
          {!isAuthenticated && <Link to="/register" className="btn btn-gilt">Create a free account</Link>}
          <Link to="/billing" className="land-link">Compare Free and Premium <FiArrowUpRight aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
