import React, { useEffect, useState, useCallback } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { Eye, Trash2, RotateCcw } from "lucide-react";

import { useListManager } from "../hooks/useListManager"; // NEW

const getNonce = () => window?.wpApiSettings?.nonce || "";

const REIMB_TYPES = [
  { value: "WLZ", label: "WLZ" },
  { value: "ZVW", label: "ZVW" },
  { value: "WMO", label: "WMO" },
  { value: "Youth", label: "Youth" },
];

/* ---------------------------------------------------------
   COMPONENT
--------------------------------------------------------- */
const Reimbursements = () => {
  /* Loaded via new cached engine */
  const {
    items,
    filters,
    setFilters,
    sort,
    setSort,
    tab,
    setTab,
    page,
    setPage,
    perPage,
    setPerPage,
    total,
    loading,
    fetchItems,
    deleteItem,
    restoreItem
  } = useListManager("/reimbursements", {
    search: "",
    provider_id: "",
    type: ""
  });

  const [providers, setProviders] = useState([]);
  const [providerMap, setProviderMap] = useState({});
  const [selected, setSelected] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    "X-WP-Nonce": getNonce(),
  };

  /* ---------------------------------------------------------
     LOAD PROVIDER LIST (WITH CACHE)
  --------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const url = `/wp-json/zorg/v1/providers?per_page=999&trashed=0`;

        const res = await fetch(url);
        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          setProviders(json.data);
          const map = {};
          json.data.forEach((p) => (map[p.id] = p.name));
          setProviderMap(map);
        }
      } catch {
        setProviders([]);
      }
    })();
  }, []);

  /* ---------------------------------------------------------
     OPEN MODAL
  --------------------------------------------------------- */
  const openItem = async (id) => {
    try {
      const res = await fetch(`/wp-json/zorg/v1/reimbursements/${id}`, { headers });
      const json = await res.json();

      if (json?.success) {
        setEditing(json.data?.data || json.data);
        setShowModal(true);
      }
    } catch {}
  };

  /* ---------------------------------------------------------
     BULK ACTIONS
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     TABLE CONFIG
  --------------------------------------------------------- */
  const columns = ["Provider", "Type", "Description", "Coverage", "Date"];

  const rows = items.map((i) => [
    providerMap[i.provider_id] || `#${i.provider_id}`,
    <span className="font-semibold">{i.type}</span>,
    <span className="truncate max-w-[200px] whitespace-pre-line">{i.description}</span>,
    <span className="truncate max-w-[200px] whitespace-pre-line">{i.coverage_details}</span>,
    i.created_at,
  ]);

  /* ---------------------------------------------------------
     RENDER UI
  --------------------------------------------------------- */
  return (
    <div className="p-2 space-y-6">

      {/* HEADER — matching Providers */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        <h1 className="text-2xl font-semibold">Reimbursements</h1>

        <div className="flex items-center gap-4">
          {/* Tabs */}
          <div className="flex bg-white shadow-sm rounded-lg overflow-hidden">
            <button
              onClick={() => setTab("active")}
              className={`px-4 py-2 text-sm ${tab === "active" ? "bg-black text-white" : "bg-gray-100"}`}
            >
              Active
            </button>
            <button
              onClick={() => setTab("trash")}
              className={`px-4 py-2 text-sm border-l ${tab === "trash" ? "bg-black text-white" : "bg-gray-100"}`}
            >
              Trash
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm">Sort:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input min-w-[140px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name_asc">Provider A–Z</option>
              <option value="name_desc">Provider Z–A</option>
            </select>
          </div>
        </div>

      </div>

      {/* FILTERS */}
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
          }
        ]}
        filters={filters}
        setFilters={setFilters}
      />

      {/* BULK BAR — same as provider */}
      {selected.length > 0 && (
        <div className="flex items-center gap-4 bg-white border p-3 rounded-xl shadow-sm">

          {tab === "trash" ? (
            <Button variant="success" size="sm" onClick={bulkRestore}>
              <RotateCcw size={14} className="mr-1" /> Restore Selected
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={bulkDelete}>
              <Trash2 size={14} className="mr-1" /> Delete Selected
            </Button>
          )}

          <span className="ml-auto text-sm text-gray-600">
            {selected.length} selected
          </span>
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
          const item = items[i];
          return (
            <div className="flex gap-3">
              {tab === "trash" ? (
                <button
                  onClick={() => restoreItem(item.id).then(fetchItems)}
                  className="text-green-600"
                >
                  <RotateCcw size={16} />
                </button>
              ) : (
                <button
                  onClick={() => deleteItem(item.id).then(fetchItems)}
                  className="text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={() => openItem(item.id)} className="text-blue-600">
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
        <Modal
          title={`Reimbursement #${editing.id}`}
          onClose={() => {
            setEditing(null);
            setShowModal(false);
          }}
        >
          <div className="space-y-4 text-sm">

            <div>
              <strong>Provider:</strong>
              <div className="mt-1">{providerMap[editing.provider_id] || editing.provider_id}</div>
            </div>

            <div>
              <strong>Type:</strong>
              <div className="mt-1">{editing.type}</div>
            </div>

            <div>
              <strong>Description:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-line">
                {editing.description}
              </div>
            </div>

            <div>
              <strong>Coverage Details:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-line">
                {editing.coverage_details}
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
