// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

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
    <>
      <header className="navbar dark-theme">

        {/* ── Left: sidebar toggle + brand ── */}
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

        {/* ── Center: nav links — hidden on mobile via CSS ── */}
        <nav className="navbar-center" aria-label="Main navigation">
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

        {/* ── Right ── */}
        <div className="navbar-right">

          {/* Desktop logout */}
          <button
            className="logout-button desktop-only"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
          >
            <FaSignOutAlt className="logout-icon" />
          </button>

          {/* Avatar + dropdown */}
          <div className="navbar-user" ref={dropdownRef}>
            <button
              className="navbar-avatar-btn"
              onClick={() => setDropdownOpen((p) => !p)}
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
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

          {/* Mobile menu toggle — visible only on mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {/* ── Mobile nav drawer ── */}
      <div
        className={`mobile-nav-drawer ${mobileMenuOpen ? "mobile-nav-drawer--open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <nav className="mobile-nav-links" aria-label="Mobile navigation">
          <NavLink to="/" end
            className={({ isActive }) => isActive ? "mobile-nav-link mobile-nav-link--active" : "mobile-nav-link"}
            onClick={closeMobileMenu}
          >
            Home
          </NavLink>
          <NavLink to="/about"
            className={({ isActive }) => isActive ? "mobile-nav-link mobile-nav-link--active" : "mobile-nav-link"}
            onClick={closeMobileMenu}
          >
            About
          </NavLink>
          <NavLink to="/contact"
            className={({ isActive }) => isActive ? "mobile-nav-link mobile-nav-link--active" : "mobile-nav-link"}
            onClick={closeMobileMenu}
          >
            Contact
          </NavLink>
          <NavLink to="/support"
            className={({ isActive }) => isActive ? "mobile-nav-link mobile-nav-link--active" : "mobile-nav-link"}
            onClick={closeMobileMenu}
          >
            Support
          </NavLink>
        </nav>

        <div className="mobile-nav-footer">
          <div className="mobile-nav-user">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name || "User"} className="profile-picture" />
            ) : (
              <div className="profile-initials">{getInitials(user?.name)}</div>
            )}
            <div className="mobile-nav-user-info">
              <span className="mobile-nav-user-name">{user?.name || "User"}</span>
              <span className="mobile-nav-user-email">{user?.email || ""}</span>
            </div>
          </div>
          <button className="mobile-nav-logout" onClick={handleLogout}>
            <FaSignOutAlt />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Backdrop for mobile drawer ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navbar;