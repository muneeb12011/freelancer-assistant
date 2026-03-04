// src/pages/Home.jsx
import React, { useState } from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaLightbulb,
  FaSearch,
  FaExternalLinkAlt,
  FaTasks,
  FaUsers,
  FaFileInvoiceDollar,
  FaChartLine,
  FaCheckCircle,
  FaPaperPlane,
  FaUserPlus,
} from "react-icons/fa";
import "../styles/Home.css";

const Home = () => {
  // ---------- Simulated “real” data ----------
  const user = {
    name: "Muneeb Bhatti",
    avatar: "https://via.placeholder.com/48",
  };

  const tasks = [
    { id: 1, title: "Design Homepage", dueDate: "2025-06-10" },
    { id: 2, title: "Client Meeting Prep", dueDate: "2025-06-05" },
    { id: 3, title: "Finalize Invoice #102", dueDate: "2025-05-30" },
    { id: 4, title: "Update Portfolio", dueDate: "2025-06-12" },
    { id: 5, title: "Write Blog Post", dueDate: "2025-06-07" },
    { id: 6, title: "SEO Audit for Client X", dueDate: "2025-06-08" },
    { id: 7, title: "Prepare Proposal", dueDate: "2025-06-09" },
  ];

  const clients = [
    { id: 1, name: "Acme Corp", email: "contact@acme.com" },
    { id: 2, name: "Globex Industries", email: "info@globex.com" },
    { id: 3, name: "Wayne Enterprises", email: "support@wayne.com" },
    { id: 4, name: "Stark Solutions", email: "hello@stark.com" },
    { id: 5, name: "Umbrella Co.", email: "admin@umbrella.com" },
    { id: 6, name: "Initech", email: "hello@initech.com" },
  ];

  const invoices = [
    {
      id: 101,
      client: "Acme Corp",
      amount: 1200,
      dueDate: "2025-06-15",
      status: "Unpaid",
    },
    {
      id: 102,
      client: "Globex Industries",
      amount: 800,
      dueDate: "2025-06-01",
      status: "Paid",
    },
    {
      id: 103,
      client: "Wayne Enterprises",
      amount: 1500,
      dueDate: "2025-06-20",
      status: "Unpaid",
    },
    {
      id: 104,
      client: "Stark Solutions",
      amount: 950,
      dueDate: "2025-05-28",
      status: "Paid",
    },
    {
      id: 105,
      client: "Umbrella Co.",
      amount: 670,
      dueDate: "2025-06-03",
      status: "Overdue",
    },
    {
      id: 106,
      client: "Initech",
      amount: 430,
      dueDate: "2025-06-05",
      status: "Unpaid",
    },
  ];

  const totalEarnings = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Sample “Recent Activity” feed
  const recentActivity = [
    {
      id: 1,
      icon: <FaCheckCircle size={18} color="#10B981" />,
      text: "Task “Design Homepage” marked complete",
      time: "Jun 3, 4:15 PM",
    },
    {
      id: 2,
      icon: <FaPaperPlane size={18} color="#3B82F6" />,
      text: "Invoice #110 sent to Acme Corp",
      time: "Jun 3, 2:20 PM",
    },
    {
      id: 3,
      icon: <FaUserPlus size={18} color="#6366F1" />,
      text: "New client “Stark Solutions” added",
      time: "Jun 2, 10:05 AM",
    },
    {
      id: 4,
      icon: <FaCheckCircle size={18} color="#10B981" />,
      text: "Invoice #102 paid by Globex Industries",
      time: "Jun 1, 3:45 PM",
    },
    {
      id: 5,
      icon: <FaPaperPlane size={18} color="#3B82F6" />,
      text: "New message from Jane Doe",
      time: "Jun 1, 11:30 AM",
    },
  ];

  const monthlyGoal = 5000;
  const progressPercent = Math.min(
    100,
    Math.round((totalEarnings / monthlyGoal) * 100)
  );

  const notifications = [
    {
      id: 1,
      icon: <FaBell size={20} color="#3B82F6" />,
      message: "$250 received from Acme Corp",
      time: "2 hrs ago",
    },
    {
      id: 2,
      icon: <FaBell size={20} color="#10B981" />,
      message: "Message from Jane Doe",
      time: "5 hrs ago",
    },
    {
      id: 3,
      icon: <FaBell size={20} color="#F59E0B" />,
      message: "Invoice #105 is overdue",
      time: "1 day ago",
    },
  ];

  const tips = [
    {
      id: 1,
      icon: <FaLightbulb size={24} color="#8B5CF6" />,
      title: "Automate Invoice Reminders",
      description:
        "Set up automated invoice reminders so you get paid on time without manual follow-ups.",
    },
    {
      id: 2,
      icon: <FaLightbulb size={24} color="#EF4444" />,
      title: "Use Time Tracking",
      description:
        "Track billable hours within each project to ensure accurate client billing and maximize revenue.",
    },
    {
      id: 3,
      icon: <FaLightbulb size={24} color="#6366F1" />,
      title: "Organize Client Files",
      description:
        "Keep all contracts, notes, and assets in one folder per client for quick reference and better organization.",
    },
  ];

  const [tipIndex, setTipIndex] = useState(0);
  const nextTip = () => setTipIndex((prev) => (prev + 1) % tips.length);
  const prevTip = () =>
    setTipIndex((prev) => (prev - 1 + tips.length) % tips.length);

  const formatDate = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const today = new Date();
  const upcomingDeadlines = tasks.filter((task) => {
    const d = new Date(task.dueDate);
    const diffDays = (d - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  });
  const overdueItems = invoices.filter((inv) => {
    const d = new Date(inv.dueDate);
    return inv.status !== "Paid" && d < today;
  });

  return (
    <div className="home-container">
      <div className="home-wrapper">
        {/* ---------- Hero + Snapshot Metrics ---------- */}
        <section className="home-section hero">
          <div className="hero-text">
            <div className="hero-greeting">
              <img
                src={user.avatar}
                alt="User Avatar"
                className="avatar-class"
              />
              <h1 className="hero-heading">Welcome back, {user.name}!</h1>
            </div>
            <p className="hero-subtext">
              Today is{" "}
              <span className="font-semibold">
                {today.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              .
            </p>

            <div className="stats-grid">
              {/* Total Tasks */}
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <FaTasks size={24} color="#3B82F6" />
                </div>
                <div>
                  <p className="stat-value">{tasks.length}</p>
                  <p className="stat-label">Total Tasks</p>
                </div>
              </div>
              {/* Active Clients */}
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <FaUsers size={24} color="#10B981" />
                </div>
                <div>
                  <p className="stat-value">{clients.length}</p>
                  <p className="stat-label">Active Clients</p>
                </div>
              </div>
              {/* Invoices Issued */}
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <FaFileInvoiceDollar size={24} color="#F59E0B" />
                </div>
                <div>
                  <p className="stat-value">{invoices.length}</p>
                  <p className="stat-label">Invoices Issued</p>
                </div>
              </div>
              {/* Earnings This Month */}
              <div className="stat-card">
                <div className="stat-icon-wrapper">
                  <FaChartLine size={24} color="#6366F1" />
                </div>
                <div>
                  <p className="stat-value">${totalEarnings}</p>
                  <p className="stat-label">This Month’s Revenue</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Progress Towards Monthly Goal ---------- */}
        <section className="home-section">
          <h2 className="section-title">Progress to Monthly Goal</h2>
          <div className="progress-wrapper">
            <p className="progress-text">
              You’ve earned ${totalEarnings} of ${monthlyGoal}
            </p>
            <div className="progress-bar-background">
              <div
                className="progress-bar-foreground"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="progress-percent">{progressPercent}% of goal</p>
          </div>
        </section>

        {/* ---------- Upcoming & Overdue Panels ---------- */}
        <section className="home-section deadlines-section">
          <h2 className="section-title">Deadlines</h2>
          <div className="deadlines-container">
            {/* Upcoming Deadlines */}
            <div className="deadline-card">
              <h3 className="deadline-card-title">Upcoming (Next 7 Days)</h3>
              {upcomingDeadlines.length > 0 ? (
                <ul className="deadline-list">
                  {upcomingDeadlines.map((task) => (
                    <li key={task.id} className="deadline-item">
                      <p className="deadline-title">{task.title}</p>
                      <p className="deadline-date">
                        Due {formatDate(task.dueDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">No tasks due soon.</p>
              )}
              <a href="/tasks" className="view-all-link">
                View All Tasks →
              </a>
            </div>

            {/* Overdue Items */}
            <div className="deadline-card overdue-card">
              <h3 className="deadline-card-title">Overdue Invoices</h3>
              {overdueItems.length > 0 ? (
                <ul className="deadline-list">
                  {overdueItems.map((inv) => (
                    <li key={inv.id} className="deadline-item overdue-item">
                      <p className="deadline-title">
                        Invoice #{inv.id} ({inv.client})
                      </p>
                      <p className="deadline-date">
                        Due {formatDate(inv.dueDate)} (Overdue)
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-message">No overdue invoices.</p>
              )}
              <a href="/invoices" className="view-all-link">
                Manage Invoices →
              </a>
            </div>
          </div>
        </section>

        {/* ---------- Recent Activity & Notifications ---------- */}
        <section className="home-section notifications-tips-section">
          {/* Recent Activity Panel */}
          <div className="notifications-panel">
            <h2 className="notifications-title">Recent Activity</h2>
            <ul className="activity-list">
              {recentActivity.map((act) => (
                <li key={act.id} className="activity-item">
                  <div className="activity-icon">{act.icon}</div>
                  <div className="activity-text">
                    <p>{act.text}</p>
                    <p className="activity-time">{act.time}</p>
                  </div>
                </li>
              ))}
            </ul>
            <a href="/activity" className="view-all-link">
              View All Activity →
            </a>
          </div>

          {/* Notifications Panel */}
          <div className="notifications-panel">
            <div className="notifications-header">
              <h2 className="notifications-title">Notifications</h2>
              <button className="refresh-button" title="Refresh">
                <FaExternalLinkAlt
                  size={18}
                  style={{ transform: "rotate(45deg)" }}
                />
              </button>
            </div>
            <ul className="notifications-list">
              {notifications.map((notif) => (
                <li key={notif.id} className="notification-item">
                  <div className="notification-icon">{notif.icon}</div>
                  <div className="notification-text">
                    <p>{notif.message}</p>
                    <p className="notification-time">{notif.time}</p>
                  </div>
                </li>
              ))}
            </ul>
            {notifications.length === 0 && (
              <p className="empty-message">No new notifications.</p>
            )}
          </div>
        </section>

        {/* ---------- Freelancer Tips Carousel ---------- */}
        <section className="home-section">
          <h2 className="section-title">Tip of the Day</h2>
          <div className="tip-content">
            <div className="tip-text">
              <div className="feature-header">
                <div className="tip-icon">{tips[tipIndex].icon}</div>
                <h3 className="tip-title">{tips[tipIndex].title}</h3>
              </div>
              <p className="tip-desc">{tips[tipIndex].description}</p>
            </div>
            <div className="tip-nav">
              <button
                onClick={prevTip}
                className="tip-button"
                aria-label="Previous Tip"
              >
                ‹
              </button>
              <button
                onClick={nextTip}
                className="tip-button"
                aria-label="Next Tip"
              >
                ›
              </button>
            </div>
          </div>
        </section>

        {/* ---------- Quick Links (Summary Only) ---------- */}
        <section className="quick-links">
          <a href="/tasks" className="quick-link-card">
            <FaTasks size={32} color="#3B82F6" className="quick-link-icon" />
            <p className="quick-link-text">Go to Tasks</p>
          </a>
          <a href="/clients" className="quick-link-card">
            <FaUsers size={32} color="#10B981" className="quick-link-icon" />
            <p className="quick-link-text">Go to Clients</p>
          </a>
          <a href="/invoices" className="quick-link-card">
            <FaFileInvoiceDollar
              size={32}
              color="#F59E0B"
              className="quick-link-icon"
            />
            <p className="quick-link-text">Go to Invoices</p>
          </a>
          <a href="/connections" className="quick-link-card">
            <FaExternalLinkAlt
              size={32}
              color="#6366F1"
              className="quick-link-icon"
            />
            <p className="quick-link-text">Go to Network</p>
          </a>
        </section>

        {/* ---------- Footer Call-to-Action ---------- */}
        <section className="home-section footer-cta">
          <p className="cta-text">
            Enjoying Aurelance? Invite a colleague or send us feedback!
          </p>
          <div className="cta-buttons">
            <a href="/invite" className="cta-button">
              Invite a Colleague
            </a>
            <a href="/feedback" className="cta-button secondary">
              Give Feedback
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
