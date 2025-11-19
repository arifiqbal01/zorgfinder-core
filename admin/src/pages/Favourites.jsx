import React, { useEffect, useState, useCallback } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import { Eye } from "lucide-react";

const DEFAULT_PER_PAGE = 10;

const getNonce = () =>
  typeof zorgFinderApp !== "undefined" ? zorgFinderApp.nonce : "";

const Favourites = () => {
  const [items, setItems] = useState([]);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    provider_id: "",
    user_id: "",
    device: "",
  });

  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    "X-WP-Nonce": getNonce(),
  };

  /* -------------------------------
   * FETCH PROVIDERS + USERS
   * -------------------------------*/
  useEffect(() => {
    (async () => {
      try {
        const p = await fetch("/wp-json/zorg/v1/providers?per_page=999", { headers });
        const pj = await p.json();
        if (pj?.success) setProviders(pj.data);
      } catch {}
    })();

    (async () => {
      try {
        const u = await fetch("/wp-json/wp/v2/users?per_page=100", { headers });
        const uj = await u.json();
        if (Array.isArray(uj)) setUsers(uj);
      } catch {}
    })();
  }, []);

  /* -------------------------------
   * FETCH FAVOURITES
   * -------------------------------*/
  const fetchFavourites = useCallback(async () => {
  setLoading(true);
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== null) params.append(k, v);
    });

    params.append("page", page);
    params.append("per_page", perPage);
    params.append("sort", sort);

    const res = await fetch(`/wp-json/zorg/v1/favourites?${params.toString()}`, { headers });
    const json = await res.json();

    // ⭐ FIXED: API now returns {data: [...], total: X}
    const root = json?.data || json;

    const list = root?.data || [];
    const totalCount = root?.total || 0;

    if (Array.isArray(list)) {
      setItems(list);
      setTotal(totalCount);
    } else {
      setItems([]);
      setTotal(0);
    }


  } catch (err) {
    setItems([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
}, [filters, page, perPage, sort]);


  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.provider_id, filters.user_id, filters.device, sort]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites, page, perPage, sort]);

  /* -------------------------------
   * ACTIONS
   * -------------------------------*/
  const openFavourite = (item) => {
    setEditing(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setEditing(null);
    setShowModal(false);
  };

  /* -------------------------------
   * TABLE COLUMNS
   * -------------------------------*/
  const columns = ["Provider", "User", "Device", "Source", "Added On"];

  const rows = items.map((it) => [
    it.provider_name,
    it.user_name,
    it.device || "-",
    it.source_page || "-",
    it.created_at,
  ]);

  /* -------------------------------
   * FILTER SCHEMA
   * -------------------------------*/
  const filterSchema = [
    { type: "search", key: "search", placeholder: "Search provider name…" },

    {
      type: "select",
      key: "provider_id",
      placeholder: "Provider",
      options: providers.map((p) => ({ value: p.id, label: p.name })),
    },

    {
      type: "select",
      key: "user_id",
      placeholder: "User",
      options: users.map((u) => ({ value: u.id, label: u.name || u.username })),
    },

    {
      type: "select",
      key: "device",
      placeholder: "Device",
      options: [
        { value: "mobile", label: "Mobile" },
        { value: "desktop", label: "Desktop" },
      ],
    },
  ];

  /* -------------------------------
   * RENDER
   * -------------------------------*/
  return (
    <div className="p-2 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Favourites</h1>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Sort:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* FILTERS */}
      <Filters schema={filterSchema} filters={filters} setFilters={setFilters} />

      {/* TABLE */}
      <Table
        columns={columns}
        data={rows}
        providers={items}
        selected={[]}
        setSelected={() => {}}
        actions={(i) => {
          const it = items[i];
          return (
            <div className="flex items-center gap-3">
              <button onClick={() => openFavourite(it)} title="View" className="text-blue-600">
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
            onPerPageChange={(v) => {
              setPerPage(v);
              setPage(1);
            }}
          />
        }
      />

      {/* MODAL */}
      {showModal && editing && (
        <Modal title={`Favourite #${editing.favourite_id}`} onClose={closeModal}>
          <div className="space-y-3 text-sm">
            <div><strong>Provider:</strong> {editing.provider_name}</div>
            <div><strong>User:</strong> {editing.user_name}</div>
            <div><strong>Device:</strong> {editing.device}</div>
            <div><strong>Source Page:</strong> {editing.source_page}</div>
            <div><strong>IP:</strong> {editing.ip_address}</div>
            <div><strong>Added:</strong> {editing.created_at}</div>

            {editing.meta_json && (
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(JSON.parse(editing.meta_json), null, 2)}
              </pre>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Favourites;
