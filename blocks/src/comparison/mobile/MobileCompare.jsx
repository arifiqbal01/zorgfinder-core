import MobileIntro from './MobileIntro';
import MobileProviderCard from './MobileProviderCard';
import MobileDifferenceToggle from './MobileDifferenceToggle';
import MobileFeaturesCompare from './MobileFeatures';
import MobileReimbursementsCompare from './MobileReimbursements';
import MobileReviewsCompare from './MobileReviews';

export default function MobileCompare({
  providers,
  schema,
  onlyDiff,
  setOnlyDiff,
}) {
  return (
    <div className="space-y-8">

      <MobileIntro />

      {/* PROVIDER CARDS */}
      <div className="space-y-4">
        {providers.map((provider) => (
          <MobileProviderCard
            key={provider.id}
            provider={provider}
          />
        ))}
      </div>

      {/* DIFF TOGGLE */}
      <MobileDifferenceToggle
        value={onlyDiff}
        onChange={setOnlyDiff}
      />

      {/* FEATURES */}
      <MobileFeaturesCompare
        providers={providers}
        schema={schema}
        onlyDifferences={onlyDiff}
      />

      <MobileReimbursementsCompare providers={providers} />
      <MobileReviewsCompare providers={providers} />
    </div>
  );
}
