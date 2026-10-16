# Aurelance — web app

React 18 (Create React App) · React Router 6 · self-hosted fonts (Newsreader, Schibsted Grotesk, JetBrains Mono).

```bash
npm install
npm start            # dev on :3000
npm run build        # production build → build/
```

`.env`
```
REACT_APP_API_URL=https://<api>/api
REACT_APP_SITE_URL=https://<this site>
REACT_APP_API_ORIGIN=https://<api>
DISABLE_ESLINT_PLUGIN=true
```

## Where things live
- `src/styles/theme.css` — every design token (ink/bone/gilt palette, type, radii). Page stylesheets map onto it.
- `src/services/api.js` — the only HTTP client (throws on errors, signs out on dead sessions, `askAI()` for server-side AI).
- `src/pages/Billing.jsx` — **the only place plans/prices/upgrading appear**. Locked features use `components/PremiumLock.jsx`, which just links here.
- `src/lib/useCloudState.js` — tool state (brand kit, estimates, timer, goal) saved to the account.
- `public/` — favicon, icons, OG image, manifest, robots, sitemap. `vercel.json` — SPA rewrites + security headers.
