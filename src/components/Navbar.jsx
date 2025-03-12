import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Toggle mobile menu open/close
  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          Freelancer's Assistant
        </Link>

        {/* Hamburger Icon for Mobile */}
        <button 
          className="navbar-toggle" 
          onClick={handleMenuToggle} 
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>

        {/* Navigation Menu */}
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
          <li>
            <Link to="/connections" className="navbar-item">
              Connections
            </Link>
          </li>
          {/* Dropdown Menu for More Options */}
          <li className="navbar-item dropdown">
            <span className="dropdown-label">More</span>
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
