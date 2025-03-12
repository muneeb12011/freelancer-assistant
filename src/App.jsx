import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import Profile from './pages/Profile';
import Invoices from './pages/Invoices';
import Settings from './pages/Settings';
import Support from './pages/Support';
import Connections from './pages/Connections'; // Ensure the file path and extension are correct
import './styles/App.css';

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
              <Route path="/settings" element={<Settings />} />
              <Route path="/support" element={<Support />} />
              <Route path="/connections" element={<Connections />} /> 
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
