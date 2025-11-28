import { useState, useCallback, useEffect } from "react";

const getNonce = () => window?.zorgFinderApp?.nonce || "";

/* -----------------------------------------------------------
 * GLOBAL TTL CACHE
 ----------------------------------------------------------- */
const LIST_CACHE = {};
const CACHE_TTL = 20000;

const isFresh = (entry) =>
  entry && Date.now() - entry.timestamp < CACHE_TTL;

/* -----------------------------------------------------------
 * MAP UI SORT → API SORT
 ----------------------------------------------------------- */
const mapSort = (sortKey) => {
  console.log("📌 mapSort() received:", sortKey);

  switch (sortKey) {
    case "newest":
      return "date_desc";

    case "oldest":
      return "date_asc";

    case "alpha_asc":
      return "name_asc";

    case "alpha_desc":
      return "name_desc";

    case "rating_high":
      return "rating_desc";

    case "rating_low":
      return "rating_asc";

    default:
      return "date_desc";
  }
};

/* -----------------------------------------------------------
 * PRODUCTION + DEBUG LIST MANAGER
 ----------------------------------------------------------- */
export const useListManager = (
  endpoint,
  initialFilters = {},
  requireAuth = true
) => {

  console.log("=== useListManager INIT for:", endpoint, "===");

  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("newest");
  const [tab, setTab] = useState("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const authHeaders = { "X-WP-Nonce": getNonce() };

  /* -----------------------------------------------------------
   * BUILD PARAMS (LOGGING INSIDE)
   ----------------------------------------------------------- */
  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    console.log("🔧 Building params…");

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) {
        params.append(k, v);
      }
    });

    params.append("page", page);
    params.append("per_page", perPage);

    const mappedSort = mapSort(sort);
    params.append("sort", mappedSort);

    params.append("trashed", tab === "trash" ? "1" : "0");

    console.log("🔍 Built params:", Object.fromEntries(params.entries()));
    return params.toString();

  }, [filters, page, perPage, sort, tab]);

  /* -----------------------------------------------------------
   * FETCH ITEMS (HEAVY LOGGING)
   ----------------------------------------------------------- */
  const fetchItems = useCallback(async () => {
    const params = buildParams();

    const url = `/wp-json/zorg/v1${endpoint}?${params}`;
    console.log("🚀 FETCH URL:", url);
    console.log("📨 Headers:", requireAuth ? authHeaders : {});

    setLoading(true);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: requireAuth ? authHeaders : {},
      });

      console.log("📥 Response Status:", res.status);

      const raw = await res.text();
      console.log("📄 RAW TEXT RESPONSE:", raw);

      let json = {};
      try {
        json = JSON.parse(raw);
      } catch (e) {
        console.error("❌ JSON PARSE FAILED:", e);
      }

      console.log("📦 JSON RESPONSE:", json);

      const list = Array.isArray(json?.data) ? json.data : [];
      const totalVal = json?.total || list.length;

      console.log("📊 Normalized list:", list);
      console.log("📊 Total:", totalVal);

      setItems(list);
      setTotal(totalVal);

      LIST_CACHE[url] = {
        timestamp: Date.now(),
        data: { items: list, total: totalVal },
      };

      console.log("💾 Cached:", LIST_CACHE[url]);

    } catch (err) {
      console.error("🔥 FETCH FAILED:", err);

      const cached = LIST_CACHE[url];
      if (isFresh(cached)) {
        console.log("♻ Loading from cache:", cached);
        setItems(cached.data.items);
        setTotal(cached.data.total);
      } else {
        setItems([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      console.log("🟦 Loading finished");
    }

  }, [endpoint, buildParams, requireAuth]);

  /* -----------------------------------------------------------
   * REFETCH ON CHANGES
   ----------------------------------------------------------- */
  useEffect(() => {
    console.log("🔄 Filters/sort/perPage/tab changed → resetting page to 1");
    setPage(1);
    fetchItems();
  }, [filters, sort, perPage, tab]);

  useEffect(() => {
    console.log("📄 Page changed:", page);
    fetchItems();
  }, [page]);

  /* -----------------------------------------------------------
   * DELETE / RESTORE
   ----------------------------------------------------------- */
  const invalidateCache = () => {
    console.log("🧹 Clearing cache for endpoint:", endpoint);
    Object.keys(LIST_CACHE)
      .filter((key) => key.includes(endpoint))
      .forEach((k) => delete LIST_CACHE[k]);
  };

  const deleteItem = async (id) => {
    console.log("🗑 Deleting:", id);

    await fetch(`/wp-json/zorg/v1${endpoint}/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    invalidateCache();
    fetchItems();
  };

  const restoreItem = async (id) => {
    console.log("♻ Restoring:", id);

    await fetch(`/wp-json/zorg/v1${endpoint}/${id}/restore`, {
      method: "PATCH",
      headers: authHeaders,
    });

    invalidateCache();
    fetchItems();
  };

  return {
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
    restoreItem,
  };
};
