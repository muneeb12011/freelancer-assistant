import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaQuestionCircle,
  FaHistory,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaPaperPlane,
  FaStar,
  FaComments,
  FaArrowUp,
  FaTrashAlt,
  FaTimes,
  FaPhoneAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaFileAlt,
  FaShareAlt,
  FaHeadset,
} from "react-icons/fa";
import "../styles/Support.css";

const SupportPage = () => {
  // ----------------------
  // Tab Navigation State
  // ----------------------
  const [activeTab, setActiveTab] = useState("faq"); // faq, history, search, contact, chat, rate

  // ----------------------
  // Contact Form States
  // ----------------------
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  // ----------------------
  // Notification States
  // ----------------------
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ----------------------
  // FAQ States
  // ----------------------
  const initialFaqs = [
    {
      id: 1,
      category: "Account",
      question: "How can I reset my password?",
      answer: "Go to the 'Privacy' section in settings and click 'Change Password.'",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: 2,
      category: "Support",
      question: "How do I contact support?",
      answer: "Fill out the form below or email us at support@freelancersassistant.com.",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: 3,
      category: "Payment",
      question: "What payment methods do you accept?",
      answer: "We accept credit cards, PayPal, and bank transfers.",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: 4,
      category: "Ticket",
      question: "Can I track my support ticket?",
      answer: "Yes, you can enter your ticket ID below or search for your ticket.",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: 5,
      category: "Billing",
      question: "How do I update my billing information?",
      answer: "You can update your billing info from the Account Settings under 'Billing'.",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: 6,
      category: "Account",
      question: "How can I change my email address?",
      answer: "Navigate to the 'Profile' section and select 'Edit Email' to update your email.",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: 7,
      category: "General",
      question: "What is your refund policy?",
      answer: "Please refer to our Refund Policy page for detailed information regarding refunds.",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
    {
      id: 8,
      category: "Technical",
      question: "How do I update my software?",
      answer: "Visit the Updates section in your account to download the latest version.",
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
  ];
  const [faqsData, setFaqsData] = useState(initialFaqs);
  const [faqOpen, setFaqOpen] = useState(null);
  const [faqSearch, setFaqSearch] = useState("");
  const [selectedFaqCategory, setSelectedFaqCategory] = useState("All");

  // ----------------------
  // Ticket Lookup / Search States
  // ----------------------
  const [ticketId, setTicketId] = useState("");
  const [ticketStatus, setTicketStatus] = useState(null);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketResults, setTicketResults] = useState([]);

  // ----------------------
  // Support History State
  // ----------------------
  const [supportHistory, setSupportHistory] = useState([]);

  // ----------------------
  // Chat States
  // ----------------------
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatContainerRef = useRef(null);

  // ----------------------
  // Rating States
  // ----------------------
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  // ----------------------
  // Loading & Modal States
  // ----------------------
  const [loading, setLoading] = useState(false);
  const [showAgentChatModal, setShowAgentChatModal] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ----------------------
  // Refs
  // ----------------------
  const contactFormRef = useRef(null);

  // ----------------------
  // Fetch Support History on Mount
  // ----------------------
  useEffect(() => {
    axios
      .get("/api/support-history")
      .then((response) => {
        setSupportHistory(response.data.history || []);
      })
      .catch(() => {
        // Optionally handle error
      });
  }, []);

  // ----------------------
  // Auto-Clear Notifications
  // ----------------------
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // ----------------------
  // Auto-Scroll Chat to Bottom
  // ----------------------
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // ----------------------
  // Listen to Scroll for Scroll-to-Top
  // ----------------------
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ----------------------
  // Handle File Selection & Preview
  // ----------------------
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setAttachment(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setAttachmentPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  // ----------------------
  // Reset Contact Form
  // ----------------------
  const resetContactForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setAttachment(null);
    setAttachmentPreview(null);
  };

  // ----------------------
  // Contact Form Submission
  // ----------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!name || !email || !message) {
      setErrorMessage("All fields are required.");
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("message", message);
      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await axios.post("/api/support", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200) {
        setSuccessMessage("Your message has been sent successfully!");
        resetContactForm();
      }
    } catch {
      setErrorMessage("There was an error sending your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Ticket Status Lookup
  // ----------------------
  const checkTicketStatus = async () => {
    if (!ticketId) {
      setTicketStatus("Please enter a valid ticket ID.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`/api/ticket-status/${ticketId}`);
      setTicketStatus(response.data.status);
    } catch {
      setTicketStatus("Invalid ticket ID or ticket not found.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Ticket Search
  // ----------------------
  const handleTicketSearchSubmit = async () => {
    if (!ticketSearch) {
      setErrorMessage("Please enter a search term.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/tickets?query=${encodeURIComponent(ticketSearch)}`
      );
      setTicketResults(response.data.tickets || []);
    } catch {
      setErrorMessage("Error searching tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // AI Chat Submission
  // ----------------------
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatHistory((prev) => [...prev, { sender: "user", text: userMessage }]);
    setChatInput("");

    setLoading(true);
    try {
      const response = await axios.post("/api/ai-support-chat", {
        message: userMessage,
      });
      setChatHistory((prev) => [...prev, { sender: "bot", text: response.data.reply }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // Clear Chat History
  // ----------------------
  const clearChat = () => setChatHistory([]);

  // ----------------------
  // Rating Submission
  // ----------------------
  const handleRatingSubmit = () => {
    if (rating === 0) {
      setErrorMessage("Please provide a rating.");
      return;
    }
    setLoading(true);
    axios
      .post("/api/rate-support", { rating, comment: ratingComment })
      .then(() => {
        setSuccessMessage("Thank you for your feedback!");
        setRating(0);
        setRatingComment("");
      })
      .catch(() => setErrorMessage("Error submitting your rating."))
      .finally(() => setLoading(false));
  };

  // ----------------------
  // FAQ Feedback Handling
  // ----------------------
  const handleFaqFeedback = (faqId, isHelpful) => {
    setFaqsData((prevFaqs) =>
      prevFaqs.map((faq) =>
        faq.id === faqId
          ? {
              ...faq,
              helpfulCount: isHelpful ? faq.helpfulCount + 1 : faq.helpfulCount,
              notHelpfulCount: !isHelpful ? faq.notHelpfulCount + 1 : faq.notHelpfulCount,
            }
          : faq
      )
    );
  };

  // ----------------------
  // Scroll to Contact Form
  // ----------------------
  const scrollToContact = () => { 
    if (contactFormRef.current) {
      contactFormRef.current.scrollIntoView({ behavior: "smooth" });
      setActiveTab("contact");
    }
  };

  // ----------------------
  // Request Live Agent (Modal)
  // ----------------------
  const requestLiveAgent = () => {
    setShowAgentChatModal(true);
    setTimeout(() => {
      setShowAgentChatModal(false);
      setSuccessMessage("A live agent will contact you shortly.");
    }, 3000);
  };

  // ----------------------
  // Contact Options (Modal)
  // ----------------------
  const handleCallSupport = () => setShowContactOptions(true);
  const handleEmailSupport = () => (window.location.href = "mailto:support@freelancersassistant.com");
  const handleWhatsAppSupport = () =>
    (window.location.href = "https://api.whatsapp.com/send?phone=+923113313836");

  // ----------------------
  // Scroll-to-Top Handler
  // ----------------------
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // ----------------------
  // Share Support Page
  // ----------------------
  const handleShareSupport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Support - Freelancer Assistant",
          text: "Get support from Freelancer Assistant.",
          url: window.location.href,
        });
      } catch {}
    } else {
      alert("Sharing is not supported in your browser.");
    }
  };

  // ----------------------
  // Filtered FAQs
  // ----------------------
  const filteredFaqs = faqsData.filter(
    (faq) =>
      (selectedFaqCategory === "All" || faq.category === selectedFaqCategory) &&
      (faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        faq.answer.toLowerCase().includes(faqSearch.toLowerCase()))
  );

  // ----------------------
  // Render Methods for Each Tab
  // ----------------------

  const renderFaqTab = () => (
    <div className="mb-8">
      <h2 className="section-title">
        <FaQuestionCircle className="icon-inline" /> Frequently Asked Questions
      </h2>
      <div className="faq-filters mb-4">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={faqSearch}
          onChange={(e) => setFaqSearch(e.target.value)}
          className="form-input"
        />
        <select
          value={selectedFaqCategory}
          onChange={(e) => setSelectedFaqCategory(e.target.value)}
          className="form-input"
        >
          <option value="All">All Categories</option>
          <option value="Account">Account</option>
          <option value="Support">Support</option>
          <option value="Payment">Payment</option>
          <option value="Ticket">Ticket</option>
          <option value="Billing">Billing</option>
          <option value="General">General</option>
          <option value="Technical">Technical</option>
        </select>
      </div>
      <div className="faq-list">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className={`faq-item ${faqOpen === faq.id ? "faq-open" : ""}`}
            >
              <div
                className="faq-header"
                onClick={() => setFaqOpen(faqOpen === faq.id ? null : faq.id)}
              >
                <div className="faq-question-wrapper">
                  <span className="faq-arrow">
                    {faqOpen === faq.id ? "▼" : "▶"}
                  </span>
                  <h3 className="faq-question">{faq.question}</h3>
                </div>
                <span className="faq-category">{faq.category}</span>
              </div>
              {faqOpen === faq.id && (
                <div className="faq-body">
                  <p className="faq-answer">{faq.answer}</p>
                  <div className="faq-feedback">
                    <span>Was this helpful?</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFaqFeedback(faq.id, true);
                      }}
                      className="fdbtn-helpful"
                    >
                      <FaThumbsUp /> {faq.helpfulCount}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFaqFeedback(faq.id, false);
                      }}
                      className="fdbtn-nothelpful"
                    >
                      <FaThumbsDown /> {faq.notHelpfulCount}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="no-results">No FAQs match your search.</p>
        )}
      </div>
      <button
        onClick={scrollToContact}
        className="btn-primary ask-question-btn"
      >
        <FaPaperPlane />
        Ask a Question
      </button>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="mb-8">
      <h2 className="section-title">
        <FaHistory className="icon-inline" /> Support History
      </h2>
      {supportHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {supportHistory.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.id}</td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.status}</td>
                  <td>
                    {new Date(ticket.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-results">No support history available.</p>
      )}
    </div>
  );

  const renderSearchTab = () => (
    <div className="mb-8">
      <h2 className="section-title">
        <FaSearch className="icon-inline" /> Search Tickets
      </h2>
      <div className="search-controls mb-4">
        <input
          type="text"
          placeholder="Enter ticket ID or keyword"
          value={ticketSearch}
          onChange={(e) => setTicketSearch(e.target.value)}
          className="form-input"
        />
        <button
          onClick={handleTicketSearchSubmit}
          className="btn-primary"
        >
          <FaSearch /> Search
        </button>
      </div>
      {loading && <p className="loading-text">Searching...</p>}
      {ticketResults.length > 0 && (
        <div className="search-results">
          <ul>
            {ticketResults.map((ticket) => (
              <li key={ticket.id} className="ticket-item">
                <div>
                  <p>
                    <span className="bold-label">ID:</span> {ticket.id}
                  </p>
                  <p>
                    <span className="bold-label">Subject:</span> {ticket.subject}
                  </p>
                </div>
                <span
                  className={`status-badge ${
                    ticket.status === "Open" ? "status-open" : "status-closed"
                  }`}
                >
                  {ticket.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderContactTab = () => (
    <div ref={contactFormRef} className="mb-8">
      <h2 className="section-title">
        <FaEnvelope className="icon-inline" /> Contact Support
      </h2>
      <div className="contact-form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Your Message"
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              className="form-textarea"
            ></textarea>
          </div>
          <div className="form-group file-group">
            <label className="file-label">
              <span className="file-text">Attach File (optional)</span>
              <input
                type="file"
                onChange={handleFileChange}
                disabled={loading}
                className="file-input"
              />
            </label>
            {attachment && (
              <div className="attachment-preview">
                {attachmentPreview ? (
                  <img
                    src={attachmentPreview}
                    alt="Preview"
                    className="attachment-img"
                  />
                ) : (
                  <FaFileAlt className="attachment-icon" />
                )}
                <div>
                  <p className="attachment-name">{attachment.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      setAttachmentPreview(null);
                    }}
                    className="remove-attachment-btn"
                  >
                    <FaTimes /> Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Sending..." : (
                <>
                  <FaPaperPlane />
                  Submit
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCallSupport}
              className="btn-secondary"
            >
              <FaPhoneAlt />
              Call/Chat Support
            </button>
            <button
              type="button"
              onClick={resetContactForm}
              className="btn-tertiary"
            >
              <FaTrashAlt />
              Reset Form
            </button>
          </div>
        </form>

        {successMessage && <p className="success-text">{successMessage}</p>}
        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <button
          onClick={handleShareSupport}
          className="btn-accent share-btn"
        >
          <FaShareAlt />
          Share Support Page
        </button>
      </div>
    </div>
  );

  const renderChatTab = () => (
    <div className="mb-8">
      <h2 className="section-title">
        <FaComments className="icon-inline" /> Live AI Chat Support
      </h2>
      <div className="chat-container">
        <div
          ref={chatContainerRef}
          className="chat-history"
        >
          {chatHistory.length === 0 && (
            <p className="no-messages">No messages yet. Start the conversation below!</p>
          )}
          {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`chat-message ${chat.sender === "user" ? "chat-user" : "chat-bot"}`}
            >
              <p>{chat.text}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleChatSubmit} className="chat-input-group">
          <input
            type="text"
            placeholder="Type your message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={loading}
            className="form-input chat-input"
          />
          <button
            type="submit"
            className="btn-primary chat-send-btn"
            disabled={loading}
          >
            Send
          </button>
        </form>
        <div className="chat-actions">
          <button onClick={clearChat} className="btn-tertiary">
            <FaTrashAlt /> Clear Chat
          </button>
          <button onClick={requestLiveAgent} className="btn-accent">
            <FaHeadset /> Request Live Agent
          </button>
        </div>
      </div>
    </div>
  );

  const renderRatingTab = () => (
    <div className="mb-8">
      <h2 className="section-title">
        <FaStar className="icon-inline" /> Rate Support
      </h2>
      <div className="rating-container">
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`star-btn ${rating >= star ? "star-selected" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          placeholder="Leave an optional comment..."
          rows="3"
          value={ratingComment}
          onChange={(e) => setRatingComment(e.target.value)}
          disabled={loading}
          className="form-textarea"
        ></textarea>
        <button
          onClick={handleRatingSubmit}
          className="btn-primary"
          disabled={loading}
        >
          Submit Rating
        </button>
      </div>
    </div>
  );

  return (
    <div className="support-page container">
      {/* Page Title */}
      <h1 className="page-title">Support Center</h1>

      {/* Tab Navigation */}
      <nav>
        <button
          onClick={() => setActiveTab("faq")}
          className={`tab-button ${activeTab === "faq" ? "tab-active" : ""}`}
        >
          <FaQuestionCircle className="icon-inline" /> FAQ
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`tab-button ${activeTab === "history" ? "tab-active" : ""}`}
        >
          <FaHistory className="icon-inline" /> History
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`tab-button ${activeTab === "search" ? "tab-active" : ""}`}
        >
          <FaSearch className="icon-inline" /> Search
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={`tab-button ${activeTab === "contact" ? "tab-active" : ""}`}
        >
          <FaEnvelope className="icon-inline" /> Contact
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`tab-button ${activeTab === "chat" ? "tab-active" : ""}`}
        >
          <FaComments className="icon-inline" /> Chat
        </button>
        <button
          onClick={() => setActiveTab("rate")}
          className={`tab-button ${activeTab === "rate" ? "tab-active" : ""}`}
        >
          <FaStar className="icon-inline" /> Rate
        </button>
      </nav>

      {/* Conditionally Render Active Tab */}
      <div className="tab-content">
        {activeTab === "faq" && renderFaqTab()}
        {activeTab === "history" && renderHistoryTab()}
        {activeTab === "search" && renderSearchTab()}
        {activeTab === "contact" && renderContactTab()}
        {activeTab === "chat" && renderChatTab()}
        {activeTab === "rate" && renderRatingTab()}
      </div>

      {/* Live Agent Modal */}
      {showAgentChatModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close-btn"
              onClick={() => setShowAgentChatModal(false)}
            >
              <FaTimes />
            </button>
            <h3 className="modal-title">Live Agent Request</h3>
            <p>Your request is being processed... Please wait.</p>
          </div>
        </div>
      )}

      {/* Contact Options Modal */}
      {showContactOptions && (
        <div className="modal-overlay" onClick={() => setShowContactOptions(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setShowContactOptions(false)}
            >
              <FaTimes />
            </button>
            <h3 className="modal-title">Contact Options</h3>
            <button
              onClick={handleEmailSupport}
              className="btn-primary modal-btn"
            >
              <FaEnvelope /> Email Support
            </button>
            <button
              onClick={handleWhatsAppSupport}
              className="btn-secondary modal-btn"
            >
              <FaPhoneAlt /> WhatsApp Support
            </button>
            <button
              onClick={() => setShowContactOptions(false)}
              className="btn-tertiary modal-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          className="scroll-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <FaArrowUp />
        </button>
      )}
    </div>
  );
};

export default SupportPage;
