// src/pages/About.jsx — what Aurelance is, plainly.
import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <article className="page-prose">
      <header className="ledger-title">
        <h1>About Aurelance</h1>
        <p>A freelance marketplace that writes down how people behave.</p>
      </header>

      <p>On most marketplaces you apply into silence, a client asks for “one small thing” three times, and you find out whether someone pays only after you’ve done the work. Freelancers in Pakistan also deal with fake “jobs” that ask for a registration fee, and with payout methods that are hard to set up and easy to get wrong.</p>
      <p>Aurelance keeps the record that answers those questions before you commit: whether a client answers applicants, how long they take to pay after approving work, whether they respect the signed scope, and what freelancers said about them once the work was done.</p>

      <h2>What it does</h2>
      <ul>
        <li><strong>Client report cards</strong> — response rate, typical reply time, jobs closed without an answer, days to pay after approval, unpaid milestones and reviews, shown on every job post.</li>
        <li><strong>No-ghosting rule</strong> — applications show Viewed, Shortlisted or Declined (with a reason). Jobs left unanswered for 14 days close themselves, applicants are told, and it counts on the client’s record.</li>
        <li><strong>Signed scope</strong> — milestones both people sign. After signing, extra work is a priced change request that only becomes a milestone when accepted.</li>
        <li><strong>Payment record</strong> — the client marks a milestone paid with a reference number; the freelancer confirms it arrived, or reports that it didn’t.</li>
        <li><strong>Scam shield</strong> — posts asking for fees, ID copies or a move to WhatsApp are held for review; risky messages carry a caution; card numbers can’t be sent in chat; one-tap reports.</li>
        <li><strong>Paid trials and squads</strong> — clients can pay for a small test task instead of judging by reviews, and freelancers can team up to take on bigger jobs.</li>
        <li><strong>Verified payouts</strong> — bank (IBAN checked), Payoneer, Wise and Visa/Mastercard, matched to your verified ID and shared only on contracts you choose.</li>
      </ul>

      <h2>How it’s built</h2>
      <p>Aurelance is built and run from Lahore, Pakistan. Data is stored in MongoDB Atlas and encrypted in transit; payout details and ID documents are also encrypted at rest, and verification documents are deleted after review. Aurelance doesn’t hold or move money between users and takes no cut. Premium is paid through Safepay; we never see card numbers. No ads, no selling data.</p>

      <h2>Talk to us</h2>
      <p>Questions, bugs or feature requests: use the <Link to="/contact">contact form</Link> or write to <a href="mailto:aurelance454@gmail.com">aurelance454@gmail.com</a>. A person reads every message.</p>

      <p style={{ marginTop: 32 }}><Link to="/register" className="btn btn-gilt" style={{ textDecoration: 'none' }}>Create a free account</Link></p>
    </article>
  );
}
