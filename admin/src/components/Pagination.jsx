import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Universal Pagination Component
 * Works with ANY REST endpoint: providers, reviews, appointments, etc.
 *
 * Props:
 * - page       : current page number
 * - perPage    : items per page
 * - total      : total items from API response
 * - onChange   : function(newPage) — triggered when user changes page
 *
 * Usage example:
 * <Pagination
 *    page={page}
 *    perPage={perPage}
 *    total={total}
 *    onChange={(p) => setPage(p)}
 * />
 */
const Pagination = ({ page, perPage, total, onChange }) => {
  const totalPages = Math.ceil(total / perPage);

  if (!totalPages || totalPages <= 1) return null;

  const goPrev = () => onChange(Math.max(1, page - 1));
  const goNext = () => onChange(Math.min(totalPages, page + 1));

  return (
    <div className="flex items-center justify-center gap-3 mt-6 select-none">

      {/* Prev */}
      <button
        onClick={goPrev}
        disabled={page === 1}
        className={`px-3 py-1 border rounded-md flex items-center gap-1 ${
          page === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"
        }`}
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      {/* Page Info */}
      <span className="font-medium">
        Page {page} of {totalPages}
      </span>

      {/* Next */}
      <button
        onClick={goNext}
        disabled={page === totalPages}
        className={`px-3 py-1 border rounded-md flex items-center gap-1 ${
          page === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-100"
        }`}
      >
        Next
        <ChevronRight size={16} />
      </button>

    </div>
  );
};

export default Pagination;
