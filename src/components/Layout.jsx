// src/components/Layout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onToggleSidebar = () => setSidebarOpen((prev) => !prev);
  const onCloseSidebar  = () => setSidebarOpen(false);

  return (
    <div className={`layout ${sidebarOpen ? "sidebar-open" : ""}`}>

      {/* ── Fixed top navbar ── */}
      <Navbar onToggleSidebar={onToggleSidebar} />

      {/* ── Fixed left sidebar ── */}
      <Sidebar isOpen={sidebarOpen} onClose={onCloseSidebar} />

      {/* ── Body: sits below navbar, offset from sidebar ── */}
      <div className="layout-body">

        {/* Mobile overlay — dims content when sidebar is open */}
        <div className="layout-overlay" onClick={onCloseSidebar} />

        {/* ── Page content ── */}
        <main className="layout-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default Layout;