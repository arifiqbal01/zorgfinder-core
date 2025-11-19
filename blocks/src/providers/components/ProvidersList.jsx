import { useEffect, useState } from "react";
import Filters from "./Filters";
import ProviderCard from "./ProviderCard";
import { useProviders } from "../hooks/useProviders";
import { FavouritesProvider } from "../hooks/useFavouritesStore";

/**
 * WRAPPER — adds global favourites context
 */
export default function ProvidersList({ isEditor = false }) {
    return (
        <FavouritesProvider>
            <ProvidersListInner isEditor={isEditor} />
        </FavouritesProvider>
    );
}

/**
 * REAL PROVIDERS LIST COMPONENT
 */
function ProvidersListInner({ isEditor = false }) {
    const { providers, total, loading, fetchProviders } = useProviders();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ search: "" });

    useEffect(() => {
        fetchProviders({ page, ...filters });
    }, [page, filters]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">

            {/* Filters */}
            <Filters onChange={setFilters} />

            {/* Loading */}
            {loading && (
                <p className="text-gray-500 mt-4 text-sm">
                    Loading providers…
                </p>
            )}

            {/* Empty State */}
            {!loading && providers.length === 0 && (
                <p className="text-gray-500 mt-4 text-sm">
                    No providers found.
                </p>
            )}

            {/* Providers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {providers.map((p) => (
                    <ProviderCard key={p.id} provider={p} />
                ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100"
                    >
                        Prev
                    </button>

                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page * 12 >= total}
                        className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
