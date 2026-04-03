const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('authToken');

const api = {
  get: (url) => fetch(`${BASE}${url}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }),
  post: (url, body) => fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  }),
  put: (url, body) => fetch(`${BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  }),
  delete: (url) => fetch(`${BASE}${url}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` }
  }),
  patch: (url, body) => fetch(`${BASE}${url}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  }),
};

export default api;