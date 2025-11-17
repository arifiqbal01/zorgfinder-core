import React, { useEffect, useState, useCallback } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import { Eye, Star } from "lucide-react";

/**
 * Admin Reviews page — sends nonce on every request so server knows this is admin UI.
 */

const DEFAULT_PER_PAGE = 10;

const getNonce = () =>
  typeof zorgFinderApp !== "undefined" ? zorgFinderApp.nonce : "";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
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
    approved: "",
    rating: "",
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

  // load providers + users
  useEffect(() => {
    (async () => {
      try {
        const p = await fetch("/wp-json/zorg/v1/providers?per_page=999", {
          headers,
        });
        const pj = await p.json();
        if (pj?.success) {
          setProviders(pj.data);
          const map = {};
          pj.data.forEach((x) => (map[x.id] = x.name));
          setProviderMap(map);
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
            map[user.id] =
              user.name || user.username || user.slug || `#${user.id}`;
          });
          setUsersMap(map);
        }
      } catch (e) {
        setUsersMap({});
      }
    })();
  }, []);

  // fetch reviews
  const fetchReviews = useCallback(async () => {
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

      const res = await fetch(
        `/wp-json/zorg/v1/reviews?${params.toString()}`,
        {
          headers,
        }
      );
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        setReviews(json.data);
        setTotal(json.total || 0);
      } else {
        setReviews([]);
        setTotal(0);
      }
    } catch (e) {
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, perPage, sort, tab]);

  useEffect(() => {
    setPage(1);
  }, [
    filters.provider_id,
    filters.search,
    filters.approved,
    filters.rating,
    sort,
    tab,
    perPage,
  ]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, page, perPage, sort, tab]);

  // actions
  const patchReview = async (id, body) => {
    await fetch(`/wp-json/zorg/v1/reviews/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
  };

  const deleteReview = async (id) => {
    await fetch(`/wp-json/zorg/v1/reviews/${id}`, {
      method: "DELETE",
      headers: { "X-WP-Nonce": getNonce() },
    });
  };

  const restoreReview = async (id) => {
    await fetch(`/wp-json/zorg/v1/reviews/${id}/restore`, {
      method: "PATCH",
      headers: { "X-WP-Nonce": getNonce() },
    });
  };

  const handleApprove = async (id) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, approved: 1 } : r))
    );
    await patchReview(id, { approved: 1 });
    await fetchReviews();
  };

  const handleUnapprove = async (id) => {
    if (tab === "active") {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setSelected((s) => s.filter((x) => x !== id));
    } else {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, approved: 0 } : r))
      );
    }
    await patchReview(id, { approved: 0 });
    await fetchReviews();
  };

  const handleDelete = async (id) => {
    await deleteReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    await fetchReviews();
  };

  const handleRestore = async (id) => {
    await restoreReview(id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    await fetchReviews();
  };

  // bulk actions
  const bulkApprove = async () => {
    for (const id of selected) await patchReview(id, { approved: 1 });
    setSelected([]);
    await fetchReviews();
  };

  const bulkPending = async () => {
    for (const id of selected) await patchReview(id, { approved: 0 });
    setSelected([]);
    await fetchReviews();
  };

  const bulkDelete = async () => {
    for (const id of selected) await deleteReview(id);
    setSelected([]);
    await fetchReviews();
  };

  const bulkRestore = async () => {
    for (const id of selected) await restoreReview(id);
    setSelected([]);
    await fetchReviews();
  };

  const openReview = async (id) => {
    try {
      const res = await fetch(`/wp-json/zorg/v1/reviews/${id}`, { headers });
      const json = await res.json();
      if (json?.success) {
        setEditing(json.data);
        setShowModal(true);
      }
    } catch (e) {}
  };

  const columns = ["", "Provider", "User", "Rating", "Status", "Comment", "Date"];

  const rows = reviews.map((r) => [
    "",
    providerMap[r.provider_id] || `#${r.provider_id}`,
    usersMap[r.user_id] || `User #${r.user_id}`,
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{r.rating}</span>
      <Star size={14} />
    </div>,

    // FIXED STATUS
    Number(r.approved) === 1 ? (
      <span className="text-green-600 font-medium">Approved</span>
    ) : (
      <span className="text-yellow-600 font-medium">Pending</span>
    ),

    <span className="truncate max-w-[220px] whitespace-pre-line">
      {r.comment}
    </span>,
    r.created_at,
  ]);

  return (
    <div className="p-2 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Reviews</h1>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Sort:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>

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

      <Filters
        schema={[
          { type: "search", key: "search", placeholder: "Search reviews…" },
          {
            type: "select",
            key: "provider_id",
            placeholder: "Provider",
            options: providers.map((p) => ({ value: p.id, label: p.name })),
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

     {/* Rating Buttons (improved visuals & accessible) */}
      <div className="flex gap-3 items-center zf-no-select" role="toolbar" aria-label="Filter by rating">
        <button
          type="button"
          onClick={() => setFilters((f) => ({ ...f, rating: "" }))}
          className={`px-4 py-1 rounded-full text-sm font-medium select-none ${filters.rating === "" ? "bg-black text-white" : "bg-gray-100 text-gray-700"}`}
          aria-pressed={filters.rating === ""}
        >
          All Ratings
        </button>

        {["5","4","3","2","1"].map((r) => {
          const active = String(filters.rating) === String(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, rating: r }))}
              className={`${active ? 'zf-rating-btn zf-active' : 'zf-rating-btn'} focus:outline-none`}
              aria-pressed={active}
              title={`${r} star${r !== "1" ? "s" : ""}`}
            >
              <div className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 .587l3.668 7.431L23 9.75l-5.5 5.356L18.334 24 12 20.092 5.666 24 6.5 15.106 1 9.75l7.332-1.732L12 .587z" />
                </svg>
                <span className="text-sm font-medium">{r}</span>
              </div>
            </button>
          );
        })}
      </div>


      {/* Bulk Actions */}
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
            <>
              <button
                onClick={bulkApprove}
                className="px-3 py-1 rounded bg-green-600 text-white"
              >
                Approve Selected
              </button>
              <button
                onClick={bulkPending}
                className="px-3 py-1 rounded bg-yellow-600 text-white"
              >
                Mark Pending
              </button>
              <button
                onClick={bulkDelete}
                className="px-3 py-1 rounded bg-red-600 text-white"
              >
                Delete Selected
              </button>
            </>
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
        providers={reviews}
        selected={selected}
        setSelected={setSelected}
        actions={(i) => {
          const r = reviews[i];
          const approved = Number(r.approved) === 1;

          return (
            <div className="flex items-center gap-3">

              {/* Approve */}
              {!approved && tab !== "trash" && (
                <button
                  onClick={() => handleApprove(r.id)}
                  title="Approve"
                  className="text-green-600"
                >
                  ✔
                </button>
              )}

              {/* Unapprove */}
              {approved && tab !== "trash" && (
                <button
                  onClick={() => handleUnapprove(r.id)}
                  title="Unapprove"
                  className="text-yellow-600"
                >
                  ✖
                </button>
              )}

              {/* Delete / Restore */}
              {tab === "trash" ? (
                <button
                  onClick={() => handleRestore(r.id)}
                  title="Restore"
                  className="text-green-600"
                >
                  ↺
                </button>
              ) : (
                <button
                  onClick={() => handleDelete(r.id)}
                  title="Delete"
                  className="text-red-600"
                >
                  🗑
                </button>
              )}

              <button
                onClick={() => openReview(r.id)}
                title="View"
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
          title={`Review #${editing.id}`}
          onClose={() => {
            setEditing(null);
            setShowModal(false);
          }}
        >
          <div className="space-y-3 text-sm">
            <div>
              <strong>Provider:</strong>{" "}
              {providerMap[editing.provider_id] || editing.provider_id}
            </div>
            <div>
              <strong>User:</strong>{" "}
              {usersMap[editing.user_id] || editing.user_id}
            </div>
            <div>
              <strong>Rating:</strong>{" "}
              <span className="inline-flex items-center gap-2">
                {editing.rating} <Star size={16} />
              </span>
            </div>

            {/* FIXED STATUS */}
            <div>
              <strong>Status:</strong>{" "}
              {Number(editing.approved) === 1 ? "Approved" : "Pending"}
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
