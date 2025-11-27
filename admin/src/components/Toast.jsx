import React from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

const COLORS = {
  success: "bg-green-50 border-green-300 text-green-800",
  error: "bg-red-50 border-red-300 text-red-800",
  info: "bg-blue-50 border-blue-300 text-blue-800",
};

const ICONS = {
  success: <CheckCircle size={20} />,
  error: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const Toast = ({ type, message, onClose }) => {
  return (
    <div
      className={`
        w-full px-4 py-3 rounded-xl border shadow-md
        flex items-center justify-between gap-3
        animate-fadeIn
        ${COLORS[type]}
      `}
    >
      <div className="flex items-center gap-3">
        {ICONS[type]}
        <span className="font-medium">{message}</span>
      </div>

      <button
        onClick={onClose}
        className="opacity-60 hover:opacity-100 transition"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
