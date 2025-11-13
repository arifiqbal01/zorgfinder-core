import React, { useState } from "react";

const Table = ({
  columns,
  data,
  providers,
  selected = [],
  setSelected = () => {},
  actions
}) => {
  const rowsPerPage = 5;
  const [page, setPage] = useState(1);

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const paginatedData = data.slice(startIndex, endIndex);
  const paginatedProviders = providers.slice(startIndex, endIndex);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  const allSelected =
    paginatedProviders.length > 0 &&
    paginatedProviders.every((p) => selected.includes(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(
        selected.filter((id) => !paginatedProviders.some((p) => p.id === id))
      );
    } else {
      setSelected([
        ...new Set([...selected, ...paginatedProviders.map((p) => p.id)])
      ]);
    }
  };

  const toggleRow = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">

      {/* TABLE AREA WITH CONSISTENT HEIGHT */}
      <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
        
        <table className="w-full table-fixed overflow-hidden text-sm text-left text-gray-700">

          {/* FIXED COLUMN WIDTHS */}
          <colgroup>
            <col className="w-12" />              {/* Checkbox */}
            <col className="w-[240px]" />         {/* Name */}
            <col className="w-[140px]" />         {/* Type of care */}
            <col className="w-[200px]" />         {/* Email */}
            <col className="w-[140px]" />         {/* Phone */}
            <col className="w-[170px]" />         {/* Website */}
            <col className="w-[250px]" />         {/* Address */}
            {actions && <col className="w-[100px]" />} {/* Actions */}
          </colgroup>

          {/* Header */}
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr className="h-[52px]">
              <th className="p-4 bg-gray-50">
                <input
                  type="checkbox"
                  className="accent-blue-600"
                  checked={allSelected}
                  onChange={toggleAll}
                />
              </th>

              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-3 font-semibold uppercase text-gray-600 text-xs tracking-wider whitespace-nowrap bg-gray-50"
                >
                  {col}
                </th>
              ))}

              {actions && (
                <th className="px-6 py-3 text-right bg-gray-50">Actions</th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paginatedData.length ? (
              paginatedData.map((row, i) => {
                const provider = paginatedProviders[i];
                const id = provider?.id;
                const isSelected = selected.includes(id);

                return (
                  <tr
                    key={id}
                    className={`h-[56px] transition-colors duration-150 border-b last:border-none ${
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-4 align-middle">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                      />
                    </td>

                    {/* Data cells */}
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className="px-6 py-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis truncate"
                      >
                        <div className="flex items-center min-h-[24px] overflow-hidden whitespace-nowrap truncate">
                          {cell}
                        </div>
                      </td>
                    ))}

                    {/* Actions */}
                    {actions && (
                      <td className="px-6 py-4 text-right align-middle space-x-3">
                        <div className="flex items-center justify-end space-x-3">
                          {actions(startIndex + i)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="text-center text-gray-500 py-10"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 bg-gray-50 border-t">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 border rounded-lg ${
                page === i + 1 ? "bg-blue-600 text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;
