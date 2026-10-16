// src/components/PublicLayout.jsx — header + footer for public pages (landing, about, contact, legal, pricing).
import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import Footer from './Footer';
import ErrorBoundary from './ErrorBoundary';
import '../styles/Public.css';

const LINKS = [
  { to: '/about', label: 'About' },
  { to: '/billing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];

export default function PublicLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="pub">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="pub-head">
        <Link to="/" className="pub-brand" aria-label="Aurelance home"><Logo size={28} /></Link>
        <nav className={`pub-nav${open ? ' is-open' : ''}`} aria-label="Site">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} className="pub-link">{l.label}</NavLink>)}
          <span className="pub-nav-sep" aria-hidden="true" />
          {isAuthenticated ? (
            <Link to="/home" className="btn btn-gilt btn-sm">Open workspace</Link>
          ) : (
            <>
              <Link to="/login" className="pub-link">Sign in</Link>
              <Link to="/register" className="btn btn-gilt btn-sm">Start free</Link>
            </>
          )}
        </nav>
        <button type="button" className="pub-burger" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <FiX /> : <FiMenu />}
        </button>
      </header>
      <main id="main" className="pub-main">
        <ErrorBoundary resetKey={pathname}>{children || <Outlet />}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
