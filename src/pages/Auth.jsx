// src/pages/Auth.jsx — every signed-out flow in one place:
//   login · register · forgot · reset · verify (email link) · confirm-email (email change) · oauth (callback) · 2FA step
import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import api, { API_BASE, errorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import '../styles/Auth.css';

const OAUTH_ERRORS = {
  google_failed: 'Google sign-in was cancelled or failed. Try again.',
  github_failed: 'GitHub sign-in was cancelled or failed. Try again.',
  google_unavailable: 'Google sign-in isn’t set up yet. Use email and password.',
  github_unavailable: 'GitHub sign-in isn’t set up yet. Use email and password.',
  oauth_error: 'Sign-in didn’t complete. Try again.',
};

function Password({ id, value, onChange, autoComplete, placeholder, invalid }) {
  const [show, setShow] = useState(false);
  return (
    <div className="au-pw">
      <input id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange}
        autoComplete={autoComplete} placeholder={placeholder} required minLength={8} aria-invalid={invalid || undefined} />
      <button type="button" className="au-pw-eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
}

const strength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += 1;
  return s; // 0–4
};
const STRENGTH = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

export default function Auth({ mode: initialMode = 'login' }) {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(OAUTH_ERRORS[params.get('error')] || '');
  const [notice, setNotice] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [providers, setProviders] = useState({ google: false, github: false });

  const from = location.state?.from && !location.state.from.startsWith('/login') ? location.state.from : '/home';
  const token = params.get('token');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { setMode(initialMode); setError(OAUTH_ERRORS[params.get('error')] || ''); setNotice(''); }, [initialMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get('/auth/providers').then(setProviders).catch(() => {});
  }, []);

  // Link-driven modes run once on load.
  useEffect(() => {
    if (mode === 'oauth') {
      const code = params.get('code');
      if (!code) { setError(OAUTH_ERRORS.oauth_error); setMode('login'); return; }
      api.post('/auth/oauth/exchange', { code })
        .then((r) => { login(r); navigate('/home', { replace: true }); })
        .catch((e) => { setError(errorMessage(e)); setMode('login'); });
    }
    if (mode === 'verify' || mode === 'confirm-email') {
      if (!token) { setError('This link is missing its token.'); return; }
      setBusy(true);
      api.post(mode === 'verify' ? '/auth/verify-email' : '/auth/confirm-email-change', { token })
        .then((r) => setNotice(r.message || 'Done.'))
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setBusy(false));
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const pwScore = useMemo(() => strength(form.password), [form.password]);

  if (isLoading) return null;
  if (isAuthenticated && ['login', 'register'].includes(mode)) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'login') {
        const r = await api.post('/auth/login', { email: form.email.trim(), password: form.password });
        if (r.twoFactorRequired) { setChallenge(r); setMode('2fa'); setNotice(`We sent a 6-digit code to ${r.email}.`); }
        else { login(r); navigate(from, { replace: true }); }
      } else if (mode === '2fa') {
        const r = await api.post('/auth/2fa/login', { challenge: challenge?.challenge, code: form.code.trim() });
        login(r); navigate(from, { replace: true });
      } else if (mode === 'register') {
        if (pwScore < 2) throw new Error('Choose a stronger password: at least 8 characters with a mix of letters and numbers.');
        const r = await api.post('/auth/register', { name: form.name.trim(), email: form.email.trim(), password: form.password, ref: params.get('ref') || undefined });
        login(r); navigate('/home', { replace: true, state: { welcome: true } });
      } else if (mode === 'forgot') {
        const r = await api.post('/auth/forgot-password', { email: form.email.trim() });
        setNotice(r.message);
      } else if (mode === 'reset') {
        const r = await api.post('/auth/reset-password', { token, password: form.password });
        setNotice(r.message);
        setTimeout(() => navigate('/login', { replace: true }), 1800);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const oauth = (p) => { window.location.href = `${API_BASE}/auth/${p}`; };

  const titles = {
    login: ['Sign in', 'Welcome back. Your book is where you left it.'],
    register: ['Create your account', 'Free for the essentials. No card needed.'],
    forgot: ['Reset your password', 'Enter your account email and we’ll send a reset link.'],
    reset: ['Choose a new password', 'Use at least 8 characters. You’ll be signed out everywhere else.'],
    '2fa': ['Check your email', 'Enter the 6-digit code to finish signing in.'],
    verify: ['Confirming your email', ''],
    'confirm-email': ['Confirming your new email', ''],
    oauth: ['Signing you in', ''],
  };
  const [title, sub] = titles[mode] || titles.login;
  const showOAuth = ['login', 'register'].includes(mode) && (providers.google || providers.github);

  return (
    <div className="au">
      <aside className="au-cover" aria-hidden="true">
        <div className="au-cover-frame">
          <Logo size={34} />
          <div className="au-cover-text">
            <p className="au-cover-line">Accounts kept by</p>
            <p className="au-cover-name">{form.name.trim() || 'an independent'}</p>
          </div>
          <dl className="au-cover-index">
            <div><dt>Clients</dt><dd>i</dd></div>
            <div><dt>Invoices</dt><dd>ii</dd></div>
            <div><dt>Tasks &amp; hours</dt><dd>iii</dd></div>
            <div><dt>Network</dt><dd>iv</dd></div>
          </dl>
        </div>
      </aside>

      <section className="au-panel">
        <Link to="/" className="au-mobile-brand" aria-label="Aurelance home"><Logo size={28} /></Link>
        <div className="au-card">
          {['forgot', 'reset', '2fa'].includes(mode) && (
            <button type="button" className="au-back" onClick={() => { setMode('login'); setError(''); setNotice(''); navigate('/login'); }}>
              <FiArrowLeft /> Back to sign in
            </button>
          )}
          <h1>{title}</h1>
          {sub && <p className="au-sub">{sub}</p>}

          {error && <div className="notice notice-err" role="alert">{error}</div>}
          {notice && <div className="notice notice-ok" role="status">{notice}</div>}

          {['verify', 'confirm-email', 'oauth'].includes(mode) ? (
            <div className="au-link-state">
              {busy || mode === 'oauth' ? <span className="spinner" /> : (
                <Link to={isAuthenticated ? '/home' : '/login'} className="btn btn-gilt btn-block">{isAuthenticated ? 'Go to your workspace' : 'Sign in'}</Link>
              )}
            </div>
          ) : (
            <>
              {showOAuth && (
                <div className="au-oauth">
                  {providers.google && <button type="button" className="btn btn-block" onClick={() => oauth('google')}><FaGoogle /> Continue with Google</button>}
                  {providers.github && <button type="button" className="btn btn-block" onClick={() => oauth('github')}><FaGithub /> Continue with GitHub</button>}
                  <div className="au-or"><span>or with email</span></div>
                </div>
              )}

              <form onSubmit={submit} className="au-form" noValidate={false}>
                {mode === 'register' && (
                  <label className="field" htmlFor="au-name"><span>Your name</span>
                    <input id="au-name" className="input" value={form.name} onChange={set('name')} autoComplete="name" required maxLength={80} />
                  </label>
                )}
                {['login', 'register', 'forgot'].includes(mode) && (
                  <label className="field" htmlFor="au-email"><span>Email</span>
                    <input id="au-email" className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" required inputMode="email" />
                  </label>
                )}
                {['login', 'register', 'reset'].includes(mode) && (
                  <div className="field">
                    <span className="au-label-row">
                      <label htmlFor="au-pw">{mode === 'reset' ? 'New password' : 'Password'}</label>
                      {mode === 'login' && <Link to="/forgot-password" className="au-small-link">Forgot password?</Link>}
                    </span>
                    <Password id="au-pw" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                    {mode !== 'login' && form.password && (
                      <span className="au-strength" data-score={pwScore}>
                        <span className="au-strength-bar"><i style={{ width: `${(pwScore / 4) * 100}%` }} /></span>
                        {STRENGTH[pwScore]}
                      </span>
                    )}
                  </div>
                )}
                {mode === '2fa' && (
                  <label className="field" htmlFor="au-code"><span>6-digit code</span>
                    <input id="au-code" className="input au-code" value={form.code} onChange={set('code')} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus />
                  </label>
                )}

                <button type="submit" className="btn btn-gilt btn-block au-submit" disabled={busy || (mode === 'reset' && !token)}>
                  {busy ? <span className="spinner" /> : {
                    login: 'Sign in', register: 'Create account', forgot: 'Send reset link', reset: 'Save new password', '2fa': 'Verify and sign in',
                  }[mode]}
                </button>
              </form>

              <p className="au-switch">
                {mode === 'register'
                  ? <>Already have an account? <Link to="/login">Sign in</Link></>
                  : mode === 'login' ? <>New to Aurelance? <Link to="/register">Create a free account</Link></> : null}
              </p>
              {mode === 'register' && (
                <p className="au-legal">By creating an account you agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy policy</Link>.</p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
