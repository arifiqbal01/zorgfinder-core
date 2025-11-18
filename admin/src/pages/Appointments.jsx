import React, { useEffect, useState, useCallback } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import { Eye } from "lucide-react";

const DEFAULT_PER_PAGE = 10;
const getNonce = () => (typeof zorgFinderApp !== "undefined" ? zorgFinderApp.nonce : "");

const Appointments = () => {
  const [items, setItems] = useState([]);
  const [providers, setProviders] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [selected, setSelected] = useState([]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    provider_id: "",
    user_id: "",
    status: "",
    date: ""
  });

  const [sort, setSort] = useState("newest");
  const [tab, setTab] = useState("active"); // active | trash
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    "X-WP-Nonce": getNonce(),
  };

  useEffect(() => {
    (async () => {
      try {
        const p = await fetch("/wp-json/zorg/v1/providers?per_page=999", { headers });
        const pj = await p.json();
        if (pj?.success) {
          setProviders(pj.data);
        }
      } catch (e) {
        setProviders([]);
      }
    })();

    (async () => {
      try {
        const u = await fetch("/wp-json/wp/v2/users?per_page=100", { headers });
        const uj = await u.json();
        if (Array.isArray(uj)) {
          const map = {};
          uj.forEach((user) => {
            map[user.id] = user.name || user.username || `#${user.id}`;
          });
          setUsersMap(map);
        }
      } catch (e) {
        setUsersMap({});
      }
    })();
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) params.append(k, v);
      });
      params.append("page", page);
      params.append("per_page", perPage);
      params.append("sort", sort);
      params.append("trashed", tab === "trash" ? 1 : 0);

      const res = await fetch(`/wp-json/zorg/v1/appointments?${params.toString()}`, { headers });
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setItems(json.data);
        setTotal(json.total || 0);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (e) {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, perPage, sort, tab]);

  useEffect(() => {
    setPage(1);
  }, [filters.provider_id, filters.search, filters.status, filters.date, sort, tab, perPage]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments, page, perPage, sort, tab]);

  // Actions
  const patchAppointment = async (id, body) => {
    await fetch(`/wp-json/zorg/v1/appointments/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
  };

  const deleteAppointment = async (id) => {
    await fetch(`/wp-json/zorg/v1/appointments/${id}`, {
      method: "DELETE",
      headers: { "X-WP-Nonce": getNonce() },
    });
  };

  const restoreAppointment = async (id) => {
    await fetch(`/wp-json/zorg/v1/appointments/${id}/restore`, {
      method: "PATCH",
      headers: { "X-WP-Nonce": getNonce() },
    });
  };

  const handleConfirm = async (id) => {
    await patchAppointment(id, { status: "confirmed" });
    await fetchAppointments();
  };

  const handleReject = async (id) => {
    await patchAppointment(id, { status: "rejected" });
    await fetchAppointments();
  };

  const handleDelete = async (id) => {
    await deleteAppointment(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    await fetchAppointments();
  };

  const handleRestore = async (id) => {
    await restoreAppointment(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    await fetchAppointments();
  };

  // Bulk actions
  const bulkConfirm = async () => {
    for (const id of selected) await patchAppointment(id, { status: "confirmed" });
    setSelected([]);
    await fetchAppointments();
  };

  const bulkReject = async () => {
    for (const id of selected) await patchAppointment(id, { status: "rejected" });
    setSelected([]);
    await fetchAppointments();
  };

  const bulkDelete = async () => {
    for (const id of selected) await deleteAppointment(id);
    setSelected([]);
    await fetchAppointments();
  };

  const bulkRestore = async () => {
    for (const id of selected) await restoreAppointment(id);
    setSelected([]);
    await fetchAppointments();
  };

  const openAppointment = async (id) => {
    try {
      const res = await fetch(`/wp-json/zorg/v1/appointments/${id}`, { headers });
      const json = await res.json();
      if (json?.success) {
        setEditing(json.data);
        setShowModal(true);
      }
    } catch (e) {}
  };

  const columns = ["", "Provider", "User", "Date", "Time", "Status", "Notes", "Created"];

  const rows = items.map((it) => [
    "",
    (providers.find(p => p.id === it.provider_id)?.name) || `#${it.provider_id}`,
    usersMap[it.user_id] || `User #${it.user_id}`,
    it.preferred_date,
    it.time_slot,
    it.status,
    <div className="truncate max-w-[240px] whitespace-pre-line">{it.notes}</div>,
    it.created_at
  ]);

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Appointments</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Sort:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>

          <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
            <button onClick={() => setTab("active")} className={`px-3 py-1 rounded ${tab === "active" ? "bg-black text-white" : "bg-gray-100"}`}>Active</button>
            <button onClick={() => setTab("trash")} className={`px-3 py-1 rounded ${tab === "trash" ? "bg-black text-white" : "bg-gray-100"}`}>Trash</button>
          </div>
        </div>
      </div>

     <Filters
      schema={[
       { type: "search", key: "search", placeholder: "Search name, notes, provider…" },

        { type: "select", key: "provider_id", placeholder: "Provider",
          options: providers.map((p) => ({ value: p.id, label: p.name })) },

        { type: "select", key: "status", placeholder: "Status",
          options: [
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'rejected', label: 'Rejected' }
          ] 
        },

        { type: "date", key: "date", placeholder: "Select date" },
        { type: "time", key: "time", placeholder: "Select time" }
      ]}
      filters={filters}
      setFilters={setFilters}
    />

      {selected.length > 0 && (
        <div className="flex gap-3 bg-white border p-3 rounded-xl shadow-sm">
          {tab === "trash" ? (
            <button onClick={bulkRestore} className="px-3 py-1 rounded bg-green-600 text-white">Restore Selected</button>
          ) : (
            <>
              <button onClick={bulkConfirm} className="px-3 py-1 rounded bg-green-600 text-white">Confirm Selected</button>
              <button onClick={bulkReject} className="px-3 py-1 rounded bg-yellow-600 text-white">Reject Selected</button>
              <button onClick={bulkDelete} className="px-3 py-1 rounded bg-red-600 text-white">Delete Selected</button>
            </>
          )}
          <div className="ml-auto text-sm text-gray-600">{selected.length} selected</div>
        </div>
      )}

      <Table
        columns={columns}
        data={rows}
        providers={items}
        selected={selected}
        setSelected={setSelected}
        actions={(i) => {
          const it = items[i];
          return (
            <div className="flex items-center gap-3">
              {it.status !== "confirmed" && tab !== "trash" && (
                <button onClick={() => handleConfirm(it.id)} title="Confirm" className="text-green-600">✔</button>
              )}
              {it.status !== "rejected" && tab !== "trash" && (
                <button onClick={() => handleReject(it.id)} title="Reject" className="text-yellow-600">✖</button>
              )}

              {tab === "trash" ? (
                <button onClick={() => handleRestore(it.id)} title="Restore" className="text-green-600">↺</button>
              ) : (
                <button onClick={() => handleDelete(it.id)} title="Delete" className="text-red-600">🗑</button>
              )}

              <button onClick={() => openAppointment(it.id)} title="View" className="text-blue-600">
                <Eye size={16} />
              </button>
            </div>
          );
        }}
        pagination={
          <Pagination
            page={page}
            perPage={perPage}
            total={total}
            onChange={(p) => setPage(p)}
            onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
          />
        }
      />

      {showModal && editing && (
        <Modal title={`Appointment #${editing.id}`} onClose={() => { setEditing(null); setShowModal(false); }}>
          <div className="space-y-3 text-sm">
            <div><strong>Provider:</strong> {(providers.find(p => p.id === editing.provider_id)?.name) || editing.provider_id}</div>
            <div><strong>User:</strong> {usersMap[editing.user_id] || editing.user_id}</div>
            <div><strong>Date:</strong> {editing.preferred_date}</div>
            <div><strong>Time:</strong> {editing.time_slot}</div>
            <div><strong>Status:</strong> {editing.status}</div>
            <div><strong>Notes:</strong><div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-line">{editing.notes}</div></div>
            <div><strong>Created:</strong> {editing.created_at}</div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Appointments;
