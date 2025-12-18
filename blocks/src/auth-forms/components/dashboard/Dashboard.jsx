import { useState } from "react";
import { Button, Icon } from "../../../ui";
import DashboardSidebar from "./DashboardSidebar";
import Overview from "./views/Overview";
import Favourites from "./views/Favourites";
import Profile from "./views/Profile";

const ICONS = {
  menu: "M4 6h16M4 12h16M4 18h16",
};

export default function Dashboard({ user }) {
  const [active, setActive] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logout = async () => {
    await fetch("/wp-json/zorg/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
      },
    });
    window.location.reload();
  };

  return (
    <div className="zf-dashboard max-w-7xl mx-auto p-4">
      {/* SINGLE SURFACE */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
       <header className="zf-dashboard-header h-14 px-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <button
            className="zf-dashboard-menu-toggle p-1 text-gray-600"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Open menu"
            >
            <Icon d={ICONS.menu} size={20} />
            </button>

            {/* Desktop title only */}
            <span className="zf-dashboard-title font-semibold text-gray-900">
            My Account
            </span>
        </div>

        <div className="flex items-center gap-3">
            {/* Desktop username only */}
            <span className="zf-dashboard-username text-sm text-gray-500">
            {user.name}
            </span>

            <Button
            variant="ghost"
            onClick={logout}
            className="zf-dashboard-logout flex items-center gap-1.5 text-gray-500 hover:text-red-600"
            aria-label="Logout"
            >
            <Icon
                size={16}
                d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4
                M10 17l5-5-5-5
                M15 12H3"
            />
            </Button>
        </div>
        </header>


        {/* BODY */}
        <div className="zf-dashboard-body">
          {/* SIDEBAR (desktop + mobile popover handled in CSS) */}
          <DashboardSidebar
            active={active}
            onChange={setActive}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
          />

          {/* CONTENT */}
          <main className="zf-dashboard-content p-4 bg-gray-50">
            {active === "overview" && <Overview user={user} />}
            {active === "favourites" && <Favourites />}
            {active === "profile" && <Profile user={user} />}
          </main>
        </div>
      </div>
    </div>
  );
}
