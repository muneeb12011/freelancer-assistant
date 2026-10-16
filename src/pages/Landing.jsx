// src/pages/Landing.jsx — public home page.
// The hero is a page from the book itself: real-looking ledger rows, and one entry gets stamped "Paid".
import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Landing.css';

const LEDGER = [
  { client: 'Northwind Studio', ref: 'INV-0142', due: 'Paid Oct 2',     amount: 1850.00, state: 'paid' },
  { client: 'Kite & Key',       ref: 'INV-0143', due: 'Due in 3 days',  amount: 640.00,  state: 'soon' },
  { client: 'Harbor Coffee',    ref: 'INV-0144', due: 'Overdue 6 days', amount: 1200.00, state: 'stamp' },
  { client: 'Mehr Textiles',    ref: 'INV-0145', due: 'Draft',          amount: 2300.00, state: 'draft' },
];

const CONTENTS = [
  { title: 'Clients', body: 'Every client with their rate, contract, revenue to date and what they still owe — worked out from their invoices, not typed in by hand.', to: '/register' },
  { title: 'Invoices', body: 'Line items, tax and discounts calculated for you. Drafts, sent, paid and overdue sort themselves. Download a PDF in one click.', to: '/register' },
  { title: 'Tasks', body: 'A four-column board with deadlines, subtasks, comments and a timer on every card, so billable hours come from what you actually did.', to: '/register' },
  { title: 'Jobs & messages', body: 'Post work or apply to it, shortlist and hire, and talk it through in one inbox. Hiring someone adds the client to their book automatically.', to: '/register' },
  { title: 'Atelier', body: 'The small tools you keep re-making in spreadsheets: rate calculator, estimator, expense log, notes, brand kit and email templates.', to: '/register' },
];

const fmt = (n) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const outstanding = LEDGER.filter((r) => r.state !== 'paid' && r.state !== 'draft').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="land">
      <section className="land-hero">
        <div className="land-copy">
          <h1>Know who owes you, what’s due, and what to do next.</h1>
          <p>Aurelance keeps your clients, invoices, tasks and hours in one book, so the money side of freelancing stops living in your head.</p>
          <div className="land-cta">
            {isAuthenticated ? (
              <Link to="/home" className="btn btn-gilt">Open your workspace</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-gilt">Create a free account</Link>
                <Link to="/login" className="btn">Sign in</Link>
              </>
            )}
          </div>
          <p className="land-fine">Free for the essentials. No card needed.</p>
        </div>

        <figure className="ledger" aria-label="Example of the invoice ledger">
          <header className="ledger-head">
            <span>Receivables</span>
            <span className="money">October</span>
          </header>
          <table>
            <thead>
              <tr><th scope="col">Client</th><th scope="col">Status</th><th scope="col" className="num">Amount</th></tr>
            </thead>
            <tbody>
              {LEDGER.map((r) => (
                <tr key={r.ref} className={`row-${r.state}`}>
                  <td><strong>{r.client}</strong><span>{r.ref}</span></td>
                  <td>
                    <span className="ledger-state">{r.state === 'stamp' ? 'Overdue 6 days' : r.due}</span>
                    {r.state === 'stamp' && <span className="ledger-stamp" aria-label="Marked paid">Paid</span>}
                  </td>
                  <td className="num money">{fmt(r.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan={2}>Still to collect</td><td className="num money">{fmt(outstanding - 1200)}</td></tr>
            </tfoot>
          </table>
          <figcaption>Mark an invoice paid and the client’s balance, your dashboard and your monthly revenue all update.</figcaption>
        </figure>
      </section>

      <section className="land-contents" aria-labelledby="contents-title">
        <h2 id="contents-title">What’s in the book</h2>
        <ol className="contents">
          {CONTENTS.map((c) => (
            <li key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="land-close">
        <div>
          <h2>Start with what you already have.</h2>
          <p>Add your clients and last month’s invoices. In ten minutes you’ll see exactly what’s outstanding.</p>
        </div>
        <div className="land-close-cta">
          {!isAuthenticated && <Link to="/register" className="btn btn-gilt">Create a free account</Link>}
          <Link to="/billing" className="land-link">Compare Free and Premium <FiArrowUpRight aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
