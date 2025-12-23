import React, { useEffect, useState, useRef } from "react";
import Table from "../components/Table";
import { useLoading } from "../hooks/useLoading";

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

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getApiBase = () => {
  const base = window?.zorgFinderApp?.restUrl || "/wp-json/zorg/v1/";
  return base.endsWith("/") ? base : base + "/";
};

const fetchJson = async (path, opts = {}) => {
  const headers = { ...(opts.headers || {}) };
  if (window?.zorgFinderApp?.nonce)
    headers["X-WP-Nonce"] = window.zorgFinderApp.nonce;

  const url = /^https?:\/\//i.test(path)
    ? path
    : getApiBase() + path.replace(/^\/+/, "");

  try {
    const res = await fetch(url, { ...opts, headers });
    const txt = await res.text();

    try {
      return { ok: res.ok, status: res.status, json: JSON.parse(txt) };
    } catch {
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
    if (r && r[dateKey] !== undefined)
      map[r[dateKey]] = Number(r[valueKey] ?? 0);
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
      {icon ?? label.charAt(0)}
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
      {hint && <span className="text-xs text-green-600 mt-0.5">{hint}</span>}
    </div>
  </div>
);

export default function Dashboard() {
  const { show, hide } = useLoading();

  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [dist, setDist] = useState({});
  const [rangeDays, setRangeDays] = useState(30);
  const loaderTimer = useRef(null);


  /* -----------------------------------------
     LocalStorage Caching
  ----------------------------------------- */
  const cacheGet = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (Date.now() - obj.time > CACHE_TTL) return null;
      return obj.data;
    } catch {
      return null;
    }
  };

  const cacheSet = (key, data) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ time: Date.now(), data })
      );
    } catch {}
  };

  /* -----------------------------------------
     MAIN EFFECT (LOAD DASHBOARD)
  ----------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      loaderTimer.current = setTimeout(() => {
  show("Loading dashboard…");
}, 400); // show only if slow

      /* ---------------------------
         SUMMARY
      --------------------------- */
      try {
        const key = "df_summary";
        const cached = cacheGet(key);

        if (cached) setSummary(cached);
        else {
          const res = await fetchJson("dashboard/summary");
          if (res.ok) {
            const payload = res.json ?? {};
            if (mounted) {
              setSummary(payload);
              cacheSet(key, payload);
            }
          }
        }
      } catch {
        setSummary({});
      }

      /* ---------------------------
         APPOINTMENT TREND
      --------------------------- */
      try {
        const key = `df_trend_${rangeDays}`;
        const cached = cacheGet(key);

        if (cached) setTrend(cached);
        else {
          const res = await fetchJson(
            `dashboard/appointments-trend?days=${rangeDays}`
          );
          const rows = res.ok ? res.json?.data ?? [] : [];
          const series = toChartSeries(rows, "date", "count", rangeDays);

          if (mounted) {
            setTrend(series);
            cacheSet(key, series);
          }
        }
      } catch {
        setTrend([]);
      }

      /* ---------------------------
         TOP PROVIDERS
      --------------------------- */
      try {
        const key = "df_top_providers";
        const cached = cacheGet(key);

        if (cached) setTopProviders(cached);
        else {
          const res = await fetchJson("dashboard/top-providers");

          const rows = Array.isArray(res.json)
            ? res.json
            : Array.isArray(res.json?.data)
            ? res.json.data
            : [];

          const normalized = rows.map((p) => ({
            ...p,
            provider: p.provider ?? p.provider_name ?? p.name ?? "Unknown",
          }));

          if (mounted) {
            setTopProviders(normalized);
            cacheSet(key, normalized);
          }
        }
      } catch {
        setTopProviders([]);
      }

      /* ---------------------------
         DISTRIBUTION
      --------------------------- */
      try {
        const key = "df_distribution";
        const cached = cacheGet(key);

        if (cached) setDist(cached);
        else {
          const res = await fetchJson("dashboard/distribution");
          const payload = res.json ?? {};

          const safe = {
            appointments_status:
              Array.isArray(payload.appointments_status)
                ? payload.appointments_status
                : [],

            reimbursements_type:
              Array.isArray(payload.reimbursements_type)
                ? payload.reimbursements_type
                : [],

            favourites_device:
              Array.isArray(payload.favourites_device)
                ? payload.favourites_device
                : [],
          };

          if (mounted) {
            setDist(safe);
            cacheSet(key, safe);
          }
        }
      } catch {
        setDist({});
      }

      clearTimeout(loaderTimer.current);
