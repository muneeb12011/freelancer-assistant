// src/context/AuthContext.jsx
// ─────────────────────────────────────────────
//  Global authentication context.
//  Wrap your whole app in <AuthProvider> so any
//  component can call useAuth() to get:
//    - user           → logged-in user object (or null)
//    - token          → JWT string (or null)
//    - login(data)    → save token + user after login
//    - logout()       → clear token + redirect
//    - isLoading      → true while checking localStorage on mount
// ─────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [isLoading, setIsLoading] = useState(true); // checking localStorage

  // On app mount, restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser  = localStorage.getItem('authUser');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Call this after a successful login or register
  const login = ({ token, user }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  // Call this to log out
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — use this in any component
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;