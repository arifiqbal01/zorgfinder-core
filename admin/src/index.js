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
  <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
    {/* Sidebar stays fixed */}
    <Sidebar />

    {/* Right Section (Header + Scrollable Content) */}
    <div className="flex flex-col flex-1 min-h-0">
      {/* Fixed Header */}
      <Header />

      {/* Scrollable content area */}
      <main className="flex-1 overflow-y-auto p-6">
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
