// src/pages/Auth.jsx — PRODUCTION v2
// ─────────────────────────────────────────────────────────────
//  Features:
//   • Three.js animated background (gold icosahedra + particles)
//   • Login / Register / Forgot Password / Email Verification
//   • Google OAuth + GitHub OAuth (backend redirect flow)
//   • Email verification step after register
//   • Resend verification email
//   • Remember me (persists token in localStorage vs sessionStorage)
//   • Show/hide password toggle
//   • Client-side validation with inline errors
//   • Smooth tab slide animation
// ─────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as THREE from 'three';
import '../styles/Auth.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* ══════════════════════════════════════════════════════════
   THREE.JS BACKGROUND — runs once, cleans up on unmount
══════════════════════════════════════════════════════════ */
const useThreeScene = (mountRef) => {
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = window.innerWidth, H = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x08080a, 1);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 500);
    camera.position.set(0, 0, 35);
    scene.fog = new THREE.FogExp2(0x08080a, 0.012);

    const C = {
      bright: new THREE.Color('#e8c97a'),
      mid:    new THREE.Color('#c9a84c'),
      dim:    new THREE.Color('#7a5e1a'),
      faint:  new THREE.Color('#3d2e0c'),
    };

    const icoGeo = new THREE.IcosahedronGeometry(1, 1);
    const meshes = [];

    [
      { p: [-12,  4, -5],  s: 3.5, spd: 0.004,  c: C.mid    },
      { p: [ 13, -3,-10],  s: 5.0, spd: 0.0025, c: C.dim    },
      { p: [  1,  9,-20],  s: 7.0, spd: 0.0015, c: C.faint  },
      { p: [ -8, -8, -4],  s: 2.2, spd: 0.006,  c: C.bright },
      { p: [ 16,  7,-22],  s: 6.0, spd: 0.001,  c: C.dim    },
      { p: [  6,-12, -8],  s: 3.2, spd: 0.0035, c: C.mid    },
      { p: [-16,  1,-16],  s: 4.5, spd: 0.002,  c: C.bright },
      { p: [  3, 14,-25],  s: 8.0, spd: 0.001,  c: C.faint  },
      { p: [ -4, -3, -2],  s: 1.5, spd: 0.008,  c: C.bright },
      { p: [ 10,  5, -3],  s: 2.0, spd: 0.005,  c: C.mid    },
    ].forEach(cfg => {
      const wire = new THREE.Mesh(icoGeo,
        new THREE.MeshBasicMaterial({ color: cfg.c, wireframe: true }));
      wire.position.set(...cfg.p);
      wire.scale.setScalar(cfg.s);
      wire.userData = {
        spd: cfg.spd,
        axis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
        floatOffset: Math.random() * Math.PI * 2,
      };
      scene.add(wire);
      meshes.push(wire);

      const fill = new THREE.Mesh(icoGeo,
        new THREE.MeshBasicMaterial({ color: cfg.c, transparent: true, opacity: 0.025 }));
      fill.position.set(...cfg.p);
      fill.scale.setScalar(cfg.s * 0.99);
      scene.add(fill);
    });

    // Particles
    const COUNT = 2200;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r  = 40 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pos[i*3+2] = r * Math.cos(ph);
      const t = Math.random();
      col[i*3]   = 0.25 + t * 0.65;
      col[i*3+1] = 0.18 + t * 0.45;
      col[i*3+2] = 0.02 + t * 0.08;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: 0.28, vertexColors: true, transparent: true, opacity: 0.75, sizeAttenuation: true,
    }));
    scene.add(particles);

    // Constellation lines
    const linePts = [];
    for (let i = 0; i < 160; i++) {
      for (let j = i + 1; j < 160; j++) {
        const dx = pos[i*3]-pos[j*3], dy = pos[i*3+1]-pos[j*3+1], dz = pos[i*3+2]-pos[j*3+2];
        if (dx*dx + dy*dy + dz*dz < 400) linePts.push(pos[i*3],pos[i*3+1],pos[i*3+2],pos[j*3],pos[j*3+1],pos[j*3+2]);
      }
    }
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
    scene.add(new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({ color:0xc9a84c, transparent:true, opacity:0.07 })));

    // Rings
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(18, 0.05, 4, 120),
      new THREE.MeshBasicMaterial({ color:0xc9a84c, transparent:true, opacity:0.12 }));
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(26, 0.03, 4, 160),
      new THREE.MeshBasicMaterial({ color:0xe8c97a, transparent:true, opacity:0.05 }));
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y =  Math.PI / 6;
    scene.add(ring2);

    // Mouse parallax
    let mx = 0, my = 0;
    const onMouse = (e) => { mx = (e.clientX/window.innerWidth - 0.5)*2; my = (e.clientY/window.innerHeight - 0.5)*2; };
    window.addEventListener('mousemove', onMouse);

    const onResize = () => {
      const W2 = window.innerWidth, H2 = window.innerHeight;
      camera.aspect = W2/H2; camera.updateProjectionMatrix(); renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);

    let raf, t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate); t += 0.008;
      meshes.forEach(m => { m.rotateOnAxis(m.userData.axis, m.userData.spd); m.position.y += Math.sin(t + m.userData.floatOffset) * 0.004; });
      particles.rotation.y = t * 0.03;
      particles.rotation.x = Math.sin(t * 0.1) * 0.05;
      ring.rotation.z  += 0.0005;
      ring2.rotation.z -= 0.0003;
      ring2.rotation.y += 0.0004;
      camera.position.x += (mx * 4  - camera.position.x) * 0.035;
      camera.position.y += (-my * 3 - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);
};

