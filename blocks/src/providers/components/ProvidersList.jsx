// src/providers/ProvidersList.jsx (replace inner component with this)
import { useEffect, useState } from "react";
import Filters from "./Filters";
import ProviderCard from "./ProviderCard";
import { useProviders } from "../hooks/useProviders";
import { FavouritesProvider } from "../hooks/useFavouritesStore";

export default function ProvidersList({ isEditor = false }) {
  return (
    <FavouritesProvider>
      <ProvidersListInner isEditor={isEditor} />
    </FavouritesProvider>
  );
}

function ProvidersListInner({ isEditor = false }) {
  const { providers, total, loading, fetchProviders } = useProviders();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "" });

  useEffect(() => {
    fetchProviders({ page, ...filters });
  }, [page, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">

        {/* LEFT: Filters (sticky on desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <Filters onChange={setFilters} initial={filters} />
          </div>
        </div>

        {/* RIGHT: Providers column */}
        <div>
          {/* mobile filters (collapse) */}
          <div className="block lg:hidden mb-4">
            <Filters onChange={setFilters} initial={filters} />
          </div>

          {/* header / summary */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Providers</h2>
            <div className="text-sm text-gray-600">
              {loading ? "Loading…" : `${total} providers`}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 bg-white rounded-2xl shadow-sm animate-pulse" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && providers.length === 0 && (
            <p className="text-gray-500">No providers found.</p>
          )}

          {/* Providers list (full width cards stacked) */}
          <div className="space-y-6">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>

          {/* Pagination */}
          {total > 12 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => setPage((pg) => Math.max(1, pg - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Prev
              </button>

              <div className="px-3 py-2 text-sm border rounded-lg">
                Page {page}
              </div>

              <button
                onClick={() => setPage((pg) => pg + 1)}
                disabled={page * 12 >= total}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
