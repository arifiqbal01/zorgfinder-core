import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { Eye, Trash2, RotateCcw, Star } from "lucide-react";
import { useListManager } from "../hooks/useListManager";

const getNonce = () => window?.zorgFinderApp?.nonce || "";

const Reviews = () => {
  const [expandedCommentId, setExpandedCommentId] = useState(null);

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
    restoreItem,
  } = useListManager(
    "/reviews",
    { search: "", provider_id: "", approved: "" },
    true
  );

  const [providers, setProviders] = useState([]);
  const [providerMap, setProviderMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [selected, setSelected] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const authHeaders = { "X-WP-Nonce": getNonce() };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/wp-json/zorg/v1/providers?per_page=999`, {
          headers: authHeaders,
        });
        const json = await res.json();
        if (json?.success) {
          const map = {};
         json.data.forEach((p) => (map[p.id] = p.provider));
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
          json.forEach((u) => {
            m[u.id] = u.name || u.username || u.slug || `User #${u.id}`;
          });
          setUsersMap(m);
        }
      } catch {}
    })();
  }, []);

  const reviewedProviders = providers.filter((p) =>
    items.some((r) => r.provider_id === p.id)
  );

  const setApproved = async (id, status) => {
    await fetch(`/wp-json/zorg/v1/reviews/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": getNonce(),
      },
      body: JSON.stringify({ approved: status }),
    });
    fetchItems();
  };

  const openItem = async (id) => {
    try {
      const res = await fetch(`/wp-json/zorg/v1/reviews/${id}`, {
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
    const handleClickOutside = () => setExpandedCommentId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const columns = ["Provider", "User", "Overall", "Status", "Comment", "Date"];

  const rows = items.map((r) => [
    providerMap[r.provider_id] || `#${r.provider_id}`,
    usersMap[r.user_id] || `User #${r.user_id}`,
    <div className="flex items-center gap-2">
      <strong>{r.rating_overall}</strong>
      <Star size={14} />
    </div>,
    Number(r.approved) === 1 ? (
      <span className="text-green-600 font-semibold">Approved</span>
    ) : (
      <span className="text-yellow-600 font-semibold">Pending</span>
    ),
    <td onClick={(e) => e.stopPropagation()}>
      {expandedCommentId === r.id ? (
        <div>
          <div className="p-2 bg-gray-50 rounded leading-relaxed whitespace-pre-line">
            {r.comment}
          </div>
          <button
            className="text-blue-600 text-xs mt-1 underline"
            onClick={() => setExpandedCommentId(null)}
          >
            Collapse
          </button>
        </div>
      ) : (
        <div className="relative max-w-[260px]">
          <div className="line-clamp-3 whitespace-pre-line">{r.comment}</div>
          {r.comment && r.comment.length > 80 && (
            <button
              className="absolute bottom-0 right-0 bg-white pl-1 text-blue-600 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedCommentId(r.id);
              }}
            >
              ...
            </button>
          )}
        </div>
      )}
    </td>,
    r.created_at,
  ]);

  return (
    <div className="p-2 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reviews</h1>

        <div className="flex items-center gap-4">
          <div className="flex bg-white shadow-sm rounded-lg overflow-hidden">
            <button
              onClick={() => setTab("active")}
              className={`px-4 py-2 text-sm ${
                tab === "active" ? "bg-black text-white" : "bg-gray-100"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setTab("trash")}
              className={`px-4 py-2 text-sm border-l ${
                tab === "trash" ? "bg-black text-white" : "bg-gray-100"
              }`}
            >
              Trash
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Sort:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input min-w-[140px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>
        </div>
      </div>

      <Filters
        schema={[
          { type: "search", key: "search", placeholder: "Search reviews…" },
          {
            type: "select",
            key: "provider_id",
            placeholder: "Provider",
            options: reviewedProviders.map((p) => ({
              value: p.id,
              label: p.provider,
            })),
          },
          {
            type: "select",
            key: "approved",
            placeholder: "Status",
            options: [
              { value: 1, label: "Approved" },
              { value: 0, label: "Pending" },
            ],
          },
        ]}
        filters={filters}
        setFilters={setFilters}
      />

      {selected.length > 0 && (
        <div className="flex items-center gap-4 bg-white border p-3 rounded-xl shadow-sm">
          {tab === "trash" ? (
            <Button variant="success" size="sm" onClick={async () => { for (const id of selected) await restoreItem(id); setSelected([]); fetchItems(); }}>
              <RotateCcw size={14} className="mr-1" /> Restore Selected
            </Button>
          ) : (
            <>
              <Button variant="success" size="sm" onClick={async () => { for (const id of selected) await fetch(`/wp-json/zorg/v1/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-WP-Nonce": getNonce() }, body: JSON.stringify({ approved: 1 }) }); setSelected([]); fetchItems(); }}>
                Approve Selected
              </Button>
              <Button variant="warning" size="sm" onClick={async () => { for (const id of selected) await fetch(`/wp-json/zorg/v1/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-WP-Nonce": getNonce() }, body: JSON.stringify({ approved: 0 }) }); setSelected([]); fetchItems(); }}>
                Mark Pending
              </Button>
              <Button variant="danger" size="sm" onClick={async () => { for (const id of selected) await deleteItem(id); setSelected([]); fetchItems(); }}>
                <Trash2 size={14} className="mr-1" /> Delete Selected
              </Button>
            </>
          )}

          <span className="ml-auto text-sm text-gray-600">{selected.length} selected</span>
        </div>
      )}

      <Table
        columns={columns}
        data={rows}
        providers={items}
        selected={selected}
        setSelected={setSelected}
        actions={(i) => {
          const r = items[i];
          return (
            <div className="flex items-center gap-3">
              {tab !== "trash" &&
                (Number(r.approved) === 1 ? (
                  <button onClick={() => setApproved(r.id, 0)} className="text-yellow-600">Mark Pending</button>
                ) : (
                  <button onClick={() => setApproved(r.id, 1)} className="text-green-600">Approve</button>
                ))}

              {tab === "trash" ? (
                <button onClick={() => restoreItem(r.id).then(fetchItems)} className="text-green-600"><RotateCcw size={16} /></button>
              ) : (
                <button onClick={() => deleteItem(r.id).then(fetchItems)} className="text-red-600"><Trash2 size={16} /></button>
              )}

              <button onClick={() => openItem(r.id)} className="text-blue-600"><Eye size={16} /></button>
            </div>
          );
        }}
        pagination={<Pagination page={page} perPage={perPage} total={total} onChange={(p) => setPage(p)} onPerPageChange={(v) => { setPerPage(v); setPage(1); }} />}
      />

      {showModal && editing && (
        <Modal title={`Review #${editing.id}`} onClose={() => { setEditing(null); setShowModal(false); }}>
          <div className="space-y-4 text-sm">
            <div>
              <strong>Provider:</strong>
              <div className="mt-1">{providerMap[editing.provider_id]}</div>
            </div>

            <div>
              <strong>User:</strong>
              <div className="mt-1">{usersMap[editing.user_id]}</div>
            </div>

            <div>
              <strong>Overall:</strong>
              <div className="mt-1 flex items-center gap-2">
                <strong>{editing.rating_overall}</strong>
                <Star size={16} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Staff Behavior</div>
                <div className="font-medium">{editing.rating_staff} <Star size={14} /></div>
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Communication</div>
                <div className="font-medium">{editing.rating_communication} <Star size={14} /></div>
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Cleanliness</div>
                <div className="font-medium">{editing.rating_cleanliness} <Star size={14} /></div>
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Facilities</div>
                <div className="font-medium">{editing.rating_facilities} <Star size={14} /></div>
              </div>

              <div className="p-3 bg-gray-50 rounded col-span-2">
                <div className="text-xs text-gray-500">Professionalism</div>
                <div className="font-medium">{editing.rating_professionalism} <Star size={14} /></div>
              </div>
            </div>

            <div>
              <strong>Comment:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-line">{editing.comment || "—"}</div>
            </div>

            <div>
              <strong>Status:</strong>
              <div className="mt-1">{Number(editing.approved) === 1 ? "Approved" : "Pending"}</div>
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

export default Reviews;
