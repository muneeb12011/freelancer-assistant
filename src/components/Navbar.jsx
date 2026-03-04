// src/components/Navbar.jsx
import React from "react";
import { FaSignOutAlt, FaBars } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = ({ onToggleSidebar }) => {
  const user = {
    profilePicture: "https://via.placeholder.com/32",
    email: "johndoe@example.com",
    provider: "Google",
  };

  const handleLogout = () => {
    console.log("Logging out...");
    // TODO: Replace with actual logout logic
  };

  return (
    <header className="navbar dark-theme">
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

      <nav className="navbar-center">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-link nav-link--active" : "nav-link"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link--active" : "nav-link"
          }
        >
          About
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link--active" : "nav-link"
          }
        >
          Contact
        </NavLink>
        <NavLink
          to="/support"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link--active" : "nav-link"
          }
        >
          Support
        </NavLink>
      </nav>

      <div className="navbar-right">
        <button
          className="logout-button"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <FaSignOutAlt className="logout-icon" />
        </button>
        <img
          src={user.profilePicture}
          alt="User Profile"
          className="profile-picture"
        />
      </div>
    </header>
  );
};

export default Navbar;
