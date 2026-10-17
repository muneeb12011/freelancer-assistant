// src/components/Modal.jsx — a small accessible dialog. Bottom sheet on phones.
import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

export default function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const first = ref.current?.querySelector('input, textarea, select, button:not(.modal-x)');
    first?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`modal${wide ? ' modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Close"><FiX /></button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
