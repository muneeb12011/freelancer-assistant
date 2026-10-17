// src/components/Footer.jsx — public footer with a working newsletter sign-up.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedinIn } from 'react-icons/fa';
import api, { errorMessage } from '../services/api';
import Logo from './Logo';
import '../styles/Footer.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ busy: false, msg: '', err: false });

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState({ busy: true, msg: '', err: false });
    try {
      const r = await api.post('/newsletter', { email: email.trim() });
      setState({ busy: false, msg: r.message || 'You’re on the list.', err: false });
      setEmail('');
    } catch (err) {
      setState({ busy: false, msg: errorMessage(err), err: true });
    }
  };

  return (
    <footer className="foot">
      <div className="foot-grid">
        <div className="foot-brand">
          <Logo size={26} />
          <p>The freelance marketplace that keeps the record. Made in Lahore.</p>
        </div>
        <nav className="foot-col" aria-label="Product">
          <strong>Product</strong>
          <Link to="/billing">Pricing</Link>
          <Link to="/register">Create account</Link>
          <Link to="/login">Sign in</Link>
        </nav>
        <nav className="foot-col" aria-label="Company">
          <strong>Company</strong>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <a href="mailto:aurelance454@gmail.com">aurelance454@gmail.com</a>
        </nav>
        <nav className="foot-col" aria-label="Legal">
          <strong>Legal</strong>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/refunds">Refunds</Link>
        </nav>
        <form className="foot-news" onSubmit={subscribe}>
          <label htmlFor="foot-email"><strong>Product updates</strong><span>One email when something ships. No spam.</span></label>
          <div className="foot-news-row">
            <input id="foot-email" className="input" type="email" placeholder="you@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" className="btn" disabled={state.busy}>{state.busy ? <span className="spinner" /> : 'Subscribe'}</button>
          </div>
          {state.msg && <p className={state.err ? 'foot-err' : 'foot-ok'} role="status">{state.msg}</p>}
        </form>
      </div>
      <div className="foot-base">
        <span>© {new Date().getFullYear()} Aurelance</span>
        <span className="foot-social">
          <a href="https://github.com/muneeb12011" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
          <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedinIn /></a>
        </span>
      </div>
    </footer>
  );
}
