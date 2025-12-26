// ProvidersList.jsx
import { useState, useEffect, useRef } from "react";
import Filters from "./Filters";
import ProviderCard from "./ProviderCard";
import Pagination from "./Pagination";
import CompareBar from "./CompareBar";
import ProviderDetailsDrawer from "./ProviderDetailsDrawer";
import { useProviders } from "../hooks/useProviders";
import { FavouritesProvider } from "../hooks/useFavouritesStore";
import { Button, Icon } from "../../ui";
import { CompareProvider } from "../../context/CompareContext";
import { useCompareCart } from "../../context/CompareContext";


const FILTER_ICON = "M3 5h18M6 12h12M10 19h4";

export default function ProvidersList() {
  return (
    <FavouritesProvider>
      <CompareProvider>
        <ProvidersListInner />
      </CompareProvider>
    </FavouritesProvider>
  );
}

function ProvidersListInner() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(5);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [activeProvider, setActiveProvider] = useState(null);

  const { clear } = useCompareCart(); // 👈 ADD THIS

  useEffect(() => {
    clear(); // 👈 ADD THIS
  }, []);

  const {
    providers,
    total,
    loading,
    setFilters: applyFilters,
    setPage: applyPage,
    setPerPage,
  } = useProviders();

  const safeProviders = Array.isArray(providers) ? providers : [];

  // 🔑 GLOBAL PROVIDER CACHE (persists across pagination)
  const allProvidersRef = useRef(new Map());

  useEffect(() => {
    safeProviders.forEach((p) => {
      allProvidersRef.current.set(p.id, p);
    });
  }, [safeProviders]);

  /* ---------- Apply filters ---------- */
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

  /* ---------- Render ---------- */
  return (
    <div className="providers-block">
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

      {showMobileFilters && (
        <div className="providers-mobile-filters">
          <Filters onChange={setFilters} initial={filters} />
        </div>
      )}

      <div className="providers-grid">
        <div className="providers-filters-desktop">
          <Filters onChange={setFilters} initial={filters} />
        </div>

        <div className="providers-results">
          {loading && safeProviders.length === 0 && <p>Loading...</p>}
          {!loading && safeProviders.length === 0 && (
            <p>No providers found.</p>
          )}

          <div className="providers-cards">
            {safeProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onOpen={setActiveProvider}
              />
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

      {/* ✅ CompareBar now resolves providers globally */}
      <CompareBar
        getProviderById={(id) => allProvidersRef.current.get(id)}
      />

      <ProviderDetailsDrawer
        provider={activeProvider}
        open={!!activeProvider}
        onClose={() => setActiveProvider(null)}
      />
    </div>
  );
}
