// src/pages/Profile.jsx — /profile (yours, editable) and /profile/:userId (someone else's).
// The top half is the record other people judge you by: report cards, revealed reviews,
// verified payout types and squads. Contact details stay private unless the person shares them.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiMapPin, FiEdit3, FiMessageSquare, FiUserPlus, FiCheck, FiClock, FiFileText, FiPlus, FiTrash2, FiExternalLink, FiCamera, FiGlobe, FiGithub, FiLinkedin, FiTwitter, FiMail, FiPhone, FiLock, FiZap } from 'react-icons/fi';
import api, { askAI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Avatar } from '../components/Navbar';
import Badges from '../components/Badges';
import Modal from '../components/Modal';
import ReportButton from '../components/ReportButton';
import PremiumLock from '../components/PremiumLock';
import { ReportCard, Stars } from '../components/ReportCard';
import { PayTags } from './Talent';
import compressImage from '../lib/compressImage';
import { money, day } from '../lib/format';
import '../styles/Profile.css';

const arr = (v) => (Array.isArray(v) ? v : []);
const LIST = {
  projects:   { label: 'Portfolio', blank: { title: '', description: '', url: '', tech: '' }, fields: [['title', 'Project name'], ['description', 'What you did and the result', 'textarea'], ['url', 'Link'], ['tech', 'Tools used (comma separated)']] },
  services:   { label: 'Services', blank: { title: '', description: '', price: '' }, fields: [['title', 'Service'], ['description', 'What’s included', 'textarea'], ['price', 'Starting price (USD)', 'number']] },
  experience: { label: 'Experience', blank: { role: '', company: '', start: '', end: '', description: '' }, fields: [['role', 'Role'], ['company', 'Company or client'], ['start', 'From (e.g. 2023)'], ['end', 'To (blank if current)'], ['description', 'What you did', 'textarea']] },
  education:  { label: 'Education & certificates', blank: { institution: '', degree: '', year: '' }, fields: [['institution', 'School or issuer'], ['degree', 'Degree or certificate'], ['year', 'Year']] },
};
const VIS = { nobody: 'Nobody', contracts: 'People I have a signed contract with', connections: 'My connections and contract partners' };

/* ── Editors ───────────────────────────────────────────────── */
function BasicsEditor({ p, onSave, onClose }) {
  const [f, setF] = useState({ name: p.name || '', title: p.title || '', location: p.location || '', hourlyRate: p.hourlyRate || '', availability: p.availability || 'available', bio: p.bio || '', phone: p.phone || '', contactVisibility: p.contactVisibility || 'contracts' });
  return (
    <Modal title="Edit your profile" onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        <label className="field"><span>Full name</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={80} /></label>
        <label className="field"><span>What you do</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} placeholder="e.g. Shopify developer for fashion brands" /></label>
        <div className="pf-two">
          <label className="field"><span>City, country</span><input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} maxLength={120} placeholder="Lahore, Pakistan" /></label>
          <label className="field"><span>Hourly rate (USD)</span><input className="input" type="number" min="0" value={f.hourlyRate} onChange={(e) => setF({ ...f, hourlyRate: e.target.value })} /></label>
        </div>
        <label className="field"><span>Availability</span>
          <select className="input" value={f.availability} onChange={(e) => setF({ ...f, availability: e.target.value })}><option value="available">Taking new work</option><option value="busy">Busy — not taking work</option></select>
        </label>
        <label className="field"><span>About you <small>{f.bio.length}/2000</small></span><textarea className="input" rows={6} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={2000} placeholder="Who you help, what you’re best at, and one result you’re proud of." /></label>
        <label className="field"><span>Phone <small>private unless you share it</small></span><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={40} /></label>
        <label className="field"><span>Who can see your email and phone</span>
          <select className="input" value={f.contactVisibility} onChange={(e) => setF({ ...f, contactVisibility: e.target.value })}>{Object.entries(VIS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <small>Payout details are never shown on your profile — you share them per contract.</small>
        </label>
        <button type="submit" className="btn btn-gilt">Save</button>
      </form>
    </Modal>
  );
}

