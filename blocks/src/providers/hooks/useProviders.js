import { useEffect, useRef, useState } from "react";
import { getCache, setCache } from "../utils/cache";

const FILTER_KEYS = [
  "search",
  "type_of_care",
  "indication_type",
  "organization_type",
  "religion",
  "target_age_groups",
  "target_genders",
  "has_hkz",
  "reimbursement_type",
  "min_rating",
  "has_reviews",
  "sort",
];

export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [params, setParams] = useState({
    page: 1,
    per_page: 5,
  });

  const requestId = useRef(0);
  const didFirstFetch = useRef(false);

  /* -------------------------------------------------------
     NORMALIZE PARAMS
  ------------------------------------------------------- */
  const normalizeParams = (p) => {
    const out = {};

    FILTER_KEYS.forEach((key) => {
      const v = p[key];
      if (v !== null && v !== undefined && v !== "" && v !== "Any") {
        out[key] = Array.isArray(v) ? v[0] : v;
      }
    });

    out.page = p.page || 1;
    out.per_page = p.per_page || 5;

    return out;
  };

  const makeQueryKey = (qp) =>
    "/wp-json/zorg/v1/frontend/providers?" +
    new URLSearchParams(qp).toString();

  /* -------------------------------------------------------
     PUBLIC API
  ------------------------------------------------------- */
  const applyFilters = (filters) =>
    setParams((prev) => ({
      ...prev,
      ...filters,
      page: 1,
    }));

  const applyPage = (page) =>
    setParams((prev) => ({ ...prev, page }));

  const applyPerPage = (per_page) =>
    setParams((prev) => ({
      ...prev,
      per_page,
      page: 1,
    }));

  /* -------------------------------------------------------
     MAIN FETCH (FAST + SAFE)
  ------------------------------------------------------- */
  const fetchProviders = async (p) => {
    const qp = normalizeParams(p);
    const queryKey = makeQueryKey(qp);

    // 🚀 instant paint from cache
    const cached = getCache(queryKey);
    if (cached) {
      setProviders(cached.data || []);
      setTotal(cached.total || 0);
      setLoading(false);

      if (!didFirstFetch.current) {
        didFirstFetch.current = true;
        return;
      }
    }

    setLoading(true);
    const id = ++requestId.current;
    didFirstFetch.current = true;

    try {
      const res = await fetch(queryKey, {
        headers: { "X-Requested-With": "zorg-frontend" },
        cache: "no-store",
      });

      const json = await res.json();
      if (id !== requestId.current) return;

      if (json?.success) {
        setProviders(json.data || []);
        setTotal(json.total || 0);
        setCache(queryKey, json, 180);
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  };

  /* -------------------------------------------------------
     PREFETCH NEXT PAGE
  ------------------------------------------------------- */
  const prefetchNext = () => {
    const nextPage = params.page + 1;
    const qp = normalizeParams({ ...params, page: nextPage });
    const queryKey = makeQueryKey(qp);

    if (getCache(queryKey)) return;

    fetch(queryKey, {
      headers: { "X-Requested-With": "zorg-frontend" },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) {
          setCache(queryKey, json, 180);
        }
      })
      .catch(() => {});
  };

  /* -------------------------------------------------------
     TRIGGERS
  ------------------------------------------------------- */
  useEffect(() => {
    fetchProviders(params);
  }, [params]);

  useEffect(() => {
    if (providers.length) {
      prefetchNext();
    }
  }, [providers]);

  /* -------------------------------------------------------
     RETURN API
  ------------------------------------------------------- */
  return {
    providers,
    total,
    loading,
    params,

    setFilters: applyFilters,
    setPage: applyPage,
    setPerPage: applyPerPage,
  };
}
