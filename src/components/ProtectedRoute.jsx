// src/components/ProtectedRoute.jsx
// ─────────────────────────────────────────────
//  Wraps any route that requires login.
//  If the user is not authenticated, redirect to /login.
//  Shows a spinner while auth state is being restored.
// ─────────────────────────────────────────────

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // While checking localStorage, show a loading screen
  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  // Not logged in → redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → render the page
  return children;
};

export default ProtectedRoute;