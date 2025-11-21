import React from "react";
import TopSummaryCards from "./TopSummaryCards";
import QuickNav from "./QuickNav";
import DifferencesToggle from "./DifferencesToggle";
import SectionFeatures from "../sections/SectionFeatures";
import SectionReimbursements from "../sections/SectionReimbursements";
import SectionReviews from "../sections/SectionReviews";
import SectionAppointments from "../sections/SectionAppointments";
import SectionDetails from "../sections/SectionDetails";

/**
 * Editor-side CompareTable preview.
 * Props:
 *  - providers: array (optional) — if not provided, an empty placeholder is shown.
 *  - editorMode: boolean (optional)
 */
export default function CompareTable({ providers = [], editorMode = false }) {
  const hasData = Array.isArray(providers) && providers.length > 0;

  // Editor shows 3 placeholder columns if no real data is supplied
  const previewProviders = hasData ? providers : [
    { id: 1, name: "Provider A", type_of_care: "Type A", indication_type: "Indication", organization_type: "Org A", religion: "N/A", has_hkz: 1, reimbursements: [], reviews: { avg_rating: 4.2, total: 12 }, appointments: {} },
    { id: 2, name: "Provider B", type_of_care: "Type B", indication_type: "Indication", organization_type: "Org B", religion: "N/A", has_hkz: 0, reimbursements: [], reviews: { avg_rating: 3.9, total: 5 }, appointments: {} },
    { id: 3, name: "Provider C", type_of_care: "Type C", indication_type: "Indication", organization_type: "Org C", religion: "N/A", has_hkz: 0, reimbursements: [], reviews: { avg_rating: 0, total: 0 }, appointments: {} }
  ];

  return (
    <div className="zorg-compare-preview">
      <TopSummaryCards providers={previewProviders} />
      <QuickNav />
      <div className="my-4">
        <DifferencesToggle value={false} onChange={() => {}} />
      </div>

      <SectionFeatures providers={previewProviders} differencesOnly={false} />
      <SectionReimbursements providers={previewProviders} differencesOnly={false} />
      <SectionReviews providers={previewProviders} differencesOnly={false} />
      <SectionAppointments providers={previewProviders} differencesOnly={false} />
      <SectionDetails providers={previewProviders} differencesOnly={false} />
    </div>
  );
}
