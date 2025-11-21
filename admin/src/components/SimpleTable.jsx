import React from "react";

const SimpleTable = ({ columns = [], rows = [] }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm text-gray-800">
        
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col, i) => (
              <th
                key={i}
                className="py-3 px-4 font-medium text-gray-600 text-xs uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr
                key={i}
                className={`transition-all hover:bg-gray-100 border-b last:border-none`}
              >
                {row.map((cell, j) => (
                  <td key={j} className="py-3 px-4 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-gray-500 py-8"
              >
                No records found.
              </td>
            </tr>
          )}
        </tbody>

      </table>
    </div>
  );
};

export default SimpleTable;
