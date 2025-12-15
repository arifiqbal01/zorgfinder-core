export default function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-400 text-indigo-600 focus:ring-indigo-300"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
