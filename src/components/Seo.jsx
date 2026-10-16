// src/components/Seo.jsx — per-route <title>, description and canonical URL.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'Aurelance';
const ORIGIN = process.env.REACT_APP_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const ROUTES = {
  '/':            ['Aurelance — the back office for independent work', 'Clients, invoices, tasks and your network in one ledger. Built for freelancers who bill every month.'],
  '/about':       ['About', 'Why Aurelance exists and what it does for freelancers.'],
  '/contact':     ['Contact', 'Write to the Aurelance team. We reply within one business day.'],
  '/pricing':     ['Pricing', 'Free for the essentials. Premium for analytics, contracts, proposals and AI.'],
  '/privacy':     ['Privacy policy', 'How Aurelance collects, uses and protects your data.'],
  '/terms':       ['Terms of service', 'The terms for using Aurelance.'],
  '/refunds':     ['Refund policy', 'How refunds work for Aurelance Premium.'],
  '/login':       ['Sign in', 'Sign in to Aurelance.'],
  '/register':    ['Create your account', 'Start free — no card needed.'],
  '/forgot-password': ['Reset password', 'Get a link to reset your Aurelance password.'],
  '/reset-password':  ['Choose a new password', ''],
  '/home':        ['Home', ''],
  '/dashboard':   ['Dashboard', ''],
  '/clients':     ['Clients', ''],
  '/tasks':       ['Tasks', ''],
  '/invoices':    ['Invoices', ''],
  '/connections': ['Connections', ''],
  '/atelier':     ['Atelier', ''],
  '/profile':     ['Profile', ''],
  '/settings':    ['Settings', ''],
  '/billing':     ['Plan & billing', ''],
  '/support':     ['Support', 'Answers, tickets and help with Aurelance.'],
  '/messages':    ['Messages', ''],
  '/jobs':        ['Jobs', ''],
  '/admin':       ['Admin', ''],
};

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const m = selector.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export default function Seo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const key = Object.keys(ROUTES).filter((k) => pathname === k || (k !== '/' && pathname.startsWith(`${k}/`))).sort((a, b) => b.length - a.length)[0];
    const [title, desc] = ROUTES[key] || ['Page not found', ''];
    const full = key === '/' ? title : `${title} · ${SITE}`;
    document.title = full;
    if (desc) {
      setMeta('meta[name="description"]', 'content', desc);
      setMeta('meta[property="og:description"]', 'content', desc);
    }
    setMeta('meta[property="og:title"]', 'content', full);
    setMeta('link[rel="canonical"]', 'href', `${ORIGIN}${pathname === '/' ? '' : pathname}`);
    // App pages shouldn't be indexed.
    const isPublic = ['/', '/about', '/contact', '/pricing', '/privacy', '/terms', '/refunds', '/login', '/register'].includes(pathname);
    setMeta('meta[name="robots"]', 'content', isPublic ? 'index,follow' : 'noindex,nofollow');
  }, [pathname]);
  return null;
}
