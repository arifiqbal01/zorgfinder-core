import React, { useEffect, useState, useCallback } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import { Eye, Heart } from "lucide-react";

const DEFAULT_PER_PAGE = 10;

const getNonce = () =>
  typeof zorgFinderApp !== "undefined" ? zorgFinderApp.nonce : "";

const Favourites = () => {
  const [items, setItems] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerMap, setProviderMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [selected, setSelected] = useState([]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    provider_id: "",
    user_id: "",
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

  /* -------------------------------
   * LOAD PROVIDERS + USERS
   * -------------------------------*/
  useEffect(() => {
    (async () => {
      try {
        const p = await fetch("/wp-json/zorg/v1/providers?per_page=999", { headers });
        const pj = await p.json();
        if (pj?.success) {
          setProviders(pj.data);
          const map = {};
          pj.data.forEach((x) => (map[x.id] = x.name));
          setProviderMap(map);
        }
      } catch {
        setProviders([]);
      }
    })();

    (async () => {
      try {
        const u = await fetch("/wp-json/wp/v2/users?per_page=100", { headers });
        const uj = await u.json();
        if (Array.isArray(uj)) {
          const map = {};
          uj.forEach((u) => {
            map[u.id] = u.name || u.username || `User #${u.id}`;
          });
          setUsersMap(map);
        }
      } catch {
        setUsersMap({});
      }
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
            if (v !== "" && v !== null && v !== undefined) {
                params.append(k, v);
            }
        });

        params.append("page", page);
        params.append("per_page", perPage);
        params.append("sort", sort);
        params.append("trashed", tab === "trash" ? 1 : 0);

        const res = await fetch(`/wp-json/zorg/v1/favourites?${params.toString()}`, { headers });
        const json = await res.json();

        // FIX — new format check
        const list = json?.data?.data;
        const totalCount = json?.data?.total;

        if (Array.isArray(list)) {
            setItems(list);
            setTotal(totalCount || 0);
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
}, [filters, page, perPage, sort, tab]);


  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.provider_id, filters.user_id, sort, tab, perPage]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites, page, perPage, sort, tab]);

  /* -------------------------------
   * ACTIONS
   * -------------------------------*/
  const deleteFavourite = async (id) => {
    await fetch(`/wp-json/zorg/v1/favourites/${id}`, {
      method: "DELETE",
      headers: { "X-WP-Nonce": getNonce() },
    });
  };

  const restoreFavourite = async (id) => {
    await fetch(`/wp-json/zorg/v1/favourites/${id}/restore`, {
      method: "PATCH",
      headers: { "X-WP-Nonce": getNonce() },
    });
  };

  const handleDelete = async (id) => {
    await deleteFavourite(id);
    setItems((prev) => prev.filter((x) => x.favourite_id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    await fetchFavourites();
  };

  const handleRestore = async (id) => {
    await restoreFavourite(id);
    setItems((prev) => prev.filter((x) => x.favourite_id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    await fetchFavourites();
  };

  /* -------------------------------
   * BULK ACTIONS
   * -------------------------------*/
  const bulkDelete = async () => {
    for (const id of selected) await deleteFavourite(id);
    setSelected([]);
    await fetchFavourites();
  };

  const bulkRestore = async () => {
    for (const id of selected) await restoreFavourite(id);
    setSelected([]);
    await fetchFavourites();
  };

  /* -------------------------------
   * VIEW MODAL
   * -------------------------------*/
  const openFavourite = (item) => {
    setEditing(item);
    setShowModal(true);
  };

  /* -------------------------------
   * TABLE SETUP
   * -------------------------------*/
  const columns = ["", "Provider", "User", "Added On"];

  const rows = items.map((it) => [
    "",
    providerMap[it.provider_id] || `#${it.provider_id}`,
    usersMap[it.user_id] || `User #${it.user_id}`,
    it.created_at,
  ]);

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

          <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
            <button onClick={() => setTab("active")} className={`px-3 py-1 rounded ${tab === "active" ? "bg-black text-white" : "bg-gray-100"}`}>Active</button>
            <button onClick={() => setTab("trash")} className={`px-3 py-1 rounded ${tab === "trash" ? "bg-black text-white" : "bg-gray-100"}`}>Trash</button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <Filters
        schema={[
          { type: "search", key: "search", placeholder: "Search provider name…" },

          {
            type: "select",
            key: "provider_id",
            placeholder: "Provider",
            options: providers.map((p) => ({ value: p.id, label: p.name })),
          },
        ]}
        filters={filters}
        setFilters={setFilters}
      />

      {/* BULK ACTIONS */}
      {selected.length > 0 && (
        <div className="flex gap-3 bg-white border p-3 rounded-xl shadow-sm">
          {tab === "trash" ? (
            <button onClick={bulkRestore} className="px-3 py-1 rounded bg-green-600 text-white">Restore Selected</button>
          ) : (
            <button onClick={bulkDelete} className="px-3 py-1 rounded bg-red-600 text-white">Delete Selected</button>
          )}
          <div className="ml-auto text-sm text-gray-600">{selected.length} selected</div>
        </div>
      )}

      {/* TABLE */}
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

              {tab === "trash" ? (
                <button onClick={() => handleRestore(it.favourite_id)} title="Restore" className="text-green-600">↺</button>
              ) : (
                <button onClick={() => handleDelete(it.favourite_id)} title="Delete" className="text-red-600">🗑</button>
              )}

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
        <Modal title={`Favourite #${editing.favourite_id}`} onClose={() => { setEditing(null); setShowModal(false); }}>
          <div className="space-y-3 text-sm">
            <div><strong>Provider:</strong> {providerMap[editing.provider_id] || editing.provider_id}</div>
            <div><strong>User:</strong> {usersMap[editing.user_id] || editing.user_id}</div>
            <div><strong>Added:</strong> {editing.created_at}</div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Favourites;
