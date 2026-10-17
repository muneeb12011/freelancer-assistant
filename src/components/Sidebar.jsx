// src/components/Sidebar.jsx — primary navigation (desktop + tablet drawer).
// Account things (profile, settings, plan, support, admin) live only in the avatar menu,
// so no destination appears twice. Phones use the bottom TabBar instead.
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUsers, FiFileText, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import { useUnread } from '../context/UnreadContext';
import '../styles/Sidebar.css';

export const NAV = [
  { to: '/home',      icon: FiHome,          label: 'Home',        short: 'Home' },
  { to: '/jobs',      icon: FiBriefcase,     label: 'Find work',   short: 'Work' },
  { to: '/talent',    icon: FiUsers,         label: 'Find talent', short: 'Talent' },
  { to: '/contracts', icon: FiFileText,      label: 'Contracts',   short: 'Contracts' },
  { to: '/messages',  icon: FiMessageSquare, label: 'Messages',    short: 'Messages', count: 'unread' },
  { to: '/network',   icon: FiShare2,        label: 'Network',     short: 'Network', desktopOnly: true },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { unread } = useUnread();
  return (
    <aside className={`side${isOpen ? ' is-open' : ''}`} aria-label="Primary">
      <nav className="side-nav">
        <ul>
          {NAV.map(({ to, icon: Icon, label, count }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => `side-item${isActive ? ' is-active' : ''}`} onClick={onClose}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
                {count === 'unread' && unread > 0 && <span className="count-pill" aria-label={`${unread} unread`}>{unread > 99 ? '99+' : unread}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <p className="side-note">Money moves directly between you and the other person. Aurelance keeps the signed record.</p>
    </aside>
  );
};

/** Bottom navigation on phones — the five places people go most. */
export function TabBar() {
  const { unread } = useUnread();
  return (
    <nav className="tabbar" aria-label="Primary">
      {NAV.filter((n) => !n.desktopOnly).map(({ to, icon: Icon, short, count }) => (
        <NavLink key={to} to={to}>
          <Icon aria-hidden="true" />
          <span>{short}</span>
          {count === 'unread' && unread > 0 && <span className="count-pill">{unread > 99 ? '99+' : unread}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default Sidebar;
