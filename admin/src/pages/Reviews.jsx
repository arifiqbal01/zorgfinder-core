import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { Eye, Trash2, RotateCcw, Star } from "lucide-react";
import { useListManager } from "../hooks/useListManager";

// Correct nonce source
const getNonce = () => window?.zorgFinderApp?.nonce || "";

const Reviews = () => {
  // NEW: expanded comment state
  const [expandedCommentId, setExpandedCommentId] = useState(null);

  /* Load reviews */
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

  const authHeaders = {
    "X-WP-Nonce": getNonce(),
  };

  /* ---------------------------------------------------------
     LOAD PROVIDERS + USERS
  --------------------------------------------------------- */
  useEffect(() => {
    // PROVIDERS
    (async () => {
      try {
        const res = await fetch(`/wp-json/zorg/v1/providers?per_page=999`, {
          headers: authHeaders,
        });
        const json = await res.json();

        if (json?.success) {
          const map = {};
          json.data.forEach((p) => (map[p.id] = p.name));
          setProviders(json.data);
          setProviderMap(map);
        }
      } catch {}
    })();

    // USERS
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

  /* ---------------------------------------------------------
     PROVIDERS WITH REVIEWS ONLY
  --------------------------------------------------------- */
  const reviewedProviders = providers.filter((p) =>
    items.some((r) => r.provider_id === p.id)
  );

  /* ---------------------------------------------------------
     APPROVE / PENDING
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     OPEN REVIEW
  --------------------------------------------------------- */
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

  const bulkApprove = async () => {
    for (const id of selected) await setApproved(id, 1);
    setSelected([]);
    fetchItems();
  };

  const bulkPending = async () => {
    for (const id of selected) await setApproved(id, 0);
    setSelected([]);
    fetchItems();
  };

  /* ---------------------------------------------------------
     Close expanded comment when clicking outside
  --------------------------------------------------------- */
  useEffect(() => {
    const handleClickOutside = () => setExpandedCommentId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  /* ---------------------------------------------------------
     TABLE CONFIG
  --------------------------------------------------------- */
  const columns = ["Provider", "User", "Rating", "Status", "Comment", "Date"];

  const rows = items.map((r) => [
    providerMap[r.provider_id] || `#${r.provider_id}`,
    usersMap[r.user_id] || `User #${r.user_id}`,
    <div className="flex items-center gap-2">{r.rating} <Star size={14} /></div>,
    Number(r.approved) === 1 ? (
      <span className="text-green-600 font-semibold">Approved</span>
    ) : (
      <span className="text-yellow-600 font-semibold">Pending</span>
    ),

    /* COMMENT CELL WITH TRUNCATION + EXPAND */
    <td onClick={(e) => e.stopPropagation()}>
      {expandedCommentId === r.id ? (
        /* FULL COMMENT */
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
        /* TRUNCATED COMMENT */
        <div className="relative max-w-[260px]">
          <div className="line-clamp-3 whitespace-pre-line">
            {r.comment}
          </div>

          {/* explicit "..." button */}
          {r.comment.length > 80 && (
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

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */
  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reviews</h1>

        <div className="flex items-center gap-4">
          {/* Tabs */}
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
            </select>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <Filters
        schema={[
          { type: "search", key: "search", placeholder: "Search reviews…" },
          {
            type: "select",
            key: "provider_id",
            placeholder: "Provider",
            options: reviewedProviders.map((p) => ({
              value: p.id,
              label: p.name,
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

      {/* BULK BAR */}
      {selected.length > 0 && (
        <div className="flex items-center gap-4 bg-white border p-3 rounded-xl shadow-sm">
          {tab === "trash" ? (
            <Button variant="success" size="sm" onClick={bulkRestore}>
              <RotateCcw size={14} className="mr-1" /> Restore Selected
            </Button>
          ) : (
            <>
              <Button variant="success" size="sm" onClick={bulkApprove}>
                Approve Selected
              </Button>
              <Button variant="warning" size="sm" onClick={bulkPending}>
                Mark Pending
              </Button>
              <Button variant="danger" size="sm" onClick={bulkDelete}>
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
        actions={(i) => {
          const r = items[i];
          return (
            <div className="flex items-center gap-3">
              {tab !== "trash" &&
                (Number(r.approved) === 1 ? (
                  <button
                    onClick={() => setApproved(r.id, 0)}
                    className="text-yellow-600"
                  >
                    Mark Pending
                  </button>
                ) : (
                  <button
                    onClick={() => setApproved(r.id, 1)}
                    className="text-green-600"
                  >
                    Approve
                  </button>
                ))}

              {tab === "trash" ? (
                <button
                  onClick={() => restoreItem(r.id).then(fetchItems)}
                  className="text-green-600"
                >
                  <RotateCcw size={16} />
                </button>
              ) : (
                <button
                  onClick={() => deleteItem(r.id).then(fetchItems)}
                  className="text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <button
                onClick={() => openItem(r.id)}
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

      {/* MODAL */}
      {showModal && editing && (
        <Modal
          title={`Review #${editing.id}`}
          onClose={() => {
            setEditing(null);
            setShowModal(false);
          }}
        >
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
              <strong>Rating:</strong>
              <div className="mt-1 flex items-center gap-2">
                {editing.rating} <Star size={16} />
              </div>
            </div>

            <div>
              <strong>Status:</strong>
              <div className="mt-1">
                {Number(editing.approved) === 1 ? "Approved" : "Pending"}
              </div>
            </div>

            <div>
              <strong>Comment:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-line">
                {editing.comment}
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

export default Reviews;
