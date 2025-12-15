import { useEffect, useState } from "react";
import Filters from "./Filters";
import ProviderCard from "./ProviderCard";
import Pagination from "./Pagination";
import { useProviders } from "../hooks/useProviders";
import { FavouritesProvider } from "../hooks/useFavouritesStore";
import { Button, Icon } from "../../ui"; // adjust path if needed

const FILTER_ICON = "M3 5h18M6 12h12M10 19h4";

export default function ProvidersList() {
  return (
    <FavouritesProvider>
      <ProvidersListInner />
    </FavouritesProvider>
  );
}

function ProvidersListInner() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(5);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const {
    providers,
    total,
    loading,
    setFilters: applyFilters,
    setPage: applyPage,
    setPerPage,
  } = useProviders();

  const safeProviders = Array.isArray(providers) ? providers : [];

  /* ---------------- Effects ---------------- */

  useEffect(() => {
    applyFilters(filters);
    setPage(1);
  }, [filters]);

  useEffect(() => {
    applyPage(page);
  }, [page]);

  useEffect(() => {
    setPerPage(perPage);
    setPage(1);
  }, [perPage]);

  /* ---------------- Render ---------------- */

  return (
    <div className="providers-block">

      {/* MOBILE FILTER BUTTON */}
      <div className="providers-mobile-toggle">
       <Button
    variant="outline"
    full
    onClick={() => setShowMobileFilters((v) => !v)}
    className="providers-filter-button justify-between"
  >
    <span>{showMobileFilters ? "Hide filters" : "Show filters"}</span>
    <Icon d={FILTER_ICON} />
  </Button>

      </div>

      {/* MOBILE FILTERS */}
      {showMobileFilters && (
        <div className="providers-mobile-filters">
          <Filters onChange={setFilters} initial={filters} />
        </div>
      )}

      {/* MAIN GRID */}
      <div className="providers-grid">

        {/* DESKTOP FILTERS */}
        <div className="providers-filters-desktop">
          <Filters onChange={setFilters} initial={filters} />
        </div>

        {/* PROVIDERS LIST */}
        <div className="providers-results">
          {loading && <p>Loading...</p>}

          {!loading && safeProviders.length === 0 && (
            <p>No providers found.</p>
          )}

          <div className="providers-cards">
            {safeProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>

          <Pagination
            page={page}
            total={total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPageState}
          />
        </div>
      </div>
    </div>
  );
}
