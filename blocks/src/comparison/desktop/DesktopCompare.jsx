import ProviderHeader from "./ProviderHeader";
import FeaturesSection from "./FeaturesSection";
import ReimbursementsSection from "./ReimbursementsSection";
import ReviewsSection from "./ReviewsSection";

export default function DesktopCompare({
  providers,
  schema,
  onlyDiff,
  setOnlyDiff
}) {
  return (
    <>
      <ProviderHeader
        providers={providers}
        showOnlyDifferences={onlyDiff}
        onToggleDifferences={setOnlyDiff}
      />

      <FeaturesSection
        providers={providers}
        schema={schema}
        onlyDifferences={onlyDiff}
      />

      <ReimbursementsSection providers={providers} />
      <ReviewsSection providers={providers} />
    </>
  );
}
