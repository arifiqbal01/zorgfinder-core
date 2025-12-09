import { useState, useCallback, useEffect } from "react";

const DEFAULT_PER_PAGE = 10;
const getNonce = () => window?.zorgFinderApp?.nonce || "";

export const useProvidersList = () => {
  const [providers, setProviders] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    type_of_care: "",
    indication_type: "",
    organization_type: "",
    religion: "",
    has_hkz: "",
    gender: "",
    age_group: "",
  });

  const [sort, setSort] = useState("newest");
  const [activeTab, setActiveTab] = useState("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [total, setTotal] = useState(0);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v != null) params.append(k, v);
    });

    params.append("page", page);
    params.append("per_page", perPage);
    params.append("sort", sort);
    params.append("trashed", activeTab === "trash" ? "1" : "0");

    return params.toString();
  }, [filters, page, perPage, sort, activeTab]);

  const fetchProviders = useCallback(async () => {
    const params = buildParams();
    const url = `/wp-json/zorg/v1/providers?${params}`;

    console.log("[Providers] Fetch URL:", url);

    try {
      const headers = {};
      if (activeTab === "trash") headers["X-WP-Nonce"] = getNonce();

      const res = await fetch(url, { headers });
      const raw = await res.text();

      console.log("[Providers] Raw:", raw);

      let json = {};
      try {
        json = JSON.parse(raw);
      } catch (err) {
        console.error("[Providers] JSON error:", err);
        setProviders([]);
        return;
      }

        const list = Array.isArray(json?.data) ? json.data : [];

        const normalized = list.map((p) => ({
          ...p,
          provider: p.provider,
          target_genders: Array.isArray(p.target_genders)
            ? p.target_genders
            : p.target_genders
            ? JSON.parse(p.target_genders)
            : [],
          target_age_groups: Array.isArray(p.target_age_groups)
            ? p.target_age_groups
            : p.target_age_groups
            ? JSON.parse(p.target_age_groups)
            : [],
          has_hkz: Number(p.has_hkz) === 1 ? 1 : 0,
        }));

        setProviders(normalized);

        // TOTAL now comes from root-level json
        setTotal(json?.total || 0);


      console.log("[Providers] Final count:", normalized.length);

    } catch (err) {
      console.error("[Providers] Fetch error:", err);
      setProviders([]);
      setTotal(0);
    }
  }, [buildParams, activeTab]);

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
    fetchProviders,
  };
};
