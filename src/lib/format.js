// src/lib/format.js — the few formatters every marketplace page shares.
export const money = (n, cur = 'USD', digits = 0) => {
  try {
    return new Intl.NumberFormat(cur === 'PKR' ? 'en-PK' : 'en-US', { style: 'currency', currency: cur || 'USD', maximumFractionDigits: digits }).format(Number(n) || 0);
  } catch { return `${cur} ${Number(n) || 0}`; }
};

/** "USD 120 + PKR 40,000" from { USD: 120, PKR: 40000 } */
export const moneyMap = (m) => {
  const parts = Object.entries(m || {}).filter(([, v]) => v > 0).map(([c, v]) => money(v, c));
  return parts.length ? parts.join(' + ') : money(0);
};

export const ago = (d) => {
  if (!d) return '';
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)} d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const day = (d, opts = { month: 'short', day: 'numeric' }) => (d ? new Date(d).toLocaleDateString('en-US', opts) : '');

export const daysFromNow = (d) => Math.ceil((new Date(d) - Date.now()) / 86400e3);

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Read a File as a data URL (for uploads that go through JSON). */
export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => reject(new Error('That file couldn’t be read'));
  r.readAsDataURL(file);
});
