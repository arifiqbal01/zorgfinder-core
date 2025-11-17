import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, perPage, total, onChange, onPerPageChange }) => {
  const totalPages = Math.ceil(total / perPage);
if (total === 0) return null;

  const goPrev = () => onChange(Math.max(1, page - 1));
  const goNext = () => onChange(Math.min(totalPages, page + 1));

  const makePageList = () => {
    const pages = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show 1, current, last, and ellipsis
      pages.push(1);

      if (page > 3) pages.push("...");

      const middleStart = Math.max(2, page - 1);
      const middleEnd = Math.min(totalPages - 1, page + 1);

      for (let i = middleStart; i <= middleEnd; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = makePageList();

  return (
    <div className="w-full rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">

      {/* LEFT — Total count */}
      <div className="text-sm text-gray-700 flex items-center gap-1">
        <span className="text-gray-600">Total</span>
        <strong>{total}</strong>
      </div>

      {/* RIGHT — Rows per page + Pagination */}
      <div className="flex items-center gap-6">

        {/* Rows per page */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Rows per page</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-sm shadow-sm focus:ring-2 focus:ring-blue-500 transition"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* MAIN PAGINATION */}
<div className="flex items-center gap-1">

  {/* Prev */}
  <button
    disabled={page === 1}
    onClick={goPrev}
    className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
      page === 1
        ? "opacity-40 cursor-not-allowed"
        : "hover:bg-gray-200"
    }`}
  >
    <ChevronLeft size={16} />
  </button>

  {/* Pages — only show if more than 1 page */}
  {totalPages > 1 && pages.map((p, i) =>
    p === "..." ? (
      <span key={i} className="px-2 text-gray-500 select-none">…</span>
    ) : (
      <button
        key={i}
        onClick={() => onChange(p)}
        className={`w-8 h-8 rounded-full text-sm flex items-center justify-center transition ${
          p === page
            ? "bg-black text-white font-medium"
            : "hover:bg-gray-200 text-gray-700"
        }`}
      >
        {p}
      </button>
    )
  )}

  {/* Next */}
  <button
    disabled={page === totalPages}
    onClick={goNext}
    className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
      page === totalPages
        ? "opacity-40 cursor-not-allowed"
        : "hover:bg-gray-200"
    }`}
  >
    <ChevronRight size={16} />
  </button>

</div>

      </div>

    </div>
  );
};

export default Pagination;
