import { useState, useEffect } from "react";
import { getCache, setCache } from "../utils/cache";

export function useProviders() {
    const [providers, setProviders] = useState(getCache("providers:list") || []);
    const [total, setTotal] = useState(getCache("providers:total") || 0);
    const [loading, setLoading] = useState(!providers.length);

   // src/providers/hooks/useProviders.js  (or wherever your hook lives)
const fetchProviders = async (params = {}) => {
  setLoading(true);

  const defaultParams = {
    per_page: 12,
    page: 1,
    ...params
  };

  // CLEAN params: remove undefined, null and empty-string filters
  const cleanParams = Object.entries(defaultParams).reduce((acc, [k, v]) => {
    if (v === undefined || v === null) return acc;
    // keep 0 and boolean false; skip empty string
    if (typeof v === "string" && v.trim() === "") return acc;
    acc[k] = v;
    return acc;
  }, {});

  const key = `providers:${JSON.stringify(cleanParams)}`;
  const cached = getCache(key);

  if (cached) {
    setProviders(cached.providers);
    setTotal(cached.total);
    setLoading(false);
  }

  try {
    const qs = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`/wp-json/zorg/v1/providers?${qs}`);
    const json = await res.json();

    if (json.success) {
      setProviders(json.data);
      setTotal(json.total);

      setCache(key, {
        providers: json.data,
        total: json.total
      }, 30); // cache 30s
    }
  } catch (e) {
    console.error("Providers fetch failed", e);
  }

  setLoading(false);
};


    return { providers, total, loading, fetchProviders };
}
