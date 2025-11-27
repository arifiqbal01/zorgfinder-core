import React from "react";

const ToastContainer = ({ toasts }) => {
  return (
    <div
      className="
        fixed bottom-5 right-5 
        z-[9999] 
        flex flex-col 
        gap-3 
        items-end
      "
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg border 
            bg-white text-gray-800 
            min-w-[260px] max-w-[340px]
            transition-all duration-300 transform
            animate-[toastIn_0.25s_ease-out]
            ${t.type === "error" ? "border-red-300" : "border-gray-200"}
          `}
        >
          <div className="font-medium">
            {t.message}
          </div>
        </div>
      ))}

      {/* Animations */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