function TagsEditor({ p, onSave, onClose }) {
  const [skills, setSkills] = useState(arr(p.skills).join(', '));
  const [languages, setLanguages] = useState(arr(p.languages).join(', '));
  const [links, setLinks] = useState({ website: p.website || '', ...(p.socialLinks || {}) });
  const split = (s) => s.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 30);
  return (
    <Modal title="Skills, languages and links" onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); onSave({ skills: split(skills), languages: split(languages), website: links.website, socialLinks: { linkedin: links.linkedin || '', github: links.github || '', twitter: links.twitter || '' } }); }}>
        <label className="field"><span>Skills <small>comma separated — clients search these</small></span><input className="input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Shopify" /></label>
        <label className="field"><span>Languages</span><input className="input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Urdu" /></label>
        <label className="field"><span>Website</span><input className="input" value={links.website} onChange={(e) => setLinks({ ...links, website: e.target.value })} placeholder="https://" /></label>
        <label className="field"><span>LinkedIn</span><input className="input" value={links.linkedin || ''} onChange={(e) => setLinks({ ...links, linkedin: e.target.value })} placeholder="https://linkedin.com/in/…" /></label>
        <label className="field"><span>GitHub</span><input className="input" value={links.github || ''} onChange={(e) => setLinks({ ...links, github: e.target.value })} placeholder="https://github.com/…" /></label>
        <label className="field"><span>X / Twitter</span><input className="input" value={links.twitter || ''} onChange={(e) => setLinks({ ...links, twitter: e.target.value })} /></label>
        <button type="submit" className="btn btn-gilt">Save</button>
      </form>
    </Modal>
  );
}

function ItemEditor({ kind, item, onSave, onClose }) {
  const cfg = LIST[kind];
  const [f, setF] = useState({ ...cfg.blank, ...(item || {}), tech: Array.isArray(item?.tech) ? item.tech.join(', ') : item?.tech || '' });
  return (
    <Modal title={`${item ? 'Edit' : 'Add'} — ${cfg.label}`} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        {cfg.fields.map(([k, l, type]) => (
          <label key={k} className="field"><span>{l}</span>
            {type === 'textarea'
              ? <textarea className="input" rows={4} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} maxLength={1500} />
              : <input className="input" type={type || 'text'} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} maxLength={300} />}
          </label>
        ))}
        <button type="submit" className="btn btn-gilt">Save</button>
      </form>
    </Modal>
  );
}

