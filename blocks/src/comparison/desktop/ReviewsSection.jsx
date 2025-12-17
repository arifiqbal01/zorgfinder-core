import { Card, Stars } from "../../ui";
import { __ } from "../utils/i18n";

const ROWS = [
  { id: "overall", label: __("Overall rating", "zorg") },
  { id: "staff", label: __("Staff", "zorg") },
  { id: "communication", label: __("Communication", "zorg") },
  { id: "cleanliness", label: __("Cleanliness", "zorg") },
  { id: "facilities", label: __("Facilities", "zorg") },
  { id: "professionalism", label: __("Professionalism", "zorg") },
  { id: "count", label: __("Number of reviews", "zorg") },
];

export default function ReviewsSection({ providers, isMobile = false }) {
  if (!providers.some(p => p.reviews?.count > 0)) return null;

  return (
    <div className="mt-12 space-y-8">
      <h3 className="text-xl font-semibold text-indigo-900">
        {__("Reviews", "zorg")}
      </h3>

      {ROWS.map(row => {
        const hasAny = providers.some(p => p.reviews?.[row.id] > 0);
        if (!hasAny) return null;

        return isMobile ? (
          <div key={row.id} className="space-y-3">
            <h4 className="font-medium text-indigo-900">{row.label}</h4>
            {providers.map(p => {
              const v = p.reviews?.[row.id];
              if (!v) return null;
              return (
                <Card key={p.id} className="text-sm">
                  <strong>{p.provider}</strong>
                  {row.id === "overall" ? (
                    <div className="flex gap-2">
                      <Stars value={v} size={14} />
                      {v}/5
                    </div>
                  ) : row.id === "count" ? v : `${v}/5`}
                </Card>
              );
            })}
          </div>
        ) : (
          <div
            key={row.id}
            className="grid gap-6"
            style={{ gridTemplateColumns: `220px repeat(${providers.length}, minmax(0,1fr))` }}
          >
            <div className="pt-3 font-medium">{row.label}</div>
            {providers.map(p => {
              const v = p.reviews?.[row.id];
              return (
                <Card key={p.id} className="text-sm py-3">
                  {v ? (row.id === "count" ? v : `${v}/5`) : "—"}
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
