// src/components/Badges.jsx — trust signals next to a person's name.
// The identity seal is the strong signal; email/linked are quieter checks.
import React from 'react';

const Seal = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 .9l1.7 1.3 2.1-.2.7 2 1.8 1.1-.6 2.1.6 2-1.8 1.2-.7 2-2.1-.2L8 15.1l-1.7-1.3-2.1.2-.7-2-1.8-1.1.6-2.1-.6-2 1.8-1.2.7-2 2.1.2z" fill="var(--gilt)" />
    <path d="M5.2 8.2l1.9 1.9 3.8-4" fill="none" stroke="var(--on-gilt)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Badges({ badges, size = 14, showLabels = false }) {
  if (!badges) return null;
  const items = [];
  if (badges.identity) items.push(['identity', 'ID verified']);
  if (badges.email) items.push(['email', 'Email confirmed']);
  if (badges.linked) items.push(['linked', 'Google or GitHub linked']);
  if (!items.length) return null;
  const title = items.map((i) => i[1]).join(', ');
  return (
    <span className="badges" title={title} aria-label={title}>
      {badges.identity ? <Seal size={size} /> : (
        <svg width={size - 2} height={size - 2} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="7" fill="none" stroke="var(--sage)" strokeWidth="1.4" />
          <path d="M5 8.3l2 2 4-4.3" fill="none" stroke="var(--sage)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {showLabels && <span className="badges-label">{badges.identity ? 'Verified' : 'Email confirmed'}</span>}
    </span>
  );
}

/** Full list used on profiles and in Settings. */
export function BadgeList({ badges }) {
  const rows = [
    ['identity', 'ID verified', 'Government ID checked by Aurelance'],
    ['email', 'Email confirmed', 'Owns the email on the account'],
    ['linked', 'Account linked', 'Signs in with Google or GitHub'],
  ];
  return (
    <ul className="badge-list">
      {rows.map(([k, label, desc]) => (
        <li key={k} className={badges?.[k] ? 'is-on' : ''}>
          <span className="badge-dot" aria-hidden="true">{badges?.[k] ? '✓' : ''}</span>
          <span><strong>{label}</strong><small>{badges?.[k] ? desc : 'Not yet'}</small></span>
        </li>
      ))}
    </ul>
  );
}
