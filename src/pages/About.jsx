// src/pages/About.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaRocket, FaUsers, FaLightbulb, FaGlobe,
  FaEnvelope, FaQuoteLeft, FaChevronDown,
  FaPaperPlane, FaTwitter, FaLinkedinIn, FaGithub,
  FaShieldAlt, FaBolt, FaChartLine, FaCode,
  FaCrown, FaCheckCircle,
} from "react-icons/fa";
import '../styles/About.css';

/* ── Data ──────────────────────────────────────────────────── */
const STATS = [
  { icon: <FaUsers     size={24} />, label: "Freelancers Onboard",  value: "12K+",  color: "#4a90d9" },
  { icon: <FaGlobe     size={24} />, label: "Countries",             value: "45",    color: "#9b72e8" },
  { icon: <FaRocket    size={24} />, label: "Projects Managed",      value: "58K+",  color: "#4caf82" },
  { icon: <FaChartLine size={24} />, label: "Revenue Tracked",       value: "$4.2M", color: "#c9a84c" },
];

const TIMELINE = [
  { year: "2022", event: "Aurelance founded — a dashboard built for freelancers tired of juggling 5 different tools." },
  { year: "2023", event: "Launched full client CRM, Kanban task board, and invoice generator." },
  { year: "2024", event: "Introduced Atelier Studio — 11 freelance tools in one place, including Rate Calculator and Smart Contracts." },
  { year: "2025", event: "Reached 12,000 active users. Launched Premium tier with Earnings Analytics, Proposal Builder, and Tax Summary." },
  { year: "2026", event: "Expanding into mobile, API integrations, and AI-powered invoice reminders." },
];

const TEAM = [
  {
    name:     "Shahzad",
    role:     "Co-Founder & CEO",
    bio:      "Former freelance developer turned product builder. Obsessed with making freelancers more profitable.",
    initials: "AR",
    color:    "#4a90d9",
    twitter:  "https://twitter.com",
    linkedin: "https://linkedin.com",
    github:   "https://github.com",
  },
  {
    name:     "David",
    role:     "Co-Founder & CTO",
    bio:      "Full-stack engineer. Built the backend that powers smart invoicing, contracts, and real-time analytics.",
    initials: "PM",
    color:    "#9b72e8",
    twitter:  "https://twitter.com",
    linkedin: "https://linkedin.com",
    github:   "https://github.com",
  },
  {
    name:     "Muneeb",
    role:     "Head of Design & Frontend",
    bio:      "Crafted the Obsidian Luxury design system. Believes great tools should be as beautiful as they are useful.",
    initials: "M",
    color:    "#c9a84c",
    twitter:  "https://twitter.com",
    linkedin: "https://linkedin.com",
    github:   "https://github.com/muneeb12011",
  },
  {
    name:     "Sara Okafor",
    role:     "Head of Growth",
    bio:      "Grew the user base from 0 to 12K. Passionate about freelancer communities and financial education.",
    initials: "SO",
    color:    "#4caf82",
    twitter:  "https://twitter.com",
    linkedin: "https://linkedin.com",
    github:   "https://github.com",
  },
];

const TESTIMONIALS = [
  {
    quote:   "Aurelance transformed how I handle my freelance business. The Atelier tools alone save me 3+ hours every week.",
    author:  "Shahzad",
    role:    "UI/UX Designer",
    initials:"SJ",
    color:   "#4a90d9",
  },
  {
    quote:   "The Smart Contracts and Proposal Builder give me so much confidence with clients. I look like a proper agency now.",
    author:  "David W.",
    role:    "Web Developer",
    initials:"DW",
    color:   "#9b72e8",
  },
  {
    quote:   "Earnings Analytics showed me that one client was worth 60% of my revenue. I restructured everything. Best decision ever.",
    author:  "Mia K.",
    role:    "Content Strategist",
    initials:"MK",
    color:   "#4caf82",
  },
];

