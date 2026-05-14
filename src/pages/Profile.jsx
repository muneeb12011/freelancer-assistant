// src/pages/Profile.jsx — PRODUCTION v4
// ─────────────────────────────────────────────────────────────
//  DUAL MODE:
//   • OWN PROFILE  → full edit suite (sidebar + 4 tabs)
//   • OTHER USER   → read-only view with action panel
//                    (Connect · Chat · Collaborate · Refer · Favorite)
//
//  Usage:
//   Own:   <Profile />                    (uses AuthContext user)
//   Other: <Profile userId="abc123" />    (or via :userId route param)
//
//  LEFT SIDEBAR:
//   • Avatar upload (camera, base64, 3MB)
//   • Name · Title · Availability chip
//   • Hourly rate · Min project
//   • Profile completeness bar
//   • Share / copy link
//   • Contact info (email · phone · location)
//   • Social links (LinkedIn · GitHub · Twitter · Website)
//
//  RIGHT MAIN (tabbed):
//   Tab 1 — OVERVIEW   Bio · Skills · Languages · Services
//   Tab 2 — PORTFOLIO  Projects · Experience · Education
//   Tab 3 — REVIEWS    Testimonials + avg rating
//   Tab 4 — ACCOUNT    Password · Notifs · AI Optimizer · Danger
//
//  OTHER-USER PANEL additions:
//   • Connect / Connected toggle
//   • Chat button → opens inline slide-up chat
//   • Collaboration request modal
//   • Referral modal
//   • Favorite toggle
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiEdit3, FiSave, FiX, FiCamera, FiMail, FiPhone, FiMapPin,
  FiLinkedin, FiGithub, FiTwitter, FiGlobe, FiPlus, FiTrash2,
  FiExternalLink, FiZap, FiLock, FiStar, FiCheck, FiAlertCircle,
  FiDollarSign, FiCopy, FiEye, FiEyeOff, FiBriefcase,
  FiAward, FiBell, FiShield, FiUser, FiMessageSquare,
  FiUserPlus, FiUserCheck, FiShare2, FiSend, FiCode,
  FiChevronDown, FiChevronUp,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import '../styles/components.css';

