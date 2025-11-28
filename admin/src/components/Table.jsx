import React from "react";

const Table = ({
  columns = [],
  data = [],
  providers = [],
  selected = [],
  setSelected = () => {},
  actions = null,
  pagination = null,
  loading = false
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
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else setSelected([...selected, id]);
  };

  const colSpan = columns.length + (actions ? 2 : 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      <table className="w-full text-sm text-gray-800">

        {/* HEADER */}
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-4 px-5 w-12">
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
                className="
                  py-4 px-5
                  font-medium text-gray-600 text-xs uppercase tracking-wider
                  text-left
                "
              >
                {col}
              </th>
            ))}

            {actions && (
              <th className="py-4 px-5 w-20 min-w-[60px] text-right"></th>
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
                  className={`
                    group transition-all
                    ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}
                    border-b
                  `}
                >
                  {/* Checkbox */}
                  <td className="py-4 px-5 w-12">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={isSelected}
                      onChange={() => toggleRow(id)}
                    />
                  </td>

                  {/* CELLS */}
                  {row.map((cell, j) => {
                    const header = columns[j];
                    const isAddress = header?.toLowerCase() === "address";

                    // ADDRESS → multiline
                    if (isAddress) {
                      return (
                        <td
                          key={j}
                          className="
                            py-4 px-5
                            whitespace-normal break-words
                            text-gray-700
                            max-w-[320px]
                            leading-5
                          "
                        >
                          {cell}
                        </td>
                      );
                    }

                    // OTHER FIELDS → truncate (Name, Email, Website)
                    return (
                      <td
                        key={j}
                        className="
                          py-4 px-5
                          truncate whitespace-nowrap overflow-hidden text-ellipsis
                          max-w-[200px]
                          text-gray-700
                        "
                        title={cell}
                      >
                        {cell}
                      </td>
                    );
                  })}

                  {/* ACTIONS */}
                  {actions && (
                    <td className="py-4 px-5 w-20 text-right">
                      <div
                        className="
                          opacity-0
                          group-hover:opacity-100
                          transition-opacity
                          duration-150
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
