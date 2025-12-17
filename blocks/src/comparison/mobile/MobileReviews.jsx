import { Stars } from '../../ui';

export default function MobileReviews({ providers }) {
  const hasAny = providers.some(p => p.reviews?.count > 0);
  if (!hasAny) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-indigo-900">
        Reviews
      </h3>

      {providers.map(p => {
        if (!p.reviews?.count) return null;

        return (
          <div
            key={p.id}
            className="bg-white rounded-xl p-4 space-y-2"
          >
            <strong>{p.provider}</strong>

            <div className="flex items-center gap-2">
              <Stars value={p.reviews.overall} size={14} />
              <span className="text-sm">
                {p.reviews.overall}/5 ({p.reviews.count})
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
