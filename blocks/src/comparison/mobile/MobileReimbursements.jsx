export default function MobileReimbursements({ providers }) {
  const hasAny = providers.some(p => p.reimbursements?.length);
  if (!hasAny) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-indigo-900">
        Reimbursements
      </h3>

      {['WLZ', 'ZVW', 'WMO', 'Youth'].map(type => {
        const exists = providers.some(p =>
          p.reimbursements?.some(r => r.type === type)
        );
        if (!exists) return null;

        return (
          <div
            key={type}
            className="bg-white rounded-xl p-4 space-y-3"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm">
              {type}
            </span>

            {providers.map(p => {
              const item = p.reimbursements?.find(r => r.type === type);
              if (!item) return null;

              return (
                <div key={p.id} className="text-sm">
                  <strong className="block">{p.provider}</strong>
                  {item.description}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
