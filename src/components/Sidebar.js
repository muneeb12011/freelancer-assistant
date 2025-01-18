// src/components/Sidebar.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Sidebar.css";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        {isCollapsed ? "FA" : "Freelancer's Assistant"}
      </div>

      {/* Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isCollapsed ? "▶" : "◀"}
      </button>

      {/* Sidebar Menu */}
      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard" className="sidebar-item">
            <i className="fas fa-home"></i>
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/tasks" className="sidebar-item">
            <i className="fas fa-tasks"></i>
            <span>Tasks</span>
          </Link>
        </li>
        <li>
          <Link to="/profile" className="sidebar-item">
            <i className="fas fa-user"></i>
            <span>Profile</span>
          </Link>
        </li>
        <li>
          <Link to="/invoices" className="sidebar-item">
            <i className="fas fa-file-invoice"></i>
            <span>Invoices</span>
          </Link>
        </li>
        <li>
          <Link to="/settings" className="sidebar-item">
            <i className="fas fa-cogs"></i>
            <span>Settings</span>
          </Link>
        </li>
      </ul>

      {/* Sidebar Button */}
      <button className="sidebar-button">
        <i className="fas fa-plus-circle"></i> Create Task
      </button>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        © 2025 Freelancer's Assistant
      </div>
    </div>
  );
};

export default Sidebar;