const FAQS = [
  {
    question: "Is Aurelance free to use?",
    answer:   "Yes. Core features — Tasks, Clients, Invoices, Connections, and 7 Atelier tools — are completely free forever. Premium ($19/mo) adds Earnings Analytics, Smart Contracts, Proposal Builder, and Tax Summary.",
  },
  {
    question: "What is Atelier Studio?",
    answer:   "Atelier is your freelance power studio — 11 tools built into one page. Rate Calculator, Time Tracker, Expense Tracker, Brand Kit, Project Estimator, Email Templates (14 built-in), and 4 Premium tools. No context switching.",
  },
  {
    question: "Is my data secure?",
    answer:   "Absolutely. All data is encrypted in transit (HTTPS/TLS) and at rest (MongoDB Atlas). We never sell your data. Your client and financial data belongs to you — always.",
  },
  {
    question: "Can I use Aurelance on mobile?",
    answer:   "Yes. The app is fully responsive and works on any screen size. A dedicated mobile app is on our 2026 roadmap.",
  },
  {
    question: "How do Smart Contracts work?",
    answer:   "Choose from 4 templates (Freelance Service, NDA, Retainer, IP Transfer), customise the content, then digitally sign with a confirmation step. Download as .txt or send directly to your client.",
  },
  {
    question: "What's the difference between Clients and Connections?",
    answer:   "Clients is your CRM — people you bill and manage projects for. Connections is your professional network — collaborators, mentors, partners — with chat, collab requests, and relationship tracking.",
  },
];

const VALUES = [
  { icon: <FaLightbulb size={22} />, title: "Built for Real Work",  text: "Every feature solves an actual freelancer problem — not a hypothetical one.", color: "#4caf82" },
  { icon: <FaShieldAlt size={22} />, title: "Privacy First",        text: "No ads. No data selling. No dark patterns. Your business data stays yours.", color: "#c9a84c" },
  { icon: <FaBolt      size={22} />, title: "Speed Matters",        text: "Fast UI, instant sync, no loading spinners where they shouldn't exist.",      color: "#9b72e8" },
  { icon: <FaUsers     size={22} />, title: "Community Driven",     text: "Built in public. Features are shaped by what real freelancers ask for.",     color: "#4a90d9" },
];

