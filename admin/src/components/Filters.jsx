import React from "react";
import { ChevronDown, Search, X } from "lucide-react";

const Filters = ({ schema = [], filters, setFilters }) => {
  const clearAll = () => {
    const reset = {};
    schema.forEach((f) => (reset[f.key] = ""));
    setFilters(reset);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 flex-nowrap">

      {schema.map((field) => {
        const value = filters[field.key] ?? "";

        // SEARCH (compact pill)
        if (field.type === "search") {
          return (
            <div
              key={field.key}
              className="flex items-center bg-gray-50 border border-gray-200 rounded-full shadow-sm px-4 h-10 shrink-0"
            >
              <Search size={16} className="text-gray-400 mr-2" />

            <input
              type="text"
              placeholder={field.placeholder || "Search..."}
              value={value}
              onChange={(e) =>
                setFilters({ ...filters, [field.key]: e.target.value })
              }
              className="
                bg-transparent
                border-none
                outline-none
                shadow-none
                rounded-none
                appearance-none
                focus:outline-none
                focus:border-none
                focus:shadow-none
                focus:ring-0
                text-sm
                min-w-[180px]
                placeholder-gray-400
              "
            />


            </div>
          );
        }

        // SELECT (compact pill)
        if (field.type === "select") {
          const label = value
            ? field.options.find((o) => o.value === value)?.label
            : field.placeholder || "Select";

          return (
            <div
              key={field.key}
              className="relative flex items-center bg-gray-50 border border-gray-200 rounded-full shadow-sm px-6 pr-14 h-10 shrink-0"
            >
              <select
                value={value}
                onChange={(e) =>
                  setFilters({ ...filters, [field.key]: e.target.value })
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="">{field.placeholder || "Select"}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <span className="text-sm text-gray-700 truncate pointer-events-none">
                {label}
              </span>

              <ChevronDown
                size={16}
                className="text-gray-400 absolute right-3 pointer-events-none"
              />
            </div>
          );
        }

        // CHECKBOX (compact pill)
        if (field.type === "checkbox") {
          return (
            <label
              key={field.key}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full shadow-sm px-4 h-10 text-sm cursor-pointer shrink-0"
            >
              <input
                type="checkbox"
                checked={value == 1}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    [field.key]: e.target.checked ? 1 : "",
                  })
                }
                className="h-4 w-4 accent-blue-600"
              />
              <span>{field.label}</span>
            </label>
          );
        }

        return null;
      })}

      {/* CLEAR ALL (compact pill) */}
      <button
        onClick={clearAll}
        className="ml-auto flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full shadow-sm text-sm px-4 h-10 shrink-0"
      >
        <X size={16} />
        Clear All
      </button>
    </div>
  );
};

export default Filters;
