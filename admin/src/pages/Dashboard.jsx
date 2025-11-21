import React, { useEffect, useState } from "react";
import Loader from "../components/Loader";
import Table from "../components/Table"; // existing Table component
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Modern compact Dashboard.jsx
 * - Uses zorgFinderApp (localized by PHP) for restUrl + nonce
 * - Defensive parsing for API shapes
 * - Compact modern cards + charts
 */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getApiBase = () => {
  const base = window?.zorgFinderApp?.restUrl || "/wp-json/zorg/v1/";
  return base.endsWith("/") ? base : base + "/";
};

const fetchJson = async (path, opts = {}) => {
  const headers = { ...(opts.headers || {}) };
  if (window?.zorgFinderApp?.nonce) headers["X-WP-Nonce"] = window.zorgFinderApp.nonce;

  const url = /^https?:\/\//i.test(path) ? path : getApiBase() + path.replace(/^\/+/, "");
  try {
    const res = await fetch(url, { ...opts, headers });
    const txt = await res.text();
    try {
      return { ok: res.ok, status: res.status, json: JSON.parse(txt) };
    } catch (err) {
      return { ok: res.ok, status: res.status, json: null, text: txt };
    }
  } catch (err) {
    return { ok: false, status: 0, json: null, text: String(err) };
  }
};

const toChartSeries = (rows, dateKey = "date", valueKey = "count", days = 30) => {
  if (!Array.isArray(rows)) return [];
  const map = {};
  rows.forEach((r) => {
    if (r && r[dateKey] !== undefined) map[r[dateKey]] = Number(r[valueKey] ?? 0);
  });

  const series = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    series.push({ date: iso, count: map[iso] || 0 });
  }
  return series;
};

