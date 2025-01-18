// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css"; // Ensure you have appropriate CSS for styling

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="footer-text">
          © 2025 Freelancer's Assistant. All Rights Reserved.
        </span>
        <div className="footer-links">
          <Link to="/privacy" className="footer-link" aria-label="Privacy Policy">
            Privacy Policy
          </Link>
          <Link to="/terms" className="footer-link" aria-label="Terms of Service">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
