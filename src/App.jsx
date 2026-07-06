import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Game from './pages/Game';
import { Analytics } from '@vercel/analytics/react';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/game" element={<Game />} />

      </Routes>
      <Analytics />
    </Router>
  );
}

export default App;
 // force reload
