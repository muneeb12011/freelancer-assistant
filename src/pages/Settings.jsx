// src/pages/Settings.jsx — account, security, notifications, preferences, data.
// Plans live on /billing only.
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiMonitor, FiSmartphone, FiDownload, FiUpload, FiCheck } from 'react-icons/fi';
import compressImage from '../lib/compressImage';
import { BadgeList } from '../components/Badges';
import api, { API_BASE, errorMessage, tokenStore } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import '../styles/Settings.css';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'security', label: 'Security' },
  { id: 'verification', label: 'Verification' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'data', label: 'Your data' },
];

const NOTIFICATIONS = [
  ['paymentReceived', 'Payment receipts', 'A receipt when your Premium payment goes through.'],
  ['overdueAlerts', 'Overdue invoices', 'The morning after a client invoice passes its due date.'],
  ['taskReminders', 'Task deadlines', 'The day before tasks are due.'],
  ['connectionReqs', 'Connection requests', 'When another freelancer wants to connect.'],
  ['jobAlerts', 'Job activity', 'New applicants on your job posts, and updates on jobs you applied to.'],
  ['clientMessages', 'Messages', 'When someone in your network messages you (at most every 30 minutes per chat).'],
  ['emailDigest', 'Weekly summary', 'Monday morning: what you earned, what’s owed, what’s due.'],
  ['marketingEmails', 'Product updates', 'Occasional emails when something new ships.'],
];

const TIMEZONES = (() => { try { return Intl.supportedValuesOf('timeZone'); } catch { return ['UTC', 'Asia/Karachi', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'America/Los_Angeles']; } })();

const Toggle = ({ on, onChange, label, disabled }) => (
  <button type="button" role="switch" aria-checked={Boolean(on)} aria-label={label} className="toggle" onClick={onChange} disabled={disabled} />
);

const Row = ({ title, desc, children }) => (
  <div className="st-row">
    <div className="st-row-text"><strong>{title}</strong>{desc && <p>{desc}</p>}</div>
    <div className="st-row-ctl">{children}</div>
  </div>
);

