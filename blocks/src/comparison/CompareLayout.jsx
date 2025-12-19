import { useState } from "@wordpress/element";
import DesktopCompare from "./desktop/DesktopCompare";
import MobileCompare from "./mobile/MobileCompare";
import CompareHeader from "./desktop/CompareHeader";

export default function CompareLayout({ providers, schema }) {
  const [onlyDiff, setOnlyDiff] = useState(false);

  if (!providers || providers.length < 2) return null;

  return (
    <section className="w-full bg-indigo-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <CompareHeader
          title="Vergelijk zorgverleners in detail"
          providerIds={providers.map((p) => p.id)}
        />

        <div className="compare-desktop">
          <DesktopCompare
            providers={providers}
            schema={schema}
            onlyDiff={onlyDiff}
            setOnlyDiff={setOnlyDiff}
          />
        </div>

        <div className="compare-mobile">
          <MobileCompare
            providers={providers}
            schema={schema}
            onlyDiff={onlyDiff}
            setOnlyDiff={setOnlyDiff}
          />
        </div>
      </div>
    </section>
  );
}
