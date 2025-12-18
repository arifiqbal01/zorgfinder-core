import { Icon } from "../../../ui";

const ICONS = {
  overview: "M3 3h18v18H3z M9 3v18 M15 3v18",
  favourites:
    "M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 \
     2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09 \
     C13.09 3.81 14.76 3 16.5 3 \
     19.58 3 22 5.42 22 8.5 \
     c0 3.78-3.4 6.86-8.55 11.18L12 21z",
  profile:
    "M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5 \
     -5 2.24-5 5 2.24 5 5 5z \
     M4 20c0-4 4-6 8-6s8 2 8 6",
};

export default function DashboardSidebar({
  active,
  onChange,
  mobileOpen,
  onCloseMobile,
}) {
  const handleSelect = (key) => {
    onChange(key);
    onCloseMobile?.();
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="zf-dashboard-sidebar p-3 border-r">
        <SidebarNav active={active} onSelect={handleSelect} />
      </aside>

      {/* MOBILE POPOVER SIDEBAR */}
      {mobileOpen && (
        <aside className="zf-dashboard-sidebar zf-dashboard-sidebar--mobile p-3">
          <SidebarNav active={active} onSelect={handleSelect} />
        </aside>
      )}
    </>
  );
}

function SidebarNav({ active, onSelect }) {
  return (
    <nav className="space-y-1">
      <NavItem
        active={active === "overview"}
        onClick={() => onSelect("overview")}
        icon={ICONS.overview}
      >
        Overview
      </NavItem>

      <NavItem
        active={active === "favourites"}
        onClick={() => onSelect("favourites")}
        icon={ICONS.favourites}
      >
        Favourites
      </NavItem>

      <NavItem
        active={active === "profile"}
        onClick={() => onSelect("profile")}
        icon={ICONS.profile}
      >
        Profile
      </NavItem>
    </nav>
  );
}

function NavItem({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3
        px-4 py-2.5 rounded-xl text-sm
        transition
        focus:outline-none focus:ring-2 focus:ring-indigo-200
        ${
          active
            ? "bg-indigo-50 text-indigo-700"
            : "text-gray-700 hover:bg-gray-100"
        }
      `}
    >
      <Icon
        d={icon}
        size={18}
        className={active ? "text-indigo-600" : "text-gray-400"}
      />
      {children}
    </button>
  );
}
