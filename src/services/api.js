// src/services/api.js — the ONE HTTP client for the app.
//  • Base URL from REACT_APP_API_URL
//  • Attaches the bearer token
//  • Parses JSON and THROWS ApiError on non-2xx (so `catch` blocks actually run)
//  • Broadcasts `auth:expired` on 401 so AuthContext can sign the user out
//  • Timeouts + one retry for idempotent requests on network failure

export const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'authToken';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code;
    this.body = body;
  }
}

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage blocked */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem('authUser'); } catch { /* ignore */ } },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function request(method, path, body, { timeout = 20000, raw = false, headers = {} } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const token = tokenStore.get();
  const init = {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  const attempts = method === 'GET' ? 2 : 1;
  let res;
  for (let i = 0; i < attempts; i += 1) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      res = await fetch(url, { ...init, signal: ctrl.signal });
      clearTimeout(t);
      break;
    } catch (err) {
      clearTimeout(t);
      if (i === attempts - 1) {
        throw new ApiError(err.name === 'AbortError' ? 'The server took too long to respond. Try again.' : 'Can’t reach Aurelance. Check your connection.', 0);
      }
      await sleep(600);
    }
  }

  if (raw) return res;
  const text = await res.text();
  let data = {};
  if (text) { try { data = JSON.parse(text); } catch { data = { error: text.slice(0, 200) }; } }

  if (!res.ok) {
    // Only session failures sign the user out — a wrong password in a form is also a 401.
    if (res.status === 401 && token && ['NO_TOKEN', 'SESSION_INVALID', 'TOKEN_INVALID'].includes(data.code)) {
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: data }));
    }
    throw new ApiError(data.error || data.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

const api = {
  get:    (p, o) => request('GET', p, undefined, o),
  post:   (p, b = {}, o) => request('POST', p, b, o),
  put:    (p, b = {}, o) => request('PUT', p, b, o),
  patch:  (p, b = {}, o) => request('PATCH', p, b, o),
  delete: (p, b, o) => request('DELETE', p, b, o),
};

export default api;

/** Human message for any thrown error. */
export const errorMessage = (err, fallback = 'Something went wrong. Try again.') => (err && err.message) || fallback;

/** Call a server-side AI feature. Returns text (or parsed JSON for json features). */
export async function askAI(feature, input, { history, context } = {}) {
  const r = await api.post(`/ai/${feature}`, { input, history, context }, { timeout: 45000 });
  return r.json !== undefined ? r.json : r.text;
}
