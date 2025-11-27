import React from "react";
import { cn } from "../utils/cn";

const variants = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
  danger:
    "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  secondary:
    "bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300",
  ghost:
    "bg-transparent hover:bg-gray-100 text-gray-700",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      className={cn(
        "rounded-md font-medium transition-all flex items-center justify-center",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
