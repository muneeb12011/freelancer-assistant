// src/pages/About.jsx
import React, { useState } from "react";
import {
  FaRocket,
  FaUsers,
  FaLightbulb,
  FaGlobe,
  FaEnvelope,
  FaQuoteLeft,
  FaChevronDown,
  FaPaperPlane,
} from "react-icons/fa";
import "../styles/About.css";

const About = () => {
  // FAQ toggle state
  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  // Placeholder data
  const stats = [
    { id: 1, icon: <FaUsers size={32} color="#4f8ef7" />, label: "Freelancers", value: "12K+" },
    { id: 2, icon: <FaGlobe size={32} color="#ff4081" />, label: "Countries Served", value: "45" },
    { id: 3, icon: <FaRocket size={32} color="#10b981" />, label: "Projects Managed", value: "58K+" },
  ];

  const timeline = [
    { year: "2020", event: "Aurelance founded by Alex & Priya" },
    { year: "2021", event: "Launched Task Management MVP" },
    { year: "2022", event: "Integrated AI Insights and Invoicing" },
    { year: "2023", event: "Reached 10,000 active users" },
    { year: "2024", event: "Expanded to 45 countries" },
  ];

  const partners = [
    { name: "FinServ", logo: "https://via.placeholder.com/100x40?text=FinServ" },
    { name: "CodeLabs", logo: "https://via.placeholder.com/100x40?text=CodeLabs" },
    { name: "DesignCo", logo: "https://via.placeholder.com/100x40?text=DesignCo" },
  ];

  const testimonials = [
    {
      id: 1,
      quote: "Aurelance transformed how I handle my freelance business. AI suggestions save me hours!",
      author: "Sarah J., UI/UX Designer",
    },
    {
      id: 2,
      quote: "Their invoicing and reminder system has cut my unpaid invoices by 80%.",
      author: "David W., Web Developer",
    },
    {
      id: 3,
      quote: "I love the real-time analytics—helps me forecast revenue effortlessly.",
      author: "Mia K., Content Strategist",
    },
  ];

  const faqs = [
    {
      question: "Is Aurelance free to use?",
      answer:
        "Yes! Our core task and client management features are free. We offer a Premium tier for advanced AI reporting and custom templates.",
    },
    {
      question: "How does AI Insights work?",
      answer:
        "AI Insights analyzes your tasks, invoices, and client data to offer suggestions—like when to send reminders or how to prioritize deadlines.",
    },
    {
      question: "Can I invite team members?",
      answer:
        "Absolutely—upgrade to Team Plan to collaborate with up to 5 members, share tasks, and assign roles.",
    },
  ];

  return (
    <div className="about-container">
      <div className="about-wrapper">
        {/* Hero Section */}
        <section className="about-section about-hero">
          <h1 className="about-hero-title">About Aurelance</h1>
          <p className="about-hero-subtext">
            Aurelance is the premier AI‐powered assistant for freelancers—offering seamless project management,
            intelligent insights, and professional invoicing within one unified platform.
          </p>
        </section>

        {/* Mission & Vision */}
        <section className="about-section about-mission-vision">
          <div className="about-card">
            <FaRocket size={36} color="#4f8ef7" className="about-icon" />
            <h2 className="about-card-title">Our Mission</h2>
            <p className="about-card-text">
              Empower every independent professional to work smarter, stay organized, and grow their
              business with cutting‐edge AI assistance.
            </p>
          </div>
          <div className="about-card">
            <FaGlobe size={36} color="#ff4081" className="about-icon" />
            <h2 className="about-card-title">Our Vision</h2>
            <p className="about-card-text">
              Create a worldwide freelancer community where AI automates the busywork,
              letting creatives focus on what they do best.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="about-section about-values">
          <h2 className="section-title">Core Values</h2>
          <div className="values-grid">
            <div className="about-card">
              <FaLightbulb size={28} color="#10b981" className="about-icon" />
              <h3 className="about-card-title">Innovation</h3>
              <p className="about-card-text">
                We relentlessly innovate—delivering AI features that redefine freelance workflows.
              </p>
            </div>
            <div className="about-card">
              <FaUsers size={28} color="#6366f1" className="about-icon" />
              <h3 className="about-card-title">Community</h3>
              <p className="about-card-text">
                We foster a global network—where freelancers can share knowledge and grow together.
              </p>
            </div>
            <div className="about-card">
              <FaEnvelope size={28} color="#f59e0b" className="about-icon" />
              <h3 className="about-card-title">Transparency</h3>
              <p className="about-card-text">
                We maintain clear communication and honest pricing—no hidden fees, no surprises.
              </p>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="about-section about-stats">
          <h2 className="section-title">By the Numbers</h2>
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.id} className="stat-card">
                <div className="stat-icon-wrapper">{stat.icon}</div>
                <div>
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="about-section about-timeline">
          <h2 className="section-title">Our Journey</h2>
          <div className="timeline">
            {timeline.map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <p className="timeline-year">{item.year}</p>
                  <p className="timeline-event">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partners */}
        <section className="about-section about-partners">
          <h2 className="section-title">Trusted By</h2>
          <div className="partners-grid">
            {partners.map((p) => (
              <div key={p.name} className="partner-logo-wrapper">
                <img src={p.logo} alt={p.name} className="partner-logo" />
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="about-section about-testimonials">
          <h2 className="section-title">What Freelancers Say</h2>
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.id} className="testimonial-card">
                <FaQuoteLeft size={24} color="#10b981" className="quote-icon" />
                <p className="testimonial-text">"{t.quote}"</p>
                <p className="testimonial-author">— {t.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="about-section about-faq">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${openFaq === idx ? "open" : ""}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question">
                  <h3>{faq.question}</h3>
                  <FaChevronDown
                    className={`faq-icon ${openFaq === idx ? "rotate" : ""}`}
                  />
                </div>
                {openFaq === idx && (
                  <p className="faq-answer">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="about-section about-newsletter">
          <h2 className="section-title">Stay Updated</h2>
          <p className="newsletter-text">
            Join our newsletter to get the latest features, tips, and exclusive
            freelancer insights delivered straight to your inbox.
          </p>
          <form className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email"
              className="newsletter-input"
            />
            <button type="submit" className="newsletter-button">
              <FaPaperPlane size={18} className="signup-icon" /> Subscribe
            </button>
          </form>
        </section>

        {/* Contact Section */}
        <section className="about-section about-contact">
          <h2 className="section-title">Get in Touch</h2>
          <p className="about-contact-text">
            Have questions, feedback, or partnership inquiries? Drop us a line—
            we’d love to hear from you.
          </p>
          <a href="mailto:support@aurelance.ai" className="contact-button">
            <FaEnvelope size={18} className="mail-icon" /> Email Us
          </a>
        </section>
      </div>
    </div>
  );
};

export default About;
