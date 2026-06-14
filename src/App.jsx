import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Game from './pages/Game';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/game" element={<Game />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
