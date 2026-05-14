// src/pages/Contact.jsx — Production Final
import React, { useState, useRef } from "react";
import {
  FaEnvelope, FaPaperPlane, FaFacebookF, FaTwitter,
  FaLinkedinIn, FaInstagram, FaGithub, FaClock,
  FaCheck, FaChevronDown, FaHeadset, FaShieldAlt,
  FaRocket, FaMapMarkerAlt, FaExclamationCircle,
} from "react-icons/fa";
import '../styles/components.css';

/* ── API ───────────────────────────────────────────────────── */
const BASE    = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const postJSON = (url, body) =>
  fetch(`${BASE}${url}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  }).then(r => r.json());

/* ── Constants ─────────────────────────────────────────────── */
const MAX_MSG = 2000;

const SUBJECTS = [
  { value: "",            label: "Select a subject…"       },
  { value: "general",     label: "General Enquiry"         },
  { value: "support",     label: "Technical Support"       },
  { value: "billing",     label: "Billing & Plans"         },
  { value: "partnership", label: "Partnership / Business"  },
  { value: "bug",         label: "Bug Report"              },
  { value: "feedback",    label: "Product Feedback"        },
  { value: "other",       label: "Other"                   },
];

const FAQS = [
  {
    q: "What is your typical response time?",
    a: "We respond to all enquiries within 24 hours on business days (Mon–Fri, PKT timezone). Weekend messages are answered the following Monday.",
  },
  {
    q: "How do I upgrade or cancel my Premium plan?",
    a: "Plan management is in your Settings page inside the dashboard. Cancellations take effect at the end of your billing cycle — no hidden fees, no lock-in.",
  },
  {
    q: "Do you offer a refund?",
    a: "Yes — we offer a 7-day money-back guarantee on all paid plans. Contact us within 7 days of payment and we'll issue a full refund, no questions asked.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit (HTTPS/TLS) and at rest (MongoDB Atlas). We use JWT authentication, never store plain-text passwords, and never sell your data.",
  },
  {
    q: "Do you offer custom or enterprise solutions?",
    a: "Yes. Choose 'Partnership / Business' as the subject in the form above and include your requirements. We'll follow up within one business day.",
  },
  {
    q: "Where is Aurelance based?",
    a: "Aurelance is a fully remote, globally distributed team. Primary support timezone is PKT (Pakistan Standard Time, UTC+5).",
  },
];

/* ── Validation ────────────────────────────────────────────── */
const validate = ({ name, email, subject, message }) => {
  const e = {};
  if (!name.trim() || name.trim().length < 2)
    e.name    = "Please enter your full name (at least 2 characters).";
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    e.email   = "Please enter a valid email address.";
  if (!subject)
    e.subject = "Please select a subject.";
  if (!message.trim() || message.trim().length < 20)
    e.message = "Message must be at least 20 characters.";
  return e;
};

/* ── Component ─────────────────────────────────────────────── */
const Contact = () => {
  const BLANK = { name:"", email:"", subject:"", message:"", honeypot:"" };
  const [form,       setForm]       = useState(BLANK);
  const [errors,     setErrors]     = useState({});
  const [sending,    setSending]    = useState(false);
  const [sentName,   setSentName]   = useState("");
  const [sentEmail,  setSentEmail]  = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [serverErr,  setServerErr]  = useState("");

  const [nl,         setNl]         = useState("");
  const [nlErr,      setNlErr]      = useState("");
  const [nlOk,       setNlOk]       = useState(false);
  const [nlBusy,     setNlBusy]     = useState(false);

  const [openFaq,    setOpenFaq]    = useState(null);
  const formRef = useRef(null);

  /* ── form handlers ── */
  const change = e => {
    const { id, value } = e.target;
    setForm(p => ({ ...p, [id]: value }));
    if (errors[id]) setErrors(p => { const n={...p}; delete n[id]; return n; });
    setServerErr("");
  };

  const submit = async e => {
    e.preventDefault();
    if (form.honeypot) return; // bot trap
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSending(true);
    setServerErr("");
    try {
      const res = await postJSON("/contact", {
        name:    form.name.trim(),
        email:   form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      if (res?.error) throw new Error(res.error);
      setSentName(form.name.trim());
      setSentEmail(form.email.trim());
      setSubmitted(true);
      setForm(BLANK);
      setErrors({});
      formRef.current?.scrollIntoView({ behavior:"smooth", block:"start" });
    } catch (err) {
      setServerErr(
        err.message === "Failed to fetch"
          ? "Could not connect to server. Please email us directly at aurelance454@gmail.com"
          : err.message || "Something went wrong. Please try again."
      );
    } finally { setSending(false); }
  };

  /* ── newsletter handler ── */
  const handleNl = async e => {
    e.preventDefault();
    if (!nl.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nl)) {
      setNlErr("Please enter a valid email address."); return;
    }
    setNlBusy(true); setNlErr("");
    try {
      await postJSON("/newsletter", { email: nl.trim() });
      setNlOk(true); setNl("");
    } catch { setNlErr("Could not subscribe right now. Please try again later."); }
    finally   { setNlBusy(false); }
  };

  const msgLen = form.message.length;

  return (
    <div className="con-page">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="con-hero">
        <div className="con-badge"><FaHeadset size={11}/> Support &amp; Contact</div>
        <h1 className="con-hero-h1">Get in Touch</h1>
        <p className="con-hero-sub">
          A question, a bug, a partnership idea, or just feedback?
          We read every message and reply within 24 hours.
        </p>
        <div className="con-trust-row">
          <span><FaShieldAlt size={11}/> Secure &amp; Private</span>
          <span><FaClock     size={11}/> 24hr Response</span>
          <span><FaRocket    size={11}/> 7-Day Money Back</span>
        </div>
      </section>

      {/* ── Main grid ────────────────────────────────────── */}
      <div className="con-grid">

        {/* LEFT — Form */}
        <div className="con-form-wrap" ref={formRef}>

          {submitted ? (
            /* Success state */
            <div className="con-success">
              <div className="con-success-icon"><FaCheck size={22}/></div>
              <h2>Message Sent!</h2>
              <p>
                Thanks, <strong>{sentName}</strong>! We've received your message and will reply to{" "}
                <strong>{sentEmail}</strong> within 24 hours.
              </p>
              <button className="con-btn" style={{ marginTop:16 }} onClick={() => setSubmitted(false)}>
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <h2 className="con-form-title">Send a Message</h2>

              {serverErr && (
                <div className="con-server-err">
                  <FaExclamationCircle size={13}/> {serverErr}
                </div>
              )}

              <form className="con-form" onSubmit={submit} noValidate>

                {/* Honeypot */}
                <input type="text" id="honeypot" value={form.honeypot} onChange={change}
                  tabIndex={-1} aria-hidden="true" autoComplete="off" style={{display:"none"}}/>

                {/* Name + Email */}
                <div className="con-row">
                  <div className="con-field">
                    <label htmlFor="name">Full Name <span className="con-req">*</span></label>
                    <input id="name" type="text" placeholder="Alex Rivera"
                      value={form.name} onChange={change} autoComplete="name"
                      className={errors.name ? "con-input-err" : ""}/>
                    {errors.name && <span className="con-err-msg">{errors.name}</span>}
                  </div>
                  <div className="con-field">
                    <label htmlFor="email">Email Address <span className="con-req">*</span></label>
                    <input id="email" type="email" placeholder="you@example.com"
                      value={form.email} onChange={change} autoComplete="email"
                      className={errors.email ? "con-input-err" : ""}/>
                    {errors.email && <span className="con-err-msg">{errors.email}</span>}
                  </div>
                </div>

                {/* Subject */}
                <div className="con-field">
                  <label htmlFor="subject">Subject <span className="con-req">*</span></label>
                  <select id="subject" value={form.subject} onChange={change}
                    className={errors.subject ? "con-input-err" : ""}>
                    {SUBJECTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  {errors.subject && <span className="con-err-msg">{errors.subject}</span>}
                </div>

                {/* Message */}
                <div className="con-field">
                  <label htmlFor="message">
                    Message <span className="con-req">*</span>
                    <span className={`con-counter${msgLen > MAX_MSG * .9 ? " warn" : ""}`}>
                      {msgLen}/{MAX_MSG}
                    </span>
                  </label>
                  <textarea id="message" rows={6} maxLength={MAX_MSG}
                    placeholder="Describe your question, issue, or idea in detail…"
                    value={form.message} onChange={change}
                    className={errors.message ? "con-input-err" : ""}/>
                  {errors.message && <span className="con-err-msg">{errors.message}</span>}
                </div>

                <button type="submit" className="con-btn" disabled={sending}>
                  {sending
                    ? <><span className="con-spinner"/> Sending…</>
                    : <><FaPaperPlane size={12}/> Send Message</>}
                </button>

                <p className="con-privacy">
                  <FaShieldAlt size={11}/> Your message is sent securely and never shared with third parties.
                </p>
              </form>
            </>
          )}

          {/* Newsletter */}
          <div className="con-newsletter">
            <h3 className="con-nl-title">Stay in the Loop</h3>
            <p className="con-nl-sub">
              Product updates, freelancer tips, and new features.
              No spam — unsubscribe any time.
            </p>
            {nlOk ? (
              <div className="con-nl-ok"><FaCheck size={12}/> You're subscribed! Welcome to Aurelance.</div>
            ) : (
              <form className="con-nl-form" onSubmit={handleNl} noValidate>
                <input type="email" className="con-nl-input" placeholder="your@email.com"
                  value={nl} onChange={e => { setNl(e.target.value); setNlErr(""); }}/>
                <button type="submit" className="con-nl-btn" disabled={nlBusy}>
                  {nlBusy ? "…" : "Subscribe"}
                </button>
              </form>
            )}
            {nlErr && <p className="con-nl-err">{nlErr}</p>}
          </div>
        </div>

        {/* RIGHT — Info */}
        <div className="con-info">

          <div className="con-info-card">
            <div className="con-info-icon-wrap" style={{ color:"#4a90d9", background:"rgba(74,144,217,.1)", borderColor:"rgba(74,144,217,.25)" }}>
              <FaEnvelope size={16}/>
            </div>
            <div>
              <div className="con-info-label">Email</div>
              <a href="mailto:aurelance454@gmail.com" className="con-info-value">
                aurelance454@gmail.com
              </a>
              <div className="con-info-sub">We reply within 24 hours</div>
            </div>
          </div>

          <div className="con-info-card">
            <div className="con-info-icon-wrap" style={{ color:"#4caf82", background:"rgba(76,175,130,.1)", borderColor:"rgba(76,175,130,.25)" }}>
              <FaClock size={16}/>
            </div>
            <div>
              <div className="con-info-label">Support Hours</div>
              <div className="con-hours">
                <span><strong>Mon – Fri</strong> 9 AM – 6 PM PKT</span>
                <span><strong>Saturday</strong> 10 AM – 2 PM PKT</span>
                <span><strong>Sunday</strong> Closed</span>
              </div>
            </div>
          </div>

          <div className="con-info-card">
            <div className="con-info-icon-wrap" style={{ color:"#9b72e8", background:"rgba(155,114,232,.1)", borderColor:"rgba(155,114,232,.25)" }}>
              <FaMapMarkerAlt size={16}/>
            </div>
            <div>
              <div className="con-info-label">Location</div>
              <div className="con-info-value">Pakistan</div>
              <div className="con-info-sub">Fully remote · Global team</div>
            </div>
          </div>

          {/* Social */}
          <div className="con-social-card">
            <div className="con-info-label" style={{ marginBottom:14 }}>Follow Aurelance</div>
            <div className="con-social-row">
              <a href="https://twitter.com/aurelance"             target="_blank" rel="noopener noreferrer" className="con-social twitter"   aria-label="Twitter"><FaTwitter/></a>
              <a href="https://linkedin.com/company/aurelance"    target="_blank" rel="noopener noreferrer" className="con-social linkedin"  aria-label="LinkedIn"><FaLinkedinIn/></a>
              <a href="https://github.com/muneeb12011"            target="_blank" rel="noopener noreferrer" className="con-social github"    aria-label="GitHub"><FaGithub/></a>
              <a href="https://facebook.com/aurelance"            target="_blank" rel="noopener noreferrer" className="con-social facebook"  aria-label="Facebook"><FaFacebookF/></a>
              <a href="https://instagram.com/aurelance"           target="_blank" rel="noopener noreferrer" className="con-social instagram" aria-label="Instagram"><FaInstagram/></a>
            </div>
          </div>

          {/* Response SLA */}
          <div className="con-sla-card">
            <div className="con-sla-row">
              <span>General enquiries</span><strong>&lt; 24 hrs</strong>
            </div>
            <div className="con-sla-row">
              <span>Technical support</span><strong>&lt; 12 hrs</strong>
            </div>
            <div className="con-sla-row">
              <span>Billing issues</span><strong>&lt; 6 hrs</strong>
            </div>
            <div className="con-sla-row">
              <span>Bug reports</span><strong>&lt; 48 hrs</strong>
            </div>
          </div>

        </div>
      </div>

      {/* ── Map ──────────────────────────────────────────── */}
      <div className="con-map-wrap">
        <iframe
          title="Aurelance — Pakistan"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13688800.553456936!2d60.87860200000001!3d30.375321!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38db52d2f8fd751f%3A0x46b7a1f7e614925c!2sPakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"
        />
      </div>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="con-faq">
        <h2 className="con-faq-title">Frequently Asked Questions</h2>
        <div className="con-faq-list">
          {FAQS.map((faq, i) => (
            <div key={i} className={`con-faq-item${openFaq === i ? " open" : ""}`}>
              <button className="con-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}>
                <span>{faq.q}</span>
                <FaChevronDown className={`con-faq-arrow${openFaq === i ? " up" : ""}`}/>
              </button>
              {openFaq === i && <p className="con-faq-a">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Contact;