function isEmpty(v) {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'string') return !v.trim();
  return false;
}

const EXCLUDED = ['age_groups', 'genders', 'reimbursements', 'rating'];

export default function MobileFeatures({
  providers,
  schema,
  onlyDifferences,
}) {
  const rows = schema.filter(r => !EXCLUDED.includes(r.id));

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-indigo-900">
        Features
      </h3>

      {rows.map(row => {
        const values = providers.map(p =>
          row.format ? row.format(row.accessor(p)) : row.accessor(p)
        );

        if (values.every(isEmpty)) return null;
        if (onlyDifferences && new Set(values).size === 1) return null;

        return (
          <div
            key={row.id}
            className="bg-white rounded-xl p-4 space-y-3"
          >
            {/* FEATURE LABEL — SMALL LIKE REIMBURSEMENT */}
            <span className="
              inline-block
              px-2.5 py-1
              rounded-full
              bg-indigo-100
              text-indigo-700
              text-xs
              font-medium
            ">
              {row.label}
            </span>

            {providers.map((p, i) => {
              const value = values[i];
              if (isEmpty(value)) return null;

              return (
                <div
                  key={p.id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-500">
                    {p.provider}
                  </span>
                  <span className="font-medium text-gray-900">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
