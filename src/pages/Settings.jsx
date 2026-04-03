// src/pages/Settings.jsx — PRODUCTION v3
// ─────────────────────────────────────────────────────────────
//  Tabs:
//   1. ACCOUNT       – name/email · change email inline ·
//                      change password inline · active sessions
//   2. BILLING       – ★ NEW ★
//                      saved payment methods (Stripe-tokenized)
//                      add card (Stripe redirect / tokenization)
//                      add PayPal · add bank account (ACH)
//                      payout method (where you GET paid)
//                      billing history (subscription invoices)
//   3. SUBSCRIPTION  – current plan · plan cards · billing cycle ·
//                      next renewal · cancel with confirmation
//   4. NOTIFICATIONS – 8 granular toggles, instant save to API
//   5. SECURITY      – 2FA full flow · login alerts · API keys
//   6. APPEARANCE    – language · timezone · currency · date format
//   7. INTEGRATIONS  – Google Drive · Dropbox · GitHub OAuth
//   8. DATA          – download data · delete account (typed confirm)
//
//  ADDED vs v2:
//   ✓ Full Billing & Payments tab (was completely missing)
//   ✓ Change password inline on Account tab
//   ✓ Billing history on Subscription tab
//   ✓ Payout settings (bank account for receiving invoice payments)
//   ✓ Wallet / PayPal connection for paying and receiving
//   ✓ Next renewal date + billing cycle on Subscription
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircularProgress } from '@mui/material';
import {
  FiUser, FiCreditCard, FiBell, FiShield, FiMonitor, FiLink,
  FiDatabase, FiCheck, FiX, FiAlertTriangle, FiExternalLink,
  FiDownload, FiRefreshCw, FiLogOut, FiStar, FiZap, FiGlobe,
  FiClock, FiSmartphone, FiMail, FiKey, FiTrash2, FiChevronRight,
  FiLock, FiEye, FiEyeOff, FiDollarSign, FiPlusCircle,
  FiCheckCircle, FiAlertCircle, FiCalendar, FiArrowUpRight,
  FiBriefcase, FiSend,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/Settings.css';

// ── API ───────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tok  = () => localStorage.getItem('authToken');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` });
const api  = {
  get:    url      => fetch(`${BASE}${url}`, { headers: hdrs() }).then(r => r.json()),
  post:   (url, b) => fetch(`${BASE}${url}`, { method: 'POST',   headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  patch:  (url, b) => fetch(`${BASE}${url}`, { method: 'PATCH',  headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  delete: url      => fetch(`${BASE}${url}`, { method: 'DELETE', headers: hdrs() }).then(r => r.json()),
};

// ── Plans config ─────────────────────────────────────────────
const PLANS = [
  {
    id: 'free', name: 'Free', price: '$0', period: 'forever',
    color: '#5a5650',
    features: ['Up to 5 clients', 'Up to 10 invoices/month', 'Basic dashboard', 'Task management', '10 AI messages/day'],
  },
  {
    id: 'premium', name: 'Premium', price: '$9.99', period: '/month',
    color: '#c9a84c', popular: true,
    features: ['Unlimited clients', 'Unlimited invoices', 'Full dashboard + analytics', 'AI Daily Focus', 'Business Health Score', 'Unlimited AI assistant', 'Priority support'],
  },
  {
    id: 'pro', name: 'Pro', price: '$19.99', period: '/month',
    color: '#9b72e8',
    features: ['Everything in Premium', 'Custom invoice branding', 'Client portal', 'API access', 'Dedicated account manager', 'White-label reports'],
  },
];

// ── Card brand icons (text fallback) ─────────────────────────
const CardBrand = ({ brand }) => {
  const colors = { visa:'#1a1f71', mastercard:'#eb001b', amex:'#007bc1', discover:'#ff6600', default:'#5a5650' };
  const labels = { visa:'VISA', mastercard:'MC', amex:'AMEX', discover:'DISC', default: brand?.toUpperCase()?.slice(0,4) || '••' };
  const c = colors[brand?.toLowerCase()] || colors.default;
  const l = labels[brand?.toLowerCase()] || labels.default;
  return <span className="st-card-brand" style={{background:c}}>{l}</span>;
};

// ── Toggle ────────────────────────────────────────────────────
const Toggle = ({ on, onChange, disabled }) => (
  <button className={`st-toggle${on ? ' on' : ''}`} onClick={onChange} disabled={disabled} type="button">
    <span className="st-toggle-thumb"/>
  </button>
);

// ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { user: authUser, logout } = useAuth();
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const isPremium  = ['premium','pro'].includes(authUser?.plan);
  const isPro      = authUser?.plan === 'pro';

  const [tab, setTab] = useState(params.get('tab') || 'account');

  // ── Toast ─────────────────────────────────────────────────
  const [toast, setToast] = useState({ show:false, msg:'', err:false });
  const showToast = (msg, err=false) => {
    setToast({ show:true, msg, err });
    setTimeout(() => setToast(t=>({...t,show:false})), 3200);
  };

  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Account state ─────────────────────────────────────────
  const [accountData,   setAccountData]   = useState({ email:'', name:'' });
  const [emailForm,     setEmailForm]     = useState({ newEmail:'', password:'' });
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [pwForm,        setPwForm]        = useState({ current:'', next:'', confirm:'' });
  const [pwShow,        setPwShow]        = useState({ current:false, next:false, confirm:false });
  const [pwSaving,      setPwSaving]      = useState(false);
  const [showPwForm,    setShowPwForm]    = useState(false);
  const [sessions,      setSessions]      = useState([]);
  const [sessLoading,   setSessLoading]   = useState(false);

  // ── Billing state ─────────────────────────────────────────
  const [payMethods,     setPayMethods]     = useState([]);    // saved Stripe cards
  const [payoutMethod,   setPayoutMethod]   = useState(null);  // bank/PayPal for receiving
  const [billingHistory, setBillingHistory] = useState([]);    // subscription invoices
  const [payLoading,     setPayLoading]     = useState(false);
  const [addCardOpen,    setAddCardOpen]    = useState(false);
  const [addPaypalOpen,  setAddPaypalOpen]  = useState(false);
  const [addBankOpen,    setAddBankOpen]    = useState(false);
  const [addPayoutOpen,  setAddPayoutOpen]  = useState(false);
  const [cardForm,       setCardForm]       = useState({ holderName:'', email:'' });
  const [bankForm,       setBankForm]       = useState({ accountHolder:'', bankName:'', accountNumber:'', routingNumber:'', accountType:'checking' });
  const [paypalForm,     setPaypalForm]     = useState({ email:'' });
  const [payoutForm,     setPayoutForm]     = useState({ method:'bank', accountHolder:'', bankName:'', accountNumber:'', routingNumber:'', paypalEmail:'' });
  const [removingCard,   setRemovingCard]   = useState(null);

  // ── Subscription state ────────────────────────────────────
  const [currentPlan,   setCurrentPlan]   = useState(authUser?.plan || 'free');
  const [planSaving,    setPlanSaving]    = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [billingCycle,  setBillingCycle]  = useState(null); // { renewsAt, amount, status }

  // ── Notifications ─────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    emailDigest:true, taskReminders:true, invoiceAlerts:true,
    connectionReqs:false, clientMessages:true, marketingEmails:false,
    paymentReceived:true, overdueAlerts:true,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // ── Security ──────────────────────────────────────────────
  const [security,      setSecurity]      = useState({ twoFactor:false, loginAlerts:true });
  const [twoFactorStep, setTwoFactorStep] = useState(0);
  const [tfMethod,      setTfMethod]      = useState('email');
  const [tfCode,        setTfCode]        = useState('');
  const [tfSending,     setTfSending]     = useState(false);
  const [apiKeys,       setApiKeys]       = useState([]);
  const [apiKeysLoad,   setApiKeysLoad]   = useState(false);

  // ── Appearance ────────────────────────────────────────────
  const [appearance, setAppearance] = useState({ language:'en', timezone:'UTC', currency:'USD', dateFormat:'MM/DD/YYYY' });

  // ── Integrations ──────────────────────────────────────────
  const [integrations, setIntegrations] = useState({ googleDrive:false, dropbox:false, github:false });

  // ── Data / Danger ─────────────────────────────────────────
  const [deleteInput,   setDeleteInput]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [downloading,   setDownloading]   = useState(false);

  // ── Load all settings ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [sr] = await Promise.allSettled([api.get('/settings')]);
      if (sr.status === 'fulfilled') {
        const d = sr.value.settings || sr.value || {};
        if (d.notifications) setNotifs(p => ({...p,...d.notifications}));
        if (d.security)      setSecurity(p => ({...p,...d.security}));
        if (d.appearance)    setAppearance(p => ({...p,...d.appearance}));
        if (d.integrations)  setIntegrations(p => ({...p,...d.integrations}));
        if (d.billingCycle)  setBillingCycle(d.billingCycle);
      }
      setAccountData({ email: authUser?.email||'', name: authUser?.name||'' });
      setCurrentPlan(authUser?.plan || 'free');
      setLoading(false);
    })();
  }, []);

  // ── Load billing data when billing tab opens ───────────────
  useEffect(() => {
    if (tab === 'billing') loadBillingData();
  }, [tab]);

  const loadBillingData = async () => {
    setPayLoading(true);
    const [pmr, por, bhr] = await Promise.allSettled([
      api.get('/billing/payment-methods'),
      api.get('/billing/payout-method'),
      api.get('/billing/history'),
    ]);
    if (pmr.status === 'fulfilled') setPayMethods(Array.isArray(pmr.value.methods) ? pmr.value.methods : []);
    if (por.status === 'fulfilled') setPayoutMethod(por.value.payout || por.value || null);
    if (bhr.status === 'fulfilled') setBillingHistory(Array.isArray(bhr.value.invoices) ? bhr.value.invoices : []);
    setPayLoading(false);
  };

  // ── Load sessions ─────────────────────────────────────────
  const loadSessions = async () => {
    setSessLoading(true);
    try { const r = await api.get('/auth/sessions'); setSessions(r.sessions||[]); }
    catch { setSessions([]); }
    setSessLoading(false);
  };
  useEffect(() => { if (tab === 'account') loadSessions(); }, [tab]);

  // ── Load API keys ─────────────────────────────────────────
  const loadApiKeys = async () => {
    setApiKeysLoad(true);
    try { const r = await api.get('/settings/api-keys'); setApiKeys(r.keys||[]); }
    catch { setApiKeys([]); }
    setApiKeysLoad(false);
  };
  useEffect(() => { if (tab === 'security') loadApiKeys(); }, [tab]);

  // ── Patch helper ──────────────────────────────────────────
  const patchSettings = async (section, data, msg) => {
    setSaving(true);
    try { await api.patch('/settings', { [section]: data }); showToast(msg||'Saved.'); }
    catch { showToast('Save failed.', true); }
    setSaving(false);
  };

  // ── Account handlers ──────────────────────────────────────
  const handleChangeEmail = async e => {
    e.preventDefault();
    if (!emailForm.newEmail || !emailForm.password) { showToast('Both fields required.', true); return; }
    setSaving(true);
    try {
      await api.post('/auth/change-email', emailForm);
      setAccountData(a => ({...a, email: emailForm.newEmail}));
      setEmailForm({ newEmail:'', password:'' }); setShowEmailForm(false);
      showToast('Email updated. Check your inbox to confirm.');
    } catch { showToast('Failed — check your password.', true); }
    setSaving(false);
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next) { showToast('Fill all fields.', true); return; }
    if (pwForm.next !== pwForm.confirm) { showToast('Passwords do not match.', true); return; }
    if (pwForm.next.length < 8) { showToast('Minimum 8 characters.', true); return; }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current:'', next:'', confirm:'' }); setShowPwForm(false);
      showToast('Password changed successfully.');
    } catch { showToast('Incorrect current password.', true); }
    setPwSaving(false);
  };

  const revokeSession = async id => {
    try { await api.delete(`/auth/sessions/${id}`); setSessions(s=>s.filter(x=>x._id!==id)); showToast('Session revoked.'); }
    catch { showToast('Failed to revoke.', true); }
  };

  // ── Billing handlers ──────────────────────────────────────
  // Add card — redirects to Stripe hosted page or opens Stripe Elements
  const handleAddCard = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.post('/billing/add-card-session', { holderName: cardForm.holderName, email: cardForm.email || accountData.email });
      if (r.setupUrl) {
        window.open(r.setupUrl, '_blank', 'width=650,height=750');
        showToast('Complete card setup in the new window, then refresh.');
      } else {
        showToast('Card setup initiated — check email for confirmation.');
      }
      setAddCardOpen(false); setCardForm({ holderName:'', email:'' });
    } catch { showToast('Could not start card setup.', true); }
    setSaving(false);
  };

  // Add PayPal — OAuth flow
  const handleAddPaypal = async e => {
    e.preventDefault();
    if (!paypalForm.email) { showToast('PayPal email required.', true); return; }
    setSaving(true);
    try {
      await api.post('/billing/add-paypal', { email: paypalForm.email });
      showToast('PayPal connected successfully.');
      setAddPaypalOpen(false); setPaypalForm({ email:'' });
      loadBillingData();
    } catch { showToast('Could not connect PayPal.', true); }
    setSaving(false);
  };

  // Add bank account (for paying subscription via ACH)
  const handleAddBank = async e => {
    e.preventDefault();
    if (!bankForm.accountHolder || !bankForm.accountNumber || !bankForm.routingNumber) {
      showToast('Account holder, account number, and routing number are required.', true); return;
    }
    setSaving(true);
    try {
      await api.post('/billing/add-bank', bankForm);
      showToast('Bank account added. Micro-deposits may take 1–2 days to verify.');
      setAddBankOpen(false); setBankForm({ accountHolder:'', bankName:'', accountNumber:'', routingNumber:'', accountType:'checking' });
      loadBillingData();
    } catch { showToast('Could not add bank account.', true); }
    setSaving(false);
  };

  // Set default payment method
  const setDefaultMethod = async id => {
    try {
      await api.patch(`/billing/payment-methods/${id}/default`);
      setPayMethods(ms => ms.map(m => ({...m, isDefault: m._id === id || m.id === id})));
      showToast('Default payment method updated.');
    } catch { showToast('Failed.', true); }
  };

  // Remove payment method
  const removePayMethod = async id => {
    setRemovingCard(id);
    try {
      await api.delete(`/billing/payment-methods/${id}`);
      setPayMethods(ms => ms.filter(m => (m._id||m.id) !== id));
      showToast('Payment method removed.');
    } catch { showToast('Failed to remove.', true); }
    setRemovingCard(null);
  };

  // Save payout method (where invoices get paid TO the freelancer)
  const handleSavePayout = async e => {
    e.preventDefault();
    const required = payoutForm.method === 'paypal'
      ? payoutForm.paypalEmail
      : payoutForm.accountHolder && payoutForm.accountNumber && payoutForm.routingNumber;
    if (!required) { showToast('Fill all required fields.', true); return; }
    setSaving(true);
    try {
      await api.post('/billing/payout-method', payoutForm);
      setPayoutMethod(payoutForm); setAddPayoutOpen(false);
      showToast('Payout method saved.');
    } catch { showToast('Could not save payout method.', true); }
    setSaving(false);
  };

  // ── Subscription handlers ─────────────────────────────────
  const handleUpgrade = async planId => {
    setPlanSaving(planId);
    try {
      const r = await api.post('/subscriptions/upgrade', { planId });
      if (r.checkoutUrl) { window.location.href = r.checkoutUrl; }
      else { setCurrentPlan(planId); showToast(`Upgraded to ${planId}.`); }
    } catch { showToast('Upgrade failed.', true); }
    setPlanSaving(null);
  };

  const handleCancelPlan = async () => {
    try {
      await api.post('/subscriptions/cancel');
      setCurrentPlan('free'); setCancelConfirm(false);
      showToast('Plan cancelled. Access continues until end of billing period.');
    } catch { showToast('Cancellation failed.', true); }
  };

  // ── Notification handlers ─────────────────────────────────
  const saveNotif = async (key, val) => {
    const updated = {...notifs, [key]: val};
    setNotifs(updated); setNotifSaving(true);
    try { await api.patch('/settings', { notifications: updated }); }
    catch { showToast('Could not save.', true); setNotifs(notifs); }
    setNotifSaving(false);
  };

  // ── Security handlers ─────────────────────────────────────
  const send2FA = async () => {
    setTfSending(true);
    try { await api.post('/auth/2fa/send', { method: tfMethod }); setTwoFactorStep(2); showToast(`Code sent via ${tfMethod}.`); }
    catch { showToast('Could not send code.', true); }
    setTfSending(false);
  };
  const verify2FA = async () => {
    setTfSending(true);
    try {
      await api.post('/auth/2fa/verify', { code: tfCode, method: tfMethod });
      setSecurity(s => ({...s, twoFactor:true})); setTwoFactorStep(3);
      showToast('2FA enabled.'); await patchSettings('security', {...security, twoFactor:true});
    } catch { showToast('Invalid code.', true); }
    setTfSending(false);
  };
  const disable2FA = async () => {
    try {
      await api.post('/auth/2fa/disable');
      setSecurity(s => ({...s, twoFactor:false})); setTwoFactorStep(0);
      showToast('2FA disabled.'); await patchSettings('security', {...security, twoFactor:false});
    } catch { showToast('Failed.', true); }
  };
  const toggleLoginAlerts = async () => {
    const updated = {...security, loginAlerts: !security.loginAlerts};
    setSecurity(updated); await patchSettings('security', updated, `Login alerts ${updated.loginAlerts?'enabled':'disabled'}.`);
  };
  const generateApiKey = async () => {
    try { await api.post('/settings/api-keys/generate'); showToast('API key generated.'); loadApiKeys(); }
    catch { showToast('Failed.', true); }
  };
  const revokeApiKey = async id => {
    try { await api.delete(`/settings/api-keys/${id}`); setApiKeys(k=>k.filter(x=>x._id!==id)); showToast('Key revoked.'); }
    catch { showToast('Failed.', true); }
  };

  // ── Appearance / Integrations ─────────────────────────────
  const saveAppearance = () => patchSettings('appearance', appearance, 'Preferences saved.');
  const toggleIntegration = async key => {
    if (integrations[key]) {
      const updated = {...integrations, [key]:false};
      setIntegrations(updated); await patchSettings('integrations', updated, `${key} disconnected.`);
    } else {
      const urls = {
        googleDrive:`${BASE}/auth/google/connect?token=${tok()}`,
        dropbox:    `${BASE}/auth/dropbox/connect?token=${tok()}`,
        github:     `${BASE}/auth/github/connect?token=${tok()}`,
      };
      window.open(urls[key], '_blank', 'width=600,height=700');
    }
  };

  // ── Data handlers ─────────────────────────────────────────
  const handleDownloadData = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`${BASE}/settings/download-data`, { headers: hdrs() });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `aurelance-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url); showToast('Download started.');
    } catch { showToast('Download failed.', true); }
    setDownloading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') { showToast('Type DELETE to confirm.', true); return; }
    setDeleting(true);
    try { await api.delete('/auth/account'); logout(); navigate('/auth'); }
    catch { showToast('Deletion failed. Contact support.', true); setDeleting(false); }
  };

  // ── Helpers ───────────────────────────────────────────────
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
  const fmtAmt  = (n,c='USD') => '$' + (+(n||0)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

  // ── Tabs config ───────────────────────────────────────────
  const TABS = [
    { id:'account',       label:'Account',       icon:<FiUser size={14}/> },
    { id:'billing',       label:'Billing',        icon:<FiCreditCard size={14}/>, badge:!payMethods.length && tab!=='billing' ? '!' : null },
    { id:'subscription',  label:'Subscription',  icon:<FiStar size={14}/> },
    { id:'notifications', label:'Notifications', icon:<FiBell size={14}/> },
    { id:'security',      label:'Security',      icon:<FiShield size={14}/> },
    { id:'appearance',    label:'Appearance',    icon:<FiMonitor size={14}/> },
    { id:'integrations',  label:'Integrations',  icon:<FiLink size={14}/> },
    { id:'data',          label:'Data',          icon:<FiDatabase size={14}/> },
  ];

  // ─────────────────────────────────────────────────────────
  return (
    <div className="st-root">
      {toast.show && (
        <div className={`st-toast${toast.err?' err':''}`}>
          {toast.err ? <FiAlertTriangle size={13}/> : <FiCheck size={13}/>} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="st-header">
        <div>
          <h1 className="st-title">Settings</h1>
          <p className="st-sub">Manage your account, billing, and workspace preferences</p>
        </div>
        <span className={`st-plan-badge ${currentPlan}`}>
          <FiStar size={11}/> {currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)} Plan
        </span>
      </div>

      <div className="st-layout">
        {/* Sidebar nav */}
        <nav className="st-nav">
          {TABS.map(t => (
            <button key={t.id} className={`st-nav-btn${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
              <span className="st-nav-icon">{t.icon}</span>
              <span>{t.label}</span>
              {t.badge && <span className="st-nav-badge">{t.badge}</span>}
              <FiChevronRight size={12} className="st-nav-arrow"/>
            </button>
          ))}
        </nav>

        <div className="st-content">

          {/* ═══════════════════════════════════════
              TAB: ACCOUNT
          ═══════════════════════════════════════ */}
          {tab === 'account' && (
            <div className="st-tab-body">
              <div className="st-card">
                <div className="st-card-hdr"><h2>Account Information</h2></div>
                <div className="st-info-rows">
                  <div className="st-info-row">
                    <span className="st-info-label">Name</span>
                    <span className="st-info-val">{accountData.name || '—'}</span>
                    <button className="st-link-btn" onClick={() => navigate('/profile')}>Edit on Profile <FiExternalLink size={11}/></button>
                  </div>
                  <div className="st-info-row">
                    <span className="st-info-label">Email</span>
                    <span className="st-info-val">{accountData.email || '—'}</span>
                    <button className="st-link-btn" onClick={() => setShowEmailForm(v=>!v)}>{showEmailForm?'Cancel':'Change'}</button>
                  </div>
                  <div className="st-info-row">
                    <span className="st-info-label">Plan</span>
                    <span className="st-info-val" style={{color:currentPlan!=='free'?'#c9a84c':'#5a5650'}}>
                      {currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)}
                    </span>
                    {currentPlan==='free' && <button className="st-link-btn gold" onClick={() => setTab('subscription')}>Upgrade →</button>}
                  </div>
                  <div className="st-info-row">
                    <span className="st-info-label">Password</span>
                    <span className="st-info-val">••••••••</span>
                    <button className="st-link-btn" onClick={() => setShowPwForm(v=>!v)}>{showPwForm?'Cancel':'Change'}</button>
                  </div>
                </div>

                {/* Change email inline */}
                {showEmailForm && (
                  <form className="st-inline-form" onSubmit={handleChangeEmail}>
                    <h3>Change Email Address</h3>
                    <div className="st-fields-grid">
                      <div className="st-field">
                        <label>New Email</label>
                        <input type="email" value={emailForm.newEmail} onChange={e=>setEmailForm(f=>({...f,newEmail:e.target.value}))} placeholder="new@email.com" required/>
                      </div>
                      <div className="st-field">
                        <label>Current Password</label>
                        <input type="password" value={emailForm.password} onChange={e=>setEmailForm(f=>({...f,password:e.target.value}))} placeholder="Confirm identity" required/>
                      </div>
                    </div>
                    <div className="st-form-actions">
                      <button type="button" className="st-btn-cancel" onClick={() => setShowEmailForm(false)}>Cancel</button>
                      <button type="submit" className="st-btn-save" disabled={saving}>{saving?'Saving…':'Update Email'}</button>
                    </div>
                  </form>
                )}

                {/* Change password inline */}
                {showPwForm && (
                  <form className="st-inline-form" onSubmit={handleChangePassword}>
                    <h3>Change Password</h3>
                    <div className="st-fields-grid">
                      {[['current','Current Password'],['next','New Password'],['confirm','Confirm New Password']].map(([k,l]) => (
                        <div className="st-field" key={k}>
                          <label>{l}</label>
                          <div className="st-pw-wrap">
                            <input type={pwShow[k]?'text':'password'} value={pwForm[k]}
                              onChange={e=>setPwForm(f=>({...f,[k]:e.target.value}))}
                              placeholder={k==='current'?'Current password':'Min 8 characters'} required/>
                            <button type="button" className="st-pw-eye" onClick={()=>setPwShow(s=>({...s,[k]:!s[k]}))}>
                              {pwShow[k]?<FiEyeOff size={14}/>:<FiEye size={14}/>}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="st-form-actions">
                      <button type="button" className="st-btn-cancel" onClick={() => setShowPwForm(false)}>Cancel</button>
                      <button type="submit" className="st-btn-save" disabled={pwSaving}>{pwSaving?'Changing…':'Change Password'}</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Active sessions */}
              <div className="st-card">
                <div className="st-card-hdr">
                  <h2>Active Sessions</h2>
                  <button className="st-icon-btn" onClick={loadSessions}><FiRefreshCw size={13}/></button>
                </div>
                <p className="st-card-desc">Devices currently logged in to your account. Revoke any you don't recognise.</p>
                {sessLoading ? (
                  <div className="st-loading-row"><CircularProgress size={16} sx={{color:'#c9a84c'}}/><span>Loading…</span></div>
                ) : !sessions.length ? (
                  <p className="st-empty">No session data available.</p>
                ) : (
                  <div className="st-sessions">
                    {sessions.map((s,i) => (
                      <div className="st-session-row" key={s._id||i}>
                        <span className="st-sess-icon"><FiSmartphone size={16}/></span>
                        <div className="st-sess-info">
                          <span className="st-sess-device">{s.device||s.userAgent||'Unknown device'}</span>
                          <span className="st-sess-meta">
                            {s.ip&&<>{s.ip} · </>}{s.location&&<>{s.location} · </>}
                            Active {s.lastActive?new Date(s.lastActive).toLocaleDateString():'recently'}
                            {s.current&&<span className="st-sess-current">Current</span>}
                          </span>
                        </div>
                        {!s.current&&<button className="st-revoke-btn" onClick={()=>revokeSession(s._id)}><FiLogOut size={12}/> Revoke</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              TAB: BILLING
          ═══════════════════════════════════════ */}
          {tab === 'billing' && (
            <div className="st-tab-body">

              {/* Payment Methods — for paying subscription */}
              <div className="st-card">
                <div className="st-card-hdr">
                  <h2>Payment Methods</h2>
                  <span className="st-card-subtitle">Used to pay your Aurelance subscription</span>
                </div>
                <p className="st-card-desc">Add a card, bank account, or PayPal. Your payment details are securely tokenized — Aurelance never stores raw card numbers.</p>

                {payLoading ? (
                  <div className="st-loading-row"><CircularProgress size={16} sx={{color:'#c9a84c'}}/><span>Loading payment methods…</span></div>
                ) : !payMethods.length ? (
                  <div className="st-pay-empty">
                    <FiCreditCard size={28}/>
                    <strong>No payment methods</strong>
                    <p>Add a payment method to subscribe to Premium or Pro, or to enable automatic invoice collection.</p>
                  </div>
                ) : (
                  <div className="st-pay-methods">
                    {payMethods.map((m,i) => (
                      <div className={`st-pay-method${m.isDefault?' default':''}`} key={m._id||m.id||i}>
                        <div className="st-pm-left">
                          {m.type === 'card' && <CardBrand brand={m.brand}/>}
                          {m.type === 'paypal' && <span className="st-card-brand" style={{background:'#003087'}}>PP</span>}
                          {m.type === 'bank' && <span className="st-card-brand" style={{background:'#1a5276'}}>ACH</span>}
                          <div className="st-pm-info">
                            {m.type==='card' && <span className="st-pm-label">•••• {m.last4} · {m.brand?.charAt(0).toUpperCase()+m.brand?.slice(1)} · Exp {m.expMonth}/{m.expYear}</span>}
                            {m.type==='paypal' && <span className="st-pm-label">PayPal · {m.email}</span>}
                            {m.type==='bank' && <span className="st-pm-label">Bank account •••• {m.last4} · {m.bankName}</span>}
                            {m.isDefault && <span className="st-pm-default-tag">Default</span>}
                          </div>
                        </div>
                        <div className="st-pm-actions">
                          {!m.isDefault && (
                            <button className="st-pm-btn" onClick={()=>setDefaultMethod(m._id||m.id)}>Set Default</button>
                          )}
                          <button className="st-pm-btn danger" onClick={()=>removePayMethod(m._id||m.id)} disabled={removingCard===(m._id||m.id)}>
                            {removingCard===(m._id||m.id)?<CircularProgress size={11} sx={{color:'#e05c5c'}}/>:<FiTrash2 size={12}/>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add buttons */}
                <div className="st-add-pm-row">
                  <button className="st-add-pm-btn" onClick={() => setAddCardOpen(v=>!v)}>
                    <FiCreditCard size={13}/> Add Card
                  </button>
                  <button className="st-add-pm-btn" onClick={() => setAddPaypalOpen(v=>!v)}>
                    <span className="st-paypal-icon">P</span> PayPal
                  </button>
                  <button className="st-add-pm-btn" onClick={() => setAddBankOpen(v=>!v)}>
                    <FiBriefcase size={13}/> Bank Account
                  </button>
                </div>

                {/* Add Card form */}
                {addCardOpen && (
                  <form className="st-inline-form" onSubmit={handleAddCard}>
                    <h3>Add Credit / Debit Card</h3>
                    <p style={{fontSize:12,color:'#5a5650',marginBottom:14,lineHeight:1.65}}>
                      You will be redirected to a secure Stripe-hosted page to enter your card details. Aurelance never stores raw card numbers.
                    </p>
                    <div className="st-fields-grid">
                      <div className="st-field">
                        <label>Cardholder Name *</label>
                        <input value={cardForm.holderName} onChange={e=>setCardForm(f=>({...f,holderName:e.target.value}))} placeholder="Name as it appears on card" required/>
                      </div>
                      <div className="st-field">
                        <label>Billing Email</label>
                        <input type="email" value={cardForm.email} onChange={e=>setCardForm(f=>({...f,email:e.target.value}))} placeholder={accountData.email||'your@email.com'}/>
                      </div>
                    </div>
                    <div className="st-form-actions">
                      <button type="button" className="st-btn-cancel" onClick={() => setAddCardOpen(false)}>Cancel</button>
                      <button type="submit" className="st-btn-save" disabled={saving}>
                        {saving?'Redirecting…':'Continue to Card Setup →'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Add PayPal form */}
                {addPaypalOpen && (
                  <form className="st-inline-form" onSubmit={handleAddPaypal}>
                    <h3>Connect PayPal</h3>
                    <p style={{fontSize:12,color:'#5a5650',marginBottom:14,lineHeight:1.65}}>Enter your PayPal email address. We'll send payment instructions to this address.</p>
                    <div className="st-field">
                      <label>PayPal Email *</label>
                      <input type="email" value={paypalForm.email} onChange={e=>setPaypalForm({email:e.target.value})} placeholder="paypal@email.com" required/>
                    </div>
                    <div className="st-form-actions">
                      <button type="button" className="st-btn-cancel" onClick={() => setAddPaypalOpen(false)}>Cancel</button>
                      <button type="submit" className="st-btn-save" disabled={saving}>{saving?'Connecting…':'Connect PayPal'}</button>
                    </div>
                  </form>
                )}

                {/* Add Bank Account form */}
                {addBankOpen && (
                  <form className="st-inline-form" onSubmit={handleAddBank}>
                    <h3>Add Bank Account (ACH)</h3>
                    <p style={{fontSize:12,color:'#5a5650',marginBottom:14,lineHeight:1.65}}>
                      Direct bank payments via ACH. After adding, 2 micro-deposits will be made to verify your account (1–2 business days).
                    </p>
                    <div className="st-fields-grid">
                      <div className="st-field">
                        <label>Account Holder Name *</label>
                        <input value={bankForm.accountHolder} onChange={e=>setBankForm(f=>({...f,accountHolder:e.target.value}))} placeholder="Full name on account" required/>
                      </div>
                      <div className="st-field">
                        <label>Bank Name</label>
                        <input value={bankForm.bankName} onChange={e=>setBankForm(f=>({...f,bankName:e.target.value}))} placeholder="e.g. Chase, Wells Fargo"/>
                      </div>
                      <div className="st-field">
                        <label>Account Number *</label>
                        <input value={bankForm.accountNumber} onChange={e=>setBankForm(f=>({...f,accountNumber:e.target.value}))} placeholder="Your account number" required/>
                      </div>
                      <div className="st-field">
                        <label>Routing Number *</label>
                        <input value={bankForm.routingNumber} onChange={e=>setBankForm(f=>({...f,routingNumber:e.target.value}))} placeholder="9-digit routing number" required/>
                      </div>
                      <div className="st-field">
                        <label>Account Type</label>
                        <select value={bankForm.accountType} onChange={e=>setBankForm(f=>({...f,accountType:e.target.value}))}>
                          <option value="checking">Checking</option>
                          <option value="savings">Savings</option>
                        </select>
                      </div>
                    </div>
                    <div className="st-form-actions">
                      <button type="button" className="st-btn-cancel" onClick={() => setAddBankOpen(false)}>Cancel</button>
                      <button type="submit" className="st-btn-save" disabled={saving}>{saving?'Adding…':'Add Bank Account'}</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Payout Method — where invoice payments go TO you */}
              <div className="st-card">
                <div className="st-card-hdr">
                  <h2>Payout Method</h2>
                  <span className="st-card-subtitle">Where your invoice payments are deposited</span>
                </div>
                <p className="st-card-desc">
                  When clients pay your invoices through Aurelance, funds are deposited here. Add a bank account or PayPal to receive payments automatically.
                </p>

                {payoutMethod ? (
                  <div className="st-payout-current">
                    <div className="st-payout-icon">
                      {payoutMethod.method==='paypal' ? <span style={{color:'#003087',fontSize:18,fontWeight:800}}>P</span> : <FiBriefcase size={18}/>}
                    </div>
                    <div className="st-payout-info">
                      {payoutMethod.method==='paypal'
                        ? <><strong>PayPal</strong><span>{payoutMethod.paypalEmail}</span></>
                        : <><strong>Bank Account</strong><span>{payoutMethod.bankName || 'Bank'} •••• {payoutMethod.accountNumber?.slice(-4)} · {payoutMethod.accountHolder}</span></>}
                    </div>
                    <button className="st-link-btn" onClick={() => { setPayoutForm(payoutMethod); setAddPayoutOpen(true); }}>Edit</button>
                  </div>
                ) : (
                  <div className="st-pay-empty">
                    <FiSend size={24}/>
                    <strong>No payout method set</strong>
                    <p>Add a bank account or PayPal to receive invoice payments from clients.</p>
                  </div>
                )}

                <button className="st-add-pm-btn" style={{marginTop:12}} onClick={() => setAddPayoutOpen(v=>!v)}>
                  <FiPlusCircle size={13}/> {payoutMethod ? 'Update Payout Method' : 'Add Payout Method'}
                </button>

                {addPayoutOpen && (
                  <form className="st-inline-form" onSubmit={handleSavePayout}>
                    <h3>{payoutMethod?'Update':'Add'} Payout Method</h3>
                    <div className="st-field">
                      <label>Payout Method</label>
                      <select value={payoutForm.method} onChange={e=>setPayoutForm(f=>({...f,method:e.target.value}))}>
                        <option value="bank">Bank Account (ACH / Wire)</option>
                        <option value="paypal">PayPal</option>
                      </select>
                    </div>
                    {payoutForm.method === 'paypal' ? (
                      <div className="st-field">
                        <label>PayPal Email *</label>
                        <input type="email" value={payoutForm.paypalEmail} onChange={e=>setPayoutForm(f=>({...f,paypalEmail:e.target.value}))} placeholder="paypal@email.com" required/>
                      </div>
                    ) : (
                      <div className="st-fields-grid">
                        <div className="st-field">
                          <label>Account Holder *</label>
                          <input value={payoutForm.accountHolder} onChange={e=>setPayoutForm(f=>({...f,accountHolder:e.target.value}))} placeholder="Full name on account" required/>
                        </div>
                        <div className="st-field">
                          <label>Bank Name</label>
                          <input value={payoutForm.bankName} onChange={e=>setPayoutForm(f=>({...f,bankName:e.target.value}))} placeholder="e.g. Bank of America"/>
                        </div>
                        <div className="st-field">
                          <label>Account Number *</label>
                          <input value={payoutForm.accountNumber} onChange={e=>setPayoutForm(f=>({...f,accountNumber:e.target.value}))} required/>
                        </div>
                        <div className="st-field">
                          <label>Routing Number *</label>
                          <input value={payoutForm.routingNumber} onChange={e=>setPayoutForm(f=>({...f,routingNumber:e.target.value}))} required/>
                        </div>
                      </div>
                    )}
                    <div className="st-form-actions">
                      <button type="button" className="st-btn-cancel" onClick={() => setAddPayoutOpen(false)}>Cancel</button>
                      <button type="submit" className="st-btn-save" disabled={saving}>{saving?'Saving…':'Save Payout Method'}</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Billing History */}
              <div className="st-card">
                <div className="st-card-hdr"><h2>Billing History</h2></div>
                <p className="st-card-desc">Past charges for your Aurelance subscription.</p>
                {payLoading ? (
                  <div className="st-loading-row"><CircularProgress size={16} sx={{color:'#c9a84c'}}/><span>Loading…</span></div>
                ) : !billingHistory.length ? (
                  <p className="st-empty">No billing history yet.</p>
                ) : (
                  <div className="st-billing-history">
                    <div className="st-bh-header">
                      <span>Date</span><span>Description</span><span>Amount</span><span>Status</span><span/>
                    </div>
                    {billingHistory.map((inv,i) => (
                      <div className="st-bh-row" key={inv._id||i}>
                        <span className="st-bh-date">{fmtDate(inv.date||inv.createdAt)}</span>
                        <span className="st-bh-desc">{inv.description||`${inv.plan||'Subscription'} — ${inv.period||'Monthly'}`}</span>
                        <span className="st-bh-amount">{fmtAmt(inv.amount)}</span>
                        <span className={`st-bh-status ${inv.status||'paid'}`}>{inv.status||'paid'}</span>
                        {inv.receiptUrl && (
                          <a href={inv.receiptUrl} target="_blank" rel="noopener noreferrer" className="st-bh-receipt">
                            <FiDownload size={12}/>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              TAB: SUBSCRIPTION
          ═══════════════════════════════════════ */}
          {tab === 'subscription' && (
            <div className="st-tab-body">
              {/* Current plan summary */}
              <div className="st-card">
                <div className="st-card-hdr">
                  <h2>Current Plan</h2>
                  <span className={`st-plan-chip ${currentPlan}`}>{currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)}</span>
                </div>
                {billingCycle && (
                  <div className="st-billing-cycle">
                    <div className="st-bc-item">
                      <FiCalendar size={14}/>
                      <span>Next renewal: <strong>{fmtDate(billingCycle.renewsAt)}</strong></span>
                    </div>
                    <div className="st-bc-item">
                      <FiDollarSign size={14}/>
                      <span>Amount: <strong>{fmtAmt(billingCycle.amount)}/month</strong></span>
                    </div>
                    <div className="st-bc-item">
                      <span className={`st-bh-status ${billingCycle.status}`}>{billingCycle.status}</span>
                    </div>
                  </div>
                )}
                <p className="st-card-desc" style={{marginTop: billingCycle ? 8 : 0}}>
                  {currentPlan==='free' ? 'Upgrade to unlock AI-powered features, unlimited clients, and advanced analytics.'
                   : currentPlan==='premium' ? 'You have full access to all Premium features including AI Daily Focus and Business Health Score.'
                   : 'Full Pro access including custom branding, client portal, and API access.'}
                </p>
                {currentPlan !== 'free' && (
                  <button className="st-danger-link" style={{marginTop:8}} onClick={() => setCancelConfirm(true)}>
                    Cancel subscription
                  </button>
                )}
              </div>

              {/* Plan cards */}
              <div className="st-plans-grid">
                {PLANS.map(plan => {
                  const isCurrent = currentPlan === plan.id;
                  return (
                    <div key={plan.id} className={`st-plan-card${isCurrent?' current':''}${plan.popular?' popular':''}`}
                      style={{ '--plan-color': plan.color, borderColor: isCurrent ? plan.color : undefined }}>
                      {plan.popular && <span className="st-popular-badge">Most Popular</span>}
                      {isCurrent && <span className="st-current-badge">Current</span>}
                      <div className="st-plan-header">
                        <h3 className="st-plan-name" style={{color:plan.color}}>{plan.name}</h3>
                        <div className="st-plan-price">
                          <span className="st-price-amount">{plan.price}</span>
                          <span className="st-price-period">{plan.period}</span>
                        </div>
                      </div>
                      <ul className="st-plan-features">
                        {plan.features.map((f,i) => (
                          <li key={i}><FiCheck size={12} style={{color:plan.color,flexShrink:0}}/>{f}</li>
                        ))}
                      </ul>
                      {!isCurrent ? (
                        <button className="st-upgrade-btn"
                          style={{background:`linear-gradient(135deg,${plan.color},${plan.id==='premium'?'#a8802a':'#7a58cc'})`}}
                          onClick={() => handleUpgrade(plan.id)} disabled={!!planSaving}>
                          {planSaving===plan.id ? <CircularProgress size={13} sx={{color:'#0a0a0c'}}/> : plan.id==='free'?'Downgrade':`Upgrade to ${plan.name}`}
                        </button>
                      ) : (
                        <div className="st-current-plan-msg"><FiCheck size={13}/> Active plan</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cancel modal */}
              {cancelConfirm && (
                <div className="st-modal-overlay" onClick={e=>e.target===e.currentTarget&&setCancelConfirm(false)}>
                  <div className="st-modal">
                    <div className="st-modal-hdr"><h3>Cancel Subscription</h3><button onClick={()=>setCancelConfirm(false)}><FiX size={15}/></button></div>
                    <p className="st-modal-body">You'll keep Premium access until the end of your current billing period. After that, the account will revert to the Free plan and AI features will be disabled.</p>
                    <div className="st-modal-footer">
                      <button className="st-btn-cancel" onClick={()=>setCancelConfirm(false)}>Keep Plan</button>
                      <button className="st-btn-danger" onClick={handleCancelPlan}><FiX size={12}/> Cancel Subscription</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════
              TAB: NOTIFICATIONS
          ═══════════════════════════════════════ */}
          {tab === 'notifications' && (
            <div className="st-tab-body">
              <div className="st-card">
                <div className="st-card-hdr">
                  <h2>Notification Preferences</h2>
                  {notifSaving && <CircularProgress size={14} sx={{color:'#c9a84c'}}/>}
                </div>
                <p className="st-card-desc">Choose what you want to be notified about. Changes are saved instantly.</p>
                <div className="st-notif-sections">
                  <div className="st-notif-group">
                    <h3>Work Alerts</h3>
                    {[
                      {key:'taskReminders',  label:'Task reminders',         desc:'When tasks are due within 24 hours'},
                      {key:'invoiceAlerts',  label:'Invoice alerts',         desc:'Overdue invoices and payment confirmations'},
                      {key:'paymentReceived',label:'Payment received',       desc:'When a client marks an invoice as paid'},
                      {key:'overdueAlerts',  label:'Overdue deadline alerts',desc:'When tasks or invoices become overdue'},
                    ].map(n => (
                      <div className="st-notif-row" key={n.key}>
                        <div className="st-notif-text"><span className="st-notif-label">{n.label}</span><span className="st-notif-desc">{n.desc}</span></div>
                        <Toggle on={notifs[n.key]} onChange={() => saveNotif(n.key, !notifs[n.key])} disabled={notifSaving}/>
                      </div>
                    ))}
                  </div>
                  <div className="st-notif-group">
                    <h3>Social &amp; Account</h3>
                    {[
                      {key:'clientMessages', label:'Client messages',     desc:'When a client sends you a message'},
                      {key:'connectionReqs', label:'Connection requests', desc:'When someone wants to connect with you'},
                      {key:'emailDigest',    label:'Weekly email digest', desc:'Summary of your week every Monday'},
                      {key:'marketingEmails',label:'Tips & updates',      desc:'Product updates and Aurelance news'},
                    ].map(n => (
                      <div className="st-notif-row" key={n.key}>
                        <div className="st-notif-text"><span className="st-notif-label">{n.label}</span><span className="st-notif-desc">{n.desc}</span></div>
                        <Toggle on={notifs[n.key]} onChange={() => saveNotif(n.key, !notifs[n.key])} disabled={notifSaving}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              TAB: SECURITY
          ═══════════════════════════════════════ */}
          {tab === 'security' && (
            <div className="st-tab-body">
              {/* 2FA */}
              <div className="st-card">
                <div className="st-card-hdr">
                  <h2>Two-Factor Authentication</h2>
                  <span className={`st-status-chip ${security.twoFactor?'green':'red'}`}>{security.twoFactor?'Enabled':'Disabled'}</span>
                </div>
                <p className="st-card-desc">Add a second layer of security. You'll need a code each time you log in from a new device.</p>
                {!security.twoFactor ? (
                  twoFactorStep===0 ? (
                    <button className="st-btn-save" onClick={()=>setTwoFactorStep(1)}><FiLock size={13}/> Enable 2FA</button>
                  ) : twoFactorStep===1 ? (
                    <div className="st-2fa-setup">
                      <h3>Choose verification method</h3>
                      <div className="st-2fa-methods">
                        {[['email','Email','Receive a 6-digit code by email'],['sms','SMS','Receive a 6-digit code by text']].map(([val,label,desc])=>(
                          <label key={val} className={`st-2fa-method${tfMethod===val?' selected':''}`} onClick={()=>setTfMethod(val)}>
                            <input type="radio" value={val} checked={tfMethod===val} onChange={()=>setTfMethod(val)} readOnly/>
                            <div><strong>{label}</strong><span>{desc}</span></div>
                          </label>
                        ))}
                      </div>
                      <div className="st-form-actions" style={{marginTop:16}}>
                        <button className="st-btn-cancel" onClick={()=>setTwoFactorStep(0)}>Cancel</button>
                        <button className="st-btn-save" onClick={send2FA} disabled={tfSending}>
                          {tfSending?<CircularProgress size={13} sx={{color:'#0a0a0c'}}/>:'Send Code →'}
                        </button>
                      </div>
                    </div>
                  ) : twoFactorStep===2 ? (
                    <div className="st-2fa-verify">
                      <p className="st-card-desc">Enter the 6-digit code sent to your {tfMethod}.</p>
                      <div className="st-field" style={{maxWidth:220}}>
                        <label>Verification Code</label>
                        <input value={tfCode} onChange={e=>setTfCode(e.target.value)} placeholder="000000" maxLength={6}
                          style={{letterSpacing:'0.2em',fontSize:22,textAlign:'center'}}/>
                      </div>
                      <div className="st-form-actions">
                        <button className="st-btn-cancel" onClick={()=>setTwoFactorStep(1)}>Back</button>
                        <button className="st-btn-save" onClick={verify2FA} disabled={tfSending||tfCode.length<6}>
                          {tfSending?<CircularProgress size={13} sx={{color:'#0a0a0c'}}/>:'Verify & Enable'}
                        </button>
                      </div>
                    </div>
                  ) : null
                ) : (
                  <div>
                    <div className="st-2fa-active"><FiCheck size={16} style={{color:'#4caf82'}}/> Active via <strong>{tfMethod}</strong></div>
                    <button className="st-danger-link" style={{marginTop:12}} onClick={disable2FA}>Disable 2FA</button>
                  </div>
                )}
              </div>

              {/* Login alerts */}
              <div className="st-card">
                <div className="st-card-hdr"><h2>Login Alerts</h2><Toggle on={security.loginAlerts} onChange={toggleLoginAlerts}/></div>
                <p className="st-card-desc">Get an email when your account is accessed from a new device or location.</p>
              </div>

              {/* API Keys */}
              <div className="st-card">
                <div className="st-card-hdr">
                  <h2>API Keys</h2>
                  {isPro ? <button className="st-btn-save sm" onClick={generateApiKey}>+ Generate</button>
                          : <span className="st-locked-badge"><FiLock size={10}/> Pro only</span>}
                </div>
                <p className="st-card-desc">API keys let external tools access your Aurelance data. Never share them publicly.</p>
                {!isPro ? (
                  <div className="st-locked-msg"><FiLock size={16}/>
                    <div><strong>Pro feature</strong>
                      <p>API access is on the Pro plan. <button className="st-link-btn gold" onClick={()=>setTab('subscription')}>Upgrade →</button></p>
                    </div>
                  </div>
                ) : apiKeysLoad ? (
                  <div className="st-loading-row"><CircularProgress size={14} sx={{color:'#c9a84c'}}/><span>Loading…</span></div>
                ) : !apiKeys.length ? (
                  <p className="st-empty">No API keys yet.</p>
                ) : (
                  <div className="st-api-keys">
                    {apiKeys.map((k,i) => (
                      <div className="st-api-key-row" key={k._id||i}>
                        <code className="st-api-key-val">{k.key}</code>
                        <span className="st-api-key-meta">{k.name||'Default'} · {k.createdAt?new Date(k.createdAt).toLocaleDateString():'recently'}</span>
                        <button className="st-revoke-btn" onClick={()=>revokeApiKey(k._id)}><FiX size={12}/> Revoke</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              TAB: APPEARANCE
          ═══════════════════════════════════════ */}
          {tab === 'appearance' && (
            <div className="st-tab-body">
              <div className="st-card">
                <div className="st-card-hdr"><h2>Appearance &amp; Locale</h2></div>
                <p className="st-card-desc">Customize language, timezone, and display preferences across your workspace.</p>
                <div className="st-fields-grid">
                  <div className="st-field">
                    <label>Language</label>
                    <select value={appearance.language} onChange={e=>setAppearance(a=>({...a,language:e.target.value}))}>
                      {[['en','English'],['es','Spanish'],['fr','French'],['de','German'],['ar','Arabic'],['ur','Urdu'],['zh','Chinese (Simplified)'],['pt','Portuguese'],['ja','Japanese']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="st-field">
                    <label>Timezone</label>
                    <select value={appearance.timezone} onChange={e=>setAppearance(a=>({...a,timezone:e.target.value}))}>
                      {[['UTC','UTC'],['GMT','GMT'],['EST','EST (UTC-5)'],['CST','CST (UTC-6)'],['MST','MST (UTC-7)'],['PST','PST (UTC-8)'],['IST','IST (UTC+5:30)'],['PKT','PKT (UTC+5)'],['GST','GST (UTC+4)'],['CET','CET (UTC+1)'],['AEST','AEST (UTC+10)']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="st-field">
                    <label>Currency Display</label>
                    <select value={appearance.currency||'USD'} onChange={e=>setAppearance(a=>({...a,currency:e.target.value}))}>
                      {[['USD','USD ($)'],['EUR','EUR (€)'],['GBP','GBP (£)'],['PKR','PKR (₨)'],['INR','INR (₹)'],['CAD','CAD ($)'],['AED','AED (د.إ)']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="st-field">
                    <label>Date Format</label>
                    <select value={appearance.dateFormat||'MM/DD/YYYY'} onChange={e=>setAppearance(a=>({...a,dateFormat:e.target.value}))}>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    </select>
                  </div>
                </div>
                <div className="st-form-actions" style={{marginTop:8}}>
                  <button className="st-btn-save" onClick={saveAppearance} disabled={saving}>{saving?'Saving…':'Save Preferences'}</button>
                </div>
              </div>
              <div className="st-card st-card-muted">
                <div className="st-card-hdr"><h2>Theme</h2></div>
                <p className="st-card-desc">Aurelance uses the Obsidian Luxury dark theme. Light mode is planned for a future release.</p>
                <div className="st-theme-preview">
                  <div className="st-theme-swatch active"><span/>Dark (Current)</div>
                  <div className="st-theme-swatch disabled"><span/>Light (Coming Soon)</div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              TAB: INTEGRATIONS
          ═══════════════════════════════════════ */}
          {tab === 'integrations' && (
            <div className="st-tab-body">
              <div className="st-card">
                <div className="st-card-hdr"><h2>Connected Apps</h2></div>
                <p className="st-card-desc">Connect external services. Clicking Connect opens a secure OAuth authorization window.</p>
                <div className="st-integrations-list">
                  {[
                    {key:'googleDrive',name:'Google Drive',icon:'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg',desc:'Sync client files and proposals to Google Drive.',badge:isPremium?null:'Premium'},
                    {key:'dropbox',name:'Dropbox',icon:'https://upload.wikimedia.org/wikipedia/commons/7/74/Dropbox_Icon.svg',desc:'Backup invoices and documents to Dropbox automatically.',badge:isPremium?null:'Premium'},
                    {key:'github',name:'GitHub',icon:'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',desc:'Link GitHub to showcase repos on your public profile.',badge:null},
                  ].map(intg => {
                    const connected = integrations[intg.key];
                    const locked    = intg.badge && !isPremium;
                    return (
                      <div className="st-intg-row" key={intg.key}>
                        <div className="st-intg-icon-wrap">
                          <img src={intg.icon} alt={intg.name} className="st-intg-logo" onError={e=>{e.target.style.display='none'}}/>
                        </div>
                        <div className="st-intg-info">
                          <div className="st-intg-name-row">
                            <strong>{intg.name}</strong>
                            {intg.badge&&<span className="st-locked-badge"><FiLock size={10}/> {intg.badge}</span>}
                            {connected&&<span className="st-conn-badge"><FiCheck size={10}/> Connected</span>}
                          </div>
                          <span className="st-intg-desc">{intg.desc}</span>
                        </div>
                        <button className={`st-intg-btn${connected?' disconnect':''}`} disabled={locked} onClick={()=>!locked&&toggleIntegration(intg.key)}>
                          {locked?<><FiLock size={11}/> Upgrade</>:connected?<><FiX size={11}/> Disconnect</>:<><FiLink size={11}/> Connect</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              TAB: DATA
          ═══════════════════════════════════════ */}
          {tab === 'data' && (
            <div className="st-tab-body">
              <div className="st-card">
                <div className="st-card-hdr"><h2>Export Your Data</h2></div>
                <p className="st-card-desc">Download a complete JSON export of all your data — clients, invoices, tasks, profile, and settings. You own your data.</p>
                <button className="st-btn-save" onClick={handleDownloadData} disabled={downloading}>
                  {downloading?<><CircularProgress size={13} sx={{color:'#0a0a0c'}}/> Preparing…</>:<><FiDownload size={13}/> Download My Data</>}
                </button>
              </div>
              <div className="st-card st-danger-card">
                <div className="st-card-hdr"><h2>Delete Account</h2></div>
                <p className="st-card-desc">
                  Permanently delete your account and all data — clients, invoices, tasks, profile.
                  <strong> This is irreversible.</strong>
                </p>
                {!deleteConfirm ? (
                  <button className="st-btn-danger" onClick={()=>setDeleteConfirm(true)}><FiTrash2 size={13}/> Delete My Account</button>
                ) : (
                  <div className="st-delete-confirm">
                    <div className="st-delete-warning">
                      <FiAlertTriangle size={18} style={{color:'#e05c5c',flexShrink:0}}/>
                      <div>
                        <strong>This will permanently delete everything.</strong>
                        <p>All your clients, invoices, tasks, and profile data will be gone. No recovery possible.</p>
                      </div>
                    </div>
                    <div className="st-field">
                      <label>Type <code>DELETE</code> to confirm</label>
                      <input value={deleteInput} onChange={e=>setDeleteInput(e.target.value)} placeholder="DELETE" style={{fontFamily:'monospace',letterSpacing:'0.1em'}}/>
                    </div>
                    <div className="st-form-actions">
                      <button className="st-btn-cancel" onClick={()=>{setDeleteConfirm(false);setDeleteInput('');}}>Cancel</button>
                      <button className="st-btn-danger" disabled={deleteInput!=='DELETE'||deleting} onClick={handleDeleteAccount}>
                        {deleting?<CircularProgress size={13} sx={{color:'#fff'}}/>:<><FiTrash2 size={12}/> Permanently Delete</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}