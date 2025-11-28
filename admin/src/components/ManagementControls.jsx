import React from "react";

const ManagementControls = ({
  sort,
  setSort,
  activeTab,
  setActiveTab,
  extraRight = null,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">

      {/* LEFT SIDE: Active / Trash Toggle */}
      <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-3 py-1 rounded ${
            activeTab === "active" ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          Active
        </button>

        <button
          onClick={() => setActiveTab("trash")}
          className={`px-3 py-1 rounded ${
            activeTab === "trash" ? "bg-black text-white" : "bg-gray-100"
          }`}
        >
          Trash
        </button>
      </div>

      {/* RIGHT SIDE: Sort + Extra Actions */}
      <div className="flex items-center gap-3">

        <div className="flex items-center gap-2">
          <span className="text-sm">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
        </div>

        {/* Inject Bulk Actions or other buttons */}
        {extraRight}
      </div>

    </div>
  );
};

export default ManagementControls;
