import { useState } from '@wordpress/element';
import DesktopCompare from './desktop/DesktopCompare';
import MobileCompare from './mobile/MobileCompare';

export default function CompareLayout({ providers, schema }) {
  const [onlyDiff, setOnlyDiff] = useState(false);

  if (!providers || providers.length < 2) return null;

  return (
    <section className="w-full bg-indigo-50 py-12">
      <div className="max-w-7xl mx-auto px-4">

        {/* DESKTOP */}
        <div className="compare-desktop">
          <DesktopCompare
            providers={providers}
            schema={schema}
            onlyDiff={onlyDiff}
            setOnlyDiff={setOnlyDiff}
          />
        </div>

        {/* MOBILE */}
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
