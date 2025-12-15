import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Star,
  CalendarDays,
  Heart,
  Wallet,
  Settings
} from "lucide-react";

const Sidebar = () => {
  const links = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/providers", label: "Providers", icon: <Users size={18} /> },
    { to: "/reviews", label: "Reviews", icon: <Star size={18} /> },
    { to: "/appointments", label: "Appointments", icon: <CalendarDays size={18} /> },
    { to: "/favourites", label: "Favourites", icon: <Heart size={18} /> },
    { to: "/reimbursements", label: "Reimbursements", icon: <Wallet size={18} /> },
    { to: "/clients", label: "Clients", icon: <Users size={18} /> },
    { to: "/settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <aside className="bg-white flex flex-col">
      
      {/* Top Bar (aligned with header) */}
      <div className="h-12 px-6 flex items-center border-b border-gray-200">
        <span className="text-lg font-semibold text-gray-800">ZorgFinder</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `
              group flex items-center gap-3 px-3 py-2 rounded-lg transition-all
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600"
                  : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
              }
              `
            }
          >
            <span className="flex-shrink-0 opacity-80 group-hover:opacity-100">
              {link.icon}
            </span>
            <span className="truncate">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Fixed Footer (Version) */}
      <div className="h-12 px-6 flex items-center border-t border-gray-200 text-xs text-gray-500">
        <span className="truncate">v1.0.1 • ZorgFinder</span>
      </div>

    </aside>
  );
};

export default Sidebar;
