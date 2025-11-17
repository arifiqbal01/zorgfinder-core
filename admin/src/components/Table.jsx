import React from "react";

const Table = ({
  columns,
  data,
  providers,
  selected = [],
  setSelected = () => {},
  actions,
  pagination
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
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

      <table className="w-full text-sm text-gray-800">

        {/* HEADER */}
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">

            {/* Checkbox */}
            <th className="py-4 px-4">
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={allSelected}
                onChange={toggleAll}
              />
            </th>

            {/* Column labels */}
            {columns.map((col, i) => (
              <th
                key={i}
                className="py-4 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider"
              >
                {col}
              </th>
            ))}

            {/* Actions column */}
            {actions && <th className="py-4 px-2 w-[40px] text-right"></th>}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {data.length ? (
            data.map((row, i) => {
              const provider = providers[i];
              const id = provider?.id;
              const isSelected = selected.includes(id);

              return (
                <tr
                  key={id}
                  className={`group transition-all ${
                    isSelected ? "bg-blue-50" : "hover:bg-gray-100"
                  } border-b ${i === providers.length - 1 ? "border-none" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={isSelected}
                      onChange={() => toggleRow(id)}
                    />
                  </td>

                  {/* Row cells */}
                  {row.map((cell, j) => (
                    <td key={j} className="py-4 px-4 whitespace-nowrap">
                      {cell}
                    </td>
                  ))}

                  {/* Actions */}
                  {actions && (
                    <td className="py-4 px-3 w-[40px] text-right">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        {actions(i)}
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

        {/* FOOTER — pagination INSIDE table */}
        <tfoot>
          <tr className="bg-white border-t border-gray-200">
            <td colSpan={columns.length + 2} className="p-4">
              {pagination}
            </td>
          </tr>
        </tfoot>

      </table>
    </div>
  );
};

export default Table;
