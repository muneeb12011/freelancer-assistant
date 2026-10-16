// src/components/Layout.jsx — signed-in app shell: top bar, sidebar, page outlet.
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';
import '../styles/Layout.css';

const Layout = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`shell${open ? ' shell-open' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar onToggleSidebar={() => setOpen((v) => !v)} sidebarOpen={open} />
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      <div className="shell-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <main id="main" className="shell-main">
        <ErrorBoundary resetKey={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default Layout;
