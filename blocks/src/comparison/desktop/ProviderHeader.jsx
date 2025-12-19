import { Card, Button, ProviderLogo, Stars } from "../../ui";
import DifferenceToggle from "./DifferenceToggle";

const BADGES = [
  { text: "Cheapest", color: "bg-sky-500" },
  { text: "High app rating", color: "bg-sky-500" },
  { text: "Good alternative", color: "bg-sky-500" },
];

export default function ProviderHeader({
  providers = [],
  showOnlyDifferences,
  onToggleDifferences,
}) {
  if (!providers?.length) return null;

  return (
    <div
      className="grid gap-6 mb-10"
      style={{
        gridTemplateColumns: `280px repeat(${providers.length}, minmax(0, 1fr))`,
      }}
    >
      {/* INTRO */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <h2 className="text-2xl font-bold text-indigo-900 leading-snug">
          The healthcare comparator for 5 years
        </h2>

        <ul className="mt-6 space-y-4 text-gray-700 text-sm">
          <li className="flex gap-3">
            <span className="text-emerald-500">✓</span>
            Lowest price guarantee
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-500">✓</span>
            We compare most insurance policies
          </li>
          <li className="flex gap-3">
            <span className="text-emerald-500">✓</span>
            Already 500 hundred people preceded you
          </li>
        </ul>
      </div>

      {/* PROVIDERS */}
      {providers.map((p, index) => (
        <Card key={p.id} className="relative flex flex-col pt-6">
          {BADGES[index] && (
            <div
              className={`
                absolute top-0 left-1/2 -translate-x-1/2
                ${BADGES[index].color}
                text-white px-4 py-2 text-sm font-medium
                rounded-b-2xl
              `}
            >
              {BADGES[index].text}
            </div>
          )}

          <div className="flex gap-6 mt-12 mb-4">
            <ProviderLogo name={p.provider} logo={p.logo} size={52} />

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {p.provider}
              </h3>

              <div className="flex items-center text-sm text-gray-500">
                <Stars value={p.reviews?.overall || 0} size={14} />
                <span className="ml-1">
                  {p.reviews?.overall || 0} ({p.reviews?.count || 0})
                </span>
              </div>
            </div>
          </div>

          <div className="flex-grow" />

          <Button full className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
            Request
          </Button>

          <div className="mt-3 text-center text-sm text-gray-500">
            We arrange your transfer for free
          </div>
        </Card>
      ))}

      {/* SINGLE TOGGLE */}
      <div
        style={{ gridColumn: `2 / span ${providers.length}` }}
        className="mt-2"
      >
        <DifferenceToggle
          value={showOnlyDifferences}
          onChange={onToggleDifferences}
        />
      </div>
    </div>
  );
}
