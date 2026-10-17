// src/components/Navbar.jsx — top bar of the signed-in app.
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiUser, FiSettings, FiCreditCard, FiLogOut, FiLifeBuoy, FiShield, FiShare2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import Badges from './Badges';
import '../styles/Navbar.css';

export const initials = (name) => (name || 'U').split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const Avatar = ({ user, size = 32 }) => (
  <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
    {user?.avatar ? <img src={user.avatar} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : initials(user?.name)}
  </span>
);

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout, isPremium } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    const esc = (e) => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, []);

  const signOut = async () => { setMenu(false); await logout(); navigate('/login'); };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="topbar-icon topbar-burger" onClick={onToggleSidebar} aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={sidebarOpen}>
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
        <Link to="/home" className="topbar-brand" aria-label="Aurelance home"><Logo size={26} /></Link>
      </div>

      <div className="topbar-right" ref={ref}>
        <button type="button" className="topbar-user" onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu}>
          <Avatar user={user} />
          <span className="topbar-user-name">{user?.name?.split(' ')[0] || 'Account'}</span>
        </button>
        {menu && (
          <div className="menu" role="menu">
            <div className="menu-head">
              <strong>{user?.name}<Badges badges={user?.badges} size={12} /></strong>
              <span>{user?.email}</span>
            </div>
            <Link role="menuitem" to="/profile" className="menu-item" onClick={() => setMenu(false)}><FiUser /> Your profile</Link>
            <Link role="menuitem" to="/network" className="menu-item only-phone" onClick={() => setMenu(false)}><FiShare2 /> Network</Link>
            <Link role="menuitem" to="/settings" className="menu-item" onClick={() => setMenu(false)}><FiSettings /> Settings & payouts</Link>
            <Link role="menuitem" to="/billing" className="menu-item" onClick={() => setMenu(false)}><FiCreditCard /> {isPremium ? 'Premium plan' : 'Free plan'}</Link>
            <Link role="menuitem" to="/support" className="menu-item" onClick={() => setMenu(false)}><FiLifeBuoy /> Help</Link>
            {user?.isAdmin && <Link role="menuitem" to="/admin" className="menu-item" onClick={() => setMenu(false)}><FiShield /> Admin queues</Link>}
            <button role="menuitem" type="button" className="menu-item menu-danger" onClick={signOut}><FiLogOut /> Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
