// src/pages/About.jsx — what Aurelance is, plainly.
import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <article className="page-prose">
      <header className="ledger-title">
        <h1>About Aurelance</h1>
        <p>A back office for people who work for themselves.</p>
      </header>

      <p>Freelancing is two jobs: the work you’re hired for, and the bookkeeping around it — who you’re working with, what you quoted, what you invoiced, what’s been paid, and what’s due on Friday. Most of us run the second job across a spreadsheet, a notes app, a calendar and our memory.</p>
      <p>Aurelance puts that second job in one place. Clients, invoices, tasks with time tracking, contracts and proposals share the same records, so marking an invoice paid updates the client’s balance and your monthly revenue without you retyping anything.</p>

      <h2>What it does</h2>
      <ul>
        <li><strong>Clients</strong> — rates, contracts, revenue and what each client still owes, calculated from their invoices.</li>
        <li><strong>Invoices</strong> — totals, tax and discounts worked out for you; drafts, sent, paid and overdue in one list; PDF download.</li>
        <li><strong>Tasks</strong> — a board with deadlines, subtasks, comments and a timer on every card.</li>
        <li><strong>Jobs</strong> — post work or apply to it; the poster shortlists and hires, and the hire lands in both people’s records.</li>
        <li><strong>Messages and connections</strong> — one inbox for every conversation, with files, read receipts and blocking; a network of freelancers to refer work to.</li>
        <li><strong>Verification</strong> — confirmed email, linked Google or GitHub, and an optional ID check, shown as badges next to names.</li>
        <li><strong>Atelier</strong> — rate calculator, estimator, expenses, notes, brand kit and email templates; Premium adds analytics, contracts, proposals and a tax summary.</li>
      </ul>

      <h2>How it’s built</h2>
      <p>Aurelance is built and run from Lahore, Pakistan. Your data is stored in MongoDB Atlas and encrypted in transit. Payments for Premium go through Safepay; we never see or store card numbers. We don’t sell data and there are no ads. You can export everything or delete your account from Settings at any time.</p>

      <h2>Talk to us</h2>
      <p>Questions, bugs or feature requests: use the <Link to="/contact">contact form</Link> or write to <a href="mailto:aurelance454@gmail.com">aurelance454@gmail.com</a>. A person reads every message.</p>

      <p style={{ marginTop: 32 }}><Link to="/register" className="btn btn-gilt" style={{ textDecoration: 'none' }}>Create a free account</Link></p>
    </article>
  );
}
