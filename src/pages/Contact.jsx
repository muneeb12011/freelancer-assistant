import React, { useState } from "react";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaClock,
} from "react-icons/fa";
import "../styles/Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: hook up to your backend or API endpoint
    console.log("Form submitted:", formData);

    // Reset form & show a thank‐you message
    setFormData({ name: "", email: "", message: "" });
    setSubmitted(true);

    // Hide the thank you message after a few seconds (optional)
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="contact-container">
      <div className="contact-wrapper">
        {/* -------------------- Hero Section -------------------- */}
        <section className="contact-hero">
          <h1 className="contact-title">Get in Touch</h1>
          <p className="contact-subtitle">
            Have a question, suggestion, or partnership proposal? We'd love to
            hear from you!
          </p>
        </section>

        {/* ---------------- Contact Form & Info & Newsletter ---------------- */}
        <section className="contact-main">
          {/* ----- Contact Form Section ----- */}
          <div className="contact-form-section">
            {submitted && (
              <div className="thank-you-message">
                <h2>Thank you for reaching out!</h2>
                <p>We’ve received your message and will get back to you shortly.</p>
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Your Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  rows="5"
                  placeholder="Write your message here..."
                  required
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>

              <button type="submit" className="contact-button">
                <FaPaperPlane className="send-icon" />
                Send Message
              </button>
            </form>

            {/* ----- Newsletter Signup Below Form ----- */}
            <div className="newsletter-section">
              <h3 className="newsletter-title">Subscribe for Updates</h3>
              <p className="newsletter-text">
                Get our latest news, tips, and special offers delivered to your
                inbox.
              </p>
              <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  className="newsletter-input"
                  placeholder="you@example.com"
                  required
                />
                <button type="submit" className="newsletter-button">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* ----- Contact Info + Business Hours + Social Links ----- */}
          <div className="contact-info-section">
            {/* Email Card */}
            <div className="contact-info-card">
              <FaEnvelope className="info-icon" />
              <h3>Email</h3>
              <p>support@aurelance.ai</p>
            </div>

            {/* Phone Card */}
            <div className="contact-info-card">
              <FaPhone className="info-icon" />
              <h3>Phone</h3>
              <p>+1 (800) 123-4567</p>
            </div>

            {/* Location Card */}
            <div className="contact-info-card">
              <FaMapMarkerAlt className="info-icon" />
              <h3>Location</h3>
              <p>Silicon Valley, CA, USA</p>
            </div>

            {/* Business Hours Card */}
            <div className="business-hours-card">
              <FaClock className="info-icon" />
              <h3>Business Hours</h3>
              <ul className="hours-list">
                <li>
                  <strong>Monday – Friday:</strong> 9:00 AM – 6:00 PM
                </li>
                <li>
                  <strong>Saturday:</strong> 10:00 AM – 4:00 PM
                </li>
                <li>
                  <strong>Sunday:</strong> Closed
                </li>
              </ul>
            </div>

            {/* Social Media Links */}
            <div className="social-links">
              <h3>Follow Us</h3>
              <div className="social-icons">
                <a
                  href="https://facebook.com/YourPage"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://twitter.com/YourProfile"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <FaTwitter />
                </a>
                <a
                  href="https://linkedin.com/company/YourCompany"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn />
                </a>
                <a
                  href="https://instagram.com/YourProfile"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------- Embedded Map -------------------- */}
        <section className="contact-map">
          <iframe
            title="Company Location (Dark Mode)"
            loading="lazy"
            src="https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&amp;center=37.3875,-122.0575&amp;zoom=13&amp;map_id=map_dark_01"
          ></iframe>
        </section>

        {/* -------------------- FAQ Section -------------------- */}
        <section className="faq-section">
          <h2 className="faq-title">Frequently Asked Questions</h2>

          <details className="faq-item">
            <summary className="faq-question">
              What is your typical response time?
            </summary>
            <p className="faq-answer">
              We strive to respond to all inquiries within 24 hours on
              business days. If you reach out over the weekend, expect our
              reply on Monday morning.
            </p>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              Do you offer custom solutions?
            </summary>
            <p className="faq-answer">
              Yes! We can tailor our services or products to suit your unique
              requirements. After you fill out the form above, a consultant will
              contact you to discuss details.
            </p>
          </details>

          <details className="faq-item">
            <summary className="faq-question">
              Can I schedule an on-site visit or demo?
            </summary>
            <p className="faq-answer">
              Absolutely. Depending on your location, we can arrange an on-site
              meeting or a remote video demo—just let us know what works best
              for you.
            </p>
          </details>
        </section>
      </div>
    </div>
  );
};

export default Contact;
