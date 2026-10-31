// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/navbar/Navbar';
import Sidebar from './components/sidebar/Sidebar';
import Home from './pages/Home';
import MeetingsPage from './pages/MeetingsPage';
import IncidentsPage from './pages/IncidentsPage';
import RisksPage from './pages/RisksPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-[#09090b] dark:text-zinc-50 flex flex-col">
          {/* Header Navbar */}
          <Navbar />

          {/* Main Layout Workspace */}
          <div className="flex flex-1">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Page Viewport */}
            <main className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/meetings" element={<MeetingsPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/risks" element={<RisksPage />} />
                {/* Fallback routing */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;