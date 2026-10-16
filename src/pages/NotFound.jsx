import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="page-prose" style={{ textAlign: 'left', minHeight: '50vh' }}>
      <header className="ledger-title">
        <h1>No page here</h1>
        <p>The link may be old, or the page moved. Nothing in your account was affected.</p>
      </header>
      <Link to={isAuthenticated ? '/home' : '/'} className="btn btn-gilt">{isAuthenticated ? 'Back to your workspace' : 'Go to the home page'}</Link>
    </div>
  );
}
