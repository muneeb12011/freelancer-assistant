// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import the Layout component which wraps Navbar, Sidebar, and the page content
import Layout from './components/Layout';

// Import your pages
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import Profile from './pages/Profile';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Connections from './pages/Connections';
import Atelier from './pages/Atelier';   // ✅ NEW

// Import new pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';

import './styles/App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* All routes nested inside Layout */}
        <Route path="/" element={<Layout />}>
          {/* New Routes */}
          <Route index element={<Home />} /> {/* Default page */}
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />

          {/* Existing App Routes */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="clients" element={<Clients />} />
          <Route path="profile" element={<Profile />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<Support />} />
          <Route path="connections" element={<Connections />} />
          <Route path="create-task" element={<Atelier />} />  {/* ✅ ADD HERE */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
