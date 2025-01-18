// src/components/Navbar.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Toggle the mobile menu
  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          Freelancer's Assistant
        </Link>

        {/* Hamburger menu for mobile */}
        <div className="navbar-toggle" onClick={handleMenuToggle}>
          <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"}`}></i>
        </div>

        {/* Navbar menu */}
        <ul className={`navbar-menu ${menuOpen ? "active" : ""}`}>
          <li>
            <Link to="/dashboard" className="navbar-item">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/tasks" className="navbar-item">
              Tasks
            </Link>
          </li>
          <li>
            <Link to="/profile" className="navbar-item">
              Profile
            </Link>
          </li>
          <li>
            <Link to="/invoices" className="navbar-item">
              Invoices
            </Link>
          </li>

          {/* Dropdown Menu */}
          <li className="navbar-item dropdown">
            More
            <ul className="dropdown-menu">
              <li>
                <Link to="/settings" className="dropdown-item">
                  Settings
                </Link>
              </li>
              <li>
                <Link to="/support" className="dropdown-item">
                  Support
                </Link>
              </li>
              <li>
                <Link to="/logout" className="dropdown-item">
                  Logout
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
