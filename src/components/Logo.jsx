// src/components/Logo.jsx — the Aurelance mark: a gilt "A" tooled onto a cloth board,
// with the crossbar extended as a ledger rule.
import React from 'react';

export const LogoMark = ({ size = 28, title = 'Aurelance' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title}>
    <rect x="2" y="2" width="60" height="60" rx="13" fill="#172520" />
    <rect x="6.5" y="6.5" width="51" height="51" rx="9.5" fill="none" stroke="#CFA75A" strokeOpacity=".45" strokeWidth="1.5" />
    <path d="M20 47 L32 15 L44 47" fill="none" stroke="#E6C98D" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 36.5 H51" stroke="#CFA75A" strokeWidth="3.2" strokeLinecap="round" />
  </svg>
);

const Logo = ({ size = 28, withWord = true, className = '' }) => (
  <span className={`brand ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <LogoMark size={size} />
    {withWord && (
      <span style={{ fontFamily: 'var(--serif)', fontSize: size * 0.72, fontWeight: 500, letterSpacing: '.005em', color: 'var(--bone)', lineHeight: 1 }}>
        Aurelance
      </span>
    )}
  </span>
);

export const BootScreen = () => (
  <div className="boot-screen" role="status" aria-live="polite">
    <span style={{ display: 'grid', justifyItems: 'center', gap: 14 }}>
      <LogoMark size={44} />
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">Loading</span>
    </span>
  </div>
);

export default Logo;
