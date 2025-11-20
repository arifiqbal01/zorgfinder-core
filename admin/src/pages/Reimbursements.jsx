import React, { useEffect, useState, useCallback } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import { Eye } from "lucide-react";

const DEFAULT_PER_PAGE = 10;

const getNonce = () =>
  typeof zorgFinderApp !== "undefined" ? zorgFinderApp.nonce : "";

// Normalize API results to always return an array
const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return [data.data];
  }
  return [];
};

const Reimbursements = () => {
  const [items, setItems] = useState([]);
  const [providers, setProviders] = useState([]);
  const [providerMap, setProviderMap] = useState({});

  const [selected, setSelected] = useState([]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    provider_id: "",
    type: "",
  });

  const [tab, setTab] = useState("active"); 
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const REIMB_TYPES = [
    { value: "WLZ", label: "WLZ" },
    { value: "ZVW", label: "ZVW" },
    { value: "WMO", label: "WMO" },
    { value: "Youth", label: "Youth" },
  ];

  const headers = {
    "Content-Type": "application/json",
    "X-WP-Nonce": getNonce(),
  };

  // Load providers
  useEffect(() => {
    (async () => {
      try {
        const p = await fetch("/wp-json/zorg/v1/providers?per_page=999", {
          headers,
        });
        const json = await p.json();
        if (json?.success && Array.isArray(json.data)) {
          setProviders(json.data);
          const map = {};
          json.data.forEach((x) => (map[x.id] = x.name));
          setProviderMap(map);
        }
      } catch (e) {
        setProviders([]);
      }
    })();
  }, []);

  // Fetch reimbursements
  const fetchItems = useCallback(async () => {
  setLoading(true);

  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "") params.append(k, v);
    });

    params.append("page", page);
    params.append("per_page", perPage);
    params.append("trashed", tab === "trash" ? 1 : 0);

    const res = await fetch(
      `/wp-json/zorg/v1/reimbursements?${params.toString()}`,
      { headers }
    );

    const json = await res.json();

    if (json?.success && json?.data) {
      const payload = json.data;

      const list = Array.isArray(payload.data)
        ? payload.data
        : [];

      setItems(list);
      setTotal(payload.total || list.length);
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
}, [filters, page, perPage, tab]);


  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [filters.provider_id, filters.type, filters.search, tab]);

  // CRUD helpers
  const deleteItem = async (id) => {
    await fetch(`/wp-json/zorg/v1/reimbursements/${id}`, {
      method: "DELETE",
      headers,
    });
  };

  const restoreItem = async (id) => {
    await fetch(`/wp-json/zorg/v1/reimbursements/${id}/restore`, {
      method: "PATCH",
      headers,
    });
  };

  const updateItem = async (id, body) => {
    await fetch(`/wp-json/zorg/v1/reimbursements/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
  };

  const openItem = async (id) => {
    try {
      const res = await fetch(`/wp-json/zorg/v1/reimbursements/${id}`, {
        headers,
      });
      const json = await res.json();

      if (json?.success) {
        const data =
          json.data?.data || 
          json.data ||
          null;

        setEditing(data);
        setShowModal(true);
      }
    } catch (e) {}
  };

  // Bulk actions
  const bulkDelete = async () => {
    for (const id of selected) await deleteItem(id);
    setSelected([]);
    fetchItems();
  };

  const bulkRestore = async () => {
    for (const id of selected) await restoreItem(id);
    setSelected([]);
    fetchItems();
  };

  const columns = ["Provider", "Type", "Description", "Coverage", "Date"];

  const rows = Array.isArray(items)
    ? items.map((i) => [
        providerMap[i.provider_id] || `#${i.provider_id}`,
        <span className="font-semibold">{i.type}</span>,
        <span className="truncate max-w-[220px] whitespace-pre-line">
          {i.description}
        </span>,
        <span className="truncate max-w-[220px] whitespace-pre-line">
          {i.coverage_details}
        </span>,
        i.created_at,
      ])
    : [];

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Reimbursements</h1>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
            <button
              onClick={() => setTab("active")}
              className={`px-3 py-1 rounded ${
                tab === "active" ? "bg-black text-white" : "bg-gray-100"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setTab("trash")}
              className={`px-3 py-1 rounded ${
                tab === "trash" ? "bg-black text-white" : "bg-gray-100"
              }`}
            >
              Trash
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Filters
        schema={[
          { type: "search", key: "search", placeholder: "Search…" },
          {
            type: "select",
            key: "provider_id",
            placeholder: "Provider",
            options: providers.map((p) => ({ value: p.id, label: p.name })),
          },
          {
            type: "select",
            key: "type",
            placeholder: "Type",
            options: REIMB_TYPES,
          },
        ]}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex gap-3 bg-white border p-3 rounded-xl shadow-sm">
          {tab === "trash" ? (
            <button
              onClick={bulkRestore}
              className="px-3 py-1 rounded bg-green-600 text-white"
            >
              Restore Selected
            </button>
          ) : (
            <button
              onClick={bulkDelete}
              className="px-3 py-1 rounded bg-red-600 text-white"
            >
              Delete Selected
            </button>
          )}

          <div className="ml-auto text-sm text-gray-600">
            {selected.length} selected
          </div>
        </div>
      )}

      {/* Table */}
      <Table
        columns={columns}
        data={rows}
        providers={items}
        selected={selected}
        setSelected={setSelected}
        actions={(i) => {
          const item = items[i];

          return (
            <div className="flex items-center gap-3">
              {/* Delete / Restore */}
              {tab === "trash" ? (
                <button
                  onClick={() => restoreItem(item.id).then(fetchItems)}
                  className="text-green-600"
                >
                  ↺
                </button>
              ) : (
                <button
                  onClick={() => deleteItem(item.id).then(fetchItems)}
                  className="text-red-600"
                >
                  🗑
                </button>
              )}

              {/* View */}
              <button
                onClick={() => openItem(item.id)}
                className="text-blue-600"
              >
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

      {/* Modal */}
      {showModal && editing && (
        <Modal
          title={`Reimbursement #${editing.id}`}
          onClose={() => {
            setEditing(null);
            setShowModal(false);
          }}
        >
          <div className="space-y-4 text-sm">
            <div>
              <strong>Provider:</strong>{" "}
              {providerMap[editing.provider_id] || editing.provider_id}
            </div>

            <div>
              <strong>Type:</strong> {editing.type}
            </div>

            <div>
              <strong>Description:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-line">
                {editing.description || "—"}
              </div>
            </div>

            <div>
              <strong>Coverage:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-line">
                {editing.coverage_details || "—"}
              </div>
            </div>

            <div>
              <strong>Date:</strong> {editing.created_at}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Reimbursements;
