// src/context/UnreadContext.jsx — unread message count for the sidebar/top bar.
// Polls every 30s while the tab is visible; the inbox calls refresh() after reading.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const Ctx = createContext({ unread: 0, refresh: () => {} });

export function UnreadProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    if (!isAuthenticated) return;
    api.get('/messages/unread').then((r) => setUnread(r.total || 0)).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { setUnread(0); return undefined; }
    refresh();
    const t = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 30000);
    const onVis = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = unread ? `(${unread}) ${base}` : base;
  }, [unread]);

  return <Ctx.Provider value={{ unread, refresh, setUnread }}>{children}</Ctx.Provider>;
}

export const useUnread = () => useContext(Ctx);
