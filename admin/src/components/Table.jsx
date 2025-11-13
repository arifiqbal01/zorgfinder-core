import React from "react";

const Table = ({ columns, data, actions }) => {
  return (
    <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 w-4">
                <input type="checkbox" className="accent-blue-600" />
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-3 font-semibold uppercase text-gray-600 text-xs tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {data.length ? (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 transition-colors duration-150 border-b last:border-none"
                >
                  <td className="p-4 w-4">
                    <input type="checkbox" className="accent-blue-600" />
                  </td>

                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="px-6 py-4 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis truncate"
                      title={typeof cell === "string" ? cell : ""}
                    >
                      {cell}
                    </td>
                  ))}

                  {actions && (
                    <td className="px-6 py-4 text-right space-x-3">
                      {actions(i)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="text-center text-gray-500 py-8"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
