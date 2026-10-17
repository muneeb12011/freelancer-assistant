// src/App.jsx — routes.
//  Public:  /  /about  /contact  /privacy  /terms  /refunds   (+ /billing shows pricing to guests)
//  Auth:    /login  /register  /forgot-password  /reset-password  /verify-email  /confirm-email  /auth/callback
//  App:     everything else, behind ProtectedRoute, inside the app Layout.
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { UnreadProvider } from './context/UnreadContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import Seo from './components/Seo';
import { BootScreen } from './components/Logo';
import Landing from './pages/Landing';
import Auth from './pages/Auth';

import './styles/theme.css';
import './styles/App.css';
import './styles/Market.css';

// App pages are code-split so the public site loads fast.
const Home        = lazy(() => import('./pages/Home'));
const About       = lazy(() => import('./pages/About'));
const Contact     = lazy(() => import('./pages/Contact'));
const Support     = lazy(() => import('./pages/Support'));
const Network     = lazy(() => import('./pages/Network'));
const Contracts   = lazy(() => import('./pages/Contracts'));
const ContractDetail = lazy(() => import('./pages/Contracts').then((m) => ({ default: m.ContractDetail })));
const Talent      = lazy(() => import('./pages/Talent'));
const SquadDetail = lazy(() => import('./pages/Talent').then((m) => ({ default: m.SquadDetail })));
const Profile     = lazy(() => import('./pages/Profile'));
const Settings    = lazy(() => import('./pages/Settings'));
const Billing     = lazy(() => import('./pages/Billing'));
const Legal       = lazy(() => import('./pages/Legal'));
const NotFound    = lazy(() => import('./pages/NotFound'));
const Messages    = lazy(() => import('./pages/Messages'));
const Jobs        = lazy(() => import('./pages/Jobs'));
const JobDetail   = lazy(() => import('./pages/Jobs').then((m) => ({ default: m.JobDetail })));
const JobForm     = lazy(() => import('./pages/Jobs').then((m) => ({ default: m.JobForm })));
const Admin       = lazy(() => import('./pages/Admin'));

/** Guests see the landing page at "/", signed-in users go to their workspace. */
function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <BootScreen />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <PublicLayout><Landing /></PublicLayout>;
}

/** /billing is the single pricing + plan page: public pricing for guests, plan management for members. */
function BillingRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <BootScreen />;
  if (!isAuthenticated) return <PublicLayout><Billing /></PublicLayout>;
  return <ProtectedRoute><Layout /></ProtectedRoute>;
}

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <UnreadProvider>
      <Router>
        <Seo />
        <Suspense fallback={<BootScreen />}>
          <Routes>
            <Route path="/" element={<RootRoute />} />

            <Route element={<PublicLayout />}>
              <Route path="about"   element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Legal doc="privacy" />} />
              <Route path="terms"   element={<Legal doc="terms" />} />
              <Route path="refunds" element={<Legal doc="refunds" />} />
            </Route>

            <Route path="login"           element={<Auth mode="login" />} />
            <Route path="register"        element={<Auth mode="register" />} />
            <Route path="forgot-password" element={<Auth mode="forgot" />} />
            <Route path="reset-password"  element={<Auth mode="reset" />} />
            <Route path="verify-email"    element={<Auth mode="verify" />} />
            <Route path="confirm-email"   element={<Auth mode="confirm-email" />} />
            <Route path="auth/callback"   element={<Auth mode="oauth" />} />
            <Route path="auth"            element={<Navigate to="/login" replace />} />

            <Route path="billing" element={<BillingRoute />}>
              <Route index element={<Billing />} />
            </Route>
            <Route path="pricing" element={<Navigate to="/billing" replace />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="home"        element={<Home />} />
              <Route path="contracts"     element={<Contracts />} />
              <Route path="contracts/:id" element={<ContractDetail />} />
              <Route path="talent"      element={<Talent />} />
              <Route path="squads/:id"  element={<SquadDetail />} />
              <Route path="network"     element={<Network />} />
              {/* Old back-office pages folded into contracts */}
              <Route path="dashboard"   element={<Navigate to="/home" replace />} />
              <Route path="tasks"       element={<Navigate to="/contracts" replace />} />
              <Route path="clients"     element={<Navigate to="/contracts" replace />} />
              <Route path="invoices"    element={<Navigate to="/contracts" replace />} />
              <Route path="atelier"     element={<Navigate to="/home" replace />} />
              <Route path="connections" element={<Navigate to="/network" replace />} />
              <Route path="profile"         element={<Profile />} />
              <Route path="profile/:userId" element={<Profile />} />
              <Route path="settings"    element={<Settings />} />
              <Route path="support"     element={<Support />} />
              <Route path="messages"     element={<Messages />} />
              <Route path="messages/:id" element={<Messages />} />
              <Route path="jobs"          element={<Jobs />} />
              <Route path="jobs/new"      element={<JobForm />} />
              <Route path="jobs/:id"      element={<JobDetail />} />
              <Route path="jobs/:id/edit" element={<JobForm />} />
              <Route path="admin"         element={<Admin />} />
            </Route>

            <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
          </Routes>
        </Suspense>
      </Router>
      </UnreadProvider>
    </ToastProvider>
  </AuthProvider>
);

export default App;
