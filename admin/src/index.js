import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Providers from './pages/providers/Providers';
import Reviews from './pages/Reviews';
import Appointments from './pages/Appointments';
import Favourites from './pages/Favourites';
import Reimbursements from './pages/Reimbursements';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import InviteReview from './pages/InviteReview';

import { ToastProvider } from './hooks/useToast';
import { LoadingProvider } from './hooks/useLoading';
import LoadingOverlay from './components/LoadingOverlay';

import '../../shared-styles/dist/global.css'; // ensure this builds to this path
import { Settings as SettingsIcon } from 'lucide-react';


const AppShell = () => (
  <div className="zf-app-shell">

    {/* Left sidebar */}
    <aside className="zf-sidebar">
      <Sidebar />
    </aside>

    {/* Right area: header + content */}
    <div className="zf-right">

      {/* Main content */}
      <main className="zf-main">
        <div className="zf-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/providers" element={<Providers />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/favourites" element={<Favourites />} />
            <Route path="/reimbursements" element={<Reimbursements />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/invite-review" element={<InviteReview />} />
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
      <ToastProvider>
        <LoadingProvider>
          <AppShell />
          <LoadingOverlay />
        </LoadingProvider>
      </ToastProvider>
    </HashRouter>
  );
}
