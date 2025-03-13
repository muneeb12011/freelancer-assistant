import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/Support.css";

const SupportPage = () => {
  // Contact Support form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  // Notification states
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Enhanced FAQ states with additional FAQs
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

  // Ticket lookup/search states
  const [ticketId, setTicketId] = useState("");
  const [ticketStatus, setTicketStatus] = useState(null);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketResults, setTicketResults] = useState([]);

  // Support History state
  const [supportHistory, setSupportHistory] = useState([]);

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatContainerRef = useRef(null);

  // Rating states
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  // Loading indicator state
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showAgentChatModal, setShowAgentChatModal] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);

  // Scroll-to-top visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Ref for Contact Support form
  const contactFormRef = useRef(null);

  // -------------------------------
  // Fetch user profile (if needed)
  // -------------------------------
  useEffect(() => {
    axios
      .get("/api/user-profile")
      .then((response) => {
        // Process user profile data if needed
      })
      .catch(() => {
        setErrorMessage("Error fetching user profile.");
      });
  }, []);

  // -------------------------------
  // Auto-clear notifications
  // -------------------------------
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // -------------------------------
  // Auto-scroll chat to bottom
  // -------------------------------
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // -------------------------------
  // Fetch support history
  // -------------------------------
  useEffect(() => {
    axios
      .get("/api/support-history")
      .then((response) => {
        setSupportHistory(response.data.history || []);
      })
      .catch(() => {
        // Optionally, setErrorMessage("Error fetching support history.");
      });
  }, []);

  // -------------------------------
  // Listen to window scroll for Scroll-to-Top
  // -------------------------------
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -------------------------------
  // Handle file selection and preview for contact form
  // -------------------------------
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setAttachment(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachmentPreview(ev.target.result);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  // -------------------------------
  // Reset Contact Form
  // -------------------------------
  const resetContactForm = () => {
    setName("");
    setEmail("");
    setMessage("");
    setAttachment(null);
    setAttachmentPreview(null);
  };

  // -------------------------------
  // Contact form submission
  // -------------------------------
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
    } catch (error) {
      setErrorMessage("There was an error sending your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Ticket status lookup
  // -------------------------------
  const checkTicketStatus = async () => {
    if (!ticketId) {
      setTicketStatus("Please enter a valid ticket ID.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`/api/ticket-status/${ticketId}`);
      setTicketStatus(response.data.status);
    } catch (error) {
      setTicketStatus("Invalid ticket ID or ticket not found.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Ticket search
  // -------------------------------
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
    } catch (error) {
      setErrorMessage("Error searching tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // AI Chat submission
  // -------------------------------
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", text: userMessage },
    ]);
    setChatInput("");

    setLoading(true);
    try {
      const response = await axios.post("/api/ai-support-chat", {
        message: userMessage,
      });
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: response.data.reply },
      ]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, I couldn't process your request. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear chat history
  const clearChat = () => {
    setChatHistory([]);
  };

  // -------------------------------
  // Rating submission
  // -------------------------------
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
      .catch(() => {
        setErrorMessage("Error submitting your rating.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // -------------------------------
  // FAQ feedback handling
  // -------------------------------
  const handleFaqFeedback = (faqId, isHelpful) => {
    setFaqsData((prevFaqs) =>
      prevFaqs.map((faq) => {
        if (faq.id === faqId) {
          return {
            ...faq,
            helpfulCount: isHelpful ? faq.helpfulCount + 1 : faq.helpfulCount,
            notHelpfulCount: !isHelpful ? faq.notHelpfulCount + 1 : faq.notHelpfulCount,
          };
        }
        return faq;
      })
    );
  };

  // -------------------------------
  // Scroll to Contact Support form
  // -------------------------------
  const scrollToContact = () => {
    if (contactFormRef.current) {
      contactFormRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // -------------------------------
  // FAQ filtering (by search and category)
  // -------------------------------
  const filteredFaqs = faqsData.filter(
    (faq) =>
      (selectedFaqCategory === "All" || faq.category === selectedFaqCategory) &&
      (faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        faq.answer.toLowerCase().includes(faqSearch.toLowerCase()))
  );

  // -------------------------------
  // Request Live Agent (simulate modal)
  // -------------------------------
  const requestLiveAgent = () => {
    setShowAgentChatModal(true);
    setTimeout(() => {
      setShowAgentChatModal(false);
      setSuccessMessage("A live agent will contact you shortly.");
    }, 3000);
  };

  // -------------------------------
  // Contact Options (Email / WhatsApp)
  // -------------------------------
  const handleCallSupport = () => {
    setShowContactOptions(true);
  };

  const handleEmailSupport = () => {
    window.location.href = "mailto:support@freelancersassistant.com";
  };

  const handleWhatsAppSupport = () => {
    window.location.href = "https://api.whatsapp.com/send?phone=923113313836";
  };

  // -------------------------------
  // Scroll-to-top handler
  // -------------------------------
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -------------------------------
  // Share Support Page (using Web Share API)
  // -------------------------------
  const handleShareSupport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Support - Freelancer Assistant",
          text: "Get support from Freelancer Assistant.",
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Sharing is not supported in your browser.");
    }
  };

  return (
    <div className="support-page container">
      <div className="support-content">
        <h1 className="text-4xl font-bold mb-6">Support</h1>

        {/* Enhanced FAQ Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-4">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
            />
            <select
              value={selectedFaqCategory}
              onChange={(e) => setSelectedFaqCategory(e.target.value)}
              className="w-full sm:w-auto p-2 rounded bg-gray-700 text-white mt-2 sm:mt-0"
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
          <div className="faq-section">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`faq-item ${faqOpen === faq.id ? "open" : ""}`}
                  onClick={() => setFaqOpen(faqOpen === faq.id ? null : faq.id)}
                >
                  <div className="faq-header">
                    <span className="faq-question">
                      {faqOpen === faq.id ? "▼" : "▶"} {faq.question}
                    </span>
                    <span className="faq-category">{faq.category}</span>
                  </div>
                  {faqOpen === faq.id && (
                    <>
                      <p className="faq-answer">{faq.answer}</p>
                      <div className="faq-feedback">
                        <span className="text-sm">Was this helpful?</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFaqFeedback(faq.id, true);
                          }}
                          className="helpful-btn"
                        >
                          👍 {faq.helpfulCount}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFaqFeedback(faq.id, false);
                          }}
                          className="not-helpful-btn"
                        >
                          👎 {faq.notHelpfulCount}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No FAQs match your search.</p>
            )}
          </div>
          <button onClick={scrollToContact} className="mt-4 btn-blue full-width">
            Didn't find what you're looking for? Ask a Question
          </button>
        </div>

        {/* Support History Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Support History</h2>
          {supportHistory.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-2 border-b border-gray-600">Ticket ID</th>
                  <th className="p-2 border-b border-gray-600">Subject</th>
                  <th className="p-2 border-b border-gray-600">Status</th>
                  <th className="p-2 border-b border-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {supportHistory.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="p-2 border-b border-gray-600">{ticket.id}</td>
                    <td className="p-2 border-b border-gray-600">{ticket.subject}</td>
                    <td className="p-2 border-b border-gray-600">{ticket.status}</td>
                    <td className="p-2 border-b border-gray-600">
                      {new Date(ticket.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No support history available.</p>
          )}
        </div>

        {/* Ticket Search Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Search Tickets</h2>
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-700 text-white mb-3"
            placeholder="Enter ticket ID or keyword"
            value={ticketSearch}
            onChange={(e) => setTicketSearch(e.target.value)}
          />
          <button onClick={handleTicketSearchSubmit} className="w-full btn-blue">
            Search Tickets
          </button>
          {loading && <p className="mt-4">Loading...</p>}
          {ticketResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-medium mb-2">Results:</h3>
              <ul>
                {ticketResults.map((ticket) => (
                  <li key={ticket.id} className="p-2 border-b border-gray-600">
                    <span className="font-semibold">ID:</span> {ticket.id} |{" "}
                    <span className="font-semibold">Subject:</span> {ticket.subject} |{" "}
                    <span className="font-semibold">Status:</span> {ticket.status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Ticket Status Lookup Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Check Ticket Status</h2>
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-700 text-white mb-3"
            placeholder="Enter your ticket ID"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
          />
          <button onClick={checkTicketStatus} className="w-full btn-blue">
            Check Status
          </button>
          {loading && <p className="mt-4">Loading...</p>}
          {ticketStatus && <p className="mt-4">{ticketStatus}</p>}
        </div>

        {/* Contact Support Section */}
        <div ref={contactFormRef} className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Contact Support</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <input
              type="email"
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <textarea
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              placeholder="Your Message"
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            ></textarea>
            <input
              type="file"
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              onChange={handleFileChange}
              disabled={loading}
            />
            {attachmentPreview && (
              <div className="attachment-preview mb-4">
                <p>Attachment Preview:</p>
                <img src={attachmentPreview} alt="Attachment Preview" style={{ maxWidth: "200px" }} />
                <button type="button" onClick={() => { setAttachment(null); setAttachmentPreview(null); }} className="btn-red">
                  Remove Attachment
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <button type="submit" className="w-full btn-blue" disabled={loading}>
                Submit
              </button>
              <button type="button" onClick={handleCallSupport} className="w-full btn-green">
                Call/Chat Support
              </button>
              <button type="button" onClick={resetContactForm} className="w-full btn-gray">
                Reset Form
              </button>
            </div>
          </form>
          {successMessage && <p className="mt-4 text-green-500">{successMessage}</p>}
          {errorMessage && <p className="mt-4 text-red-500">{errorMessage}</p>}
          <button onClick={handleShareSupport} className="mt-4 full-width btn-purple">
            Share Support Page
          </button>
        </div>

        {/* Rating Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Rate Support</h2>
          <div className="flex items-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-2 ${rating >= star ? "bg-yellow-500" : "bg-gray-700"} rounded`}
              >
                ⭐
              </button>
            ))}
          </div>
          <textarea
            className="w-full p-2 rounded bg-gray-700 text-white mb-4"
            placeholder="Leave an optional comment..."
            rows="2"
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
          ></textarea>
          <button onClick={handleRatingSubmit} className="w-full btn-blue" disabled={loading}>
            Submit Rating
          </button>
        </div>

        {/* AI Chatbot Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4">Live AI Chat Support</h2>
          <div
            ref={chatContainerRef}
            className="h-60 overflow-y-auto bg-gray-700 p-4 rounded-md mb-4"
          >
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`mb-2 ${chat.sender === "user" ? "text-right" : "text-left"}`}
              >
                <p className={chat.sender === "user" ? "text-blue-400" : "text-gray-300"}>
                  {chat.text}
                </p>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit} className="flex">
            <input
              type="text"
              className="w-full p-2 rounded-l bg-gray-700 text-white"
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 p-2 rounded-r font-medium" disabled={loading}>
              Send
            </button>
          </form>
          <div className="mt-3 flex gap-4">
            <button onClick={clearChat} className="w-full btn-red">
              Clear Chat
            </button>
            <button onClick={requestLiveAgent} className="w-full btn-purple">
              Request Live Agent
            </button>
          </div>
        </div>

        {/* Live Agent Modal */}
        {showAgentChatModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="text-xl font-semibold mb-4">Live Agent Request</h3>
              <p>Your request for a live agent is being processed...</p>
            </div>
          </div>
        )}

        {/* Contact Options Modal */}
        {showContactOptions && (
          <div className="modal-overlay" onClick={() => setShowContactOptions(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">Contact Options</h3>
              <button onClick={handleEmailSupport} className="w-full btn-blue mb-2">
                Email Support
              </button>
              <button onClick={handleWhatsAppSupport} className="w-full btn-green mb-2">
                WhatsApp Support
              </button>
              <button onClick={() => setShowContactOptions(false)} className="w-full btn-gray">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Scroll-to-Top Button */}
        {showScrollTop && (
          <button className="scroll-top" onClick={scrollToTop}>
            ↑ Top
          </button>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
