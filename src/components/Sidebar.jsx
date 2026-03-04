import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaTasks,
  FaUser,
  FaFileInvoice,
  FaCogs,
  FaUserFriends,
  FaPlusCircle,
} from "react-icons/fa";
import "../styles/Sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? "active" : ""}`}
        onClick={onClose}
      ></div>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  "sidebar-item" + (isActive ? " active" : "")
                }
                title="Dashboard"
                onClick={onClose}
              >
                <FaHome className="sidebar-icon" />
                <span className="sidebar-text">Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  "sidebar-item" + (isActive ? " active" : "")
                }
                title="Tasks"
                onClick={onClose}
              >
                <FaTasks className="sidebar-icon" />
                <span className="sidebar-text">Tasks</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  "sidebar-item" + (isActive ? " active" : "")
                }
                title="Profile"
                onClick={onClose}
              >
                <FaUser className="sidebar-icon" />
                <span className="sidebar-text">Profile</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/invoices"
                className={({ isActive }) =>
                  "sidebar-item" + (isActive ? " active" : "")
                }
                title="Invoices"
                onClick={onClose}
              >
                <FaFileInvoice className="sidebar-icon" />
                <span className="sidebar-text">Invoices</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  "sidebar-item" + (isActive ? " active" : "")
                }
                title="Settings"
                onClick={onClose}
              >
                <FaCogs className="sidebar-icon" />
                <span className="sidebar-text">Settings</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/connections"
                className={({ isActive }) =>
                  "sidebar-item" + (isActive ? " active" : "")
                }
                title="Connections"
                onClick={onClose}
              >
                <FaUserFriends className="sidebar-icon" />
                <span className="sidebar-text">Connections</span>
              </NavLink>
            </li>
          </ul>
        </nav>

<NavLink
  to="/create-task"
  className={({ isActive }) =>
    "sidebar-action-button" + (isActive ? " active" : "")
  }
  aria-label="Create Task"
  onClick={onClose}
>
  <FaPlusCircle className="sidebar-icon" />
  <span className="sidebar-text">Atelier</span>
</NavLink>
        <div className="sidebar-footer">
          <span>© 2025 Aurelance</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
