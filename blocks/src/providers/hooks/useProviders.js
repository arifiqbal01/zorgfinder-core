import { useState, useEffect } from "react";
import { getCache, setCache } from "../utils/cache";

export function useProviders() {
    const [providers, setProviders] = useState(getCache("providers:list") || []);
    const [total, setTotal] = useState(getCache("providers:total") || 0);
    const [loading, setLoading] = useState(!providers.length);

    const fetchProviders = async (params = {}) => {
        setLoading(true);

        const defaultParams = {
            per_page: 12,
            page: 1,
            ...params
        };

        const key = `providers:${JSON.stringify(defaultParams)}`;
        const cached = getCache(key);

        if (cached) {
            setProviders(cached.providers);
            setTotal(cached.total);
            setLoading(false);
        }

        try {
            const qs = new URLSearchParams(defaultParams).toString();
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
