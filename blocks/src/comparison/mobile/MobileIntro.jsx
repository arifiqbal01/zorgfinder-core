export default function MobileIntro() {
  return (
    <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
      <h2 className="text-lg font-semibold text-indigo-900 leading-snug">
        The largest independent healthcare comparator for 25 years
      </h2>

      <ul className="mt-4 space-y-3 text-gray-700 text-sm">
        <li className="flex gap-2">
          <span className="text-emerald-500">✓</span>
          Lowest price guarantee
        </li>
        <li className="flex gap-2">
          <span className="text-emerald-500">✓</span>
          We compare all 58 insurance policies
        </li>
        <li className="flex gap-2">
          <span className="text-emerald-500">✓</span>
          Already 2 million people preceded you
        </li>
      </ul>
    </div>
  );
}
