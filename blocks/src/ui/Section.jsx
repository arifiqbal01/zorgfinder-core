export default function Section({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}