hide();    };

    load();
    return () => {
  mounted = false;
  clearTimeout(loaderTimer.current);
  hide();
};;
  }, [rangeDays]);

  /* -----------------------------------------
     PROCESS DASHBOARD DATA
  ----------------------------------------- */
  const s = summary || {};
  const tp = Array.isArray(topProviders) ? topProviders : [];
  const d = dist || {};

  const pieColors = ["#2563EB", "#1E3A8A", "#60A5FA", "#93C5FD", "#DBEAFE"];

  const latestReviewsRows = Array.isArray(s.latest_reviews)
    ? s.latest_reviews.map((r) => [
        r.provider_name ?? r.provider ?? "Unknown",
        r.rating_overall ?? "",
        r.comment ?? "",
        r.created_at ?? "",
      ])
    : [];

  const latestAppointmentsRows = Array.isArray(s.latest_appointments)
    ? s.latest_appointments.map((a) => [
        a.provider_name ?? a.provider ?? "Unknown",
        a.user_name ?? "Visitor",
        a.created_at ?? "",
        a.status ?? "",
      ])
    : [];

  const barData = tp.map((t) => ({
    name: t.provider ?? "Unknown",
    appointments: Number(t.appointments ?? 0),
  }));

  /* -----------------------------------------
     RENDER DASHBOARD
  ----------------------------------------- */
  return (
    <div className="p-4 space-y-4">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview & analytics</p>
        </div>

        <div className="bg-white rounded-md border px-3 py-2 shadow-sm">
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Providers" value={s.total_providers ?? 0} icon="P" />
        <StatCard label="Appointments" value={s.total_appointments ?? 0} icon="A" />
        <StatCard label="Reviews" value={s.total_reviews ?? 0} icon="R" />
        <StatCard label="Favourites" value={s.total_favourites ?? 0} icon="★" />
      </div>

      {/* LINE CHART */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="text-base font-semibold mb-3">
          Appointments — last {rangeDays} days
        </h3>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={trend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2563EB"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP PROVIDERS + STATUS PIE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* BAR CHART */}
        <div className="bg-white rounded-xl p-4 shadow-sm border lg:col-span-2">
          <h3 className="text-base font-semibold mb-3">
            Top Providers by Appointments
          </h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="appointments" fill="#2563EB" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* APPOINTMENT STATUS PIE */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="text-base font-semibold mb-3">
            Appointments by Status
          </h3>
          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={(d.appointments_status || []).map((it) => ({
                    name: it.status ?? "",
                    value: Number(it.total ?? 0),
                  }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={44}
                  outerRadius={72}
                  paddingAngle={4}
                  stroke="transparent"
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

      {/* SMALL DONUTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* REIMBURSEMENTS */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h4 className="text-sm font-medium mb-2">Reimbursements by Type</h4>
          <div className="h-36">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={(d.reimbursements_type || []).map((it) => ({
                    name: it.type ?? "",
                    value: Number(it.total ?? 0),
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

        {/* FAVOURITES DEVICE */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h4 className="text-sm font-medium mb-2">Favourites by Device</h4>
          <div className="h-36">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={(d.favourites_device || []).map((it) => ({
                    name: it.device ?? "",
                    value: Number(it.total ?? 0),
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

        {/* MOST ACTIVE PROVIDER */}
        <div className="bg-white rounded-xl p-4 shadow-sm border flex flex-col justify-center">
          <div className="text-sm text-gray-600">Most active provider</div>
          <div className="text-lg font-semibold mt-1">
            {barData[0]?.name ?? "—"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {barData[0]
              ? `${barData[0].appointments} appointments`
              : ""}
          </div>
        </div>
      </div>

      {/* LATEST ACTIVITY TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LATEST REVIEWS */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">Latest Reviews</h4>
            <span className="text-sm text-gray-400">
              {latestReviewsRows.length}
            </span>
          </div>

          <Table
            columns={["Provider", "Rating", "Comment", "Date"]}
            data={latestReviewsRows}
            providers={[]}
            selected={[]}
            setSelected={() => {}}
            pagination={null}
          />
        </div>

        {/* LATEST APPOINTMENTS */}
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-semibold">Latest Appointments</h4>
            <span className="text-sm text-gray-400">
              {latestAppointmentsRows.length}
            </span>
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
