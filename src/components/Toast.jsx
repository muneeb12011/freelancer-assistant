// src/components/Toast.jsx — app-wide toasts: const toast = useToast(); toast.ok('Saved'); toast.err(e)
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { FiCheck, FiAlertTriangle, FiX } from 'react-icons/fi';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const seq = useRef(0);
  const remove = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((kind, msg) => {
    const id = ++seq.current;
    const text = typeof msg === 'string' ? msg : msg?.message || 'Something went wrong';
    setItems((xs) => [...xs.slice(-3), { id, kind, text }]);
    setTimeout(() => remove(id), kind === 'err' ? 6000 : 3500);
  }, [remove]);
  const api = useMemo(() => ({ ok: (m) => push('ok', m), err: (m) => push('err', m), info: (m) => push('info', m) }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.kind === 'ok' ? <FiCheck color="var(--sage)" /> : t.kind === 'err' ? <FiAlertTriangle color="var(--wax)" /> : null}
            <span>{t.text}</span>
            <button type="button" onClick={() => remove(t.id)} aria-label="Dismiss"><FiX /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx) || { ok: () => {}, err: () => {}, info: () => {} };
