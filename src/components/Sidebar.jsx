// src/components/Sidebar.jsx — primary navigation. The plan line links to /billing;
// there is deliberately no upgrade card here (Billing is the single place for plans).
import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  FiHome, FiGrid, FiUsers, FiCheckSquare, FiFileText, FiShare2, FiFeather,
  FiUser, FiCreditCard, FiSettings, FiLifeBuoy, FiLogOut, FiMessageSquare, FiBriefcase, FiShield,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Navbar';
import Badges from './Badges';
import { useUnread } from '../context/UnreadContext';
import '../styles/Sidebar.css';

const WORK = [
  { to: '/home',        icon: FiHome,        label: 'Home' },
  { to: '/dashboard',   icon: FiGrid,        label: 'Dashboard' },
  { to: '/clients',     icon: FiUsers,       label: 'Clients' },
  { to: '/tasks',       icon: FiCheckSquare, label: 'Tasks' },
  { to: '/invoices',    icon: FiFileText,    label: 'Invoices' },
  { to: '/messages',    icon: FiMessageSquare, label: 'Messages', count: 'unread' },
  { to: '/jobs',        icon: FiBriefcase,   label: 'Jobs' },
  { to: '/connections', icon: FiShare2,      label: 'Connections' },
  { to: '/atelier',     icon: FiFeather,     label: 'Atelier' },
];

const ACCOUNT = [
  { to: '/profile',  icon: FiUser,       label: 'Profile' },
  { to: '/billing',  icon: FiCreditCard, label: 'Plan & billing' },
  { to: '/settings', icon: FiSettings,   label: 'Settings' },
  { to: '/support',  icon: FiLifeBuoy,   label: 'Support' },
];

const Item = ({ to, icon: Icon, label, onClose, badge }) => (
  <li>
    <NavLink to={to} end={to === '/profile'} className={({ isActive }) => `side-item${isActive ? ' is-active' : ''}`} onClick={onClose}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      {badge > 0 && <span className="count-pill" aria-label={`${badge} unread`}>{badge > 99 ? '99+' : badge}</span>}
    </NavLink>
  </li>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isPremium } = useAuth();
  const { unread } = useUnread();
  const navigate = useNavigate();
  const until = isPremium && user?.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <aside className={`side${isOpen ? ' is-open' : ''}`} aria-label="Primary">
      <Link to="/profile" className="side-user" onClick={onClose}>
        <Avatar user={user} size={36} />
        <span className="side-user-text">
          <strong>{user?.name || 'Freelancer'}<Badges badges={user?.badges} size={12} /></strong>
          <span>{user?.title || user?.email}</span>
        </span>
      </Link>

      <nav className="side-nav">
        <p className="side-group">Work</p>
        <ul>{WORK.map((l) => <Item key={l.to} {...l} badge={l.count === 'unread' ? unread : 0} onClose={onClose} />)}</ul>
        <p className="side-group">Account</p>
        <ul>
          {ACCOUNT.map((l) => <Item key={l.to} {...l} onClose={onClose} />)}
          {user?.isAdmin && <Item to="/admin" icon={FiShield} label="Admin" onClose={onClose} />}
        </ul>
      </nav>

      <div className="side-foot">
        <Link to="/billing" className="side-plan" onClick={onClose}>
          <span className={`side-plan-dot${isPremium ? ' is-premium' : ''}`} aria-hidden="true" />
          {isPremium ? (until ? `Premium until ${until}` : 'Premium') : 'Free plan'}
        </Link>
        <button type="button" className="side-item side-signout" onClick={async () => { onClose(); await logout(); navigate('/login'); }}>
          <FiLogOut aria-hidden="true" /><span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
