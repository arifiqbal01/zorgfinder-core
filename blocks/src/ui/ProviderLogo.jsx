import clsx from "clsx";

const COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-indigo-100 text-indigo-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
  "bg-purple-100 text-purple-700",
  "bg-lime-100 text-lime-700",
];

function getColorClass(name) {
  if (!name) return COLORS[0];
  const index = name.charCodeAt(0) % COLORS.length;
  return COLORS[index];
}

export default function ProviderLogo({
  name,
  logo,
  size = 48
}) {
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  const colorClass = getColorClass(name);

  return (
    <>
      {logo ? (
        <img
          src={logo}
          alt={name}
          style={{ width: size, height: size }}
          className="rounded-full object-cover ring-1 ring-gray-200"
        />
      ) : (
        <div
          className={clsx(
            "rounded-full flex items-center justify-center font-semibold",
            colorClass
          )}
          style={{ width: size, height: size, fontSize: size * 0.45 }}
        >
          {letter}
        </div>
      )}
    </>
  );
}
