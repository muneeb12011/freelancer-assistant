/****************************************************************************************************
 * Connections.jsx – Enhanced Real-Time Connections, Chat, Job Listings, Portfolio, Activity Feed,
 * and Additional Features Page.
 *
 * New Features:
 *   - Quick Action Bar for easy navigation.
 *   - Favorite Connections: Mark and view favorite contacts.
 *   - Personal Notes: Attach personal notes to your connections.
 *   - Activity Summary: Quick overview of friend requests, connections, and upcoming meetings.
 *   - Upcoming Meetings: Display scheduled video calls/meetings.
 *
 * API endpoints ("/api/search-users", "/api/friend-request", "/api/chat/history", "/api/chat/ai",
 * "/api/chat/ai/suggest", "/api/chat/send-file", "/api/job-listings", "/api/job-listings/apply",
 * "/api/portfolio", "/api/activity", "/api/profile", "/api/group-chat", "/api/video-call/start",
 * "/api/upcoming-meetings", etc.) must be implemented on the backend.
 ****************************************************************************************************/

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "../styles/Connections.css";

// Custom hook to debounce a value.
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Connections = () => {
  // ---------------------------
  // STATE DECLARATIONS
  // ---------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);

  // Chat state
  const [chatHistory, setChatHistory] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fileUpload, setFileUpload] = useState(null);

  // AI Assistant state
  const [aiSuggestion, setAiSuggestion] = useState("");

  // Additional features state
  const [jobListings, setJobListings] = useState([]);
  const [jobFilter, setJobFilter] = useState("");
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityFilter, setActivityFilter] = useState("All");

  // New UI states
  const [favorites, setFavorites] = useState([]); // Array of connection IDs
  const [connectionNotes, setConnectionNotes] = useState({}); // Map connection ID => note
  const [profileModal, setProfileModal] = useState(null);
  const [groupChatModal, setGroupChatModal] = useState(false);
  const [groupChatSelected, setGroupChatSelected] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  // Loading states for other async operations
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [loadingJobListings, setLoadingJobListings] = useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // UI Notification for feedback
  const [notification, setNotification] = useState("");

  // Ref for auto-scrolling the chat container
  const chatContainerRef = useRef(null);

  // Auto-clear notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ---------------------------
  // QUICK ACTION BAR NAVIGATION
  // ---------------------------
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  // ---------------------------
  // INITIAL DATA FETCHING
  // ---------------------------
  const fetchInitialConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const [connRes, reqRes, sentRes, suggRes] = await Promise.all([
        axios.get("/api/connections"),
        axios.get("/api/friend-requests"),
        axios.get("/api/sent-friend-requests"),
        axios.get("/api/friend-suggestions")
      ]);
      setConnections(connRes.data.connections || []);
      setFriendRequests(reqRes.data.requests || []);
      setSentRequests(sentRes.data.requests || []);
      setSuggestions(suggRes.data.suggestions || []);
    } catch (error) {
      console.error("Error fetching connection data:", error);
      setNotification("Failed to load connection data. Please try again later.");
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialConnections();
  }, [fetchInitialConnections]);

  const fetchExtraData = useCallback(async () => {
    setLoadingJobListings(true);
    setLoadingPortfolio(true);
    setLoadingActivity(true);
    try {
      const [jobsRes, portfolioRes, activityRes] = await Promise.all([
        axios.get("/api/job-listings"),
        axios.get("/api/portfolio"),
        axios.get("/api/activity", { params: { page: 1 } })
      ]);
      setJobListings(jobsRes.data.listings || []);
      setPortfolioItems(portfolioRes.data.items || []);
      setActivityFeed(activityRes.data.activities || []);
    } catch (error) {
      console.error("Error fetching extra data:", error);
      setNotification("Error loading additional features.");
    } finally {
      setLoadingJobListings(false);
      setLoadingPortfolio(false);
      setLoadingActivity(false);
    }
  }, []);

  useEffect(() => {
    fetchExtraData();
  }, [fetchExtraData]);

  // Fetch Upcoming Meetings
  const fetchUpcomingMeetings = useCallback(async () => {
    setLoadingMeetings(true);
    try {
      const res = await axios.get("/api/upcoming-meetings");
      setUpcomingMeetings(res.data.meetings || []);
    } catch (error) {
      console.error("Error fetching upcoming meetings:", error);
      setNotification("Error loading upcoming meetings.");
    } finally {
      setLoadingMeetings(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingMeetings();
  }, [fetchUpcomingMeetings]);

  // ---------------------------
  // USER SEARCH FUNCTIONALITY (Debounced)
  // ---------------------------
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await axios.get("/api/search-users", {
          params: { query: debouncedSearchTerm }
        });
        setSearchResults(res.data.users || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setNotification("Error searching users.");
      }
    };
    searchUsers();
  }, [debouncedSearchTerm]);

  // ---------------------------
  // FRIEND REQUEST HANDLERS
  // ---------------------------
  const sendFriendRequest = useCallback(async (username) => {
    try {
      const res = await axios.post("/api/friend-request", { username });
      setNotification(`Friend request sent to ${username}.`);
      setSentRequests((prev) => [...prev, res.data.request]);
    } catch (error) {
      console.error("Error sending friend request:", error);
      setNotification("Error sending friend request.");
    }
  }, []);

  const acceptFriendRequest = useCallback(async (requestId) => {
    try {
      const res = await axios.post("/api/friend-request/accept", { requestId });
      setNotification(`Friend request accepted from ${res.data.connection.username}.`);
      setConnections((prev) => [...prev, res.data.connection]);
      setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setNotification("Error accepting friend request.");
    }
  }, []);

  const rejectFriendRequest = useCallback(async (requestId) => {
    try {
      await axios.post("/api/friend-request/reject", { requestId });
      setNotification("Friend request rejected.");
      setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setNotification("Error rejecting friend request.");
    }
  }, []);

  const cancelFriendRequest = useCallback(async (requestId) => {
    try {
      await axios.post("/api/friend-request/cancel", { requestId });
      setNotification("Friend request cancelled.");
      setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      setNotification("Error cancelling friend request.");
    }
  }, []);

  // ---------------------------
  // CONNECTION MANAGEMENT
  // ---------------------------
  const removeConnection = useCallback(async (connectionId) => {
    try {
      await axios.post("/api/remove-connection", { connectionId });
      setNotification("Connection removed successfully.");
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));
      setFavorites((prev) => prev.filter((id) => id !== connectionId));
      setConnectionNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[connectionId];
        return newNotes;
      });
    } catch (error) {
      console.error("Error removing connection:", error);
      setNotification("Error removing connection.");
    }
  }, []);

  const refreshConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const res = await axios.get("/api/connections");
      setConnections(res.data.connections || []);
      setNotification("Connections refreshed.");
    } catch (error) {
      console.error("Error refreshing connections:", error);
      setNotification("Error refreshing connections.");
    } finally {
      setLoadingConnections(false);
    }
  }, []);

  // ---------------------------
  // CHAT FUNCTIONALITY
  // ---------------------------
  const loadChatHistory = useCallback(async (connection) => {
    setChatLoading(true);
    try {
      const res = await axios.get("/api/chat/history", {
        params: { connectionId: connection.id }
      });
      setChatHistory(res.data.messages || []);
      setSelectedConnection(connection);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setNotification("Error loading chat history.");
    } finally {
      setChatLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConnection) return;
    try {
      await axios.post("/api/chat/send", {
        connectionId: selectedConnection.id,
        message: newMessage
      });
      setChatHistory((prev) => [...prev, { sender: "user", text: newMessage }]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setNotification("Error sending message.");
    }
  }, [newMessage, selectedConnection]);

  const sendAIMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConnection) return;
    try {
      const res = await axios.post("/api/chat/ai", {
        connectionId: selectedConnection.id,
        message: newMessage
      });
      setChatHistory((prev) => [...prev, { sender: "ai", text: res.data.reply }]);
      setNewMessage("");
    } catch (error) {
      console.error("Error communicating with AI assistant:", error);
      setNotification("Error communicating with AI assistant.");
    }
  }, [newMessage, selectedConnection]);

  const getAISuggestion = useCallback(async () => {
    if (!selectedConnection) {
      setNotification("Select a connection to get AI suggestions.");
      return;
    }
    try {
      const res = await axios.get("/api/chat/ai/suggest", {
        params: { connectionId: selectedConnection.id }
      });
      setAiSuggestion(res.data.suggestion);
      setNotification("AI suggestion received.");
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      setNotification("Error getting AI suggestion.");
    }
  }, [selectedConnection]);

  const sendFileMessage = useCallback(async () => {
    if (!fileUpload || !selectedConnection) return;
    const formData = new FormData();
    formData.append("connectionId", selectedConnection.id);
    formData.append("file", fileUpload);
    try {
      const res = await axios.post("/api/chat/send-file", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setChatHistory((prev) => [
        ...prev,
        { sender: "user", text: res.data.message, fileUrl: res.data.fileUrl }
      ]);
      setFileUpload(null);
      setNotification("File sent successfully.");
    } catch (error) {
      console.error("Error sending file message:", error);
      setNotification("Error sending file message.");
    }
  }, [fileUpload, selectedConnection]);

  const markChatAsRead = useCallback(async () => {
    if (!selectedConnection) return;
    try {
      await axios.post("/api/chat/mark-read", { connectionId: selectedConnection.id });
      setNotification("Chat marked as read.");
    } catch (error) {
      console.error("Error marking chat as read:", error);
      setNotification("Error marking chat as read.");
    }
  }, [selectedConnection]);

  // Poll chat history and typing indicator every 5 seconds
  useEffect(() => {
    if (selectedConnection) {
      const interval = setInterval(async () => {
        try {
          const res = await axios.get("/api/chat/history", {
            params: { connectionId: selectedConnection.id }
          });
          setChatHistory(res.data.messages || []);
          setIsTyping(res.data.typing || false);
        } catch (error) {
          console.error("Error polling chat history:", error);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConnection]);

  // Auto-scroll chat container on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // ---------------------------
  // JOB LISTINGS & ACTIVITY FEED HANDLERS
  // ---------------------------
  const applyToJob = useCallback(async (jobId) => {
    try {
      await axios.post("/api/job-listings/apply", { jobId });
      setNotification("Applied to job successfully.");
    } catch (error) {
      console.error("Error applying to job:", error);
      setNotification("Error applying to job.");
    }
  }, []);

  const loadMoreActivity = useCallback(async () => {
    try {
      const nextPage = activityPage + 1;
      const res = await axios.get("/api/activity", { params: { page: nextPage } });
      if (res.data.activities && res.data.activities.length > 0) {
        setActivityFeed((prev) => [...prev, ...res.data.activities]);
        setActivityPage(nextPage);
      } else {
        setNotification("No more activities to load.");
      }
    } catch (error) {
      console.error("Error loading more activity:", error);
      setNotification("Error loading more activity.");
    }
  }, [activityPage]);

  // ---------------------------
  // ADDITIONAL UI FEATURE HANDLERS
  // ---------------------------
  const toggleFavorite = (connectionId) => {
    setFavorites((prev) =>
      prev.includes(connectionId)
        ? prev.filter((id) => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const addConnectionNote = (connectionId) => {
    const note = prompt("Enter a personal note for this connection:");
    if (note !== null) {
      setConnectionNotes((prev) => ({ ...prev, [connectionId]: note }));
      setNotification("Note saved.");
    }
  };

  const viewUserProfile = async (user) => {
    try {
      const res = await axios.get("/api/profile", { params: { username: user.username } });
      setProfileModal(res.data.profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setNotification("Error fetching profile.");
    }
  };

  const closeProfileModal = () => {
    setProfileModal(null);
  };

  const toggleMessageReaction = (index) => {
    setChatHistory((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, reaction: msg.reaction === "👍" ? "" : "👍" } : msg
      )
    );
  };

  // ---------------------------
  // GROUP CHAT MODAL HANDLERS
  // ---------------------------
  const openGroupChatModal = () => {
    setGroupChatModal(true);
    setGroupChatSelected([]);
  };

  const closeGroupChatModal = () => {
    setGroupChatModal(false);
  };

  const createGroupChat = async () => {
    if (groupChatSelected.length < 2) {
      setNotification("Select at least 2 connections for a group chat.");
      return;
    }
    try {
      await axios.post("/api/group-chat", { participants: groupChatSelected });
      setNotification("Group chat created successfully.");
      closeGroupChatModal();
    } catch (error) {
      console.error("Error creating group chat:", error);
      setNotification("Error creating group chat.");
    }
  };

  const startVideoCall = async () => {
    if (!selectedConnection) return;
    try {
      await axios.post("/api/video-call/start", { connectionId: selectedConnection.id });
      setNotification("Video call initiated.");
    } catch (error) {
      console.error("Error starting video call:", error);
      setNotification("Error initiating video call.");
    }
  };

  // ---------------------------
  // ACTIVITY SUMMARY COMPONENT
  // ---------------------------
  const ActivitySummary = () => (
    <div className="activity-summary">
      <h3>Activity Summary</h3>
      <ul>
        <li>Incoming Requests: {friendRequests.length}</li>
        <li>Total Connections: {connections.length}</li>
        <li>Upcoming Meetings: {upcomingMeetings.length}</li>
      </ul>
    </div>
  );

  // ---------------------------
  // COMPONENT RENDERING
  // ---------------------------
  return (
    <div className="connections-page container">
      <header className="header-bar">
        <h1>Connections</h1>
        <div className="quick-action-bar">
          <button onClick={() => scrollToSection("suggestions-section")}>Suggestions</button>
          <button onClick={() => scrollToSection("search-section")}>Search</button>
          <button onClick={() => scrollToSection("requests-section")}>Requests</button>
          <button onClick={() => scrollToSection("connections-section")}>Connections</button>
          <button onClick={() => scrollToSection("job-listings-section")}>Jobs</button>
          <button onClick={() => scrollToSection("portfolio-section")}>Portfolio</button>
          <button onClick={() => scrollToSection("activity-feed-section")}>Activity</button>
          <button onClick={() => scrollToSection("chat-section")}>Chat</button>
          <button onClick={() => scrollToSection("meetings-section")}>Meetings</button>
        </div>
        {/* New button added to trigger the Group Chat Modal */}
        <div className="header-actions">
          <button onClick={openGroupChatModal} className="btn-blue">
            Create Group Chat
          </button>
        </div>
      </header>

      <ActivitySummary />

      {notification && <div className="notification">{notification}</div>}

      {/* Friend Suggestions Section */}
      <section id="suggestions-section" className="suggestions-section">
        <h2>Friend Suggestions</h2>
        <button
          onClick={async () => {
            try {
              const res = await axios.get("/api/friend-suggestions");
              setSuggestions(res.data.suggestions || []);
              setNotification("Suggestions refreshed.");
            } catch (error) {
              console.error("Error fetching friend suggestions:", error);
              setNotification("Error loading friend suggestions.");
            }
          }}
          className="btn-blue"
        >
          Refresh Suggestions
        </button>
        <div className="suggestions-list">
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((user) => (
                <li key={user.id} className="suggestion-item">
                  <span>
                    {user.username} {user.online && <span className="online-indicator" />}
                  </span>
                  <div className="suggestion-actions">
                    <button onClick={() => sendFriendRequest(user.username)} className="btn-green">
                      Add Friend
                    </button>
                    <button onClick={() => viewUserProfile(user)} className="btn-blue">
                      View Profile
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No suggestions available. Try searching for friends!</p>
          )}
        </div>
      </section>

      {/* Search Users Section */}
      <section id="search-section" className="search-section">
        <h2>Search Users</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Enter username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="search-results">
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map((user) => (
                <li key={user.id} className="search-item">
                  <span>{user.username}</span>
                  <div className="search-actions">
                    <button onClick={() => sendFriendRequest(user.username)} className="btn-green">
                      Send Request
                    </button>
                    <button onClick={() => viewUserProfile(user)} className="btn-blue">
                      View Profile
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users found.</p>
          )}
        </div>
      </section>

      {/* Friend Requests Section */}
      <section id="requests-section" className="requests-section">
        <h2>Incoming Friend Requests</h2>
        {friendRequests.length > 0 ? (
          <ul>
            {friendRequests.map((req) => (
              <li key={req.id} className="request-item">
                <span>{req.fromUsername}</span>
                <div className="request-actions">
                  <button onClick={() => acceptFriendRequest(req.id)} className="btn-green">
                    Accept
                  </button>
                  <button onClick={() => rejectFriendRequest(req.id)} className="btn-red">
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No incoming friend requests.</p>
        )}
        <h2>Sent Friend Requests</h2>
        {sentRequests.length > 0 ? (
          <ul>
            {sentRequests.map((req) => (
              <li key={req.id} className="request-item">
                <span>{req.toUsername}</span>
                <button onClick={() => cancelFriendRequest(req.id)} className="btn-red">
                  Cancel Request
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No pending sent friend requests.</p>
        )}
      </section>

      {/* Favorite Connections Section */}
      <section className="favorites-section">
        <h2>Favorite Connections</h2>
        {favorites.length > 0 ? (
          <ul>
            {connections
              .filter((conn) => favorites.includes(conn.id))
              .map((conn) => (
                <li key={conn.id} className="connection-item">
                  <span>
                    {conn.username} {conn.online && <span className="online-indicator" title="Online" />}
                  </span>
                  <div className="connection-actions">
                    <button onClick={() => loadChatHistory(conn)} className="btn-blue">
                      Chat
                    </button>
                    <button onClick={() => viewUserProfile(conn)} className="btn-blue">
                      View Profile
                    </button>
                    <button onClick={() => addConnectionNote(conn.id)} className="btn-green">
                      {connectionNotes[conn.id] ? "Edit Note" : "Add Note"}
                    </button>
                    <button onClick={() => toggleFavorite(conn.id)} className="btn-red">
                      Unfavorite
                    </button>
                  </div>
                  {connectionNotes[conn.id] && <p className="connection-note">Note: {connectionNotes[conn.id]}</p>}
                </li>
              ))}
          </ul>
        ) : (
          <p>No favorite connections yet.</p>
        )}
      </section>

      {/* Connections Section */}
      <section id="connections-section" className="connections-section">
        <h2>
          Your Connections {loadingConnections && <span className="loading-indicator">Loading...</span>}
        </h2>
        <button onClick={refreshConnections} className="btn-blue">
          Refresh Connections
        </button>
        {connections.length > 0 ? (
          <ul>
            {connections.map((conn) => (
              <li key={conn.id} className="connection-item">
                <span>
                  {conn.username} {conn.online && <span className="online-indicator" title="Online" />}
                </span>
                <div className="connection-actions">
                  <button onClick={() => loadChatHistory(conn)} className="btn-blue">
                    Chat
                  </button>
                  <button onClick={() => removeConnection(conn.id)} className="btn-red">
                    Remove
                  </button>
                  <button onClick={() => viewUserProfile(conn)} className="btn-blue">
                    View Profile
                  </button>
                  <button onClick={() => addConnectionNote(conn.id)} className="btn-green">
                    {connectionNotes[conn.id] ? "Edit Note" : "Add Note"}
                  </button>
                  <button onClick={() => toggleFavorite(conn.id)} className="btn-green">
                    {favorites.includes(conn.id) ? "Unfavorite" : "Favorite"}
                  </button>
                </div>
                {connectionNotes[conn.id] && <p className="connection-note">Note: {connectionNotes[conn.id]}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p>You have no connections yet. Use the search above to add friends!</p>
        )}
      </section>

      {/* Job Listings/Bids Section */}
      <section id="job-listings-section" className="job-listings-section">
        <h2>
          Available Projects {loadingJobListings && <span className="loading-indicator">Loading...</span>}
        </h2>
        <input
          type="text"
          placeholder="Search projects..."
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="job-filter"
        />
        {jobListings.filter(job => 
          job.title.toLowerCase().includes(jobFilter.toLowerCase()) ||
          job.description.toLowerCase().includes(jobFilter.toLowerCase())
        ).length > 0 ? (
          <ul>
            {jobListings
              .filter(job => 
                job.title.toLowerCase().includes(jobFilter.toLowerCase()) ||
                job.description.toLowerCase().includes(jobFilter.toLowerCase())
              )
              .map((job) => (
                <li key={job.id} className="job-listing-item">
                  <h3>{job.title}</h3>
                  <p>{job.description}</p>
                  <button onClick={() => applyToJob(job.id)} className="btn-blue">
                    Bid/Apply
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p>No job listings available at the moment.</p>
        )}
      </section>

      {/* Portfolio Showcase Section */}
      <section id="portfolio-section" className="portfolio-section">
        <h2>
          Portfolio Showcase {loadingPortfolio && <span className="loading-indicator">Loading...</span>}
        </h2>
        {portfolioItems.length > 0 ? (
          <div className="portfolio-items">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="portfolio-card"
                onClick={() => setSelectedPortfolioItem(item)}
                style={{ cursor: "pointer" }}
              >
                {item.image && <img src={item.image} alt={item.title} />}
                <h3>{item.title}</h3>
                <p>{item.description.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No portfolio items to display.</p>
        )}
      </section>

      {/* Activity Feed Section */}
      <section id="activity-feed-section" className="activity-feed-section">
        <h2>
          Recent Activity {loadingActivity && <span className="loading-indicator">Loading...</span>}
        </h2>
        <div className="activity-filter">
          <label htmlFor="activity-filter-select">Filter:</label>
          <select
            id="activity-filter-select"
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Jobs">Jobs</option>
            <option value="Connections">Connections</option>
            <option value="Chats">Chats</option>
          </select>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await axios.get("/api/activity", { params: { page: 1 } });
              setActivityFeed(res.data.activities || []);
              setActivityPage(1);
              setNotification("Activity feed refreshed.");
            } catch (error) {
              console.error("Error refreshing activity feed:", error);
              setNotification("Error loading activity feed.");
            }
          }}
          className="btn-blue"
        >
          Refresh Activity
        </button>
        {activityFeed.length > 0 ? (
          <ul>
            {activityFeed
              .filter((activity) =>
                activityFilter === "All" ? true : activity.type === activityFilter
              )
              .map((activity) => (
                <li key={activity.id} className="activity-item">
                  <span>{activity.message}</span>
                  <small>{new Date(activity.timestamp).toLocaleString()}</small>
                </li>
              ))}
          </ul>
        ) : (
          <p>No recent activity to display.</p>
        )}
        <button onClick={loadMoreActivity} className="btn-blue">
          Load More
        </button>
      </section>

      {/* Chat Section with AI Integration */}
      <section id="chat-section" className="chat-section">
        <h2>Chat</h2>
        {selectedConnection ? (
          <div className="chat-container" ref={chatContainerRef}>
            <h3>Chat with {selectedConnection.username}</h3>
            <div className="chat-toolbar">
              <button onClick={startVideoCall} className="btn-purple">
                Start Video Call
              </button>
            </div>
            {chatLoading ? (
              <p>Loading chat history...</p>
            ) : (
              <div className="chat-history">
                {chatHistory.length > 0 ? (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`chat-message ${
                        msg.sender === "user"
                          ? "user-message"
                          : msg.sender === "ai"
                          ? "ai-message"
                          : "other-message"
                      }`}
                      onDoubleClick={() => toggleMessageReaction(idx)}
                    >
                      <p>{msg.text}</p>
                      {msg.fileUrl && (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                          View Attachment
                        </a>
                      )}
                      {msg.reaction && <span className="message-reaction">{msg.reaction}</span>}
                    </div>
                  ))
                ) : (
                  <p>No messages yet.</p>
                )}
              </div>
            )}
            {isTyping && <p className="typing-indicator">User is typing...</p>}
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              />
              <button onClick={sendMessage} className="btn-blue">
                Send
              </button>
              <button onClick={sendAIMessage} className="btn-purple">
                Ask AI
              </button>
              <button onClick={getAISuggestion} className="btn-green">
                Get AI Suggestion
              </button>
            </div>
            <div className="chat-file-upload">
              <input type="file" onChange={(e) => setFileUpload(e.target.files[0])} />
              <button onClick={sendFileMessage} className="btn-blue">
                Send File
              </button>
            </div>
            {aiSuggestion && (
              <div className="ai-suggestion">
                <p>AI Suggestion: {aiSuggestion}</p>
                <button onClick={() => setAiSuggestion("")} className="btn-red">
                  Clear
                </button>
              </div>
            )}
            <button onClick={markChatAsRead} className="btn-green full-width">
              Mark as Read
            </button>
          </div>
        ) : (
          <p>Select a connection to start chatting.</p>
        )}
      </section>

      {/* Upcoming Meetings Section */}
      <section id="meetings-section" className="meetings-section">
        <h2>
          Upcoming Meetings {loadingMeetings && <span className="loading-indicator">Loading...</span>}
        </h2>
        <button onClick={fetchUpcomingMeetings} className="btn-blue">
          Refresh Meetings
        </button>
        {upcomingMeetings.length > 0 ? (
          <ul>
            {upcomingMeetings.map((meeting) => (
              <li key={meeting.id} className="meeting-item">
                <span>{meeting.title}</span>
                <small>{new Date(meeting.scheduledAt).toLocaleString()}</small>
                <button onClick={() => startVideoCall()} className="btn-purple">
                  Join Call
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming meetings scheduled.</p>
        )}
      </section>

      {/* Portfolio Detail Modal */}
      {selectedPortfolioItem && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setSelectedPortfolioItem(null)}>
              &times;
            </span>
            <h2>{selectedPortfolioItem.title}</h2>
            {selectedPortfolioItem.image && (
              <img src={selectedPortfolioItem.image} alt={selectedPortfolioItem.title} />
            )}
            <p>{selectedPortfolioItem.description}</p>
          </div>
        </div>
      )}

      {/* Profile Preview Modal */}
      {profileModal && (
        <div className="modal profile-modal">
          <div className="modal-content">
            <span className="close" onClick={closeProfileModal}>
              &times;
            </span>
            <h2>{profileModal.username}'s Profile</h2>
            {profileModal.image && <img src={profileModal.image} alt={profileModal.username} />}
            <p>{profileModal.bio}</p>
            <p>Email: {profileModal.email}</p>
          </div>
        </div>
      )}

      {/* Group Chat Creation Modal */}
      {groupChatModal && (
        <div className="modal group-chat-modal">
          <div className="modal-content">
            <span className="close" onClick={closeGroupChatModal}>
              &times;
            </span>
            <h2>Create Group Chat</h2>
            <p>Select connections to include:</p>
            <div className="group-chat-list">
              {connections.map((conn) => (
                <div key={conn.id} className="group-chat-item">
                  <input
                    type="checkbox"
                    id={`group-${conn.id}`}
                    checked={groupChatSelected.includes(conn.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGroupChatSelected((prev) => [...prev, conn.id]);
                      } else {
                        setGroupChatSelected((prev) => prev.filter((id) => id !== conn.id));
                      }
                    }}
                  />
                  <label htmlFor={`group-${conn.id}`}>{conn.username}</label>
                </div>
              ))}
            </div>
            <button onClick={createGroupChat} className="btn-blue">
              Create Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections;