/* ── Component ─────────────────────────────────────────────── */
const About = () => {
  const { isAuthenticated } = useAuth();
  const [openFaq,  setOpenFaq]  = useState(null);
  const [email,    setEmail]    = useState("");
  const [subMsg,   setSubMsg]   = useState("");

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) { setSubMsg("error"); return; }
    setSubMsg("success");
    setEmail("");
    setTimeout(() => setSubMsg(""), 4000);
  };

  return (
    <div className="abt-page">
      <div className="abt-wrap">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="abt-section abt-hero">
          <div className="abt-badge">✦ Our Story</div>
          <h1 className="abt-hero-title">
            Built for freelancers,<br />
            <span className="abt-gold-text">by freelancers.</span>
          </h1>
          <p className="abt-hero-sub">
            Aurelance is the all-in-one dashboard that handles your clients, tasks,
            invoices, contracts, proposals, and business analytics — so you can focus
            on the work you love.
          </p>
          <div className="abt-hero-cta">
            {isAuthenticated ? (
              <Link to="/dashboard" className="abt-btn-primary">
                <FaRocket size={13} /> Go to Dashboard
              </Link>
            ) : (
              <Link to="/register" className="abt-btn-primary">
                <FaRocket size={13} /> Get Started Free
              </Link>
            )}
            <Link to="/contact" className="abt-btn-ghost">Contact Us</Link>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────── */}
        <section className="abt-section">
          <div className="abt-stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="abt-stat-card">
                <div className="abt-stat-icon" style={{ color: s.color, background: s.color + "18", borderColor: s.color + "30" }}>
                  {s.icon}
                </div>
                <div className="abt-stat-value">{s.value}</div>
                <div className="abt-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mission & Vision ─────────────────────────────── */}
        <section className="abt-section abt-mv-grid">
          <div className="abt-card abt-mission">
            <div className="abt-card-icon" style={{ color: "#4a90d9", background: "#4a90d918", borderColor: "#4a90d930" }}>
              <FaRocket size={20} />
            </div>
            <h2 className="abt-card-title">Our Mission</h2>
            <p className="abt-card-text">
              Empower every independent professional to work smarter, stay organised,
              and grow their business — with tools that actually understand the freelance life.
            </p>
          </div>
          <div className="abt-card abt-vision">
            <div className="abt-card-icon" style={{ color: "#9b72e8", background: "#9b72e818", borderColor: "#9b72e830" }}>
              <FaGlobe size={20} />
            </div>
            <h2 className="abt-card-title">Our Vision</h2>
            <p className="abt-card-text">
              A world where freelancers spend 80% of their time on creative work —
              and 20% on the rest. Aurelance handles the 20%.
            </p>
          </div>
        </section>

        {/* ── What's inside ────────────────────────────────── */}
        <section className="abt-section">
          <h2 className="abt-section-title">What's Inside Aurelance</h2>
          <p className="abt-section-sub">Every tool you need to run a professional freelance business.</p>
          <div className="abt-features-grid">
            {[
              { icon: <FaUsers size={16}/>,     label:"Client CRM",          desc:"Full client management with status, priority, revenue tracking, and contract fields.", color:"#4a90d9" },
              { icon: <FaCode size={16}/>,      label:"Kanban Tasks",         desc:"Drag-and-drop task board with priorities, deadlines, and time tracking.",              color:"#9b72e8" },
              { icon: <FaChartLine size={16}/>, label:"Invoices",             desc:"Create, send, and track invoices. Auto-updates client revenue on payment.",            color:"#c9a84c" },
              { icon: <FaUsers size={16}/>,     label:"Connections",          desc:"Professional network with chat, collab requests, and relationship tracking.",           color:"#4caf82" },
              { icon: <FaCrown size={16}/>,     label:"Atelier Studio",       desc:"11 freelance tools: Rate Calc, Time Tracker, Smart Contracts, Proposals & more.",      color:"#c9a84c" },
              { icon: <FaChartLine size={16}/>, label:"Earnings Analytics",   desc:"Revenue charts, goal tracking, client breakdown, and profit analysis.",                color:"#4caf82" },
              { icon: <FaShieldAlt size={16}/>, label:"Smart Contracts",      desc:"4 legal templates with digital signing and download.",                                 color:"#9b72e8" },
              { icon: <FaPaperPlane size={16}/>,label:"Proposal Builder",     desc:"Structured proposals with win-rate tracking and status progression.",                  color:"#4a90d9" },
            ].map((f, i) => (
              <div key={i} className="abt-feature-card">
                <div className="abt-feature-icon" style={{ color: f.color, background: f.color + "15", borderColor: f.color + "30" }}>
                  {f.icon}
                </div>
                <div>
                  <div className="abt-feature-label">{f.label}</div>
                  <div className="abt-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Values ───────────────────────────────────────── */}
        <section className="abt-section">
          <h2 className="abt-section-title">What We Stand For</h2>
          <div className="abt-values-grid">
            {VALUES.map((v, i) => (
              <div key={i} className="abt-card">
                <div className="abt-card-icon" style={{ color: v.color, background: v.color + "15", borderColor: v.color + "30" }}>
                  {v.icon}
                </div>
                <h3 className="abt-card-title">{v.title}</h3>
                <p className="abt-card-text">{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ─────────────────────────────────────────── */}
        <section className="abt-section">
          <h2 className="abt-section-title">Meet the Team</h2>
          <p className="abt-section-sub">Small team, big mission.</p>
          <div className="abt-team-grid">
            {TEAM.map((m, i) => (
              <div key={i} className="abt-team-card">
                {/* Avatar — initials only (no broken image links) */}
                <div className="abt-team-avatar" style={{ background: m.color + "20", borderColor: m.color + "50", color: m.color }}>
                  {m.initials}
                </div>
                <div className="abt-team-info">
                  <p className="abt-team-name">{m.name}</p>
                  <p className="abt-team-role">{m.role}</p>
                  <p className="abt-team-bio">{m.bio}</p>
                  <div className="abt-team-socials">
                    <a href={m.twitter}  target="_blank" rel="noopener noreferrer" className="abt-social-link" aria-label="Twitter"><FaTwitter /></a>
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="abt-social-link" aria-label="LinkedIn"><FaLinkedinIn /></a>
                    <a href={m.github}   target="_blank" rel="noopener noreferrer" className="abt-social-link" aria-label="GitHub"><FaGithub /></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline ─────────────────────────────────────── */}
        <section className="abt-section">
          <h2 className="abt-section-title">Our Journey</h2>
          <div className="abt-timeline">
            {TIMELINE.map((item, i) => (
              <div key={i} className="abt-tl-item">
                <div className="abt-tl-dot" />
                <div className="abt-tl-content">
                  <span className="abt-tl-year">{item.year}</span>
                  <p className="abt-tl-event">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────── */}
        <section className="abt-section">
          <h2 className="abt-section-title">What Freelancers Say</h2>
          <div className="abt-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="abt-testimonial-card">
                <FaQuoteLeft size={18} className="abt-quote-icon" />
                <p className="abt-testimonial-text">{t.quote}</p>
                <div className="abt-testimonial-footer">
                  <div className="abt-testimonial-avatar" style={{ background: t.color + "20", borderColor: t.color + "50", color: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="abt-testimonial-author">{t.author}</p>
                    <p className="abt-testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section className="abt-section">
          <h2 className="abt-section-title">Frequently Asked Questions</h2>
          <div className="abt-faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`abt-faq-item${openFaq === i ? " open" : ""}`} onClick={() => toggleFaq(i)}>
                <div className="abt-faq-question">
                  <span>{faq.question}</span>
                  <FaChevronDown className={`abt-faq-chevron${openFaq === i ? " rotated" : ""}`} />
                </div>
                {openFaq === i && <p className="abt-faq-answer">{faq.answer}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing CTA ──────────────────────────────────── */}
        <section className="abt-section abt-pricing-cta">
          <div className="abt-pricing-card abt-pricing-free">
            <div className="abt-pricing-badge" style={{ color: "#4caf82", borderColor: "#4caf8240", background: "#4caf8215" }}>
              <FaCheckCircle size={10} /> Free Forever
            </div>
            <h3 className="abt-pricing-name">Free</h3>
            <div className="abt-pricing-price">$0<span>/mo</span></div>
            <ul className="abt-pricing-list">
              {["Tasks & Kanban board", "Client CRM", "Invoices", "Connections", "7 Atelier tools", "Unlimited everything"].map(f => (
                <li key={f}><FaCheckCircle size={11} color="#4caf82" /> {f}</li>
              ))}
            </ul>
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className="abt-pricing-btn free">
              {isAuthenticated ? "Go to Dashboard" : "Start Free"}
            </Link>
          </div>
          <div className="abt-pricing-card abt-pricing-premium">
            <div className="abt-pricing-badge abt-gold-badge">
              <FaCrown size={10} /> Most Popular
            </div>
            <h3 className="abt-pricing-name" style={{ color: "#c9a84c" }}>Premium</h3>
            <div className="abt-pricing-price abt-gold-text">$19<span>/mo</span></div>
            <ul className="abt-pricing-list">
              {["Everything in Free", "Earnings Analytics + Goals", "Smart Contracts (4 templates)", "Proposal Builder + Win Rate", "Tax Summary + Quarterly", "Priority support"].map(f => (
                <li key={f}><FaCheckCircle size={11} color="#c9a84c" /> {f}</li>
              ))}
            </ul>
            <Link to="/atelier" className="abt-pricing-btn premium">
              Upgrade in Atelier
            </Link>
          </div>
        </section>

        {/* ── Newsletter ───────────────────────────────────── */}
        <section className="abt-section abt-newsletter">
          <div className="abt-newsletter-inner">
            <h2 className="abt-section-title" style={{ textAlign: "center" }}>Stay in the Loop</h2>
            <p className="abt-newsletter-sub">
              Get the latest features, freelancer tips, and product updates.
              No spam. Unsubscribe any time.
            </p>
            <form className="abt-newsletter-form" onSubmit={handleNewsletter} noValidate>
              <input
                type="email"
                placeholder="your@email.com"
                className="abt-newsletter-input"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSubMsg(""); }}
              />
              <button type="submit" className="abt-btn-primary">
                <FaPaperPlane size={12} /> Subscribe
              </button>
            </form>
            {subMsg === "success" && <p className="abt-sub-msg success">✓ You're subscribed! Welcome to the Aurelance community.</p>}
            {subMsg === "error"   && <p className="abt-sub-msg error">Please enter a valid email address.</p>}
          </div>
        </section>

        {/* ── Contact CTA ──────────────────────────────────── */}
        <section className="abt-section abt-contact">
          <div className="abt-contact-inner">
            <FaEnvelope size={28} className="abt-contact-icon" />
            <h2 className="abt-section-title" style={{ marginBottom: 8 }}>Get in Touch</h2>
            <p className="abt-card-text" style={{ textAlign: "center", maxWidth: 420 }}>
              Questions, feedback, or partnership inquiries?
              We read every message and reply within 24 hours.
            </p>
            <Link to="/contact" className="abt-btn-primary" style={{ marginTop: 16 }}>
              <FaEnvelope size={13} /> Contact Us
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;