import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Star, CalendarDays, Heart } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/providers', label: 'Providers', icon: <Users size={18} /> },
    { to: '/reviews', label: 'Reviews', icon: <Star size={18} /> },
    { to: '/appointments', label: 'Appointments', icon: <CalendarDays size={18} /> },
    { to: '/favourites', label: 'Favourites', icon: <Heart size={18} /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo / Brand Section */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-700 tracking-tight">
          ZorgFinder
        </h1>
      </div>

      {/* Navigation Links (scrollable if needed) */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition ${
                isActive
                  ? 'bg-gray-100 font-semibold text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Version */}
      <div className="p-4 border-t border-gray-100 text-xs text-gray-500">
        v1.0.1 &nbsp;•&nbsp; ZorgFinder
      </div>
    </aside>
  );
};

export default Sidebar;
