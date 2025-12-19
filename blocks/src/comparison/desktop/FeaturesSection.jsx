import { Card } from "../../ui";

const EXCLUDED_IDS = ["age_groups", "genders", "reimbursements", "rating"];

function isEmpty(v) {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "string") return !v.trim();
  return false;
}

export default function ComparisonRows({
  providers = [],
  schema,
  onlyDifferences,
  isMobile = false,
}) {
  const rows = schema.filter(r => !EXCLUDED_IDS.includes(r.id)).filter(row => {
    const values = providers.map(p => row.format ? row.format(row.accessor(p)) : row.accessor(p));
    if (values.every(isEmpty)) return false;
    if (onlyDifferences && new Set(values).size === 1) return false;
    return true;
  });

  if (!rows.length) return null;

  return (
    <div className="mt-12 space-y-8">
      <h3 className="text-xl font-semibold text-indigo-900">Features</h3>

      {rows.map(row =>
        isMobile ? (
          <div key={row.id} className="space-y-3">
            <h4 className="font-medium text-indigo-900">{row.label}</h4>
            {providers.map(p => {
              const v = row.format ? row.format(row.accessor(p)) : row.accessor(p);
              if (isEmpty(v)) return null;
              return (
                <Card key={p.id} className="py-3 text-sm">
                  <strong className="block">{p.provider}</strong>
                  {v}
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
            <div className="pt-3 font-medium text-indigo-900">{row.label}</div>
            {providers.map(p => {
              const v = row.format ? row.format(row.accessor(p)) : row.accessor(p);
              return (
                <Card key={p.id} className="py-3 text-sm">
                  {isEmpty(v) ? "—" : v}
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
