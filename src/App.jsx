// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import { AuthProvider }  from './context/AuthContext';
import ProtectedRoute    from './components/ProtectedRoute';

// Auth page
import Auth from './pages/Auth';

// Layout
import Layout from './components/Layout';

// Pages
import Home        from './pages/Home';
import About       from './pages/About';
import Contact     from './pages/Contact';
import Support     from './pages/Support';
import Dashboard   from './pages/Dashboard';
import Tasks       from './pages/Tasks';
import Clients     from './pages/Clients';
import Invoices    from './pages/Invoices';
import Connections from './pages/Connections';
import Profile     from './pages/Profile';
import Settings    from './pages/Settings';
import Atelier     from './pages/Atelier';

import './styles/App.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* ── Public routes (no login required) ─────── */}
          <Route path="/login"    element={<Auth />} />
          <Route path="/register" element={<Auth />} />

          {/* ── Protected routes (login required) ─────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Home — default page at "/" */}
            <Route index element={<Home />} />

            {/* Marketing / info pages */}
            <Route path="about"   element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="support" element={<Support />} />

            {/* Core app pages */}
            <Route path="dashboard"   element={<Dashboard />} />
            <Route path="tasks"       element={<Tasks />} />
            <Route path="clients"     element={<Clients />} />
            <Route path="invoices"    element={<Invoices />} />
            <Route path="connections" element={<Connections />} />
            <Route path="atelier"     element={<Atelier />} />

            {/* Profile — own profile OR another user's profile */}
            <Route path="profile"          element={<Profile />} />
            <Route path="profile/:userId"  element={<Profile />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />

            {/* Legacy redirect — old create-task URL */}
            <Route path="create-task" element={<Navigate to="/atelier" replace />} />
          </Route>

          {/* ── 404 catch-all → home ──────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;