const ago = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Settings() {
  const { user, setUser, logout, isPremium } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'account';
  const go = (id) => setParams(id === 'account' ? {} : { tab: id }, { replace: true });

  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => api.get('/settings').then((r) => setSettings(r.settings)).catch((e) => toast.err(e)), [toast]);
  useEffect(() => { load(); }, [load]);

  const patch = async (body, okMsg = 'Saved') => {
    try {
      const r = await api.patch('/settings', body);
      setSettings(r.settings);
      toast.ok(okMsg);
      return true;
    } catch (e) { toast.err(e); return false; }
  };

  /* ── Account ── */
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const isLocal = user?.authProvider === 'local';

  const changeEmail = async (e) => {
    e.preventDefault(); setBusy('email');
    try { const r = await api.post('/auth/change-email', emailForm); toast.ok(r.message); setEmailForm({ newEmail: '', password: '' }); } catch (err) { toast.err(err); }
    setBusy('');
  };
  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.err('The new passwords don’t match.'); return; }
    if (pwForm.next.length < 8) { toast.err('Use at least 8 characters.'); return; }
    setBusy('pw');
    try {
      const r = await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      toast.ok(r.message); setPwForm({ current: '', next: '', confirm: '' }); loadSessions();
    } catch (err) { toast.err(err); }
    setBusy('');
  };
  const resendVerification = async () => {
    setBusy('verify');
    try { const r = await api.post('/auth/resend-verification'); toast.ok(r.message); } catch (err) { toast.err(err); }
    setBusy('');
  };

  /* ── Security ── */
  const [sessions, setSessions] = useState([]);
  const [tf, setTf] = useState({ step: 0, code: '', password: '' });
  const loadSessions = useCallback(() => api.get('/auth/sessions').then((r) => setSessions(r.sessions || [])).catch(() => {}), []);
  useEffect(() => { if (tab === 'security') loadSessions(); }, [tab, loadSessions]);

  const revoke = async (id) => {
    try { await api.delete(`/auth/sessions/${id}`); setSessions((s) => s.filter((x) => x._id !== id)); toast.ok('Device signed out'); } catch (e) { toast.err(e); }
  };
  const revokeOthers = async () => {
    setBusy('others');
    try { const r = await api.post('/auth/sessions/revoke-others'); toast.ok(r.message); loadSessions(); } catch (e) { toast.err(e); }
    setBusy('');
  };
  const send2fa = async () => {
    setBusy('2fa');
    try { const r = await api.post('/auth/2fa/send'); toast.ok(r.message); setTf((t) => ({ ...t, step: 1 })); } catch (e) { toast.err(e); }
    setBusy('');
  };
  const verify2fa = async (e) => {
    e.preventDefault(); setBusy('2fa');
    try { const r = await api.post('/auth/2fa/verify', { code: tf.code }); setUser(r.user); toast.ok(r.message); setTf({ step: 0, code: '', password: '' }); } catch (err) { toast.err(err); }
    setBusy('');
  };
  const disable2fa = async (e) => {
    e.preventDefault(); setBusy('2fa');
    try { const r = await api.post('/auth/2fa/disable', { password: tf.password }); setUser(r.user); toast.ok(r.message); setTf({ step: 0, code: '', password: '' }); } catch (err) { toast.err(err); }
    setBusy('');
  };

  /* ── Data ── */
  const [del, setDel] = useState({ confirm: '', password: '' });
  const exportData = async () => {
    setBusy('export');
    try {
      const res = await fetch(`${API_BASE}/settings/download-data`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `aurelance-export-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.ok('Export downloaded');
    } catch (e) { toast.err(errorMessage(e)); }
    setBusy('');
  };
  const deleteAccount = async (e) => {
    e.preventDefault(); setBusy('delete');
    try {
      await api.delete('/auth/account', { confirm: del.confirm, password: del.password });
      await logout();
      navigate('/', { replace: true });
    } catch (err) { toast.err(err); setBusy(''); }
  };

  const notif = settings?.notifications || user?.notifications || {};
  const prefs = settings?.preferences || user?.preferences || {};

  return (
    <div className="st">
      <header className="ledger-title">
        <h1>Settings</h1>
        <p>Signed in as {user?.email}. Your plan is managed on <Link to="/billing">Plan &amp; billing</Link>{isPremium ? ' (Premium)' : ''}.</p>
      </header>

      <div className="st-layout">
        <nav className="st-tabs" aria-label="Settings sections" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-on' : ''} onClick={() => go(t.id)}>{t.label}</button>
          ))}
        </nav>

        <div className="st-body" role="tabpanel">
          {tab === 'account' && (
            <>
              <section className="st-section">
                <h2>Email</h2>
                <Row title={user?.email} desc={user?.emailVerified ? 'Confirmed' : 'Not confirmed yet — confirm it so password resets and receipts reach you.'}>
                  {!user?.emailVerified && <button type="button" className="btn btn-sm" onClick={resendVerification} disabled={busy === 'verify'}>{busy === 'verify' ? <span className="spinner" /> : 'Send confirmation'}</button>}
                </Row>
                <form className="st-form" onSubmit={changeEmail}>
                  <label className="field"><span>New email</span><input className="input" type="email" required value={emailForm.newEmail} onChange={(e) => setEmailForm((f) => ({ ...f, newEmail: e.target.value }))} autoComplete="email" /></label>
                  {isLocal && <label className="field"><span>Current password</span><input className="input" type="password" required value={emailForm.password} onChange={(e) => setEmailForm((f) => ({ ...f, password: e.target.value }))} autoComplete="current-password" /></label>}
                  <button type="submit" className="btn" disabled={busy === 'email'}>{busy === 'email' ? <span className="spinner" /> : 'Send confirmation link'}</button>
                  <small className="st-hint">We email the new address. The change happens when you click the link.</small>
                </form>
              </section>

              <section className="st-section">
                <h2>Password</h2>
                {!isLocal && <p className="st-hint">You sign in with {user?.authProvider === 'google' ? 'Google' : 'GitHub'}. Set a password to also sign in with email.</p>}
                <form className="st-form" onSubmit={changePassword}>
                  {isLocal && <label className="field"><span>Current password</span><input className="input" type="password" required value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} autoComplete="current-password" /></label>}
                  <label className="field"><span>New password</span><input className="input" type="password" required minLength={8} value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} autoComplete="new-password" /></label>
                  <label className="field"><span>Repeat new password</span><input className="input" type="password" required minLength={8} value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} autoComplete="new-password" /></label>
                  <button type="submit" className="btn" disabled={busy === 'pw'}>{busy === 'pw' ? <span className="spinner" /> : 'Change password'}</button>
                  <small className="st-hint">Changing it signs out every other device.</small>
                </form>
              </section>
            </>
          )}

          {tab === 'security' && (
            <>
              <section className="st-section">
                <h2>Two-step sign-in</h2>
                <Row title={user?.twoFactorEnabled ? 'On — we email a code at every sign-in' : 'Off'} desc="After your password, enter a 6-digit code sent to your email.">
                  {!user?.twoFactorEnabled && tf.step === 0 && <button type="button" className="btn btn-sm" onClick={send2fa} disabled={busy === '2fa'}>{busy === '2fa' ? <span className="spinner" /> : 'Turn on'}</button>}
                  {user?.twoFactorEnabled && tf.step === 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setTf((t) => ({ ...t, step: 2 }))}>Turn off</button>}
                </Row>
                {tf.step === 1 && (
                  <form className="st-form st-inline" onSubmit={verify2fa}>
                    <label className="field"><span>Code from your email</span><input className="input" inputMode="numeric" pattern="\d{6}" maxLength={6} required value={tf.code} onChange={(e) => setTf((t) => ({ ...t, code: e.target.value }))} autoComplete="one-time-code" /></label>
                    <button type="submit" className="btn btn-gilt" disabled={busy === '2fa'}>Confirm</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setTf({ step: 0, code: '', password: '' })}>Cancel</button>
                  </form>
                )}
                {tf.step === 2 && (
                  <form className="st-form st-inline" onSubmit={disable2fa}>
                    {isLocal && <label className="field"><span>Password</span><input className="input" type="password" required value={tf.password} onChange={(e) => setTf((t) => ({ ...t, password: e.target.value }))} autoComplete="current-password" /></label>}
                    <button type="submit" className="btn btn-danger" disabled={busy === '2fa'}>Turn off two-step</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setTf({ step: 0, code: '', password: '' })}>Cancel</button>
                  </form>
                )}
                <Row title="Sign-in alerts" desc="Email me when my account is used on a new device.">
                  <Toggle label="Sign-in alerts" on={settings?.security?.loginAlerts ?? user?.loginAlerts} onChange={() => patch({ security: { loginAlerts: !(settings?.security?.loginAlerts ?? user?.loginAlerts) } }).then((ok) => ok && setUser((u) => ({ ...u, loginAlerts: !u.loginAlerts })))} />
                </Row>
              </section>

              <section className="st-section">
                <div className="st-section-head">
                  <h2>Signed-in devices</h2>
                  {sessions.length > 1 && <button type="button" className="btn btn-sm" onClick={revokeOthers} disabled={busy === 'others'}>Sign out all other devices</button>}
                </div>
                <ul className="st-sessions">
                  {sessions.map((s) => (
                    <li key={s._id}>
                      {/Android|iOS/.test(s.device) ? <FiSmartphone aria-hidden="true" /> : <FiMonitor aria-hidden="true" />}
                      <div>
                        <strong>{s.device || 'Unknown device'}{s.current && <span className="chip chip-sage">This device</span>}</strong>
                        <span>{s.ip} — active {ago(s.lastSeenAt)} — signed in with {s.method === '2fa' ? 'password + code' : s.method}</span>
                      </div>
                      {!s.current && <button type="button" className="btn btn-sm btn-ghost" onClick={() => revoke(s._id)}>Sign out</button>}
                    </li>
                  ))}
                  {!sessions.length && <li className="st-hint">Loading devices…</li>}
                </ul>
              </section>
            </>
          )}

          {tab === 'verification' && <VerificationPanel />}

          {tab === 'notifications' && (
            <section className="st-section">
              <h2>Email notifications</h2>
              {NOTIFICATIONS.map(([key, title, desc]) => (
                <Row key={key} title={title} desc={desc}>
                  <Toggle label={title} on={notif[key]} disabled={!settings} onChange={() => patch({ notifications: { [key]: !notif[key] } }, `${title} ${notif[key] ? 'off' : 'on'}`)} />
                </Row>
              ))}
            </section>
          )}

          {tab === 'preferences' && (
            <PreferencesForm prefs={prefs} discoverable={settings?.discoverable ?? user?.discoverable} onSave={(body) => patch(body, 'Preferences saved')} />
          )}

          {tab === 'data' && (
            <>
              <section className="st-section">
                <h2>Export</h2>
                <Row title="Download everything" desc="Clients, invoices, tasks, notes, connections, contracts, proposals, earnings and receipts as one JSON file.">
                  <button type="button" className="btn btn-sm" onClick={exportData} disabled={busy === 'export'}>{busy === 'export' ? <span className="spinner" /> : <><FiDownload /> Export</>}</button>
                </Row>
              </section>
              <section className="st-section st-danger">
                <h2>Delete account</h2>
                <p className="st-hint">Permanently deletes your account and everything in it. Paid receipts are kept for tax records. This can’t be undone.</p>
                <form className="st-form" onSubmit={deleteAccount}>
                  <label className="field"><span>Type DELETE to confirm</span><input className="input" value={del.confirm} onChange={(e) => setDel((d) => ({ ...d, confirm: e.target.value }))} autoComplete="off" /></label>
                  {isLocal && <label className="field"><span>Password</span><input className="input" type="password" value={del.password} onChange={(e) => setDel((d) => ({ ...d, password: e.target.value }))} autoComplete="current-password" /></label>}
                  <button type="submit" className="btn btn-danger" disabled={del.confirm !== 'DELETE' || busy === 'delete'}>{busy === 'delete' ? <span className="spinner" /> : 'Delete my account'}</button>
                </form>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PreferencesForm({ prefs, discoverable, onSave }) {
  const [p, setP] = useState(prefs);
  const [disc, setDisc] = useState(discoverable !== false);
  useEffect(() => setP(prefs), [prefs]);
  useEffect(() => setDisc(discoverable !== false), [discoverable]);
  const set = (k) => (e) => setP((x) => ({ ...x, [k]: e.target.value }));
  return (
    <section className="st-section">
      <h2>Preferences</h2>
      <form className="st-grid" onSubmit={(e) => { e.preventDefault(); onSave({ preferences: p, discoverable: disc }); }}>
        <label className="field"><span>Currency for new invoices</span>
          <select className="input" value={p.currency || 'USD'} onChange={set('currency')}>
            {['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'INR'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field"><span>Date format</span>
          <select className="input" value={p.dateFormat || 'MM/DD/YYYY'} onChange={set('dateFormat')}>
            {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="field"><span>Time zone</span>
          <select className="input" value={p.timezone || 'UTC'} onChange={set('timezone')}>
            {TIMEZONES.map((z) => <option key={z}>{z}</option>)}
          </select>
        </label>
        <label className="field"><span>Language</span>
          <select className="input" value={p.language || 'en'} onChange={set('language')}>
            <option value="en">English</option>
          </select>
        </label>
        <div className="st-row st-span">
          <div className="st-row-text"><strong>Show me in network search</strong><p>Other freelancers can find you by name and skills and send connection requests.</p></div>
          <button type="button" role="switch" aria-checked={disc} aria-label="Show me in network search" className="toggle" onClick={() => setDisc((d) => !d)} />
        </div>
        <div className="st-span"><button type="submit" className="btn btn-gilt">Save preferences</button></div>
      </form>
    </section>
  );
}

/* ── Verification ─────────────────────────────────────────── */
const DOC_TYPES = [['cnic', 'CNIC (Pakistan)'], ['national_id', 'National ID card'], ['passport', 'Passport'], ['driving_license', 'Driving licence']];

function PhotoPick({ label, hint, value, onChange }) {
  const toast = useToast();
  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { onChange(await compressImage(f)); } catch (err) { toast.err(err); }
  };
  return (
    <label className={`vf-photo${value ? ' has-photo' : ''}`}>
      {value ? <img src={value} alt="" /> : <FiUpload aria-hidden="true" />}
      <span><strong>{label}</strong><small>{value ? 'Tap to replace' : hint}</small></span>
      <input type="file" accept="image/*" capture="environment" onChange={pick} hidden />
    </label>
  );
}

function VerificationPanel() {
  const { setUser } = useAuth();
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({ fullName: '', country: 'Pakistan', docType: 'cnic', front: '', back: '', selfie: '', consent: false });
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.get('/verification').then(setInfo).catch((e) => toast.err(e)), [toast]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api.post('/verification/identity', form, { timeout: 60000 }); toast.ok(r.message); setUser(r.user); setForm((f) => ({ ...f, front: '', back: '', selfie: '' })); load(); }
    catch (err) { toast.err(err); }
    setBusy(false);
  };
  const cancel = async () => {
    try { const r = await api.delete('/verification/identity'); toast.ok(r.message); setUser(r.user); load(); } catch (err) { toast.err(err); }
  };

  if (!info) return <section className="st-section"><span className="spinner" /></section>;
  const [emailStep, linkedStep, idStep] = info.steps;
  return (
    <>
      <section className="st-section">
        <h2>Verification</h2>
        <p className="st-hint">Badges appear next to your name on your profile, job posts, applications and in messages. Clients hire verified freelancers faster.</p>
        <BadgeList badges={info.badges} />
      </section>

      <section className="st-section">
        <h2>Email</h2>
        <Row title={emailStep.done ? 'Confirmed' : 'Not confirmed'} desc="Needed to post jobs and to receive receipts and password resets.">
          {emailStep.done ? <span className="chip chip-sage"><FiCheck /> Done</span> : (
            <button type="button" className="btn btn-sm" onClick={() => api.post('/auth/resend-verification').then((r) => toast.ok(r.message)).catch((e) => toast.err(e))}>Send confirmation</button>
          )}
        </Row>
      </section>

      <section className="st-section">
        <h2>Linked account</h2>
        <Row title={linkedStep.done ? `Linked with ${[linkedStep.providers.google && 'Google', linkedStep.providers.github && 'GitHub'].filter(Boolean).join(' and ')}` : 'Not linked'}
          desc="Sign in once with Google or GitHub using the same email as this account and it links automatically.">
          {linkedStep.done && <span className="chip chip-sage"><FiCheck /> Done</span>}
        </Row>
      </section>

      <section className="st-section">
        <h2>Identity check</h2>
        {idStep.status === 'approved' && <div className="notice notice-ok">Your ID is verified. The photos you sent were deleted after review.</div>}
        {idStep.status === 'pending' && (
          <Row title="Under review" desc="A person checks submissions within one business day. You’ll get an email either way.">
            <button type="button" className="btn btn-sm btn-ghost" onClick={cancel}>Cancel and delete photos</button>
          </Row>
        )}
        {idStep.status === 'rejected' && <div className="notice notice-err">Last attempt wasn’t approved: {idStep.last?.reason || 'the photos weren’t clear enough'}. You can try again below.</div>}
        {!info.identityEnabled && idStep.status !== 'approved' && <div className="notice notice-warn">ID checks open soon.</div>}
        {info.identityEnabled && ['none', 'rejected'].includes(idStep.status) && (
          <form className="vf-form" onSubmit={submit}>
            {!emailStep.done && <div className="notice notice-warn">Confirm your email first.</div>}
            <div className="st-grid">
              <label className="field"><span>Full name, as on the document</span><input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label>
              <label className="field"><span>Issuing country</span><input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required /></label>
              <label className="field st-span"><span>Document</span>
                <select className="input" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>{DOC_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              </label>
            </div>
            <div className="vf-photos">
              <PhotoPick label="Front" hint="All four corners visible, no glare" value={form.front} onChange={(v) => setForm((f) => ({ ...f, front: v }))} />
              {form.docType !== 'passport' && <PhotoPick label="Back" hint="Same document, other side" value={form.back} onChange={(v) => setForm((f) => ({ ...f, back: v }))} />}
              <PhotoPick label="Selfie with the document" hint="Your face and the document in one photo" value={form.selfie} onChange={(v) => setForm((f) => ({ ...f, selfie: v }))} />
            </div>
            <label className="vf-consent">
              <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
              <span>I agree that Aurelance stores these photos encrypted only until a reviewer has checked them, then deletes them. Only the result (verified or not) is kept.</span>
            </label>
            <button type="submit" className="btn btn-gilt" disabled={busy || !form.consent || !emailStep.done || !form.front || !form.selfie || (form.docType !== 'passport' && !form.back)}>
              {busy ? <span className="spinner" /> : 'Submit for review'}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
