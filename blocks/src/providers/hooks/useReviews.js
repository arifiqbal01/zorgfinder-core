import { useEffect, useState } from "react";
import { getCache, setCache } from "../utils/cache";

export function useReviews(providerId) {
    const cacheKey = `review:${providerId}`;
    const cached = getCache(cacheKey);

    const [rating, setRating] = useState(cached?.rating || 0);
    const [count, setCount] = useState(cached?.count || 0);

    const load = async () => {
        const res = await fetch(`/wp-json/zorg/v1/reviews?provider_id=${providerId}`);
        const json = await res.json();

        if (json.success) {
            const list = json.data;
            const count = list.length;

            const rating = count
                ? (list.reduce((s, r) => s + parseInt(r.rating), 0) / count).toFixed(1)
                : 0;

            setRating(rating);
            setCount(count);

            setCache(cacheKey, { rating, count }, 120);
        }
    };

    useEffect(() => { load(); }, [providerId]);

    return { rating, count };
}
