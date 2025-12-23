export function Table({ children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="bg-gray-50 text-gray-600 border-b">
      {children}
    </thead>
  );
}

export function Th({ children, align = "left" }) {
  return (
    <th
      className={`px-4 py-2 font-medium ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }) {
  return <tbody className="divide-y">{children}</tbody>;
}

export function Tr({ children }) {
  return (
    <tr className="hover:bg-gray-50 transition">
      {children}
    </tr>
  );
}

export function Td({ children, align = "left" }) {
  return (
    <td
      className={`px-4 py-2 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}