const StatCard = ({ icon, label, value, hint }) => (
  <div className="bg-white/95 rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-semibold">
      {icon ?? label?.charAt(0)}
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
      {hint && <span className="text-xs text-green-600 mt-0.5">{hint}</span>}
    </div>
  </div>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [dist, setDist] = useState({});
  const [rangeDays, setRangeDays] = useState(30);

  // cache helpers
  const cacheGet = (k) => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (Date.now() - p.time > CACHE_TTL) {
        localStorage.removeItem(k);
        return null;
      }
      return p.data;
    } catch (e) {
      return null;
    }
  };
  const cacheSet = (k, d) => {
    try {
      localStorage.setItem(k, JSON.stringify({ time: Date.now(), data: d }));
    } catch (e) {}
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      // 1 — summary
      try {
        const key = "dashboard_summary_v1";
        const cached = cacheGet(key);
        if (cached) setSummary(cached);
        else {
          const res = await fetchJson("dashboard/summary");
          if (res.ok && mounted) {
            const payload = res.json?.data ?? res.json?.summary ?? res.json ?? {};
            setSummary(payload);
            cacheSet(key, payload);
          } else {
            setSummary({});
          }
        }
      } catch (e) {
        setSummary({});
      }

      // 2 — trend
      try {
        const key = `dashboard_trend_v2_${rangeDays}`;;
        const cached = cacheGet(key);
        if (cached) setTrend(cached);
        else {
          const res = await fetchJson(`dashboard/appointments-trend?days=${rangeDays}`);
          if (res.ok && mounted) {
            const rows =
              (Array.isArray(res.json?.data) && res.json.data) ||
              (Array.isArray(res.json?.trend) && res.json.trend) ||
              (Array.isArray(res.json?.list) && res.json.list) ||
              [];
            const series = toChartSeries(rows, "date", "count", rangeDays);
            setTrend(series);
            cacheSet(key, series);
          } else {
            setTrend([]);
          }
        }
      } catch (e) {
        setTrend([]);
      }

      // 3 — top providers
      try {
        const key = "dashboard_top_providers";
        const cached = cacheGet(key);
        if (cached) setTopProviders(cached);
        else {
          const res = await fetchJson("dashboard/top-providers");
          if (res.ok && mounted) {
            const rows = Array.isArray(res.json?.data)
              ? res.json.data
              : Array.isArray(res.json)
              ? res.json
              : res.json?.data?.items ?? [];
            setTopProviders(rows);
            cacheSet(key, rows);
          } else {
            setTopProviders([]);
          }
        }
      } catch (e) {
        setTopProviders([]);
      }

      // 4 — distribution
      try {
        const key = "dashboard_distribution";
        const cached = cacheGet(key);
        if (cached) setDist(cached);
        else {
          const res = await fetchJson("dashboard/distribution");
          if (res.ok && mounted) {
            const payload = res.json?.data ?? res.json ?? {};
            const safe = {
              appointments_status: Array.isArray(payload.appointments_status)
                ? payload.appointments_status
                : payload.appointments_status_list ?? payload.statuses ?? [],
              reimbursements_type: Array.isArray(payload.reimbursements_type)
                ? payload.reimbursements_type
                : payload.reimbursements ?? [],
              favourites_device: Array.isArray(payload.favourites_device)
                ? payload.favourites_device
                : payload.favourites ?? [],
            };
            setDist(safe);
            cacheSet(key, safe);
          } else {
            setDist({});
          }
        }
      } catch (e) {
        setDist({});
      }

      if (mounted) setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [rangeDays]);

  if (loading) return <Loader />;

  // safe defaults
  const s = summary || {};
  const tp = Array.isArray(topProviders) ? topProviders : [];
  const d = dist || {};
  const pieColors = ["#2563EB", "#1E3A8A", "#60A5FA", "#93C5FD", "#DBEAFE"];

  // Normalize rows for Table component: array-of-arrays
  const latestReviewsRows = Array.isArray(s.latest_reviews)
    ? s.latest_reviews.map((r) => [
        r.provider_name ?? r.name ?? "",
        r.rating ?? "",
        r.comment ?? r.comment_text ?? r.text ?? "",
        r.created_at ?? r.date ?? "",
      ])
    : [];

  const latestAppointmentsRows = Array.isArray(s.latest_appointments)
    ? s.latest_appointments.map((a) => [
        a.provider_name ?? a.provider ?? "",
        a.user_name ?? a.user ?? "",
        a.preferred_date ?? a.date ?? "",
        a.status ?? "",
      ])
    : [];

  // Prepare bar data: recharts expects numeric values
  const barData = tp.map((t) => ({
    name: t.name ?? t.provider_name ?? t.label ?? "Unknown",
    appointments: Number(t.appointments ?? t.count ?? t.total ?? 0),
  }));

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview & analytics</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white rounded-md border border-gray-200 px-3 py-2 shadow-sm">
            <select
              className="text-sm bg-transparent outline-none"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Providers" value={s.total_providers ?? 0} icon="P" hint={s.providers_change ? `${s.providers_change}%` : null} />
        <StatCard label="Appointments" value={s.total_appointments ?? 0} icon="A" hint={s.appointments_change ? `${s.appointments_change}%` : null} />
        <StatCard label="Reviews" value={s.total_reviews ?? 0} icon="R" hint={s.reviews_change ? `${s.reviews_change}%` : null} />
        <StatCard label="Favourites" value={s.total_favourites ?? 0} icon="★" hint={s.favourites_change ? `${s.favourites_change}%` : null} />
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-800">Appointments — last {rangeDays} days</h3>
          <span className="text-sm text-gray-500">Trend</span>
        </div>

        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar + Donuts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-800">Top Providers by Appointments</h3>
            <span className="text-sm text-gray-500">Top {barData.length}</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ left: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="appointments" radius={[6, 6, 6, 6]} fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donuts */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Appointments by Status</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={(d.appointments_status || []).map((it) => ({
                    name: it.status ?? it.name ?? "",
                    value: Number(it.total ?? it.count ?? 0),
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={44}
                  outerRadius={72}
                  paddingAngle={4}
                  stroke="transparent"
                  labelLine={false}
                >
                  {(d.appointments_status || []).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Small donuts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Reimbursements by Type</h4>
          <div className="h-36">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={(d.reimbursements_type || []).map((it) => ({
                    name: it.type ?? it.name ?? "",
                    value: Number(it.total ?? it.count ?? 0),
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={34}
                  outerRadius={56}
                  paddingAngle={3}
                  stroke="transparent"
                >
                  {(d.reimbursements_type || []).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Favourites by Device</h4>
          <div className="h-36">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={(d.favourites_device || []).map((it) => ({
                    name: it.device ?? it.name ?? "",
                    value: Number(it.total ?? it.count ?? 0),
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={34}
                  outerRadius={56}
                  paddingAngle={3}
                  stroke="transparent"
                >
                  {(d.favourites_device || []).map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick stats (optional) */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
          <div className="text-sm text-gray-600">Most active provider</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">{barData[0]?.name ?? "—"}</div>
          <div className="text-xs text-gray-500 mt-1">{barData[0] ? `${barData[0].appointments} appointments` : ""}</div>
        </div>
      </div>

      {/* Latest tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold text-gray-800">Latest Reviews</h4>
            <span className="text-sm text-gray-400">{latestReviewsRows.length}</span>
          </div>
          <Table
            columns={["Provider", "Rating", "Comment", "Date"]}
            data={latestReviewsRows}
            providers={[]} // Table expects providers array - pass empty to avoid crash
            selected={[]}
            setSelected={() => {}}
            pagination={null}
          />
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold text-gray-800">Latest Appointments</h4>
            <span className="text-sm text-gray-400">{latestAppointmentsRows.length}</span>
          </div>
          <Table
            columns={["Provider", "User", "Date", "Status"]}
            data={latestAppointmentsRows}
            providers={[]}
            selected={[]}
            setSelected={() => {}}
            pagination={null}
          />
        </div>
      </div>
    </div>
  );
}
