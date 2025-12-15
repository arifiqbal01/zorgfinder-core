import { useCompareCart } from "../../context/CompareContext";

export default function CompareBar({ providersMap }) {
  const { ids, remove } = useCompareCart();

  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-3">
          {ids.map((id) => {
            const p = providersMap[id];
            if (!p) return null;

            return (
              <div
                key={id}
                className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded"
              >
                <span className="font-semibold truncate max-w-[120px]">
                  {p.provider}
                </span>
                <button onClick={() => remove(id)}>✕</button>
              </div>
            );
          })}
        </div>

        <button
          disabled={ids.length < 2}
          onClick={() => (window.location.href = "/compare")}
          className="bg-white text-purple-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          Compare
        </button>
      </div>
    </div>
  );
}
