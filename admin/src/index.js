import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Providers from './pages/Providers';
import Reviews from './pages/Reviews';
import Appointments from './pages/Appointments';
import Favourites from './pages/Favourites';
import '../../shared-styles/dist/global.css';


const App = () => (
  <div className="flex w-full h-full bg-gray-50 text-gray-800 overflow-hidden">
    
    {/* Sidebar */}
    <Sidebar />

    {/* Right side */}
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      
      {/* Fixed Header */}
      <Header />

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/favourites" element={<Favourites />} />
        </Routes>
      </main>

    </div>
  </div>
);


const mount = document.getElementById('zorgfinder-admin-app');
if (mount) {
  createRoot(mount).render(
    <HashRouter>
      <App />
    </HashRouter>
  );
}
