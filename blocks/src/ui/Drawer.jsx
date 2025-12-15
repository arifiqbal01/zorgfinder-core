import { useEffect } from "react";

export default function Drawer({ open, onClose, title, subtitle, children }) {
  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] shadow-sm">
      {/* BACKDROP */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* DRAWER PANEL */}
      <div
        className="
          absolute right-0 top-0 h-full w-full max-w-xl
          bg-white border-l border-gray-200
          flex flex-col
          animate-slide-in
        "
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* SCROLL AREA (FULL HEIGHT) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 hide-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
