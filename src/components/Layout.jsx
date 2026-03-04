import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onToggleSidebar = () => setSidebarOpen((prev) => !prev);
  const onCloseSidebar = () => setSidebarOpen(false);

  return (
    <div className={`layout ${sidebarOpen ? "sidebar-open" : ""}`}>
      <Navbar onToggleSidebar={onToggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={onCloseSidebar} />

      {/* This wrapper must be visible; check its CSS */}
      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
