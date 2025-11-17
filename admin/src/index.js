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
import '../../shared-styles/dist/global.css'; // ensure this builds to this path

const AppShell = () => (
  <div className="zf-app-shell">
    {/* Left sidebar */}
    <aside className="zf-sidebar">
      <Sidebar />
    </aside>

    {/* Right area: header + content */}
    <div className="zf-right">


      <main className="zf-main">
        {/* page container centers content and limits max width */}
        <div className="zf-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/favourites" element={<Favourites />} />
          </Routes>
        </div>
      </main>
    </div>
  </div>
);

const mount = document.getElementById('zorgfinder-admin-app');
if (mount) {
  createRoot(mount).render(
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
