import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Prevent the form from reloading the page and handle subscription logic here
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // TODO: Add your newsletter subscription logic
    alert("Thank you for subscribing!");
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        {/* Newsletter Signup */}
        <div className="newsletter">
          <h3>Subscribe to our Newsletter</h3>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Email address"
              required
            />
            <button type="submit" aria-label="Subscribe">
              Subscribe
            </button>
          </form>
        </div>
        {/* Social Media Links */}
        <div className="social-media">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="social-link"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="social-link"
          >
            <FaTwitter />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="social-link"
          >
            <FaInstagram />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="social-link"
          >
            <FaLinkedinIn />
          </a>
        </div>
      </div>

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
          {/* Additional links can be added here */}
        </div>
      </div>

      <button
        className="back-to-top"
        onClick={handleBackToTop}
        aria-label="Back to top"
      >
        ↑ Back to Top
      </button>
    </footer>
  );
};

export default Footer;