// ── API ───────────────────────────────────────────────────────
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const tok  = () => localStorage.getItem('authToken');
const hdrs = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` });
const api  = {
  get:    url      => fetch(`${BASE}${url}`, { headers: hdrs() }).then(r => r.json()),
  patch:  (url, b) => fetch(`${BASE}${url}`, { method: 'PATCH',  headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  post:   (url, b) => fetch(`${BASE}${url}`, { method: 'POST',   headers: hdrs(), body: JSON.stringify(b) }).then(r => r.json()),
  delete: url      => fetch(`${BASE}${url}`, { method: 'DELETE', headers: hdrs() }).then(r => r.json()),
};

// ── Anthropic AI ─────────────────────────────────────────────
const askClaude = async (system, msg) => {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514', max_tokens: 900, system,
      messages: [{ role: 'user', content: msg }],
    }),
  });
  const d = await res.json();
  return d.content?.map(b => b.text || '').join('') || '';
};

// ── Helpers ───────────────────────────────────────────────────
const arr     = v  => Array.isArray(v) ? v : [];
const fmtDate = (s, e) => {
  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
  return e ? `${fmt(s)} – ${fmt(e)}` : `${fmt(s)} – Present`;
};

// ── Profile completeness ──────────────────────────────────────
const completeness = p => {
  if (!p) return 0;
  const checks = [
    !!p.name, !!p.bio?.trim(), !!p.hourlyRate, !!p.title,
    arr(p.skills).length >= 3, arr(p.projects).length >= 1,
    arr(p.services).length >= 1,
    !!(p.socialLinks?.linkedin || p.socialLinks?.github),
    !!p.phone, !!p.avatar,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

// ── Availability config ───────────────────────────────────────
const AVAIL = {
  available:   { label: 'Available for work', color: '#4caf82', bg: 'rgba(76,175,130,.12)' },
  busy:        { label: 'Busy',               color: '#e8a030', bg: 'rgba(232,160,48,.12)' },
  unavailable: { label: 'Not available',      color: '#e05c5c', bg: 'rgba(224,92,92,.12)'  },
};

// ── Stars ─────────────────────────────────────────────────────
const Stars = ({ rating = 0, size = 14 }) => (
  <span className="pf-stars">
    {[1,2,3,4,5].map(i => (
      <FiStar key={i} size={size}
        style={{ fill: i <= Math.round(rating) ? '#c9a84c' : 'none',
                 color: i <= Math.round(rating) ? '#c9a84c' : '#3a3835' }} />
    ))}
  </span>
);

// ── Blank form shapes ──────────────────────────────────────────
const blankProject = () => ({ title: '', description: '', url: '', tech: '' });
const blankService = () => ({ title: '', description: '', price: '' });
const blankExp     = () => ({ company: '', role: '', start: '', end: '', current: false, description: '' });
const blankEdu     = () => ({ institution: '', degree: '', year: '', description: '' });

// ─────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Profile({ userId: propUserId }) {
  const { user: authUser } = useAuth();
  const navigate  = useNavigate();
  const params    = useParams();
  const fileRef   = useRef(null);

  // Determine mode
  const targetId    = propUserId || params?.userId;
  const isOwnProfile = !targetId || targetId === authUser?._id;
  const isPremium   = authUser?.plan === 'premium';

  // ── Data ─────────────────────────────────────────────────
  const [profile,    setProfile]    = useState(null);
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [activeTab,  setActiveTab]  = useState('overview');

  // ── Toast ─────────────────────────────────────────────────
  const [toast, setToast] = useState({ show: false, msg: '', err: false });
  const showToast = useCallback((msg, err = false) => {
    setToast({ show: true, msg, err });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);

  // ── OWN: sidebar edit modes ───────────────────────────────
  const [editIdent,    setEditIdent]    = useState(false);
  const [editContact,  setEditContact]  = useState(false);
  const [editSocial,   setEditSocial]   = useState(false);
  const [draftIdent,   setDraftIdent]   = useState({});
  const [draftContact, setDraftContact] = useState({});
  const [draftSocial,  setDraftSocial]  = useState({});
  const [copied,       setCopied]       = useState(false);

  // ── OWN: overview edits ───────────────────────────────────
  const [editBio,        setEditBio]        = useState(false);
  const [draftBio,       setDraftBio]       = useState('');
  const [newSkill,       setNewSkill]       = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newLang,        setNewLang]        = useState('');
  const [showLangInput,  setShowLangInput]  = useState(false);

  // ── OWN: drawers ──────────────────────────────────────────
  const [projDrawer,    setProjDrawer]    = useState(false);
  const [serviceDrawer, setServiceDrawer] = useState(false);
  const [expDrawer,     setExpDrawer]     = useState(false);
  const [eduDrawer,     setEduDrawer]     = useState(false);
  const [deletingItem,  setDeletingItem]  = useState(null);

  const [editingProj,    setEditingProj]    = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingExp,     setEditingExp]     = useState(null);
  const [editingEdu,     setEditingEdu]     = useState(null);
  const [projForm,       setProjForm]       = useState(blankProject());
  const [serviceForm,    setServiceForm]    = useState(blankService());
  const [expForm,        setExpForm]        = useState(blankExp());
  const [eduForm,        setEduForm]        = useState(blankEdu());
  const [drawerSaving,   setDrawerSaving]   = useState(false);

  // ── OWN: password ─────────────────────────────────────────
  const [pwForm,   setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwShow,   setPwShow]   = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  // ── OWN: notifications ────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({ email: true, tasks: true, invoices: true, connections: false });

  // ── OWN: AI optimizer ────────────────────────────────────
  const [aiText, setAiText] = useState('');
  const [aiLoad, setAiLoad] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  // ── OTHER: connection/action state ────────────────────────
  const [isConnected,   setIsConnected]   = useState(false);
  const [connSent,      setConnSent]      = useState(false);
  const [isFav,         setIsFav]         = useState(false);
  const [showChat,      setShowChat]      = useState(false);
  const [chatMsgs,      setChatMsgs]      = useState([]);
  const [chatInput,     setChatInput]     = useState('');
  const [collabModal,   setCollabModal]   = useState(false);
  const [collabMsg,     setCollabMsg]     = useState('');
  const [collabProject, setCollabProject] = useState('');
  const [referralModal, setReferralModal] = useState(false);
  const [refMsg,        setRefMsg]        = useState('');
  const chatEndRef = useRef(null);

  // ── Load ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const endpoint = isOwnProfile ? '/profile' : `/profile/${targetId}`;
        const [pr, rr] = await Promise.allSettled([
          api.get(endpoint),
          api.get(isOwnProfile ? '/profile/reviews' : `/profile/${targetId}/reviews`),
        ]);
        if (pr.status === 'fulfilled') {
          const p = pr.value?.profile || pr.value || {};
          setProfile(p);
          if (isOwnProfile) {
            setDraftIdent({ name: p.name||'', title: p.title||'', hourlyRate: p.hourlyRate||'', minProject: p.minProject||'', availability: p.availability||'available' });
            setDraftContact({ email: p.email||'', phone: p.phone||'', location: p.location||'' });
            setDraftSocial(p.socialLinks || {});
            setDraftBio(p.bio || '');
            if (p.notifPrefs) setNotifPrefs(p.notifPrefs);
          } else {
            setIsConnected(pr.value?.isConnected || false);
            setConnSent(pr.value?.requestSent || false);
            setIsFav(pr.value?.isFavorite || false);
          }
        }
        if (rr.status === 'fulfilled') setReviews(arr(rr.value?.reviews || rr.value));
      } catch (e) {
        showToast('Failed to load profile.', true);
      }
      setLoading(false);
    })();
  }, [targetId, isOwnProfile]); // eslint-disable-line

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  // ── PATCH helper ─────────────────────────────────────────
  const patch = async (data, msg) => {
    setSaving(true);
    try {
      const r = await api.patch('/profile', data);
      setProfile(prev => ({ ...prev, ...(r.profile || r) }));
      showToast(msg || 'Saved.');
      return true;
    } catch { showToast('Save failed.', true); return false; }
    finally { setSaving(false); }
  };

  // ── Avatar ────────────────────────────────────────────────
  const onAvatarChange = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 3 * 1024 * 1024) { showToast('Max 3 MB.', true); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setProfile(p => ({ ...p, avatar: reader.result }));
      await patch({ avatar: reader.result }, 'Photo updated.');
    };
    reader.readAsDataURL(file);
  };

  // ── Sidebar saves ─────────────────────────────────────────
  const saveIdent   = async () => { const ok = await patch(draftIdent, 'Profile updated.'); if (ok) setEditIdent(false); };
  const saveContact = async () => { const ok = await patch(draftContact, 'Contact updated.'); if (ok) setEditContact(false); };
  const saveSocial  = async () => { const ok = await patch({ socialLinks: draftSocial }, 'Links updated.'); if (ok) setEditSocial(false); };
  const saveBio     = async () => { const ok = await patch({ bio: draftBio }, 'Bio updated.'); if (ok) setEditBio(false); };

  // ── Copy link ─────────────────────────────────────────────
  const copyLink = () => {
    const id = isOwnProfile ? (authUser?._id?.slice(-8) || 'me') : targetId?.slice(-8);
    navigator.clipboard.writeText(`${window.location.origin}/u/${id}`);
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };

  // ── Skills ────────────────────────────────────────────────
  const addSkill = async () => {
    const s = newSkill.trim(); if (!s) return;
    const curr = arr(profile?.skills);
    if (curr.some(x => x.toLowerCase() === s.toLowerCase())) { showToast('Already added.', true); return; }
    const updated = [...curr, s];
    setProfile(p => ({ ...p, skills: updated }));
    setNewSkill(''); setShowSkillInput(false);
    await patch({ skills: updated }, `"${s}" added.`);
  };
  const removeSkill = async s => {
    const updated = arr(profile?.skills).filter(x => x !== s);
    setProfile(p => ({ ...p, skills: updated }));
    await patch({ skills: updated });
  };

  // ── Languages ────────────────────────────────────────────
  const addLang = async () => {
    const l = newLang.trim(); if (!l) return;
    const updated = [...arr(profile?.languages), l];
    setProfile(p => ({ ...p, languages: updated }));
    setNewLang(''); setShowLangInput(false);
    await patch({ languages: updated }, `"${l}" added.`);
  };
  const removeLang = async l => {
    const updated = arr(profile?.languages).filter(x => x !== l);
    setProfile(p => ({ ...p, languages: updated }));
    await patch({ languages: updated });
  };

  // ── Generic list CRUD ─────────────────────────────────────
  const saveListItem = async (listKey, editingItem, form, setDrawer, setEditing, setForm, blank, successMsg) => {
    setDrawerSaving(true);
    const list = arr(profile?.[listKey]);
    const updated = editingItem
      ? list.map(x => (x._id || x.id) === (editingItem._id || editingItem.id) ? { ...x, ...form } : x)
      : [...list, { ...form, id: Date.now() }];
    setProfile(p => ({ ...p, [listKey]: updated }));
    setDrawer(false); setEditing(null); setForm(blank());
    await patch({ [listKey]: updated }, successMsg);
    setDrawerSaving(false);
  };
  const deleteListItem = async (listKey, item) => {
    const updated = arr(profile?.[listKey]).filter(x => (x._id || x.id) !== (item._id || item.id));
    setProfile(p => ({ ...p, [listKey]: updated }));
    setDeletingItem(null);
    await patch({ [listKey]: updated }, 'Deleted.');
  };

  // ── Open drawers ──────────────────────────────────────────
  const openProjDrawer = (proj = null) => {
    setEditingProj(proj);
    setProjForm(proj ? { title: proj.title||'', description: proj.description||'', url: proj.url||'', tech: arr(proj.tech).join(', ') } : blankProject());
    setProjDrawer(true);
  };
  const openServiceDrawer = (svc = null) => {
    setEditingService(svc);
    setServiceForm(svc ? { title: svc.title||'', description: svc.description||'', price: svc.price||'' } : blankService());
    setServiceDrawer(true);
  };
  const openExpDrawer = (exp = null) => {
    setEditingExp(exp); setExpForm(exp ? { ...exp } : blankExp()); setExpDrawer(true);
  };
  const openEduDrawer = (edu = null) => {
    setEditingEdu(edu); setEduForm(edu ? { ...edu } : blankEdu()); setEduDrawer(true);
  };

  // ── Save drawers ──────────────────────────────────────────
  const saveProjForm = e => {
    e.preventDefault();
    if (!projForm.title.trim()) { showToast('Title required.', true); return; }
    const tech = projForm.tech ? projForm.tech.split(',').map(t => t.trim()).filter(Boolean) : [];
    saveListItem('projects', editingProj, { ...projForm, tech }, setProjDrawer, setEditingProj, setProjForm, blankProject, editingProj ? 'Project updated.' : 'Project added.');
  };
  const saveServiceForm = e => {
    e.preventDefault();
    if (!serviceForm.title.trim()) { showToast('Title required.', true); return; }
    saveListItem('services', editingService, serviceForm, setServiceDrawer, setEditingService, setServiceForm, blankService, editingService ? 'Service updated.' : 'Service added.');
  };
  const saveExpForm = e => {
    e.preventDefault();
    if (!expForm.company.trim() || !expForm.role.trim()) { showToast('Company and role required.', true); return; }
    saveListItem('experience', editingExp, expForm, setExpDrawer, setEditingExp, setExpForm, blankExp, 'Experience saved.');
  };
  const saveEduForm = e => {
    e.preventDefault();
    if (!eduForm.institution.trim()) { showToast('Institution required.', true); return; }
    saveListItem('education', editingEdu, eduForm, setEduDrawer, setEditingEdu, setEduForm, blankEdu, 'Education saved.');
  };

  // ── Password ──────────────────────────────────────────────
  const changePassword = async e => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next) { showToast('Fill all fields.', true); return; }
    if (pwForm.next !== pwForm.confirm) { showToast('Passwords do not match.', true); return; }
    if (pwForm.next.length < 8) { showToast('Min 8 characters.', true); return; }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      showToast('Password changed successfully.');
    } catch { showToast('Incorrect current password.', true); }
    setPwSaving(false);
  };

  // ── Notification prefs ────────────────────────────────────
  const toggleNotif = async key => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await patch({ notifPrefs: updated });
  };

  // ── AI optimizer ──────────────────────────────────────────
  const runAI = async () => {
    setAiLoad(true);
    const ctx = 'You are a senior freelance career coach. Give 4–5 specific, actionable improvements for this freelancer profile using bullet points (•). Be direct and concrete. Max 200 words.';
    const msg = `Name: ${profile?.name}. Title: ${profile?.title||'none'}. Bio: "${profile?.bio||'none'}". Skills: ${arr(profile?.skills).join(', ')||'none'}. Services: ${arr(profile?.services).map(s=>s.title).join(', ')||'none'}. Projects: ${arr(profile?.projects).length}. Rate: ${profile?.hourlyRate?'$'+profile.hourlyRate+'/hr':'not set'}. Languages: ${arr(profile?.languages).join(', ')||'none'}. Experience: ${arr(profile?.experience).length}. Social: ${Object.entries(profile?.socialLinks||{}).filter(([,v])=>v).map(([k])=>k).join(', ')||'none'}.`;
    try {
      setAiText(await askClaude(ctx, msg)); setAiDone(true);
    } catch { showToast('AI request failed.', true); }
    setAiLoad(false);
  };

  // ── OTHER: connection actions ─────────────────────────────
  const handleConnect = async () => {
    try {
      if (connSent) {
        await api.delete(`/connections/request/cancel/${targetId}`);
        setConnSent(false); showToast('Request cancelled.');
      } else {
        await api.post('/connections/request', { userId: targetId });
        setConnSent(true); showToast(`Request sent to ${profile?.name}!`);
      }
    } catch { showToast('Action failed.', true); }
  };

  const handleToggleFav = async () => {
    try {
      if (isFav) {
        await api.delete(`/connections/favorites/${targetId}`);
        setIsFav(false); showToast('Removed from favorites.');
      } else {
        await api.post('/connections/favorites', { userId: targetId });
        setIsFav(true); showToast('Added to favorites ★');
      }
    } catch { showToast('Action failed.', true); }
  };

  const openChatWithUser = async () => {
    setShowChat(true);
    if (!chatMsgs.length) {
      try {
        const d = await api.get(`/connections/chat/${targetId}`);
        setChatMsgs(d?.messages || []);
      } catch { setChatMsgs([]); }
    }
  };

  const sendChatMsg = async () => {
    if (!chatInput.trim()) return;
    const txt = chatInput.trim(); setChatInput('');
    setChatMsgs(prev => [...prev, { isOwn: true, text: txt, createdAt: new Date().toISOString() }]);
    try { await api.post(`/connections/chat/${targetId}`, { message: txt }); }
    catch { showToast('Message failed.', true); }
  };

  const sendCollab = async () => {
    if (!collabMsg.trim()) return;
    try {
      await api.post('/connections/collab', { toUserId: targetId, message: collabMsg, skill: collabProject });
      showToast(`Collaboration request sent to ${profile?.name}!`);
      setCollabModal(false); setCollabMsg(''); setCollabProject('');
    } catch { showToast('Failed to send request.', true); }
  };

  const sendReferral = async () => {
    if (!refMsg.trim()) return;
    try {
      await api.post('/connections/referral', { toUserId: targetId, message: refMsg });
      showToast(`Referral sent to ${profile?.name}!`);
      setReferralModal(false); setRefMsg('');
    } catch { showToast('Failed to send referral.', true); }
  };

  // ── Computed ──────────────────────────────────────────────
  const score = profile ? completeness(profile) : 0;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;
  const avail = AVAIL[profile?.availability || 'available'];

  // ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="pf-root">
      <div className="pf-loading">
        <div className="pf-spinner"/>
        <span>Loading profile…</span>
      </div>
    </div>
  );
  if (!profile) return (
    <div className="pf-root">
      <div className="pf-loading">
        <FiAlertCircle size={26} style={{ color: '#e05c5c' }}/>
        <span>Failed to load profile.</span>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="pf-root">

      {/* Toast */}
      {toast.show && (
        <div className={`pf-toast${toast.err ? ' pf-toast-err' : ''}`}>
          {toast.err ? <FiAlertCircle size={13}/> : <FiCheck size={13}/>} {toast.msg}
        </div>
      )}

      <div className="pf-layout">

        {/* ╔═══════════════════════════════════
            SIDEBAR
        ═══════════════════════════════════╗ */}
        <aside className="pf-sidebar">

          {/* ── ID card ─────────────────────── */}
          <div className="pf-id-card">
            <div className="pf-avatar-wrap">
              <div className="pf-avatar">
                {profile.avatar
                  ? <img src={profile.avatar} alt={profile.name}/>
                  : <span className="pf-avatar-fb">{(profile.name || 'U')[0].toUpperCase()}</span>}
              </div>
              {isOwnProfile && (
                <>
                  <button className="pf-avatar-cam" onClick={() => fileRef.current?.click()} title="Change photo">
                    <FiCamera size={13}/>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange}/>
                </>
              )}
              {/* Online indicator for other-user view */}
              {!isOwnProfile && profile.online && <span className="pf-online-dot"/>}
            </div>

            {!editIdent ? (
              <div className="pf-id-info">
                <h1 className="pf-name">{profile.name || 'Freelancer'}</h1>
                {profile.title && <p className="pf-title-line">{profile.title}</p>}
                {profile.location && (
                  <p className="pf-location-line">
                    <FiMapPin size={11}/> {profile.location}
                  </p>
                )}
                <span className="pf-avail" style={{ color: avail.color, background: avail.bg }}>
                  <span className="pf-avail-dot" style={{ background: avail.color }}/>{avail.label}
                </span>
                {(profile.hourlyRate || profile.minProject) && (
                  <div className="pf-rates">
                    {profile.hourlyRate && <span><FiDollarSign size={11}/> ${profile.hourlyRate}/hr</span>}
                    {profile.minProject && <span>Min ${profile.minProject}</span>}
                  </div>
                )}
                {avgRating && (
                  <div className="pf-rating-row">
                    <Stars rating={avgRating}/>
                    <span>{avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
                  </div>
                )}
                {isOwnProfile && (
                  <button className="pf-id-edit-btn" onClick={() => {
                    setDraftIdent({ name: profile.name||'', title: profile.title||'', hourlyRate: profile.hourlyRate||'', minProject: profile.minProject||'', availability: profile.availability||'available' });
                    setEditIdent(true);
                  }}>
                    <FiEdit3 size={11}/> Edit Profile
                  </button>
                )}
              </div>
            ) : (
              /* Own profile edit form */
              <div className="pf-id-form">
                {[
                  ['name', 'Full Name', 'text', 'e.g. Muneeb Bhatti'],
                  ['title', 'Professional Title', 'text', 'e.g. Full-Stack Developer'],
                ].map(([k, l, t, ph]) => (
                  <div className="pf-field" key={k}>
                    <label>{l}</label>
                    <input type={t} value={draftIdent[k]||''} onChange={e => setDraftIdent(d => ({ ...d, [k]: e.target.value }))} placeholder={ph}/>
                  </div>
                ))}
                <div className="pf-field-row">
                  <div className="pf-field">
                    <label>Rate ($/hr)</label>
                    <input type="number" min="0" value={draftIdent.hourlyRate||''} onChange={e => setDraftIdent(d => ({ ...d, hourlyRate: e.target.value }))} placeholder="75"/>
                  </div>
                  <div className="pf-field">
                    <label>Min Project ($)</label>
                    <input type="number" min="0" value={draftIdent.minProject||''} onChange={e => setDraftIdent(d => ({ ...d, minProject: e.target.value }))} placeholder="500"/>
                  </div>
                </div>
                <div className="pf-field">
                  <label>Availability</label>
                  <select value={draftIdent.availability} onChange={e => setDraftIdent(d => ({ ...d, availability: e.target.value }))}>
                    <option value="available">Available for work</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Not available</option>
                  </select>
                </div>
                <div className="pf-row-btns">
                  <button className="pf-btn-cancel" onClick={() => setEditIdent(false)}>Cancel</button>
                  <button className="pf-btn-save" onClick={saveIdent} disabled={saving}>{saving ? '…' : 'Save'}</button>
                </div>
              </div>
            )}

            {/* Profile completeness (own only) */}
            {isOwnProfile && (
              <div className="pf-completeness">
                <div className="pf-comp-row">
                  <span>Profile strength</span>
                  <span style={{ color: score >= 80 ? '#4caf82' : score >= 50 ? '#e8a030' : '#e05c5c', fontWeight: 700 }}>{score}%</span>
                </div>
                <div className="pf-comp-track">
                  <div className="pf-comp-fill" style={{ width: `${score}%`, background: score >= 80 ? '#4caf82' : score >= 50 ? '#e8a030' : '#e05c5c' }}/>
                </div>
              </div>
            )}

            {/* Share/copy link */}
            <button className="pf-share-btn" onClick={copyLink}>
              {copied ? <><FiCheck size={12}/> Copied!</> : <><FiCopy size={12}/> {isOwnProfile ? 'Copy Profile Link' : 'Share Profile'}</>}
            </button>

            {/* OTHER USER: action buttons */}
            {!isOwnProfile && (
              <div className="pf-other-actions">
                {isConnected ? (
                  <button className="pf-action-btn pf-action-connected" onClick={() => openChatWithUser()}>
                    <FiMessageSquare size={14}/> Message
                  </button>
                ) : connSent ? (
                  <button className="pf-action-btn pf-action-sent" onClick={handleConnect}>
                    <FiCheck size={14}/> Request Sent
                  </button>
                ) : (
                  <button className="pf-action-btn pf-action-connect" onClick={handleConnect}>
                    <FiUserPlus size={14}/> Connect
                  </button>
                )}
                <button className={`pf-action-btn pf-action-fav${isFav ? ' active' : ''}`} onClick={handleToggleFav}>
                  {isFav ? '★' : '☆'} {isFav ? 'Favorited' : 'Favorite'}
                </button>
                <button className="pf-action-btn pf-action-collab" onClick={() => setCollabModal(true)}>
                  <FiCode size={14}/> Collaborate
                </button>
                <button className="pf-action-btn pf-action-refer" onClick={() => setReferralModal(true)}>
                  <FiShare2 size={14}/> Refer Client
                </button>
              </div>
            )}
          </div>

          {/* ── Contact ─────────────────────── */}
          <div className="pf-sidebar-card">
            <div className="pf-sc-hdr">
              <h3>Contact</h3>
              {isOwnProfile && (!editContact
                ? <button className="pf-sc-edit" onClick={() => { setDraftContact({ email: profile.email||'', phone: profile.phone||'', location: profile.location||'' }); setEditContact(true); }}><FiEdit3 size={11}/></button>
                : <div style={{ display: 'flex', gap: 6 }}>
                    <button className="pf-btn-cancel sm" onClick={() => setEditContact(false)}>✕</button>
                    <button className="pf-btn-save sm" onClick={saveContact} disabled={saving}><FiCheck size={11}/></button>
                  </div>)}
            </div>
            {!editContact ? (
              <div className="pf-contact-rows">
                {[
                  [FiMail,  'email',    profile.email],
                  [FiPhone, 'phone',    profile.phone],
                  [FiMapPin,'location', profile.location],
                ].map(([Icon, k, v]) => (
                  <div className="pf-contact-row" key={k}>
                    <Icon size={13} className="pf-ci"/>
                    {k === 'email' && v && !isOwnProfile
                      ? <a href={`mailto:${v}`} className="pf-contact-link">{v}</a>
                      : <span>{v || <em>Not set</em>}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="pf-form-stack">
                {[['email','Email','email'], ['phone','Phone','tel'], ['location','Location','text']].map(([k,l,t]) => (
                  <div className="pf-field" key={k}>
                    <label>{l}</label>
                    <input type={t} value={draftContact[k]||''} onChange={e => setDraftContact(d => ({ ...d, [k]: e.target.value }))}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Social ──────────────────────── */}
          <div className="pf-sidebar-card">
            <div className="pf-sc-hdr">
              <h3>Social Links</h3>
              {isOwnProfile && (!editSocial
                ? <button className="pf-sc-edit" onClick={() => { setDraftSocial({ ...(profile.socialLinks||{}) }); setEditSocial(true); }}><FiEdit3 size={11}/></button>
                : <div style={{ display: 'flex', gap: 6 }}>
                    <button className="pf-btn-cancel sm" onClick={() => setEditSocial(false)}>✕</button>
                    <button className="pf-btn-save sm" onClick={saveSocial} disabled={saving}><FiCheck size={11}/></button>
                  </div>)}
            </div>
            {!editSocial ? (
              <div className="pf-social-rows">
                {[
                  { k: 'linkedin', I: FiLinkedin, c: '#0a66c2', label: 'LinkedIn' },
                  { k: 'github',   I: FiGithub,   c: '#c4bfb6', label: 'GitHub'   },
                  { k: 'twitter',  I: FiTwitter,  c: '#1d9bf0', label: 'Twitter'  },
                  { k: 'website',  I: FiGlobe,    c: '#9b72e8', label: 'Website'  },
                ].map(({ k, I, c, label }) => {
                  const v = profile.socialLinks?.[k];
                  return (
                    <div className="pf-social-row" key={k}>
                      <span className="pf-social-icon" style={{ color: c, background: `${c}14` }}><I size={14}/></span>
                      {v
                        ? <a href={v} target="_blank" rel="noopener noreferrer" className="pf-social-link">
                            {v.replace(/^https?:\/\/(www\.)?/, '')}<FiExternalLink size={9}/>
                          </a>
                        : <span className="pf-social-empty">{label}</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="pf-form-stack">
                {[
                  { k: 'linkedin', ph: 'linkedin.com/in/yourname' },
                  { k: 'github',   ph: 'github.com/yourname'      },
                  { k: 'twitter',  ph: 'twitter.com/yourname'     },
                  { k: 'website',  ph: 'yourwebsite.com'          },
                ].map(({ k, ph }) => (
                  <div className="pf-field" key={k}>
                    <input value={draftSocial[k]||''} onChange={e => setDraftSocial(d => ({ ...d, [k]: e.target.value }))} placeholder={ph}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ╔═══════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════╗ */}
        <main className="pf-main">

          {/* Tabs */}
          <div className="pf-tabs">
            {[
              { id: 'overview',  label: 'Overview',  icon: <FiUser size={14}/> },
              { id: 'portfolio', label: 'Portfolio',  icon: <FiBriefcase size={14}/> },
              { id: 'reviews',   label: 'Reviews',   icon: <FiStar size={14}/>, badge: reviews.length },
              ...(isOwnProfile ? [{ id: 'account', label: 'Account', icon: <FiShield size={14}/> }] : []),
            ].map(t => (
              <button key={t.id} className={`pf-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
                {t.badge > 0 && <span className="pf-tab-badge">{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* ────────── OVERVIEW ────────── */}
          {activeTab === 'overview' && (
            <div className="pf-tab-body">

              {/* Bio */}
              <div className="pf-card">
                <div className="pf-card-hdr">
                  <h2>About</h2>
                  {isOwnProfile && (!editBio
                    ? <button className="pf-edit-btn" onClick={() => { setDraftBio(profile.bio||''); setEditBio(true); }}><FiEdit3 size={12}/> Edit</button>
                    : <div style={{ display: 'flex', gap: 8 }}>
                        <button className="pf-btn-cancel" onClick={() => setEditBio(false)}>Cancel</button>
                        <button className="pf-btn-save" onClick={saveBio} disabled={saving}>{saving ? '…' : 'Save'}</button>
                      </div>)}
                </div>
                {!editBio
                  ? (profile.bio
                      ? <p className="pf-bio">{profile.bio}</p>
                      : <p className="pf-empty-hint" onClick={isOwnProfile ? () => { setDraftBio(''); setEditBio(true); } : undefined}>
                          {isOwnProfile ? '+ Add a bio to tell clients about your background and expertise.' : 'No bio provided.'}
                        </p>)
                  : <textarea className="pf-textarea" rows={6} value={draftBio} autoFocus
                      onChange={e => setDraftBio(e.target.value)}
                      placeholder="Tell clients about your background, expertise, and what makes you stand out…"/>}
              </div>

              {/* Skills */}
              <div className="pf-card">
                <div className="pf-card-hdr">
                  <h2>Skills</h2>
                  {isOwnProfile && <button className="pf-edit-btn" onClick={() => setShowSkillInput(true)}><FiPlus size={12}/> Add</button>}
                </div>
                <div className="pf-chips">
                  {arr(profile.skills).map((s, i) => (
                    <span className="pf-chip" key={i}>
                      {s}
                      {isOwnProfile && <button onClick={() => removeSkill(s)}><FiX size={10}/></button>}
                    </span>
                  ))}
                  {isOwnProfile && showSkillInput && (
                    <div className="pf-chip-input-row">
                      <input autoFocus className="pf-chip-input" value={newSkill}
                        onChange={e => setNewSkill(e.target.value)} placeholder="Add skill…"
                        onKeyDown={e => { if (e.key==='Enter') addSkill(); if (e.key==='Escape') { setShowSkillInput(false); setNewSkill(''); } }}/>
                      <button className="pf-btn-save sm" onClick={addSkill}><FiCheck size={11}/></button>
                      <button className="pf-btn-cancel sm" onClick={() => { setShowSkillInput(false); setNewSkill(''); }}><FiX size={11}/></button>
                    </div>
                  )}
                  {!arr(profile.skills).length && !showSkillInput && (
                    <span className="pf-empty-hint">{isOwnProfile ? 'No skills yet — add your top skills.' : 'No skills listed.'}</span>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div className="pf-card">
                <div className="pf-card-hdr">
                  <h2>Languages</h2>
                  {isOwnProfile && <button className="pf-edit-btn" onClick={() => setShowLangInput(true)}><FiPlus size={12}/> Add</button>}
                </div>
                <div className="pf-chips">
                  {arr(profile.languages).map((l, i) => (
                    <span className="pf-chip lang" key={i}>
                      {l}
                      {isOwnProfile && <button onClick={() => removeLang(l)}><FiX size={10}/></button>}
                    </span>
                  ))}
                  {isOwnProfile && showLangInput && (
                    <div className="pf-chip-input-row">
                      <input autoFocus className="pf-chip-input" value={newLang}
                        onChange={e => setNewLang(e.target.value)} placeholder="e.g. English (Fluent)"
                        onKeyDown={e => { if (e.key==='Enter') addLang(); if (e.key==='Escape') { setShowLangInput(false); setNewLang(''); } }}/>
                      <button className="pf-btn-save sm" onClick={addLang}><FiCheck size={11}/></button>
                      <button className="pf-btn-cancel sm" onClick={() => { setShowLangInput(false); setNewLang(''); }}><FiX size={11}/></button>
                    </div>
                  )}
                  {!arr(profile.languages).length && !showLangInput && (
                    <span className="pf-empty-hint">{isOwnProfile ? 'No languages yet — add your working languages.' : 'No languages listed.'}</span>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="pf-card">
                <div className="pf-card-hdr">
                  <h2>Services Offered</h2>
                  {isOwnProfile && <button className="pf-edit-btn" onClick={() => openServiceDrawer()}><FiPlus size={12}/> Add Service</button>}
                </div>
                {!arr(profile.services).length
                  ? <p className="pf-empty-hint">{isOwnProfile ? 'No services yet — define what you offer.' : 'No services listed.'}</p>
                  : <div className="pf-services-grid">
                      {arr(profile.services).map((svc, i) => (
                        <div className="pf-service-card" key={svc._id||svc.id||i}>
                          <div className="pf-svc-top">
                            <span className="pf-svc-title">{svc.title}</span>
                            {svc.price && <span className="pf-svc-price">{svc.price.startsWith('$') ? '' : '$'}{svc.price}</span>}
                          </div>
                          {svc.description && <p className="pf-svc-desc">{svc.description}</p>}
                          {isOwnProfile && (
                            <div className="pf-svc-actions">
                              <button onClick={() => openServiceDrawer(svc)}><FiEdit3 size={12}/></button>
                              <button onClick={() => setDeletingItem({ type: 'services', item: svc })}><FiTrash2 size={12}/></button>
                            </div>
                          )}
                          {/* Other user: hire button */}
                          {!isOwnProfile && (
                            <button className="pf-svc-hire-btn" onClick={() => setCollabModal(true)}>
                              Hire for this →
                            </button>
                          )}
                        </div>
                      ))}
                    </div>}
              </div>
            </div>
          )}

          {/* ────────── PORTFOLIO ────────── */}
          {activeTab === 'portfolio' && (
            <div className="pf-tab-body">

              {/* Projects */}
              <div className="pf-card">
                <div className="pf-card-hdr">
                  <h2>Projects</h2>
                  {isOwnProfile && <button className="pf-edit-btn" onClick={() => openProjDrawer()}><FiPlus size={12}/> Add Project</button>}
                </div>
                {!arr(profile.projects).length
                  ? <p className="pf-empty-hint">{isOwnProfile ? 'No projects yet — showcase your best work.' : 'No projects yet.'}</p>
                  : <div className="pf-projects-grid">
                      {arr(profile.projects).map((proj, i) => (
                        <div className="pf-project-card" key={proj._id||proj.id||i}>
                          <div className="pf-proj-body">
                            <div className="pf-proj-name">{proj.title}</div>
                            <p className="pf-proj-desc">{proj.description}</p>
                            {arr(proj.tech).length > 0 && (
                              <div className="pf-proj-tags">
                                {arr(proj.tech).map((t, j) => <span key={j}>{t}</span>)}
                              </div>
                            )}
                          </div>
                          <div className="pf-proj-foot">
                            {proj.url && (
                              <a href={proj.url} target="_blank" rel="noopener noreferrer" className="pf-proj-link">
                                <FiExternalLink size={11}/> View Project
                              </a>
                            )}
                            {isOwnProfile && (
                              <div className="pf-proj-btns">
                                <button onClick={() => openProjDrawer(proj)}><FiEdit3 size={12}/></button>
                                <button onClick={() => setDeletingItem({ type: 'projects', item: proj })}><FiTrash2 size={12}/></button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>}
              </div>

              {/* Experience */}
              <div className="pf-card">
                <div className="pf-card-hdr">
                  <h2>Work Experience</h2>
                  {isOwnProfile && <button className="pf-edit-btn" onClick={() => openExpDrawer()}><FiPlus size={12}/> Add</button>}
                </div>
                {!arr(profile.experience).length
                  ? <p className="pf-empty-hint">{isOwnProfile ? 'No experience entries yet.' : 'No experience listed.'}</p>
                  : <div className="pf-timeline">
                      {arr(profile.experience).map((exp, i) => (
                        <div className="pf-timeline-item" key={exp._id||exp.id||i}>
                          <div className="pf-tl-dot"/>
                          <div className="pf-tl-body">
                            <div className="pf-tl-top">
                              <div>
                                <span className="pf-tl-role">{exp.role}</span>
                                <span className="pf-tl-company">{exp.company}</span>
                                <span className="pf-tl-dates">{fmtDate(exp.start, exp.current ? null : exp.end)}</span>
                              </div>
                              {isOwnProfile && (
                                <div className="pf-tl-btns">
                                  <button onClick={() => openExpDrawer(exp)}><FiEdit3 size={11}/></button>
                                  <button onClick={() => setDeletingItem({ type: 'experience', item: exp })}><FiTrash2 size={11}/></button>
                                </div>
                              )}
                            </div>
                            {exp.description && <p className="pf-tl-desc">{exp.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>}
              </div>

              {/* Education */}
              <div className="pf-card">
                <div className="pf-card-hdr">
                  <h2>Education &amp; Certifications</h2>
                  {isOwnProfile && <button className="pf-edit-btn" onClick={() => openEduDrawer()}><FiPlus size={12}/> Add</button>}
                </div>
                {!arr(profile.education).length
                  ? <p className="pf-empty-hint">{isOwnProfile ? 'No education or certifications yet.' : 'No education listed.'}</p>
                  : <div className="pf-edu-list">
                      {arr(profile.education).map((edu, i) => (
                        <div className="pf-edu-row" key={edu._id||edu.id||i}>
                          <span className="pf-edu-icon"><FiAward size={15}/></span>
                          <div className="pf-edu-body">
                            <span className="pf-edu-degree">{edu.degree || edu.institution}</span>
                            {edu.degree && <span className="pf-edu-inst">{edu.institution}</span>}
                            {edu.year && <span className="pf-edu-year">{edu.year}</span>}
                            {edu.description && <p className="pf-edu-desc">{edu.description}</p>}
                          </div>
                          {isOwnProfile && (
                            <div className="pf-edu-btns">
                              <button onClick={() => openEduDrawer(edu)}><FiEdit3 size={11}/></button>
                              <button onClick={() => setDeletingItem({ type: 'education', item: edu })}><FiTrash2 size={11}/></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>}
              </div>
            </div>
          )}

          {/* ────────── REVIEWS ────────── */}
          {activeTab === 'reviews' && (
            <div className="pf-tab-body">
              <div className="pf-card">
                <div className="pf-card-hdr">
                  <h2>Client Reviews</h2>
                  {avgRating && (
                    <span className="pf-avg-rating">
                      <Stars rating={avgRating} size={16}/> <strong>{avgRating}</strong> / 5
                    </span>
                  )}
                </div>
                {!reviews.length ? (
                  <div className="pf-reviews-empty">
                    <FiStar size={32} style={{ color: '#3a3835', marginBottom: 10 }}/>
                    <strong>No reviews yet</strong>
                    <p>Reviews will appear here once clients leave feedback on completed projects.</p>
                  </div>
                ) : (
                  <div className="pf-reviews-list">
                    {reviews.map((rev, i) => (
                      <div className="pf-review-card" key={rev._id||i}>
                        <div className="pf-rev-top">
                          <div className="pf-rev-avatar">{(rev.clientName||'C')[0].toUpperCase()}</div>
                          <div className="pf-rev-meta">
                            <span className="pf-rev-name">{rev.clientName || 'Anonymous Client'}</span>
                            <Stars rating={rev.rating}/>
                          </div>
                          {rev.createdAt && (
                            <span className="pf-rev-date">
                              {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {rev.comment && <p className="pf-rev-text">"{rev.comment}"</p>}
                        {rev.project && <span className="pf-rev-proj">{rev.project}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ────────── ACCOUNT (own only) ────────── */}
          {activeTab === 'account' && isOwnProfile && (
            <div className="pf-tab-body">

              {/* Password */}
              <div className="pf-card">
                <div className="pf-card-hdr"><h2>Change Password</h2></div>
                <form className="pf-pw-form" onSubmit={changePassword}>
                  {[
                    ['current', 'Current Password'],
                    ['next',    'New Password'],
                    ['confirm', 'Confirm New Password'],
                  ].map(([k, l]) => (
                    <div className="pf-field pf-pw-field" key={k}>
                      <label>{l}</label>
                      <div className="pf-pw-wrap">
                        <input type={pwShow[k] ? 'text' : 'password'} value={pwForm[k]}
                          onChange={e => setPwForm(f => ({ ...f, [k]: e.target.value }))} required
                          placeholder={k === 'current' ? 'Your current password' : 'Min 8 characters'}/>
                        <button type="button" className="pf-pw-eye" onClick={() => setPwShow(s => ({ ...s, [k]: !s[k] }))}>
                          {pwShow[k] ? <FiEyeOff size={14}/> : <FiEye size={14}/>}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="submit" className="pf-btn-save" disabled={pwSaving} style={{ marginTop: 8 }}>
                    {pwSaving ? 'Changing…' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Notifications */}
              <div className="pf-card">
                <div className="pf-card-hdr"><h2>Notification Preferences</h2></div>
                <div className="pf-notif-list">
                  {[
                    ['email',       'Email notifications',  'Receive weekly digest and important alerts'],
                    ['tasks',       'Task reminders',       'Get notified when tasks are due soon'],
                    ['invoices',    'Invoice alerts',       'Alerts for overdue invoices and payments'],
                    ['connections', 'Connection requests',  'When someone wants to connect with you'],
                  ].map(([k, title, desc]) => (
                    <div className="pf-notif-row" key={k}>
                      <div>
                        <span className="pf-notif-title">{title}</span>
                        <span className="pf-notif-desc">{desc}</span>
                      </div>
                      <button className={`pf-toggle${notifPrefs[k] ? ' on' : ''}`} onClick={() => toggleNotif(k)}>
                        <span className="pf-toggle-thumb"/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI optimizer */}
              <div className="pf-card pf-ai-card">
                <div className="pf-card-hdr">
                  <h2><FiZap size={14} style={{ marginRight: 7, color: '#38bdf8' }}/> AI Profile Optimizer</h2>
                  <span className={`pf-badge-chip ${isPremium ? 'teal' : 'locked'}`}>{isPremium ? '✦ Premium' : '✦ Locked'}</span>
                </div>
                {!isPremium ? (
                  <div className="pf-ai-lock">
                    <FiLock size={18}/>
                    <div>
                      <strong>Premium feature</strong>
                      <p>Get personalised AI analysis of your profile with actionable improvements to attract better clients.</p>
                    </div>
                    <button className="pf-upgrade-btn" onClick={() => navigate('/settings')}>Upgrade →</button>
                  </div>
                ) : !aiDone && !aiLoad ? (
                  <div className="pf-ai-idle">
                    <p>AI analyses your full profile — bio, skills, services, projects, rate — and gives you concrete improvements.</p>
                    <button className="pf-ai-run-btn" onClick={runAI}><FiZap size={13}/> Analyse Profile</button>
                  </div>
                ) : aiLoad ? (
                  <div className="pf-ai-loading">
                    <div className="pf-spinner" style={{ width: 18, height: 18 }}/>
                    <span>Analysing…</span>
                  </div>
                ) : (
                  <div className="pf-ai-result">
                    {aiText.split('\n').filter(Boolean).map((line, i) => (
                      <p key={i} className={/^[•\-]/.test(line.trim()) ? 'pf-ai-bullet' : 'pf-ai-line'}>{line}</p>
                    ))}
                    <button className="pf-ai-regen" onClick={() => { setAiDone(false); setAiText(''); }}>Re-analyse</button>
                  </div>
                )}
              </div>

              {/* Danger zone */}
              <div className="pf-card pf-danger-card">
                <div className="pf-card-hdr"><h2>Danger Zone</h2></div>
                <p className="pf-danger-txt">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button className="pf-danger-btn" onClick={() => navigate('/settings?tab=danger')}>Delete Account</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── SLIDE-UP CHAT (other user) ──────────────────────── */}
      {!isOwnProfile && showChat && (
        <div className="pf-chat-panel">
          <div className="pf-chat-head">
            <div className="pf-chat-avatar">{(profile.name||'?')[0].toUpperCase()}</div>
            <div className="pf-chat-head-info">
              <div className="pf-chat-name">{profile.name}</div>
              <div className="pf-chat-sub">{profile.title || 'Freelancer'}</div>
            </div>
            <button className="pf-chat-close" onClick={() => setShowChat(false)}><FiX size={15}/></button>
          </div>
          <div className="pf-chat-msgs">
            {!chatMsgs.length && (
              <div className="pf-chat-empty">
                <FiMessageSquare size={24}/>
                <span>No messages yet. Say hello!</span>
              </div>
            )}
            {chatMsgs.map((m, i) => (
              <div key={i} className={`pf-cmsg${m.isOwn || m.sender === 'me' ? ' own' : ''}`}>
                <p>{m.text || m.message}</p>
                <small>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <div className="pf-chat-input-row">
            <input type="text" placeholder={`Message ${profile.name}…`}
              value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendChatMsg(); }}/>
            <button className="pf-chat-send-btn" onClick={sendChatMsg} disabled={!chatInput.trim()}>
              <FiSend size={14}/>
            </button>
          </div>
        </div>
      )}

      {/* ── COLLABORATION MODAL ────────────────────────────── */}
      {collabModal && (
        <div className="pf-modal-overlay" onClick={e => e.target === e.currentTarget && setCollabModal(false)}>
          <div className="pf-modal">
            <div className="pf-modal-hdr">
              <h3>Collaborate with {profile.name}</h3>
              <button onClick={() => setCollabModal(false)}><FiX size={14}/></button>
            </div>
            <div className="pf-modal-body-content">
              <p style={{ fontSize: 13, color: 'var(--pf-text-muted)', marginBottom: 14 }}>
                Invite {profile.name} to collaborate on a project or hire them for a service.
              </p>
              <div className="pf-field">
                <label>Project / Service needed</label>
                <input type="text" value={collabProject} onChange={e => setCollabProject(e.target.value)}
                  placeholder="e.g. Figma design, React frontend, API integration…"/>
              </div>
              <div className="pf-field">
                <label>Message</label>
                <textarea rows={4} value={collabMsg} onChange={e => setCollabMsg(e.target.value)}
                  placeholder="Describe the project, timeline, and what you need help with…"
                  className="pf-textarea"/>
              </div>
            </div>
            <div className="pf-modal-footer">
              <button className="pf-btn-cancel" onClick={() => setCollabModal(false)}>Cancel</button>
              <button className="pf-btn-save" onClick={sendCollab} disabled={!collabMsg.trim()}>
                <FiSend size={12}/> Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REFERRAL MODAL ───────────────────────────────────── */}
      {referralModal && (
        <div className="pf-modal-overlay" onClick={e => e.target === e.currentTarget && setReferralModal(false)}>
          <div className="pf-modal">
            <div className="pf-modal-hdr">
              <h3>Refer a Client to {profile.name}</h3>
              <button onClick={() => setReferralModal(false)}><FiX size={14}/></button>
            </div>
            <div className="pf-modal-body-content">
              <p style={{ fontSize: 13, color: 'var(--pf-text-muted)', marginBottom: 14 }}>
                Send {profile.name} a referral for a client or project opportunity.
              </p>
              <div className="pf-field">
                <label>Referral Message</label>
                <textarea rows={4} value={refMsg} onChange={e => setRefMsg(e.target.value)}
                  placeholder="E.g. Client needs a React dev for 3-month project, ~$4k budget. You would be a great fit!"
                  className="pf-textarea"/>
              </div>
            </div>
            <div className="pf-modal-footer">
              <button className="pf-btn-cancel" onClick={() => setReferralModal(false)}>Cancel</button>
              <button className="pf-btn-save" onClick={sendReferral} disabled={!refMsg.trim()}>
                <FiShare2 size={12}/> Send Referral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OWN: DRAWERS ──────────────────────────────────── */}

      {/* Project drawer */}
      {projDrawer && (
        <div className="pf-drawer-overlay" onClick={e => e.target === e.currentTarget && setProjDrawer(false)}>
          <div className="pf-drawer">
            <div className="pf-drawer-hdr">
              <h3>{editingProj ? 'Edit Project' : 'Add Project'}</h3>
              <button onClick={() => setProjDrawer(false)}><FiX size={15}/></button>
            </div>
            <form className="pf-drawer-body" onSubmit={saveProjForm}>
              <div className="pf-field"><label>Title *</label><input autoFocus value={projForm.title} onChange={e => setProjForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. E-commerce Platform" required/></div>
              <div className="pf-field"><label>Description</label><textarea rows={4} value={projForm.description} onChange={e => setProjForm(f => ({ ...f, description: e.target.value }))} placeholder="What you built, technologies used, and impact."/></div>
              <div className="pf-field"><label>Project URL</label><input value={projForm.url} onChange={e => setProjForm(f => ({ ...f, url: e.target.value }))} placeholder="https://yourproject.com" type="url"/></div>
              <div className="pf-field"><label>Tech Stack (comma-separated)</label><input value={projForm.tech} onChange={e => setProjForm(f => ({ ...f, tech: e.target.value }))} placeholder="React, Node.js, MongoDB"/></div>
              <div className="pf-drawer-footer">
                <button type="button" className="pf-btn-cancel" onClick={() => setProjDrawer(false)}>Cancel</button>
                <button type="submit" className="pf-btn-save" disabled={drawerSaving}>{drawerSaving ? '…' : editingProj ? 'Save Changes' : 'Add Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service drawer */}
      {serviceDrawer && (
        <div className="pf-drawer-overlay" onClick={e => e.target === e.currentTarget && setServiceDrawer(false)}>
          <div className="pf-drawer">
            <div className="pf-drawer-hdr">
              <h3>{editingService ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setServiceDrawer(false)}><FiX size={15}/></button>
            </div>
            <form className="pf-drawer-body" onSubmit={saveServiceForm}>
              <div className="pf-field"><label>Service Title *</label><input autoFocus value={serviceForm.title} onChange={e => setServiceForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Full-Stack Web App Development" required/></div>
              <div className="pf-field"><label>Description</label><textarea rows={3} value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))} placeholder="What's included…"/></div>
              <div className="pf-field"><label>Price / Rate</label><input value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))} placeholder="e.g. $500 fixed, or $75/hr"/></div>
              <div className="pf-drawer-footer">
                <button type="button" className="pf-btn-cancel" onClick={() => setServiceDrawer(false)}>Cancel</button>
                <button type="submit" className="pf-btn-save" disabled={drawerSaving}>{drawerSaving ? '…' : editingService ? 'Save Changes' : 'Add Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Experience drawer */}
      {expDrawer && (
        <div className="pf-drawer-overlay" onClick={e => e.target === e.currentTarget && setExpDrawer(false)}>
          <div className="pf-drawer">
            <div className="pf-drawer-hdr">
              <h3>{editingExp ? 'Edit Experience' : 'Add Experience'}</h3>
              <button onClick={() => setExpDrawer(false)}><FiX size={15}/></button>
            </div>
            <form className="pf-drawer-body" onSubmit={saveExpForm}>
              <div className="pf-field-row">
                <div className="pf-field"><label>Role / Title *</label><input autoFocus value={expForm.role} onChange={e => setExpForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Senior Developer" required/></div>
                <div className="pf-field"><label>Company *</label><input value={expForm.company} onChange={e => setExpForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" required/></div>
              </div>
              <div className="pf-field-row">
                <div className="pf-field"><label>Start Date</label><input type="month" value={expForm.start} onChange={e => setExpForm(f => ({ ...f, start: e.target.value }))}/></div>
                <div className="pf-field"><label>End Date</label><input type="month" value={expForm.end} onChange={e => setExpForm(f => ({ ...f, end: e.target.value }))} disabled={expForm.current}/></div>
              </div>
              <div className="pf-field pf-checkbox-field">
                <label><input type="checkbox" checked={!!expForm.current} onChange={e => setExpForm(f => ({ ...f, current: e.target.checked, end: '' }))}/> Currently working here</label>
              </div>
              <div className="pf-field"><label>Description</label><textarea rows={3} value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} placeholder="Key responsibilities and achievements…"/></div>
              <div className="pf-drawer-footer">
                <button type="button" className="pf-btn-cancel" onClick={() => setExpDrawer(false)}>Cancel</button>
                <button type="submit" className="pf-btn-save" disabled={drawerSaving}>{drawerSaving ? '…' : editingExp ? 'Save Changes' : 'Add Experience'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Education drawer */}
      {eduDrawer && (
        <div className="pf-drawer-overlay" onClick={e => e.target === e.currentTarget && setEduDrawer(false)}>
          <div className="pf-drawer">
            <div className="pf-drawer-hdr">
              <h3>{editingEdu ? 'Edit Education' : 'Add Education / Certification'}</h3>
              <button onClick={() => setEduDrawer(false)}><FiX size={15}/></button>
            </div>
            <form className="pf-drawer-body" onSubmit={saveEduForm}>
              <div className="pf-field"><label>Institution / Issuer *</label><input autoFocus value={eduForm.institution} onChange={e => setEduForm(f => ({ ...f, institution: e.target.value }))} placeholder="e.g. MIT, Coursera, Google" required/></div>
              <div className="pf-field"><label>Degree / Certification</label><input value={eduForm.degree} onChange={e => setEduForm(f => ({ ...f, degree: e.target.value }))} placeholder="e.g. B.Sc Computer Science, AWS Certified"/></div>
              <div className="pf-field"><label>Year</label><input type="number" min="1990" max="2030" value={eduForm.year} onChange={e => setEduForm(f => ({ ...f, year: e.target.value }))} placeholder="2024"/></div>
              <div className="pf-field"><label>Description</label><textarea rows={2} value={eduForm.description} onChange={e => setEduForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief notes…"/></div>
              <div className="pf-drawer-footer">
                <button type="button" className="pf-btn-cancel" onClick={() => setEduDrawer(false)}>Cancel</button>
                <button type="submit" className="pf-btn-save" disabled={drawerSaving}>{drawerSaving ? '…' : editingEdu ? 'Save Changes' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deletingItem && (
        <div className="pf-modal-overlay" onClick={e => e.target === e.currentTarget && setDeletingItem(null)}>
          <div className="pf-modal">
            <div className="pf-modal-hdr">
              <h3>Delete</h3>
              <button onClick={() => setDeletingItem(null)}><FiX size={14}/></button>
            </div>
            <p className="pf-modal-body">
              Delete <strong>{deletingItem.item.title||deletingItem.item.role||deletingItem.item.institution||'this item'}</strong>? This cannot be undone.
            </p>
            <div className="pf-modal-footer">
              <button className="pf-btn-cancel" onClick={() => setDeletingItem(null)}>Cancel</button>
              <button className="pf-btn-delete" onClick={() => deleteListItem(deletingItem.type, deletingItem.item)}>
                <FiTrash2 size={12}/> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}