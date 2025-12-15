import Button from "../../ui/Button";
import Icon from "../../ui/Icon";

const ICONS = {
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "M9 6l6 6-6 6",
};

export default function Pagination({
  page,
  total,
  perPage,
  perPageOptions = [5, 10, 20, 50],
  onPageChange,
  onPerPageChange,
}) {
  if (!total || total <= 0) return null;

  const totalPages = Math.ceil(total / perPage);

  const makePageButton = (p) => (
    <Button
      key={p}
      variant={p === page ? "primary" : "outline"}
      className="px-3 py-1.5 min-w-[38px] rounded-lg !text-sm"
      onClick={() => onPageChange(p)}
    >
      {p}
    </Button>
  );

  // Show nearby pages + first/last
  const pages = [];
  const windowSize = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
      pages.push(p);
    }
  }

  const finalPages = [];
  let last = 0;
  pages.forEach((p) => {
    if (p - last > 1) finalPages.push("ellipsis-" + p);
    finalPages.push(p);
    last = p;
  });

  return (
    <div className="mt-10 w-full flex justify-center">
      <div
        className="
          flex items-center gap-6
          bg-white border border-gray-200 shadow-sm
          rounded-xl px-8 py-4
        "
      >
        {/* Prev button */}
        <Button
          variant="outline"
          className="px-3 py-1.5 !text-sm flex items-center gap-1"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon d={ICONS.chevronLeft} size={16} />
          Prev
        </Button>

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          {finalPages.map((p) =>
            typeof p === "string" ? (
              <span key={p} className="px-2 text-gray-400 select-none">…</span>
            ) : (
              makePageButton(p)
            )
          )}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          className="px-3 py-1.5 !text-sm flex items-center gap-1"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <Icon d={ICONS.chevronRight} size={16} />
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Per-page selector block */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Per page:</span>

          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="
              px-3 py-1.5 rounded-lg border border-gray-300 bg-white
              text-sm text-gray-700 focus:ring-2 focus:ring-indigo-300
              min-w-[72px]
            "
          >
            {perPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
