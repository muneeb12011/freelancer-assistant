import React from 'react';
import ReactDOM from 'react-dom/client';
// Self-hosted fonts (no third-party font CDN at runtime)
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/schibsted-grotesk';
import '@fontsource-variable/jetbrains-mono';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
