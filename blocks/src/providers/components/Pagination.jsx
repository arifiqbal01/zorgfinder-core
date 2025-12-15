import Icon from "../../ui/Icon";
import SelectorPopover from "../../ui/SelectorPopover";

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

  const pages = [];
  const windowSize = 1;

  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      Math.abs(p - page) <= windowSize
    ) {
      pages.push(p);
    }
  }

  const finalPages = [];
  let last = 0;
  pages.forEach((p) => {
    if (p - last > 1) finalPages.push(`ellipsis-${p}`);
    finalPages.push(p);
    last = p;
  });

  return (
    <div className="mt-10 flex justify-center px-2">
      <div
        className="
          w-full max-w-5xl
          flex items-center justify-between
          gap-6
          rounded-full
          bg-white
          px-6 py-2.5
          border border-gray-200
          shadow-sm
        "
      >
        {/* LEFT: pagination */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="
              h-9 w-9 rounded-full
              flex items-center justify-center
              text-gray-400 hover:bg-gray-100
              disabled:opacity-40
            "
          >
            <Icon d={ICONS.chevronLeft} size={18} />
          </button>

          {/* Pages */}
          <div className="flex items-center gap-1">
            {finalPages.map((p) =>
              typeof p === "string" ? (
                <span
                  key={p}
                  className="px-2 text-gray-400 select-none"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`
                    h-9 w-9 rounded-full
                    text-sm font-medium transition
                    ${
                      p === page
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="
              h-9 w-9 rounded-full
              flex items-center justify-center
              text-gray-400 hover:bg-gray-100
              disabled:opacity-40
            "
          >
            <Icon d={ICONS.chevronRight} size={18} />
          </button>
        </div>

        {/* RIGHT: secondary page-size control */}
        <div className="flex items-center shrink-0 pl-6">
          <SelectorPopover
            value={perPage}
            options={perPageOptions}
            onChange={onPerPageChange}
            renderLabel={(v) => `${v} / page`}
            placement="top"
          />
        </div>
      </div>
    </div>
  );
}
