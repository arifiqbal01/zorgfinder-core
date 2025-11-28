import { useState, useCallback, useEffect } from "react";

const DEFAULT_PER_PAGE = 10;

const getNonce = () =>
  window?.wpApiSettings?.nonce || "";

export const useProvidersList = () => {
  const [providers, setProviders] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    type_of_care: "",
    indication_type: "",
    organization_type: "",
    religion: "",
    has_hkz: "",
  });

  const [sort, setSort] = useState("newest");
  const [activeTab, setActiveTab] = useState("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  /* Build Query Params */
  const buildParams = useCallback(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });

    params.append("page", page);
    params.append("per_page", perPage);
    params.append("sort", sort);
    params.append("trashed", activeTab === "trash" ? "1" : "0");

    return params.toString();
  }, [filters, page, perPage, sort, activeTab]);

  /* Fetch Providers */
  const fetchProviders = useCallback(async () => {
  const params = buildParams();
  const url = `/wp-json/zorg/v1/providers?${params}`;

  setLoading(true);

  try {
    const headers = {};

    // Only for trash view, because requires admin
    if (activeTab === "trash") {
      headers["X-WP-Nonce"] = window.wpApiSettings?.nonce || "";
    }

    const res = await fetch(url, { headers });

    const text = await res.text();

    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = {};
    }

    const rawList = Array.isArray(json?.data) ? json.data : [];

    const normalized = rawList.map((p) => ({
      ...p,
      has_hkz: Number(p.has_hkz) === 1 ? 1 : 0,
    }));

    setProviders(normalized);
    setTotal(json?.total || 0);
  } catch (err) {
    setProviders([]);
    setTotal(0);
  } finally {
    setLoading(false);
  }
}, [buildParams, activeTab]);

  /* Effects */
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    setPage(1);
    fetchProviders();
  }, [filters, sort, perPage]);

  useEffect(() => {
    setPage(1);
    fetchProviders();
  }, [activeTab]);

  return {
    providers,
    total,
    filters,
    setFilters,
    sort,
    setSort,
    activeTab,
    setActiveTab,
    page,
    setPage,
    perPage,
    setPerPage,
    loading,
    fetchProviders,
  };
};
