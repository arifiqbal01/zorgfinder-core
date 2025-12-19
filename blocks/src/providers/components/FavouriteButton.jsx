import { useFavouritesStore } from "../hooks/useFavouritesStore";

export default function FavouriteButton({ providerId }) {
  const { favourites, toggle, loading } = useFavouritesStore();
  const id = Number(providerId);
  const isFav = favourites.includes(id);

  return (
    <button
      disabled={loading}
      onClick={() => toggle(id)}
      className={`text-2xl transition-all ${
        isFav
          ? "text-red-500"
          : "text-gray-400 hover:text-gray-600"
      }`}
      aria-pressed={isFav}
    >
      {isFav ? "♥" : "♡"}
    </button>
  );
}
