import React from "react";
import { Search, X } from "lucide-react";

const Filters = ({ schema = [], filters, setFilters }) => {
  const clearAll = () => {
    const reset = {};
    schema.forEach((f) => (reset[f.key] = ""));
    setFilters(reset);
  };

  return (
    <div
      className="
        w-full bg-white rounded-xl border border-gray-200 shadow-sm
        p-3 md:p-4
        flex flex-wrap items-center gap-3
      "
    >
      {schema.map((field) => {
        const value = filters[field.key] ?? "";

       /* --------------------------------
        * SEARCH — dynamic placeholder, no icon
        * -------------------------------- */
        if (field.type === "search") {
          const placeholder =
            field.placeholder ||
            `Search ${field.resource || "items"}…`; // fallback

          return (
            <div
              key={field.key}
              className="w-full md:w-64"
            >
              <input
                placeholder={placeholder}
                value={value}
                onChange={(e) =>
                  setFilters({ ...filters, [field.key]: e.target.value })
                }
                className="
                  input
                  h-10
                  text-sm
                  pl-4 pr-3
                "
              />
            </div>
          );
        }


        /* --------------------------------
         * SELECT — pill styled, no arrows
         * -------------------------------- */
        if (field.type === "select") {
          const label =
            value &&
            field.options.find((o) => o.value === value)?.label;

          return (
            <div
              key={field.key}
              className="
                relative flex items-center
                bg-gray-50 border border-gray-200
                rounded-full shadow-sm
                px-4 h-9 text-sm cursor-pointer
              "
            >
              <select
                value={value}
                onChange={(e) =>
                  setFilters({ ...filters, [field.key]: e.target.value })
                }
                className="
                  absolute inset-0 w-full h-full opacity-0 cursor-pointer
                "
              >
                <option value="">{field.placeholder}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <span className="pointer-events-none text-gray-700 truncate">
                {label || field.placeholder}
              </span>
            </div>
          );
        }

        /* --------------------------------
         * CHECKBOX — pill style
         * -------------------------------- */
        if (field.type === "checkbox") {
          return (
            <label
              key={field.key}
              className="
                flex items-center gap-2
                bg-gray-50 border border-gray-200
                rounded-full shadow-sm
                px-4 h-9 text-sm cursor-pointer
                select-none
              "
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

      {/* CLEAR BUTTON */}
      <button
        onClick={clearAll}
        className="
          ml-auto
          flex items-center gap-2
          bg-gray-100 border border-gray-200
          rounded-full shadow-sm
          px-4 h-9 text-sm
          hover:bg-gray-200 transition
        "
      >
        <X size={14} />
        Clear
      </button>
    </div>
  );
};

export default Filters;
