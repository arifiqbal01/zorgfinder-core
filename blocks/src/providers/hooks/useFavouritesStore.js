import { createContext, useContext, useEffect, useState } from "react";

const FavouritesContext = createContext();

export function FavouritesProvider({ children }) {
  const [favourites, setFavourites] = useState(() => {
    try {
      const raw = localStorage.getItem("zf_favourites_list");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(favourites.length === 0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/wp-json/zorg/v1/favourites?per_page=999&page=1", {
          headers: { "X-WP-Nonce": window.zorgFinderApp?.nonce || "" },
        });
        const json = await res.json();
        const rows = json?.data || [];
        const ids = rows.map((r) => Number(r.provider_id)).filter(Boolean);
        if (mounted) {
          setFavourites(ids);
          localStorage.setItem("zf_favourites_list", JSON.stringify(ids));
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const toggle = async (providerId) => {
    const id = Number(providerId);
    const next = favourites.includes(id) ? favourites.filter((x) => x !== id) : [...favourites, id];
    setFavourites(next);
    localStorage.setItem("zf_favourites_list", JSON.stringify(next));
    try {
      await fetch("/wp-json/zorg/v1/favourites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": window.zorgFinderApp?.nonce || "",
        },
        body: JSON.stringify({ provider_id: id }),
      });
    } catch { /* ignore errors, UI already updated */ }
  };

  return <FavouritesContext.Provider value={{ favourites, toggle, loading }}>{children}</FavouritesContext.Provider>;
}

export function useFavouritesStore() {
  return useContext(FavouritesContext);
}
