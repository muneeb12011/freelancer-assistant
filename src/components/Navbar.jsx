// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaSignOutAlt, FaBars } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get initials from name for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="navbar dark-theme">
      {/* ── Left: hamburger + brand ── */}
      <div className="navbar-left">
        <button
          className="navbar-hamburger"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <FaBars />
        </button>
        <h1 className="app-name">Aurelance</h1>
      </div>

      {/* ── Center: nav links ── */}
      <nav className="navbar-center">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"}>
          Home
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"}>
          About
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"}>
          Contact
        </NavLink>
        <NavLink to="/support" className={({ isActive }) => isActive ? "nav-link nav-link--active" : "nav-link"}>
          Support
        </NavLink>
      </nav>

      {/* ── Right: logout + user avatar dropdown ── */}
      <div className="navbar-right">

        {/* Logout button */}
        <button className="logout-button" onClick={handleLogout} aria-label="Logout" title="Logout">
          <FaSignOutAlt className="logout-icon" />
        </button>

        {/* User avatar — shows photo if available, else initials */}
        <div className="navbar-user" ref={dropdownRef}>
          <button
            className="navbar-avatar-btn"
            onClick={() => setDropdownOpen((p) => !p)}
            aria-label="User menu"
          >
            {/* ✅ FIXED: use user.avatar (matches backend User model) */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || "User"}
                className="profile-picture"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="profile-initials">
                {getInitials(user?.name)}
              </div>
            )}
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">
                <span className="navbar-dropdown-name">{user?.name || "User"}</span>
                <span className="navbar-dropdown-email">{user?.email || ""}</span>
              </div>
              <div className="navbar-dropdown-divider" />
              <NavLink
                to="/profile"
                className="navbar-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                👤 &nbsp; Profile
              </NavLink>
              <NavLink
                to="/settings"
                className="navbar-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                ⚙️ &nbsp; Settings
              </NavLink>
              <div className="navbar-dropdown-divider" />
              <button className="navbar-dropdown-item logout" onClick={handleLogout}>
                <FaSignOutAlt style={{ marginRight: 8 }} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;