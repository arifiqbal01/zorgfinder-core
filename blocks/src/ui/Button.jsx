export default function Button({
  children,
  variant = "primary",
  full = false,
  className = "",
  ...props
}) {
  const base =
    "ui-button inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition duration-200";

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
    ghost: "text-gray-600 hover:bg-gray-100",
  };

  const disabled =
    "opacity-50 cursor-not-allowed pointer-events-none";

  return (
    <button
      className={`
        ${base}
        ${variants[variant]}
        ${full ? "w-full" : ""}
        ${props.disabled ? disabled : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
