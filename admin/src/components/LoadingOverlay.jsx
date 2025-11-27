import React from "react";
import { useLoading } from "../hooks/useLoading";

/**
 * Shopify Muted Gray loading overlay.
 * - Non-intrusive, centered card
 * - Blocks interaction while visible
 * - Accessible (role + aria)
 */

const LoadingOverlay = () => {
  const { visible, message } = useLoading();

  if (!visible) return null;

  return (
    <div
      aria-hidden={!visible}
      aria-live="assertive"
      role="status"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Card */}
      <div
        className="
          relative z-10
          max-w-2xl w-full
          mx-4
          rounded-2xl
          shadow-xl
          bg-white/95
          border border-gray-200
          p-6
          lg:p-8
        "
        style={{ boxShadow: "0 12px 40px rgba(16,24,40,0.12)" }}
      >
        <div className="flex items-center gap-4">
          {/* spinner (muted gray) */}
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              className="animate-spin h-6 w-6 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              role="img"
            >
              <circle
                className="opacity-20"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-80"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </div>

          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-700">
              {message || "Processing…"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Please wait — this may take a moment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
