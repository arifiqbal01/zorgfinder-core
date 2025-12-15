import React, { useEffect, useState } from "react";
import TopSummaryCards from "./components/TopSummaryCards";
import QuickNav from "./components/QuickNav";
import DifferencesToggle from "./components/DifferencesToggle";
import SectionFeatures from "./sections/SectionFeatures";
import SectionReimbursements from "./sections/SectionReimbursements";
import SectionReviews from "./sections/SectionReviews";
import SectionAppointments from "./sections/SectionAppointments";
import SectionDetails from "./sections/SectionDetails";
import useCompare from "./hooks/useCompare";

const STORAGE_KEY = "zorg_compare_cart_v1";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export default function ComparePage() {
  const { data, loading, error, fetchCompare } = useCompare();
  const [ids] = useState(readCart());
  const [differencesOnly, setDifferencesOnly] = useState(false);

  useEffect(() => {
    if (ids.length >= 2) {
      fetchCompare(ids);
    }
  }, []);

  // Guard: nothing selected
  if (ids.length < 2) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-semibold mb-3">
          Select providers to compare
        </h2>
        <p className="text-gray-600 mb-6">
          Please select at least two providers from the providers list.
        </p>
        <a
          href="/providers"
          className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-medium"
        >
          Go to providers
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {loading && <p className="text-gray-500">Loading comparison…</p>}
      {error && <p className="text-red-500">{error.message}</p>}

      {data && data.length > 0 && (
        <>
          <TopSummaryCards providers={data} />

          <QuickNav />

          <DifferencesToggle
            value={differencesOnly}
            onChange={() => setDifferencesOnly(!differencesOnly)}
          />

          <SectionFeatures providers={data} differencesOnly={differencesOnly} />
          <SectionReimbursements providers={data} differencesOnly={differencesOnly} />
          <SectionReviews providers={data} differencesOnly={differencesOnly} />
          <SectionAppointments providers={data} differencesOnly={differencesOnly} />
          <SectionDetails providers={data} differencesOnly={differencesOnly} />
        </>
      )}
    </div>
  );
}
