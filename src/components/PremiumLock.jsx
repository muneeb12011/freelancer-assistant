// src/components/PremiumLock.jsx — the ONLY upsell element allowed outside /billing.
// Use <PremiumLock feature="Smart contracts" /> where a locked feature would render,
// or <PremiumLock inline /> for a small chip. Both link to /billing — never a pricing table.
import React from 'react';
import { Link } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';

export default function PremiumLock({ feature = 'This feature', description, inline = false }) {
  if (inline) {
    return (
      <Link to="/billing" className="premium-lock-inline" title={`${feature} is part of Premium`}>
        <FiLock size={11} aria-hidden="true" /> Premium
      </Link>
    );
  }
  return (
    <div className="premium-lock">
      <strong><FiLock size={14} aria-hidden="true" style={{ marginRight: 6, verticalAlign: '-1px', color: 'var(--gilt)' }} />{feature} is part of Premium</strong>
      {description && <p>{description}</p>}
      <Link to="/billing" className="btn btn-gilt btn-sm">See Premium</Link>
    </div>
  );
}
