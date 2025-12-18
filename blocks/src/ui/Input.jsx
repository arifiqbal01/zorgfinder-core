export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  return (
    <label className="block space-y-1">
      {label && (
        <span className="text-sm font-medium text-gray-600">
          {label}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="
          w-full h-10 px-3
          rounded-lg border border-gray-300
          text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-300
          disabled:bg-gray-100 disabled:cursor-not-allowed
        "
      />
    </label>
  );
}
