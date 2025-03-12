import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
import {
  FaHome,
  FaTasks,
  FaUser,
  FaFileInvoice,
  FaCogs,
  FaUserFriends,
  FaPlusCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile (viewport width < 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize(); // Check initial width
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>

      {/* Sidebar Menu */}
      <nav>
        <ul className="sidebar-menu">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                "sidebar-item" + (isActive ? " active" : "")
              }
              title="Dashboard"
            >
              <FaHome className="sidebar-icon" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/tasks"
              className={({ isActive }) =>
                "sidebar-item" + (isActive ? " active" : "")
              }
              title="Tasks"
            >
              <FaTasks className="sidebar-icon" />
              {!isCollapsed && <span>Tasks</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                "sidebar-item" + (isActive ? " active" : "")
              }
              title="Profile"
            >
              <FaUser className="sidebar-icon" />
              {!isCollapsed && <span>Profile</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/invoices"
              className={({ isActive }) =>
                "sidebar-item" + (isActive ? " active" : "")
              }
              title="Invoices"
            >
              <FaFileInvoice className="sidebar-icon" />
              {!isCollapsed && <span>Invoices</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                "sidebar-item" + (isActive ? " active" : "")
              }
              title="Settings"
            >
              <FaCogs className="sidebar-icon" />
              {!isCollapsed && <span>Settings</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/connections"
              className={({ isActive }) =>
                "sidebar-item" + (isActive ? " active" : "")
              }
              title="Connections"
            >
              <FaUserFriends className="sidebar-icon" />
              {!isCollapsed && <span>Connections</span>}
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Sidebar Action Button */}
      <button className="sidebar-button" aria-label="Create Task">
        <FaPlusCircle className="sidebar-icon" />
        {!isCollapsed && <span>Create Task</span>}
      </button>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {!isCollapsed && <span>© 2025 Freelancer's Assistant</span>}
      </div>
    </aside>
  );
};

export default Sidebar;
