// src/pages/Billing.jsx — THE single place for plans and upgrading.
// Guests see pricing; members see their plan, checkout (Safepay), renewal and receipts.
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import api, { errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import '../styles/Billing.css';

const money = (amount, currency) => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat(currency === 'PKR' ? 'en-PK' : 'en-US', { style: 'currency', currency, maximumFractionDigits: currency === 'PKR' ? 0 : 2 }).format(amount);
};
const date = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—');

const RETURN_NOTICES = {
  success: ['ok', 'Payment received — Premium is active. A receipt is on its way to your inbox.'],
  pending: ['warn', 'We’re waiting for Safepay to confirm your payment. This usually takes under a minute; refresh this page shortly.'],
  cancelled: ['', 'Checkout was cancelled. You haven’t been charged.'],
  error: ['err', 'Checkout didn’t complete. You haven’t been charged — try again or contact support.'],
};

export default function Billing() {
  const { user, isAuthenticated, isPremium, refreshUser, setUser } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = useState(null);
  const [sub, setSub] = useState(null);
  const [history, setHistory] = useState([]);
  const [interval, setPeriod] = useState('month');
  const [busy, setBusy] = useState('');
  const [loadErr, setLoadErr] = useState('');
  const [returnNotice, setReturnNotice] = useState(null);

  const load = useCallback(async () => {
    setLoadErr('');
    try {
      const plans = await api.get('/billing/plans');
      setCatalog(plans);
      if (isAuthenticated) {
        const [s, h] = await Promise.all([api.get('/billing/subscription'), api.get('/billing/history')]);
        setSub(s); setHistory(h.payments || []);
      }
    } catch (e) { setLoadErr(errorMessage(e)); }
  }, [isAuthenticated]);

  useEffect(() => { load(); }, [load]);

  // Coming back from Safepay
  useEffect(() => {
    const state = params.get('checkout');
    if (!state) return;
    setReturnNotice(RETURN_NOTICES[state] || null);
    params.delete('checkout');
    setParams(params, { replace: true });
    if (isAuthenticated) refreshUser().then(load).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const premium = catalog?.plans?.find((p) => p.id === 'premium');
  const free = catalog?.plans?.find((p) => p.id === 'free');
  const currency = premium?.local?.currency || 'USD';
  const yearlySaving = premium ? premium.prices.month * 12 - premium.prices.year : 0;

  const checkout = async () => {
    setBusy('checkout');
    try {
      const r = await api.post('/billing/checkout', { plan: 'premium', interval });
      window.location.assign(r.url);
    } catch (e) { toast.err(e); setBusy(''); }
  };

  const toggleRenewal = async () => {
    setBusy('renewal');
    try {
      const r = await api.post(sub?.cancelAtPeriodEnd ? '/billing/resume' : '/billing/cancel');
      setUser(r.user); toast.ok(r.message); await load();
    } catch (e) { toast.err(e); }
    setBusy('');
  };

  const priceFor = (p) => (p?.local ? p.local[interval] : null);

  return (
    <div className={`bill${isAuthenticated ? '' : ' bill-public'}`}>
      <header className="ledger-title">
        <h1>{isAuthenticated ? 'Plan & billing' : 'Pricing'}</h1>
        <p>{isAuthenticated ? 'Your plan, renewals and receipts.' : 'Applying and hiring are free, with every safety feature included. Premium is for people who apply or hire every week.'}</p>
      </header>

      {returnNotice && <div className={`notice ${returnNotice[0] ? `notice-${returnNotice[0]}` : ''} bill-notice`} role="status">{returnNotice[1]}</div>}
      {loadErr && <div className="notice notice-err bill-notice" role="alert">{loadErr} <button type="button" className="btn btn-sm" onClick={load}>Retry</button></div>}

      {isAuthenticated && (
        <section className="bill-current panel" aria-labelledby="bill-current-h">
          <div>
            <h2 id="bill-current-h">{isPremium ? 'Premium' : 'Free'}</h2>
            <p>
              {isPremium
                ? (sub?.cancelAtPeriodEnd
                    ? <>Active until <strong>{date(sub?.expiresAt || user?.planExpiresAt)}</strong>. It won’t renew.</>
                    : <>Paid through <strong>{date(sub?.expiresAt || user?.planExpiresAt)}</strong>. We’ll email you a week before it ends.</>)
                : 'You’re on the Free plan. Everything you create stays yours if you ever upgrade or downgrade.'}
            </p>
          </div>
          {isPremium && (
            <div className="bill-current-actions">
              <button type="button" className="btn" onClick={checkout} disabled={!!busy || !catalog?.paymentsEnabled}>
                {busy === 'checkout' ? <span className="spinner" /> : `Extend by a ${interval}`}
              </button>
              <button type="button" className="btn btn-ghost" onClick={toggleRenewal} disabled={!!busy}>
                {busy === 'renewal' ? <span className="spinner" /> : sub?.cancelAtPeriodEnd ? 'Turn reminders back on' : 'Don’t renew'}
              </button>
            </div>
          )}
        </section>
      )}

      <div className="bill-interval" role="radiogroup" aria-label="Billing period">
        {['month', 'year'].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={interval === i} className={interval === i ? 'is-on' : ''} onClick={() => setPeriod(i)}>
            {i === 'month' ? 'Monthly' : 'Yearly'}
            {i === 'year' && yearlySaving > 0 && <span className="bill-save">2 months free</span>}
          </button>
        ))}
      </div>

      <section className="bill-plans" aria-label="Plans">
        {[free, premium].filter(Boolean).map((p) => {
          const isCurrent = isAuthenticated && ((p.id === 'premium') === isPremium);
          const local = priceFor(p);
          return (
            <article key={p.id} className={`bill-plan${p.id === 'premium' ? ' bill-plan-premium' : ''}`}>
              <header>
                <h3>{p.name}</h3>
                {isCurrent && <span className="chip chip-gilt">Your plan</span>}
              </header>
              <p className="bill-tagline">{p.tagline}</p>
              <p className="bill-price">
                {p.id === 'free' ? <><span className="money">{money(0, currency)}</span><span className="bill-per">forever</span></> : (
                  <>
                    <span className="money">{money(local, currency)}</span>
                    <span className="bill-per">per {interval}</span>
                  </>
                )}
              </p>
              {p.id === 'premium' && currency !== 'USD' && (
                <p className="bill-usd">About {money(p.prices[interval], 'USD')}, charged in {currency} at today’s rate.</p>
              )}
              <ul>
                {p.features.map((f) => <li key={f}><FiCheck aria-hidden="true" /> {f}</li>)}
              </ul>
              <div className="bill-plan-cta">
                {p.id === 'free' && !isAuthenticated && <Link to="/register" className="btn btn-block">Create a free account</Link>}
                {p.id === 'premium' && !isAuthenticated && <Link to="/register" className="btn btn-gilt btn-block">Start free, upgrade anytime</Link>}
                {p.id === 'premium' && isAuthenticated && !isPremium && (
                  <button type="button" className="btn btn-gilt btn-block" onClick={checkout} disabled={!!busy || !catalog?.paymentsEnabled}>
                    {busy === 'checkout' ? <span className="spinner" /> : `Pay ${money(local, currency)} with Safepay`}
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {!catalog && !loadErr && <div className="bill-skeleton" aria-hidden="true" />}
      </section>

      {catalog && !catalog.paymentsEnabled && isAuthenticated && !isPremium && (
        <p className="notice notice-warn bill-notice">Online payments are being set up. Write to <Link to="/support">support</Link> and we’ll activate Premium for you by bank transfer in the meantime.</p>
      )}

      <p className="bill-fine">
        Payments are processed by Safepay with card, bank account or wallet. Premium is prepaid — nothing renews automatically.
        Read the <Link to="/refunds">refund policy</Link>.
      </p>

      {isAuthenticated && (
        <section className="bill-history" aria-labelledby="bill-history-h">
          <h2 id="bill-history-h">Receipts</h2>
          {history.length === 0 ? (
            <p className="bill-empty">No payments yet. Receipts appear here and in your inbox after each payment.</p>
          ) : (
            <div className="bill-table-wrap">
              <table className="bill-table">
                <thead><tr><th scope="col">Date</th><th scope="col">Reference</th><th scope="col">Period</th><th scope="col">Status</th><th scope="col" className="num">Amount</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h._id}>
                      <td>{date(h.paidAt || h.createdAt)}</td>
                      <td className="bill-ref">{h.orderId}</td>
                      <td>{h.periodEnd ? `${date(h.periodStart)} – ${date(h.periodEnd)}` : h.interval === 'year' ? 'Yearly' : 'Monthly'}</td>
                      <td><span className={`chip ${h.status === 'paid' ? 'chip-sage' : 'chip-wax'}`}>{h.status === 'paid' ? 'Paid' : 'Failed'}</span></td>
                      <td className="num money">{money(h.amount, h.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
