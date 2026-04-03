// src/components/Footer.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaGithub } from "react-icons/fa";
import "../styles/Footer.css";

const Footer = () => {
  const [email,     setEmail]     = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ FIXED: no alert() — inline success state instead
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: POST /api/newsletter with { email }
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="footer">
      <div className="footer-top">

        {/* ── Newsletter ── */}
        <div className="newsletter">
          <h3>Stay in the loop</h3>
          {subscribed ? (
            <p className="newsletter-success">✓ You're subscribed — thank you!</p>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" aria-label="Subscribe">Subscribe</button>
            </form>
          )}
        </div>

        {/* ── Social links ── */}
        <div className="social-media">
          <a href="https://facebook.com"  target="_blank" rel="noopener noreferrer" aria-label="Facebook"  className="social-link"><FaFacebookF /></a>
          <a href="https://twitter.com"   target="_blank" rel="noopener noreferrer" aria-label="Twitter"   className="social-link"><FaTwitter /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link"><FaInstagram /></a>
          <a href="https://linkedin.com"  target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"  className="social-link"><FaLinkedinIn /></a>
          <a href="https://github.com/muneeb12011" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="social-link"><FaGithub /></a>
        </div>

      </div>

      <div className="footer-content">
        {/* ✅ FIXED: dynamic year + correct brand name */}
        <span className="footer-text">
          © {new Date().getFullYear()} Aurelance. All Rights Reserved.
        </span>
        <div className="footer-links">
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <Link to="/terms"   className="footer-link">Terms of Service</Link>
          <Link to="/about"   className="footer-link">About</Link>
          <Link to="/support" className="footer-link">Support</Link>
        </div>
      </div>

      <button className="back-to-top" onClick={handleBackToTop} aria-label="Back to top">
        ↑ Back to Top
      </button>
    </footer>
  );
};

export default Footer;