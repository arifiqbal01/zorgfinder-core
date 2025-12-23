import React, { useEffect, useState } from "react";
import { Card, Button } from "../../../../ui";
import Icon from "../../../../ui/Icon";
import { getCache, setCache } from "@utils/cache";

const ICONS = {
  favourites: "M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5",
  compares: "M3 5h6v14H3z M15 5h6v14h-6z",
  activity: "M12 8v4l3 3",
};

export default function Overview({ user, onNavigate }) {
  const [stats, setStats] = useState({
    favourites: 0,
    compares: 0,
    lastActivity: null,
  });

  useEffect(() => {
    const cached = getCache("dashboard_overview");
    if (cached) {
      setStats(cached);
      return;
    } 

    Promise.all([
      fetch("/wp-json/zorg/v1/favourites?per_page=1&page=1", {
        credentials: "include",
        headers: { "X-WP-Nonce": window?.zorgFinderApp?.nonce || "" },
      }).then(r => r.json()),

      fetch("/wp-json/zorg/v1/compare/saved", {
        credentials: "include",
        headers: { "X-WP-Nonce": window?.zorgFinderApp?.nonce || "" },
      }).then(r => r.json()),
    ]).then(([fav, cmp]) => {
      const data = {
        favourites: fav?.total || fav?.data?.length || 0,
        compares: cmp?.data?.length || 0,
        lastActivity: fav?.data?.[0]?.created_at || null,
      };

      setStats(data);
      setCache("dashboard_overview", data);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <h2 className="text-xl font-semibold text-indigo-700 mb-1">
          Welcome back, {user.name}
        </h2>
        <p className="text-sm text-gray-600">
          Manage your saved providers and comparisons.
        </p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ICONS.favourites} label="Favourites" value={stats.favourites} />
        <StatCard icon={ICONS.compares} label="Saved compares" value={stats.compares} />
        <StatCard
          icon={ICONS.activity}
          label="Last activity"
          value={
            stats.lastActivity
              ? new Date(stats.lastActivity).toLocaleDateString()
              : "—"
          }
        />
      </div>

      <Card className="flex gap-3">
        <Button variant="outline" onClick={() => onNavigate("favourites")}>
          View favourites
        </Button>
        <Button variant="outline" onClick={() => onNavigate("compares")}>
          View comparisons
        </Button>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
        <Icon d={icon} size={18} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </Card>
  );
}
