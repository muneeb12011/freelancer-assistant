// src/context/AuthContext.jsx — session state for the whole app.
// On load it trusts nothing in localStorage: the token is checked against /auth/me,
// so a revoked or expired session signs out cleanly instead of showing broken pages.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { tokenStore } from '../services/api';

const AuthContext = createContext(null);
const USER_KEY = 'authUser';

const readCachedUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
const cacheUser = (u) => { try { if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY); } catch { /* ignore */ } };

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => tokenStore.get());
  const [user, setUserState] = useState(() => (tokenStore.get() ? readCachedUser() : null));
  const [isLoading, setIsLoading] = useState(Boolean(tokenStore.get()));

  const setUser = useCallback((u) => {
    setUserState((prev) => {
      const next = typeof u === 'function' ? u(prev) : u;
      cacheUser(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    setUserState(null);
  }, []);

  /** Call after any sign-in path (password, 2FA, OAuth exchange). */
  const login = useCallback(({ token: t, user: u }) => {
    tokenStore.set(t);
    cacheUser(u);
    setToken(t);
    setUserState(u);
  }, []);

  const logout = useCallback(async () => {
    try { if (tokenStore.get()) await api.post('/auth/logout'); } catch { /* already invalid */ }
    clear();
  }, [clear]);

  /** Re-read the user from the server (after billing, profile edits, etc.). */
  const refreshUser = useCallback(async () => {
    const r = await api.get('/auth/me');
    setUser(r.user);
    return r.user;
  }, [setUser]);

  // Validate the stored session once on boot.
  useEffect(() => {
    let alive = true;
    if (!tokenStore.get()) { setIsLoading(false); return undefined; }
    api.get('/auth/me')
      .then((r) => { if (alive) setUser(r.user); })
      .catch((err) => { if (alive && err.status === 401) clear(); })
      .finally(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
  }, [clear, setUser]);

  // Any 401 from any request → sign out.
  useEffect(() => {
    const onExpired = () => clear();
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [clear]);

  // Keep tabs in sync (sign out in one tab signs out all).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'authToken') {
        if (!e.newValue) { setToken(null); setUserState(null); } else { setToken(e.newValue); setUserState(readCachedUser()); }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({
    user, token, isLoading,
    isAuthenticated: Boolean(token),
    isPremium: user?.plan === 'premium',
    login, logout, setUser, refreshUser,
  }), [user, token, isLoading, login, logout, setUser, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
