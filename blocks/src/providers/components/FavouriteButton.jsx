import { useFavouritesStore } from "../hooks/useFavouritesStore";

export default function FavouriteButton({ providerId }) {
    const { favourites, toggle, loading } = useFavouritesStore();

    const isFav = favourites.includes(parseInt(providerId));

    return (
        <button
            disabled={loading}
            onClick={() => toggle(providerId)}
            className={`text-2xl transition-all ${
                isFav ? "text-red-500" : "text-gray-400 hover:text-gray-600"
            }`}
        >
            {isFav ? "♥" : "♡"}
        </button>
    );
}
