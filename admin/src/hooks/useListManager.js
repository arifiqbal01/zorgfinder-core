import { useState, useCallback, useEffect } from "react";

const DEFAULT_CACHE_TTL = 20000;
const LIST_CACHE = {};

const getNonce = () => window?.zorgFinderApp?.nonce || "";

const mapSort = (key) => {
  switch (key) {
    case "newest": return "date_desc";
    case "oldest": return "date_asc";
    case "alpha_asc": return "name_asc";
    case "alpha_desc": return "name_desc";
    case "rating_high": return "rating_desc";
    case "rating_low": return "rating_asc";
    default: return "date_desc";
  }
};

export const useListManager = (endpoint, initialFilters = {}, requireAuth = true) => {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("newest");
  const [tab, setTab] = useState("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const authHeaders = requireAuth ? { "X-WP-Nonce": getNonce() } : {};

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) params.append(k, v);
    });

    params.append("page", page);
    params.append("per_page", perPage);
    params.append("sort", mapSort(sort));
    params.append("trashed", tab === "trash" ? "1" : "0");

    return params.toString();
  }, [filters, page, perPage, sort, tab]);

  const fetchItems = useCallback(async () => {
    const params = buildParams();
    const url = `/wp-json/zorg/v1${endpoint}?${params}`;

    try {
      const res = await fetch(url, { headers: authHeaders });
      const text = await res.text();
      const json = JSON.parse(text);

      const list = Array.isArray(json?.data) ? json.data : [];
      setItems(list);
      setTotal(json?.total ?? list.length);

      LIST_CACHE[url] = {
        timestamp: Date.now(),
        data: { items: list, total: json?.total ?? list.length },
      };
    } catch {
      const cached = LIST_CACHE[url];
      if (cached && Date.now() - cached.timestamp < DEFAULT_CACHE_TTL) {
        setItems(cached.data.items);
        setTotal(cached.data.total);
      } else {
        setItems([]);
        setTotal(0);
      }
    }
  }, [buildParams, endpoint]);

  useEffect(() => {
    setPage(1);
    fetchItems();
  }, [filters, sort, perPage, tab]);

  useEffect(() => {
    fetchItems();
  }, [page]);

  const invalidateCache = () => {
    Object.keys(LIST_CACHE)
      .filter((key) => key.includes(endpoint))
      .forEach((k) => delete LIST_CACHE[k]);
  };

  const deleteItem = async (id) => {
    await fetch(`/wp-json/zorg/v1${endpoint}/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    invalidateCache();
    fetchItems();
  };

  const restoreItem = async (id) => {
    await fetch(`/wp-json/zorg/v1${endpoint}/${id}/restore`, {
      method: "PATCH",
      headers: authHeaders,
    });
    invalidateCache();
    fetchItems();
  };

  return {
    items,
    filters, setFilters,
    sort, setSort,
    tab, setTab,
    page, setPage,
    perPage, setPerPage,
    total,
    fetchItems,
    deleteItem,
    restoreItem,
  };
};
