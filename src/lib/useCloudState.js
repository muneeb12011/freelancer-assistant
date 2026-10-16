// src/lib/useCloudState.js — like useState, but saved to your account (GET/PUT /api/workspace/:key).
// Keeps a local copy for instant first paint and offline use; migrates old localStorage-only data once.
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

const readLocal = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const writeLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

export default function useCloudState(key, initial, { legacyKey } = {}) {
  const localKey = `cloud:${key}`;
  const [value, setValue] = useState(() => readLocal(localKey, legacyKey ? readLocal(legacyKey, initial) : initial));
  const [status, setStatus] = useState('loading'); // loading | synced | saving | offline
  const timer = useRef(null);
  const latest = useRef(value);

  useEffect(() => {
    let alive = true;
    api.get(`/workspace/${key}`).then((r) => {
      if (!alive) return;
      if (r.data === null || r.data === undefined) {
        // Nothing on the server yet — upload what this browser had (one-time migration).
        const local = latest.current;
        const hasLocal = Array.isArray(local) ? local.length > 0 : local && (typeof local !== 'object' || Object.keys(local).length > 0);
        if (hasLocal) api.put(`/workspace/${key}`, { data: local }).catch(() => {});
      } else {
        setValue(r.data); latest.current = r.data; writeLocal(localKey, r.data);
      }
      setStatus('synced');
    }).catch(() => alive && setStatus('offline'));
    return () => { alive = false; };
  }, [key, localKey]);

  const update = useCallback((next) => {
    setValue((prev) => {
      const v = typeof next === 'function' ? next(prev) : next;
      latest.current = v;
      writeLocal(localKey, v);
      clearTimeout(timer.current);
      setStatus('saving');
      timer.current = setTimeout(() => {
        api.put(`/workspace/${key}`, { data: latest.current }).then(() => setStatus('synced')).catch(() => setStatus('offline'));
      }, 500);
      return v;
    });
  }, [key, localKey]);

  return [value, update, status];
}
