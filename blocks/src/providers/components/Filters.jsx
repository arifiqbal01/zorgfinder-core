import { useEffect, useRef, useState } from "react";

export default function Filters({ onChange, initial = {} }) {
  const hydrating = useRef(true);
  const didInitFromUrl = useRef(false);

  const [filters, setFilters] = useState({
    search: initial.search || "",
    type_of_care: initial.type_of_care || "",
    indication_type: initial.indication_type || "",
    organization_type: initial.organization_type || "",
    religion: initial.religion || "",
    has_hkz: initial.has_hkz ?? null,
    target_age_groups: initial.target_age_groups || "",
    target_genders: initial.target_genders || "",
    reimbursement_type: initial.reimbursement_type || "",
    min_rating: initial.min_rating || "",
    has_reviews: initial.has_reviews ?? null,
    sort: initial.sort || "",
  });

  /* -------------------------------------------------
     🔑 READ SEARCH FROM URL (ONCE)
  ------------------------------------------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");

    if (!search) {
      hydrating.current = false;
      return;
    }

    didInitFromUrl.current = true;
    setFilters((prev) => ({ ...prev, search }));
    onChange({ search });

    requestAnimationFrame(() => {
      hydrating.current = false;
    });
  }, []);

  /* -------------------------------------------------
     CLEAN + EMIT
  ------------------------------------------------- */
  const emit = (next) => {
    const clean = Object.fromEntries(
      Object.entries(next).filter(
        ([_, v]) => v !== "" && v !== null
      )
    );
    onChange(clean);
  };

  /* -------------------------------------------------
     🔄 SEARCH (DEBOUNCED)
  ------------------------------------------------- */
  useEffect(() => {
    if (hydrating.current) return;

    if (didInitFromUrl.current) {
      didInitFromUrl.current = false;
      return;
    }

    const t = setTimeout(() => emit(filters), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  /* -------------------------------------------------
     ⚡ OTHER FILTERS
  ------------------------------------------------- */
  useEffect(() => {
    if (hydrating.current) return;
    emit(filters);
  }, [
    filters.type_of_care,
    filters.indication_type,
    filters.organization_type,
    filters.religion,
    filters.target_age_groups,
    filters.target_genders,
    filters.has_hkz,
    filters.reimbursement_type,
    filters.min_rating,
    filters.has_reviews,
    filters.sort,
  ]);

  /* -------------------------------------------------
     🔁 SYNC SEARCH → URL
  ------------------------------------------------- */
  useEffect(() => {
    if (hydrating.current) return;

    const params = new URLSearchParams(window.location.search);

    if (filters.search) {
      params.set("search", filters.search);
    } else {
      params.delete("search");
    }

    const newUrl =
      window.location.pathname +
      (params.toString() ? `?${params}` : "");

    window.history.replaceState({}, "", newUrl);
  }, [filters.search]);

  /* -------------------------------------------------
     HELPERS
  ------------------------------------------------- */
  const update = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setFilters({
      search: "",
      type_of_care: "",
      indication_type: "",
      organization_type: "",
      religion: "",
      has_hkz: null,
      target_age_groups: "",
      target_genders: "",
      reimbursement_type: "",
      min_rating: "",
      has_reviews: null,
      sort: "",
    });
    onChange({});
  };

  const field =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm focus:ring-2 focus:ring-indigo-300";

  return (
    <aside className="w-full md:max-w-xs bg-white rounded-2xl shadow-md border border-gray-100 p-5 space-y-4">
      <Section label="Search">
        <input
          value={filters.search}
          placeholder="Search providers..."
          onChange={(e) => update("search", e.target.value)}
          className={field}
        />
      </Section>

      <Section label="Type of care">
        <select
          value={filters.type_of_care}
          onChange={(e) => update("type_of_care", e.target.value)}
          className={field}
        >
          <option value="">Any</option>
          <option value="disability">Disability</option>
          <option value="ggz">GGZ</option>
          <option value="youth">Youth</option>
          <option value="elderly">Elderly</option>
        </select>
      </Section>

      <Section label="Indication type">
        <select
          value={filters.indication_type}
          onChange={(e) => update("indication_type", e.target.value)}
          className={field}
        >
          <option value="">Any</option>
          <option value="PGB">PGB</option>
          <option value="ZIN">ZIN</option>
        </select>
      </Section>

      <Section label="Organization type">
        <select
          value={filters.organization_type}
          onChange={(e) =>
            update("organization_type", e.target.value)
          }
          className={field}
        >
          <option value="">Any</option>
          <option value="BV">BV</option>
          <option value="Stichting">Stichting</option>
        </select>
      </Section>

      <Section label="Religion">
        <select
          value={filters.religion}
          onChange={(e) => update("religion", e.target.value)}
          className={field}
        >
          <option value="">Any</option>
          <option value="Islamic">Islamic</option>
          <option value="Christian">Christian</option>
          <option value="Jewish">Jewish</option>
          <option value="None">None</option>
        </select>
      </Section>

      <Section label="Target age group">
        <select
          value={filters.target_age_groups}
          onChange={(e) =>
            update("target_age_groups", e.target.value)
          }
          className={field}
        >
          <option value="">Any</option>
          <option value="child">Child</option>
          <option value="adult">Adult</option>
          <option value="elderly">Elderly</option>
        </select>
      </Section>

      <Section label="Target gender">
        <select
          value={filters.target_genders}
          onChange={(e) =>
            update("target_genders", e.target.value)
          }
          className={field}
        >
          <option value="">Any</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </Section>

      <Section label="HKZ Certified">
        <input
          type="checkbox"
          checked={filters.has_hkz === 1}
          onChange={(e) =>
            update("has_hkz", e.target.checked ? 1 : null)
          }
        />
      </Section>

      <Section label="Reimbursement type">
        <select
          value={filters.reimbursement_type}
          onChange={(e) =>
            update("reimbursement_type", e.target.value)
          }
          className={field}
        >
          <option value="">Any</option>
          <option value="WLZ">WLZ</option>
          <option value="WMO">WMO</option>
          <option value="ZVW">ZVW</option>
          <option value="Youth">Youth</option>
        </select>
      </Section>

      <Section label="Minimum rating">
        <select
          value={filters.min_rating}
          onChange={(e) => update("min_rating", e.target.value)}
          className={field}
        >
          <option value="">Any</option>
          <option value="1">1 ★</option>
          <option value="2">2 ★</option>
          <option value="3">3 ★</option>
          <option value="4">4 ★</option>
          <option value="5">5 ★</option>
        </select>
      </Section>

      <Section label="Has reviews">
        <input
          type="checkbox"
          checked={filters.has_reviews === 1}
          onChange={(e) =>
            update("has_reviews", e.target.checked ? 1 : null)
          }
        />
      </Section>

      <Section label="Sort by">
        <select
          value={filters.sort}
          onChange={(e) => update("sort", e.target.value)}
          className={field}
        >
          <option value="">Newest</option>
          <option value="name_asc">Name A → Z</option>
          <option value="name_desc">Name Z → A</option>
          <option value="oldest">Oldest</option>
        </select>
      </Section>

      <button
        type="button"
        className="mt-4 text-indigo-600 text-sm"
        onClick={reset}
      >
        Reset filters
      </button>
    </aside>
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-2">
      <div className="text-sm font-medium text-gray-600 mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
