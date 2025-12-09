import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { Eye, Trash2, RotateCcw } from "lucide-react";
import ManagementControls from "../components/ManagementControls";
import { useListManager } from "../hooks/useListManager";

const getNonce = () => window?.zorgFinderApp?.nonce || "";

const Appointments = () => {
  const [providers, setProviders] = useState([]);
  const [providerMap, setProviderMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

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
    fetchItems,
    deleteItem,
    restoreItem
  } = useListManager(
    "/appointments",
    {
      search: "",
      provider_id: "",
      status: ""
    },
    true
  );

  const [selected, setSelected] = useState([]);
  const authHeaders = { "X-WP-Nonce": getNonce() };

  /* LOAD PROVIDERS + USERS */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/wp-json/zorg/v1/providers?per_page=999`, {
          headers: authHeaders,
        });
        const json = await res.json();

        if (json?.success) {
          const map = {};
          json.data.forEach(p => (map[p.id] = p.provider));
          setProviders(json.data);
          setProviderMap(map);
        }
      } catch {}
    })();

    (async () => {
      try {
        const res = await fetch(`/wp-json/wp/v2/users?per_page=100`, {
          headers: authHeaders,
        });
        const json = await res.json();

        if (Array.isArray(json)) {
          const m = {};
          json.forEach(u => {
            m[u.id] = u.name || u.username || u.slug || `User #${u.id}`;
          });
          setUsersMap(m);
        }
      } catch {}
    })();
  }, []);

  const appointmentProviders = providers.filter(p =>
    items.some(it => it.provider_id === p.id)
  );

  const updateStatus = async (id, status) => {
    await fetch(`/wp-json/zorg/v1/appointments/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": getNonce(),
      },
      body: JSON.stringify({ status }),
    });

    fetchItems();
  };

  const openAppointment = async (id) => {
    try {
      const res = await fetch(`/wp-json/zorg/v1/appointments/${id}`, {
        headers: authHeaders,
      });
      const json = await res.json();

      if (json?.success) {
        setEditing(json.data);
        setShowModal(true);
      }
    } catch {}
  };

  useEffect(() => {
    const handler = () => setExpandedNoteId(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  /* TABLE CONFIG — NEW ORDER */
  const columns = [
    "Name",
    "Email",
    "Phone",
    "Provider",
    "Notes",
    "Status",
  ];

  const rows = items.map(it => [
    it.name || "—",
    it.email || "—",
    it.phone || "—",
    providerMap[it.provider_id] || `#${it.provider_id}`,

    /* NOTES COLUMN */
    <td onClick={(e) => e.stopPropagation()}>
      {expandedNoteId === it.id ? (
        <div>
          <div className="p-2 bg-gray-50 rounded whitespace-pre-line">
            {it.notes || "—"}
          </div>
          <button
            className="text-blue-600 text-xs mt-1 underline"
            onClick={() => setExpandedNoteId(null)}
          >
            Collapse
          </button>
        </div>
      ) : (
        <div className="relative max-w-[260px]">
          <div className="line-clamp-3 whitespace-pre-line">
            {it.notes || "—"}
          </div>
          {it.notes && it.notes.length > 80 && (
            <button
              className="absolute bottom-0 right-0 bg-white pl-1 text-blue-600 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedNoteId(it.id);
              }}
            >
              ...
            </button>
          )}
        </div>
      )}
    </td>,

    /* STATUS */
    it.status === "confirmed" ? (
      <span className="text-green-600 font-semibold">Confirmed</span>
    ) : it.status === "rejected" ? (
      <span className="text-red-600 font-semibold">Rejected</span>
    ) : (
      <span className="text-yellow-600 font-semibold">Pending</span>
    )
  ]);

  return (
    <div className="p-2 space-y-6">

      <ManagementControls
        title="Appointments"
        sort={sort}
        setSort={setSort}
        activeTab={tab}
        setActiveTab={setTab}
      />

      <Filters
        schema={[
          { type: "search", key: "search", placeholder: "Search…" },
          {
            type: "select",
            key: "provider_id",
            placeholder: "Provider",
            options: appointmentProviders.map(p => ({
              value: p.id,
              label: p.provider,
            })),
          },
          {
            type: "select",
            key: "status",
            placeholder: "Status",
            options: [
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "rejected", label: "Rejected" },
            ],
          }
        ]}
        filters={filters}
        setFilters={setFilters}
      />

      {/* BULK BAR */}
      {selected.length > 0 && (
        <div className="flex items-center gap-4 bg-white border p-3 rounded-xl shadow-sm">
          {tab === "trash" ? (
            <Button
              variant="success"
              size="sm"
              onClick={() => {
                for (const id of selected) restoreItem(id);
                setSelected([]);
                fetchItems();
              }}
            >
              <RotateCcw size={14} className="mr-1" /> Restore Selected
            </Button>
          ) : (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => {
                  for (const id of selected) updateStatus(id, "confirmed");
                  setSelected([]);
                  fetchItems();
                }}
              >
                Confirm Selected
              </Button>

              <Button
                variant="warning"
                size="sm"
                onClick={() => {
                  for (const id of selected) updateStatus(id, "rejected");
                  setSelected([]);
                  fetchItems();
                }}
              >
                Reject Selected
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  for (const id of selected) deleteItem(id);
                  setSelected([]);
                  fetchItems();
                }}
              >
                <Trash2 size={14} className="mr-1" /> Delete Selected
              </Button>
            </>
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
        actions={(index) => {
          const it = items[index];
          return (
            <div className="flex items-center gap-3">
              {tab !== "trash" && it.status !== "confirmed" && (
                <button onClick={() => updateStatus(it.id, "confirmed")} className="text-green-600">
                  ✔
                </button>
              )}

              {tab !== "trash" && it.status !== "rejected" && (
                <button onClick={() => updateStatus(it.id, "rejected")} className="text-yellow-600">
                  ✖
                </button>
              )}

              {tab === "trash" ? (
                <button onClick={() => restoreItem(it.id)} className="text-green-600">
                  ↺
                </button>
              ) : (
                <button onClick={() => deleteItem(it.id)} className="text-red-600">
                  🗑
                </button>
              )}

              <button
                onClick={() => openAppointment(it.id)}
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
            onChange={setPage}
            onPerPageChange={(v) => {
              setPerPage(v);
              setPage(1);
            }}
          />
        }
      />

      {/* MODERNISED MODAL */}
      {showModal && editing && (
        <Modal
          title={`Appointment #${editing.id}`}
          onClose={() => {
            setEditing(null);
            setShowModal(false);
          }}
        >
          <div className="space-y-4 text-sm">

            {/* SECTION */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2 text-gray-700">Contact Details</h4>

              <div className="flex justify-between py-1">
                <span className="text-gray-500">Name:</span>
                <span>{editing.name}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-gray-500">Email:</span>
                <span>{editing.email}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-gray-500">Phone:</span>
                <span>{editing.phone}</span>
              </div>
            </div>

            {/* SECTION */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2 text-gray-700">Provider</h4>

              <div>{providerMap[editing.provider_id]}</div>
            </div>

            {/* SECTION */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2 text-gray-700">User (Optional)</h4>

              <div>{editing.user_id ? usersMap[editing.user_id] : "Visitor"}</div>
            </div>

            {/* SECTION */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2 text-gray-700">Notes</h4>

              <div className="whitespace-pre-line">{editing.notes || "—"}</div>
            </div>

            {/* SECTION */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2 text-gray-700">Status</h4>

              <div className="capitalize">{editing.status}</div>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
};

export default Appointments;
