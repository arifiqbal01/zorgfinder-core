import { Card } from "../../ui";
import { __ } from "../utils/i18n";

const TYPES = ["WLZ", "ZVW", "WMO", "Youth"];

export default function ReimbursementsSection({ providers, isMobile = false }) {
  const hasAny = providers.some(p => p.reimbursements?.length);
  if (!hasAny) return null;

  return (
    <div className="mt-12 space-y-8">
      <h3 className="text-xl font-semibold text-indigo-900">
        {__("Reimbursements", "zorg")}
      </h3>

      {TYPES.map(type => {
        const exists = providers.some(p =>
          p.reimbursements?.some(r => r.type === type)
        );
        if (!exists) return null;

        return isMobile ? (
          <div key={type} className="space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm">
              {type}
            </span>
            {providers.map(p => {
              const item = p.reimbursements?.find(r => r.type === type);
              if (!item) return null;
              return (
                <Card key={p.id} className="text-sm">
                  <strong>{p.provider}</strong>
                  <p className="mt-1">{item.description}</p>
                  {item.coverage_details && (
                    <p className="mt-2 text-gray-600">{item.coverage_details}</p>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div
            key={type}
            className="grid gap-6"
            style={{ gridTemplateColumns: `220px repeat(${providers.length}, minmax(0,1fr))` }}
          >
            <div className="pt-3">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm">
                {type}
              </span>
            </div>

            {providers.map(p => {
              const item = p.reimbursements?.find(r => r.type === type);
              return (
                <Card key={p.id} className="text-sm">
                  {item ? (
                    <>
                      <p>{item.description}</p>
                      {item.coverage_details && (
                        <p className="mt-2 text-gray-600">{item.coverage_details}</p>
                      )}
                    </>
                  ) : "—"}
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