function OfferModal({ person, onClose }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ title: '', summary: '', currency: 'USD', kind: 'standard', mTitle: '', amount: '', dueDate: '' });
  const [busy, setBusy] = useState(false);
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const r = await api.post('/engagements', { freelancer: person._id, title: f.title, summary: f.summary, currency: f.currency, kind: f.kind, milestones: [{ title: f.mTitle || f.title, amount: f.amount, dueDate: f.dueDate || undefined }] });
      toast.ok('Draft sent. Add milestones and sign it.');
      navigate(`/contracts/${r.contract._id}`);
    } catch (err) { toast.err(err); setBusy(false); }
  };
  return (
    <Modal title={`Offer ${person.name.split(' ')[0]} a contract`} onClose={onClose}>
      <form className="stack" onSubmit={send}>
        <fieldset className="radio-list">
          <legend className="visually-hidden">Kind</legend>
          <label><input type="radio" checked={f.kind === 'standard'} onChange={() => setF({ ...f, kind: 'standard' })} /> A contract for the work</label>
          <label><input type="radio" checked={f.kind === 'trial'} onChange={() => setF({ ...f, kind: 'trial' })} /> A small paid trial first</label>
        </fieldset>
        <label className="field"><span>Title</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required minLength={4} maxLength={140} placeholder="e.g. Landing page for our app" /></label>
        <label className="field"><span>What it covers</span><textarea className="input" rows={3} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></label>
        <div className="pf-two">
          <label className="field"><span>First milestone</span><input className="input" value={f.mTitle} onChange={(e) => setF({ ...f, mTitle: e.target.value })} placeholder="Design" /></label>
          <label className="field"><span>Amount</span><span className="pf-amt"><select className="input" value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })}>{['USD', 'PKR', 'EUR', 'GBP', 'AED'].map((c) => <option key={c}>{c}</option>)}</select><input className="input" type="number" min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required /></span></label>
        </div>
        <label className="field"><span>Due <small>optional</small></span><input className="input" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></label>
        <p className="muted-sm">This sends a draft. You can both add milestones; work starts when you’ve both signed.</p>
        <button type="submit" className="btn btn-gilt" disabled={busy}>{busy ? <span className="spinner" /> : 'Send draft contract'}</button>
      </form>
    </Modal>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function Profile() {
  const { userId } = useParams();
  const { user: me, setUser, isPremium } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const own = !userId || userId === me?._id;
  const [p, setP] = useState(null);
  const [rel, setRel] = useState({});
  const [reviews, setReviews] = useState([]);
  const [squads, setSquads] = useState([]);
  const [edit, setEdit] = useState(null); // 'basics' | 'tags' | { kind, index }
  const [offer, setOffer] = useState(false);
  const [busy, setBusy] = useState('');
  const [aiTips, setAiTips] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      if (own) {
        const [r, rv, sq] = await Promise.all([api.get('/profile'), api.get('/profile/reviews').catch(() => ({ reviews: [] })), api.get('/squads/mine').catch(() => ({ squads: [] }))]);
        setP(r.profile); setReviews(rv.reviews || []); setSquads((sq.squads || []).map((s) => ({ _id: s._id, name: s.name, tagline: s.tagline, members: s.stats.members })));
      } else {
        const [r, rv] = await Promise.all([api.get(`/profile/${userId}`), api.get(`/profile/${userId}/reviews`).catch(() => ({ reviews: [] }))]);
        setP(r.profile); setRel(r); setReviews(rv.reviews || []); setSquads(r.profile.squads || []);
      }
    } catch (e) { setError(e.status === 404 ? 'This profile doesn’t exist any more.' : e.message); }
  }, [own, userId]);
  useEffect(() => { setP(null); load(); }, [load]);

  const save = async (patch, ok = 'Saved') => {
    try { const r = await api.patch('/profile', patch); setP((x) => ({ ...x, ...r.profile })); setUser?.(r.user); setEdit(null); toast.ok(ok); } catch (e) { toast.err(e); }
  };
  const saveItem = (kind, index, item) => {
    const list = [...arr(p[kind])];
    const clean = { ...item };
    if (kind === 'projects') clean.tech = String(item.tech || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (index === null || index === undefined) list.push(clean); else list[index] = { ...list[index], ...clean };
    save({ [kind]: list });
  };
  const removeItem = (kind, index) => { if (window.confirm('Remove this?')) save({ [kind]: arr(p[kind]).filter((_, i) => i !== index) }, 'Removed'); };
  const photo = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { const data = await compressImage(file, { maxSide: 600, maxBytes: 300 * 1024 }); await save({ avatar: data }, 'Photo updated'); } catch (err) { toast.err(err); }
  };
  const connect = async () => {
    setBusy('connect');
    try { const r = await api.post('/connections/request', { userId }); toast.ok(r.message); load(); } catch (e) { toast.err(e); }
    setBusy('');
  };
  const accept = async () => {
    setBusy('connect');
    try { await api.post(`/connections/request/${rel.requestId}/accept`); toast.ok(`Connected with ${p.name}. Your conversation is in Messages.`); load(); } catch (e) { toast.err(e); }
    setBusy('');
  };
  const review = async () => {
    setBusy('ai');
    try {
      const text = await askAI('profile-review', `Name: ${p.name}. Title: ${p.title || 'none'}. Bio: "${p.bio || 'none'}". Skills: ${arr(p.skills).join(', ') || 'none'}. Projects: ${arr(p.projects).length}. Rate: ${p.hourlyRate || 'not set'}. Verified ID: ${p.badges?.identity ? 'yes' : 'no'}. Verified payout: ${arr(p.payoutTypes).join(', ') || 'none'}.`);
      setAiTips(String(text));
    } catch (e) { toast.err(e); }
    setBusy('');
  };

  if (error) return <div className="pf"><div className="empty"><h3>Profile not available</h3><p>{error}</p><Link to="/talent" className="btn">Find talent</Link></div></div>;
  if (!p) return <div className="pf"><span className="spinner" /></div>;

  const rep = p.reputation || {};
  const social = { website: p.website, ...(p.socialLinks || {}) };
  const linkIcons = { website: FiGlobe, linkedin: FiLinkedin, github: FiGithub, twitter: FiTwitter };
  const theirReviewsOfFreelancer = reviews.filter((r) => r.direction === 'of_freelancer');
  const reviewsAsClient = reviews.filter((r) => r.direction === 'of_client');
  const contactShared = own || p.contactShared;

  const section = (kind) => {
    const items = arr(p[kind]);
    if (!own && !items.length) return null;
    return (
      <section className="pf-sec" key={kind}>
        <div className="pf-sec-head"><h2>{LIST[kind].label}</h2>{own && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEdit({ kind, index: null })}><FiPlus /> Add</button>}</div>
        {!items.length ? <p className="muted-sm">Nothing here yet. {kind === 'projects' ? 'One real project with a link beats a long bio.' : ''}</p> : (
          <ul className={`pf-items pf-${kind}`}>
            {items.map((it, i) => (
              <li key={it._id || i}>
                <div>
                  <strong>{it.title || it.role || it.degree || it.institution || it.name || 'Untitled'}</strong>
                  <small>
                    {kind === 'experience' && [it.company, [it.start, it.end || (it.start ? 'now' : '')].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')}
                    {kind === 'education' && [it.degree ? it.institution : '', it.year].filter(Boolean).join(' · ')}
                    {kind === 'services' && it.price ? `From ${money(it.price)}` : ''}
                    {kind === 'projects' && arr(it.tech).length ? arr(it.tech).join(' · ') : ''}
                  </small>
                  {(it.description || it.desc) && <p>{it.description || it.desc}</p>}
                  {(it.url || it.link) && /^https?:\/\//.test(it.url || it.link) && <a href={it.url || it.link} target="_blank" rel="noopener noreferrer nofollow"><FiExternalLink /> {(it.url || it.link).replace(/^https?:\/\//, '').slice(0, 48)}</a>}
                </div>
                {own && <span className="pf-item-actions"><button type="button" className="btn btn-sm btn-ghost" onClick={() => setEdit({ kind, index: i })} aria-label="Edit"><FiEdit3 /></button><button type="button" className="btn btn-sm btn-ghost" onClick={() => removeItem(kind, i)} aria-label="Remove"><FiTrash2 /></button></span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="pf">
      <header className="pf-head">
        <div className="pf-photo">
          <Avatar user={p} size={112} />
          {own && <><button type="button" className="pf-photo-btn" onClick={() => fileRef.current?.click()} aria-label="Change photo"><FiCamera /></button><input ref={fileRef} type="file" accept="image/*" hidden onChange={photo} /></>}
        </div>
        <div className="pf-id">
          <h1>{p.name}<Badges badges={p.badges} size={20} /></h1>
          {p.title ? <p className="pf-title">{p.title}</p> : own && <button type="button" className="ct-link" onClick={() => setEdit('basics')}>Add what you do</button>}
          <p className="pf-meta">
            {p.location && <span><FiMapPin aria-hidden="true" /> {p.location}</span>}
            {p.hourlyRate > 0 && <span className="money">{money(p.hourlyRate)}/hr</span>}
            <span className={`pf-avail is-${p.availability || 'available'}`}>{p.availability === 'busy' ? 'Busy' : 'Taking work'}</span>
            <span><FiClock aria-hidden="true" /> Member since {day(p.createdAt, { month: 'short', year: 'numeric' })}</span>
          </p>
          <PayTags types={p.payoutTypes} />
        </div>
        <div className="pf-actions">
          {own ? (
            <>
              <button type="button" className="btn" onClick={() => setEdit('basics')}><FiEdit3 /> Edit profile</button>
              <Link to="/settings?tab=verification" className="btn btn-ghost">Verification</Link>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-gilt" onClick={() => setOffer(true)}><FiFileText /> Offer a contract</button>
              <Link to={`/messages?user=${p._id}`} className="btn"><FiMessageSquare /> Message</Link>
              {rel.relationship === 'connected' ? <span className="chip chip-sage"><FiCheck /> Connected</span>
                : rel.relationship === 'request-received' ? <button type="button" className="btn" onClick={accept} disabled={busy === 'connect'}><FiCheck /> Accept request</button>
                  : rel.relationship === 'request-sent' ? <span className="chip">Request sent</span>
                    : <button type="button" className="btn" onClick={connect} disabled={busy === 'connect'}><FiUserPlus /> Connect</button>}
              <ReportButton target="user" targetId={p._id} />
            </>
          )}
        </div>
      </header>

      <div className="pf-grid">
        <div className="pf-main">
          <section className="pf-sec">
            <div className="pf-sec-head"><h2>About</h2>{own && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEdit('basics')}><FiEdit3 /> Edit</button>}</div>
            {p.bio ? <p className="pf-bio">{p.bio}</p> : <p className="muted-sm">{own ? 'Write two or three sentences: who you help, what you’re best at, one result.' : 'No bio yet.'}</p>}
          </section>

          <section className="pf-sec">
            <div className="pf-sec-head"><h2>Reviews</h2></div>
            {theirReviewsOfFreelancer.length + reviewsAsClient.length === 0 ? (
              <p className="muted-sm">No reviews yet. Reviews are double-blind — they appear once both sides of a finished contract have written theirs.</p>
            ) : (
              <ul className="pf-reviews">
                {[...theirReviewsOfFreelancer, ...reviewsAsClient].map((r) => (
                  <li key={r._id}>
                    <p>{r.comment || 'Ratings only.'}</p>
                    <footer>
                      <span>{r.direction === 'of_freelancer' ? 'From a client' : 'From a freelancer they hired'}{r.from ? <> — <Link to={`/profile/${r.from._id}`}>{r.from.name}</Link></> : ''}</span>
                      <span>{r.contract?.title}{r.contract?.kind === 'trial' ? ' (paid trial)' : ''} · {day(r.at, { month: 'short', year: 'numeric' })}</span>
                      <span className="pf-review-stars">{Object.entries(r.ratings || {}).filter(([, v]) => v).map(([k, v]) => <span key={k}><Stars value={v} /> {k}</span>)}</span>
                    </footer>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {['projects', 'services', 'experience', 'education'].map(section)}
        </div>

        <aside className="pf-side">
          <ReportCard rep={rep} as="freelancer" />
          <ReportCard rep={rep} as="client" />

          <section className="panel pf-side-block">
            <div className="pf-sec-head"><h2>Skills</h2>{own && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEdit('tags')}><FiEdit3 /></button>}</div>
            {arr(p.skills).length ? <p className="jb-skills">{arr(p.skills).map((s) => <span key={s}>{s}</span>)}</p> : <p className="muted-sm">None listed.</p>}
            {arr(p.languages).length > 0 && <p className="muted-sm">Speaks {arr(p.languages).join(', ')}</p>}
            {Object.entries(social).some(([, v]) => v) && (
              <ul className="pf-links">
                {Object.entries(social).filter(([k, v]) => v && linkIcons[k] && /^https?:\/\//.test(v)).map(([k, v]) => { const I = linkIcons[k]; return <li key={k}><a href={v} target="_blank" rel="noopener noreferrer nofollow"><I aria-hidden="true" /> {v.replace(/^https?:\/\/(www\.)?/, '').slice(0, 36)}</a></li>; })}
              </ul>
            )}
          </section>

          {squads.length > 0 && (
            <section className="panel pf-side-block">
              <h2>Squads</h2>
              <ul className="pf-links">{squads.map((s) => <li key={s._id}><Link to={`/squads/${s._id}`}>{s.name}</Link> <small className="muted-sm">· {s.members} people</small></li>)}</ul>
            </section>
          )}

          <section className="panel pf-side-block">
            <h2>Contact</h2>
            {contactShared ? (
              <ul className="pf-links">
                {p.email && <li><FiMail aria-hidden="true" /> {own ? me.email : p.email}</li>}
                {(own ? p.phone : p.phone) && <li><FiPhone aria-hidden="true" /> {p.phone}</li>}
              </ul>
            ) : <p className="muted-sm"><FiLock aria-hidden="true" /> {p.name.split(' ')[0]} keeps contact details private{p.contactVisibility === 'nobody' ? '' : ` until you ${p.contactVisibility === 'connections' ? 'connect or sign a contract' : 'sign a contract'}`}. Use Messages.</p>}
            {own && <p className="muted-sm">Visible to: {VIS[p.contactVisibility || 'contracts']}.</p>}
          </section>

          {own && (
            <section className="panel pf-side-block">
              <h2>Profile review</h2>
              <p className="muted-sm">Specific fixes that help you win work here.</p>
              {isPremium
                ? <button type="button" className="btn btn-sm" onClick={review} disabled={busy === 'ai'}>{busy === 'ai' ? <span className="spinner" /> : <><FiZap /> Review my profile</>}</button>
                : <PremiumLock inline feature="AI profile review" />}
              {aiTips && <p className="pf-tips">{aiTips}</p>}
            </section>
          )}
        </aside>
      </div>

      {edit === 'basics' && <BasicsEditor p={p} onClose={() => setEdit(null)} onSave={(f) => save(f, 'Profile updated')} />}
      {edit === 'tags' && <TagsEditor p={p} onClose={() => setEdit(null)} onSave={(f) => save(f, 'Updated')} />}
      {edit && typeof edit === 'object' && <ItemEditor kind={edit.kind} item={edit.index !== null ? arr(p[edit.kind])[edit.index] : null} onClose={() => setEdit(null)} onSave={(item) => saveItem(edit.kind, edit.index, item)} />}
      {offer && <OfferModal person={p} onClose={() => setOffer(false)} />}
    </div>
  );
}