/* ══════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════ */
const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const EyeIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const EyeOffIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const UserIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
const MailIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>;
const LockIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const CheckIcon= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const InfoIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const Auth = () => {
  const navigate               = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const mountRef               = useRef(null);

  // mode: 'login' | 'register' | 'forgot' | 'verify'
  const [mode,       setMode]       = useState('login');
  const [sliding,    setSliding]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [oauthBusy,  setOauthBusy]  = useState('');
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [remember,   setRemember]   = useState(true);
  const [resendCool, setResendCool] = useState(0); // countdown seconds

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    terms: false,
  });

  // Registered email — used for verification screen
  const [registeredEmail, setRegisteredEmail] = useState('');

  useThreeScene(mountRef);

  // Already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // OAuth callback — token in URL params
  useEffect(() => {
    const p   = new URLSearchParams(window.location.search);
    const tk  = p.get('token');
    const usr = p.get('user');
    const err = p.get('error');
    if (err) { setError(decodeURIComponent(err)); return; }
    if (tk && usr) {
      try {
        login({ token: tk, user: JSON.parse(decodeURIComponent(usr)), remember: true });
        navigate('/dashboard', { replace: true });
      } catch { setError('OAuth error — please try again.'); }
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCool <= 0) return;
    const t = setTimeout(() => setResendCool(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCool]);

  /* ── Form helpers ─────────────────────────────── */
  const change = (e) => {
    setError('');
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const switchMode = useCallback((m) => {
    if (m === mode || sliding) return;
    setSliding(true); setError(''); setSuccess('');
    setTimeout(() => {
      setMode(m);
      setForm({ name:'', email:'', password:'', confirmPassword:'', terms: false });
      setShowPass(false);
      setSliding(false);
    }, 200);
  }, [mode, sliding]);

  /* ── Validation ───────────────────────────────── */
  const validate = () => {
    if (!form.email.trim())               return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email address.';
    if (mode === 'forgot') return null;
    if (!form.password)                   return 'Password is required.';
    if (form.password.length < 6)         return 'Password must be at least 6 characters.';
    if (mode === 'register') {
      if (!form.name.trim())              return 'Full name is required.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
      if (!form.terms)                    return 'Please accept the terms to continue.';
    }
    return null;
  };

  /* ── Submit ───────────────────────────────────── */
  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(''); setSuccess('');

    try {
      if (mode === 'forgot') {
        // Forgot password — POST /api/auth/forgot-password
        const res  = await fetch(`${API}/auth/forgot-password`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Could not send reset email.'); setLoading(false); return; }
        setSuccess('✓ Reset link sent — check your inbox.');
        setLoading(false);
        return;
      }

      const endpoint = mode === 'login' ? 'login' : 'register';
      const body     = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res  = await fetch(`${API}/auth/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return; }

      if (mode === 'register') {
        // Show email verification screen
        setRegisteredEmail(form.email);
        setResendCool(60);
        // If backend returns token immediately (no email verify), log in
        if (data.token) {
          login({ token: data.token, user: data.user, remember });
          navigate('/dashboard', { replace: true });
        } else {
          switchMode('verify');
        }
      } else {
        login({ token: data.token, user: data.user, remember });
        navigate('/dashboard', { replace: true });
      }
    } catch {
      setError('Cannot reach the server. Is your backend running on port 5000?');
    }
    setLoading(false);
  };

  /* ── Resend verification email ────────────────── */
  const resendVerification = async () => {
    if (resendCool > 0) return;
    setLoading(true);
    try {
      await fetch(`${API}/auth/resend-verification`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      setSuccess('Verification email resent!');
      setResendCool(60);
    } catch { setError('Could not resend email.'); }
    setLoading(false);
  };

  /* ── OAuth ────────────────────────────────────── */
  const oauth = (provider) => {
    setOauthBusy(provider);
    window.location.href = `${API}/auth/${provider}`;
  };

  /* ── Password strength ────────────────────────── */
  const passStrength = (p) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = mode === 'register' ? passStrength(form.password) : 0;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength] || '';
  const strengthColor = ['', '#e05c5c', '#e8a030', '#4a90d9', '#4caf82', '#4caf82'][strength] || '';

  /* ─────────────────────────────────────────────── */
  return (
    <div className="auth-root">

      {/* Three.js canvas */}
      <div ref={mountRef} className="auth-three-mount" />
      <div className="auth-vignette" />

      {/* Brand */}
      <div className="auth-brand">
        <span className="auth-brand-star">✦</span>
        <span className="auth-brand-name">Aurelance</span>
      </div>

      {/* ── VERIFY EMAIL SCREEN ── */}
      {mode === 'verify' ? (
        <div className={`auth-card ${sliding ? 'auth-card-exit' : 'auth-card-enter'}`}>
          <div className="auth-shimmer" />
          <div className="auth-verify-icon">✉️</div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-sub" style={{ textAlign:'center', marginBottom: 20 }}>
            We sent a verification link to<br/>
            <strong style={{ color:'var(--auth-gold)' }}>{registeredEmail}</strong>
          </p>
          <div className="auth-verify-steps">
            <div className="auth-verify-step"><span>1</span> Open the email</div>
            <div className="auth-verify-step"><span>2</span> Click the verification link</div>
            <div className="auth-verify-step"><span>3</span> Come back and sign in</div>
          </div>
          {error   && <div className="auth-msg error">  <InfoIcon/>{error}</div>}
          {success && <div className="auth-msg success"><CheckIcon/>{success}</div>}
          <button className="auth-submit" onClick={() => switchMode('login')}>
            Go to Sign In
          </button>
          <p className="auth-switch">
            Didn't receive it?{' '}
            <button type="button" onClick={resendVerification} disabled={resendCool > 0 || loading}>
              {resendCool > 0 ? `Resend in ${resendCool}s` : 'Resend email'}
            </button>
          </p>
        </div>

      ) : mode === 'forgot' ? (

        /* ── FORGOT PASSWORD SCREEN ── */
        <div className={`auth-card ${sliding ? 'auth-card-exit' : 'auth-card-enter'}`}>
          <div className="auth-shimmer" />
          <button className="auth-back-btn" onClick={() => switchMode('login')} type="button">
            ← Back to sign in
          </button>
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-sub">Enter your email and we'll send a reset link.</p>
          <form onSubmit={submit} noValidate className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-inp-wrap">
                <MailIcon/>
                <input id="email" name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={change} autoComplete="email"/>
              </div>
            </div>
            {error   && <div className="auth-msg error">  <InfoIcon/>{error}</div>}
            {success && <div className="auth-msg success"><CheckIcon/>{success}</div>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="auth-spin"/> : 'Send Reset Link'}
            </button>
          </form>
        </div>

      ) : (

        /* ── LOGIN / REGISTER ── */
        <div className={`auth-card ${sliding ? 'auth-card-exit' : 'auth-card-enter'}`}>
          <div className="auth-shimmer" />

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab${mode==='login'   ?' active':''}`} onClick={() => switchMode('login')}    type="button">Sign In</button>
            <button className={`auth-tab${mode==='register'?' active':''}`} onClick={() => switchMode('register')} type="button">Register</button>
            <div className="auth-tab-ink" style={{ left: mode==='login' ? '4px' : 'calc(50% + 0px)' }}/>
          </div>

          {/* Heading */}
          <h1 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="auth-sub">
            {mode === 'login'
              ? 'Sign in to your Aurelance dashboard'
              : 'Start managing your freelance business for free'}
          </p>

          {/* OAuth buttons */}
          <div className="auth-oauth-row">
            <button className="auth-oauth-btn google" onClick={() => oauth('google')}
              disabled={!!oauthBusy || loading} type="button" title="Continue with Google">
              {oauthBusy==='google' ? <span className="auth-spin sm dark"/> : <GoogleIcon/>}
              <span>Google</span>
            </button>
            <button className="auth-oauth-btn github" onClick={() => oauth('github')}
              disabled={!!oauthBusy || loading} type="button" title="Continue with GitHub">
              {oauthBusy==='github' ? <span className="auth-spin sm light"/> : <GithubIcon/>}
              <span>GitHub</span>
            </button>
          </div>

          <div className="auth-divider">
            <span/><span className="auth-divider-txt">or continue with email</span><span/>
          </div>

          {/* Form */}
          <form onSubmit={submit} noValidate className="auth-form">

            {mode === 'register' && (
              <div className="auth-field">
                <label htmlFor="name">Full Name</label>
                <div className="auth-inp-wrap">
                  <UserIcon/>
                  <input id="name" name="name" type="text" placeholder="Your name"
                    value={form.name} onChange={change} autoComplete="name" autoFocus={mode==='register'}/>
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-inp-wrap">
                <MailIcon/>
                <input id="email" name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={change} autoComplete="email" autoFocus={mode==='login'}/>
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password">Password</label>
                {mode === 'login' && (
                  <button type="button" className="auth-forgot" onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="auth-inp-wrap">
                <LockIcon/>
                <input id="password" name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode==='login' ? 'Your password' : 'Min. 6 characters'}
                  value={form.password} onChange={change}
                  autoComplete={mode==='login' ? 'current-password' : 'new-password'}/>
                <button type="button" className="auth-eye" onClick={() => setShowPass(p=>!p)} tabIndex={-1}>
                  {showPass ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
              </div>
              {/* Password strength bar — register only */}
              {mode === 'register' && form.password && (
                <div className="auth-strength">
                  <div className="auth-strength-bars">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="auth-strength-bar"
                        style={{ background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)' }}/>
                    ))}
                  </div>
                  <span style={{ color: strengthColor, fontSize: 11 }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm password — register only */}
            {mode === 'register' && (
              <div className="auth-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="auth-inp-wrap">
                  <LockIcon/>
                  <input id="confirmPassword" name="confirmPassword"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.confirmPassword} onChange={change}
                    autoComplete="new-password"/>
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <span style={{ color:'#4caf82', display:'flex', marginRight:10 }}><CheckIcon/></span>
                  )}
                </div>
              </div>
            )}

            {/* Remember me — login only */}
            {mode === 'login' && (
              <label className="auth-checkbox-row">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>
                <span className="auth-checkbox-box">{remember && <CheckIcon/>}</span>
                <span>Remember me for 7 days</span>
              </label>
            )}

            {/* Terms — register only */}
            {mode === 'register' && (
              <label className="auth-checkbox-row">
                <input type="checkbox" name="terms" checked={form.terms} onChange={change}/>
                <span className="auth-checkbox-box">{form.terms && <CheckIcon/>}</span>
                <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></span>
              </label>
            )}

            {error   && <div className="auth-msg error">  <InfoIcon/>{error}</div>}
            {success && <div className="auth-msg success"><CheckIcon/>{success}</div>}

            <button type="submit" className="auth-submit" disabled={loading || !!oauthBusy}>
              {loading
                ? <span className="auth-spin"/>
                : mode === 'login' ? 'Sign In to Dashboard' : 'Create Free Account'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode==='login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Register free →' : '← Sign in'}
            </button>
          </p>

        </div>
      )}

      <p className="auth-footer-note">🔒 Secure · Private · No ads ever</p>
    </div>
  );
};

export default Auth;