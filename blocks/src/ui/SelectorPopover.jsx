import { useEffect, useRef, useState } from "react";

export default function SelectorPopover({
  value,
  options,
  onChange,
  renderLabel,
  placement = "top",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger (secondary control) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          h-9 px-3
          flex items-center gap-1.5
          text-sm font-medium text-indigo-600
          rounded-md
          hover:bg-indigo-50
          transition
          focus:outline-none focus:ring-2 focus:ring-indigo-200
        "
      >
        {renderLabel ? renderLabel(value) : value}

        <svg
          className={`h-4 w-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.7a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          className={`
            absolute z-50 min-w-[140px]
            rounded-xl border border-gray-200
            bg-white shadow-lg
            py-1
            ${
              placement === "top"
                ? "bottom-full mb-2"
                : "top-full mt-2"
            }
          `}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`
                w-full px-3 py-2
                flex items-center gap-2
                text-sm text-left rounded-md
                hover:bg-indigo-50
                ${
                  opt === value
                    ? "text-indigo-600 font-medium"
                    : "text-gray-700"
                }
              `}
            >
              {opt === value && (
                <span className="text-indigo-600">✓</span>
              )}
              {renderLabel ? renderLabel(opt) : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
