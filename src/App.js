// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import Profile from './pages/Profile';
import Invoices from './pages/Invoices';
import './styles/App.css';  // Global styles

const App = () => {
  return (
    <Router>
      <div className="app">
        {/* Navbar Component */}
        <Navbar />

        <div className="app-body">
          {/* Sidebar Component */}
          <Sidebar />

          <div className="app-content">
            {/* Routes for Pages */}
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/invoices" element={<Invoices />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
