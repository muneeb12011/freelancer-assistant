// src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaTasks,
  FaUser,
  FaFileInvoice,
  FaCogs,
  FaUserFriends,
  FaChartBar,
  FaSignOutAlt,
  FaCrown,
  FaPalette,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "../styles/Sidebar.css";

// ── Nav sections ──────────────────────────────
const MAIN_LINKS = [
  { to: "/dashboard",   icon: <FaHome />,        label: "Dashboard"   },
  { to: "/clients",     icon: <FaUserFriends />,  label: "Clients"     },
  { to: "/tasks",       icon: <FaTasks />,        label: "Tasks"       },
  { to: "/invoices",    icon: <FaFileInvoice />,  label: "Invoices"    },
  { to: "/connections", icon: <FaChartBar />,     label: "Connections" },
];

const SECONDARY_LINKS = [
  { to: "/profile",  icon: <FaUser />,  label: "Profile"  },
  { to: "/settings", icon: <FaCogs />,  label: "Settings" },
];

// ── Helper: initials avatar ───────────────────
const getInitials = (name) => {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPremium = user?.plan === "premium";

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose();
  };

  return (
    <>
      {/* Backdrop — clicking closes sidebar on mobile */}
      <div
        className={`sidebar-backdrop ${isOpen ? "active" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>

        {/* ── User info at top ── */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {/* ✅ FIXED: use user.avatar (matches backend User model) */}
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} />
            ) : (
              <span>{getInitials(user?.name)}</span>
            )}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name || "Freelancer"}</p>
            <p className="sidebar-user-plan">
              {isPremium ? (
                <span className="sidebar-premium-badge">
                  <FaCrown style={{ fontSize: "9px" }} /> Premium
                </span>
              ) : (
                <span className="sidebar-free-badge">Free Plan</span>
              )}
            </p>
          </div>
        </div>

        {/* ── Main navigation ── */}
        <nav className="sidebar-nav">

          <p className="sidebar-section-label">Main</p>
          <ul className="sidebar-menu">
            {MAIN_LINKS.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    "sidebar-item" + (isActive ? " active" : "")
                  }
                  onClick={onClose}
                  title={label}
                >
                  <span className="sidebar-icon">{icon}</span>
                  <span className="sidebar-text">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <p className="sidebar-section-label" style={{ marginTop: "20px" }}>Account</p>
          <ul className="sidebar-menu">
            {SECONDARY_LINKS.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    "sidebar-item" + (isActive ? " active" : "")
                  }
                  onClick={onClose}
                  title={label}
                >
                  <span className="sidebar-icon">{icon}</span>
                  <span className="sidebar-text">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

        </nav>

        {/* ── Atelier CTA ── ✅ FIXED: link to /atelier, not /create-task */}
        <NavLink
          to="/atelier"
          className={({ isActive }) =>
            "sidebar-action-button" + (isActive ? " active" : "")
          }
          onClick={onClose}
          aria-label="Atelier"
        >
          <FaPalette className="sidebar-icon" />
          <span className="sidebar-text">Atelier Studio</span>
        </NavLink>

        {/* ── Upgrade banner (free users only) ── */}
        {!isPremium && (
          <div className="sidebar-upgrade">
            <FaCrown className="sidebar-upgrade-icon" />
            <div>
              <p className="sidebar-upgrade-title">Go Premium</p>
              <p className="sidebar-upgrade-sub">Unlock AI features & more</p>
            </div>
            <NavLink to="/atelier" className="sidebar-upgrade-btn" onClick={onClose}>
              Upgrade
            </NavLink>
          </div>
        )}

        {/* ── Footer: logout + copyright ── */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
          <span className="sidebar-copyright">© {new Date().getFullYear()} Aurelance</span>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;