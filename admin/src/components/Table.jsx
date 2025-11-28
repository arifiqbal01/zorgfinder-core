import React from "react";

const Table = ({
  columns = [],
  data = [],
  providers = [],
  selected = [],
  setSelected = () => {},
  actions = null,
  pagination = null,
  loading = false,
}) => {
  const allSelected =
    providers.length > 0 && providers.every((p) => selected.includes(p.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(selected.filter((id) => !providers.some((p) => p.id === id)));
    } else {
      setSelected([...new Set([...selected, ...providers.map((p) => p.id)])]);
    }
  };

  const toggleRow = (id) => {
    if (!id) return;
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const colSpan = columns.length + (actions ? 2 : 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden w-full">

      {/* TABLE WRAPPER (scroll on small screens) */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-gray-800 min-w-max">

          {/* HEADER */}
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">

              {/* Checkbox column – sticky only on desktop */}
              <th
                className="
                  py-4 px-5 w-12
                  lg:sticky lg:left-0 lg:bg-gray-50 lg:z-20 lg:border-r
                "
              >
                <input
                  type="checkbox"
                  className="
                    accent-blue-600
                    w-4 h-4
                    md:w-3.5 md:h-3.5
                    sm:w-3 sm:h-3
                  "
                  checked={allSelected}
                  onChange={toggleAll}
                />

              </th>

              {columns.map((col, i) => (
                <th
                  key={i}
                  className="
                    py-4 px-5
                    font-medium text-gray-600 text-xs uppercase tracking-wider
                    whitespace-nowrap text-left
                  "
                >
                  {col}
                </th>
              ))}

              {actions && (
                <th className="py-4 px-5 w-16 text-right whitespace-nowrap"></th>
              )}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {data.length ? (
              data.map((row, i) => {
                const provider = providers[i] || {};
                const id = provider.id;
                const isSelected = selected.includes(id);

                return (
                  <tr
                    key={id || i}
                    className={`group transition-all border-b ${
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Checkbox – sticky only on desktop */}
                    <td
                      className="
                        py-4 px-5 w-12
                        lg:sticky lg:left-0 lg:bg-white lg:z-10 lg:border-r
                      "
                    >
                      <input
                        type="checkbox"
                        className="
                          accent-blue-600
                          w-4 h-4
                          md:w-3.5 md:h-3.5
                          sm:w-3 sm:h-3
                        "
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                      />

                    </td>

                    {/* Cells */}
                    {row.map((cell, j) => {
                      const header = columns[j];
                      const isAddress =
                        header?.toLowerCase?.() === "address";

                      return (
                        <td
                          key={j}
                          className={`
                            py-4 px-5 text-gray-700 align-top
                            ${
                              isAddress
                                ? "whitespace-normal break-words leading-5 max-w-[320px]"
                                : "whitespace-nowrap truncate max-w-[200px]"
                            }
                          `}
                          title={isAddress ? "" : cell}
                        >
                          {cell}
                        </td>
                      );
                    })}

                    {/* Actions */}
                    {actions && (
                      <td
                        className="
                          py-4 px-5 w-16 text-right
                        "
                      >
                        {/* always visible on mobile, fade on desktop hover */}
                        <div
                          className="
                            opacity-100 lg:opacity-0
                            lg:group-hover:opacity-100
                            transition-opacity duration-150
                          "
                        >
                          {actions(i)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={colSpan} className="text-center text-gray-500 py-10">
                  {loading ? "Loading…" : "No records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {pagination && (
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-sm">
          {pagination}
        </div>
      )}
    </div>
  );
};

export default Table;
