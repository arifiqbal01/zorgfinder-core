import { createContext, useContext, useEffect, useState } from "react";
import { getCache, setCache } from "../utils/cache";

const FavouritesContext = createContext();

export function FavouritesProvider({ children }) {
    const cached = getCache("favourites:list") || [];

    const [favourites, setFavourites] = useState(cached);
    const [loading, setLoading] = useState(!cached.length);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/wp-json/zorg/v1/favourites?per_page=999&page=1", {
                    headers: { "X-WP-Nonce": window.zorgFinderApp?.nonce || "" }
                });

                const json = await res.json();
                const favs = json?.data?.data || [];

                const ids = favs.map(f => parseInt(f.provider_id));
                setFavourites(ids);

                setCache("favourites:list", ids, 60); // 1 minute cache
            } catch {
                console.error("Favourite load failed");
            }
            setLoading(false);
        }

        load();
    }, []);

    async function toggle(providerId) {
        const id = parseInt(providerId);

        setFavourites(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

        setCache("favourites:list", favourites, 60);

        await fetch("/wp-json/zorg/v1/favourites", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": window.zorgFinderApp?.nonce || ""
            },
            body: JSON.stringify({ provider_id: id })
        });
    }

    return (
        <FavouritesContext.Provider value={{ favourites, toggle, loading }}>
            {children}
        </FavouritesContext.Provider>
    );
}

export function useFavouritesStore() {
    return useContext(FavouritesContext);
}
