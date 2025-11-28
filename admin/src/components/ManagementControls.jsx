import React from "react";

const ManagementControls = ({
  title = "",
  sort,
  setSort,
  activeTab,
  setActiveTab,
  extraRight = null,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">

      {/* LEFT — PAGE TITLE */}
      <h1 className="text-2xl font-semibold">{title}</h1>

      {/* RIGHT — TABS + SORT + EXTRA */}
      <div className="flex items-center gap-4">

        {/* Tabs */}
        <div className="flex bg-white shadow-sm rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 text-sm ${
              activeTab === "active" ? "bg-black text-white" : "bg-gray-100"
            }`}
          >
            Active
          </button>

          <button
            onClick={() => setActiveTab("trash")}
            className={`px-4 py-2 text-sm border-l ${
              activeTab === "trash" ? "bg-black text-white" : "bg-gray-100"
            }`}
          >
            Trash
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm">Sort:</label>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input min-w-[160px]"
          >
            {/* DATE SORTING */}
            <optgroup label="By Date">
              <option value="newest">Newest → Oldest</option>
              <option value="oldest">Oldest → Newest</option>
            </optgroup>

            {/* ALPHABET SORTING */}
            <optgroup label="Alphabetical">
              <option value="alpha_asc">A → Z</option>
              <option value="alpha_desc">Z → A</option>
            </optgroup>

            {/* RATING SORT (optional for reviews) */}
            <optgroup label="Rating (if applicable)">
              <option value="rating_high">Highest Rating</option>
              <option value="rating_low">Lowest Rating</option>
            </optgroup>
          </select>
        </div>

        {/* Extra Right Buttons (if any) */}
        {extraRight}
      </div>
    </div>
  );
};

export default ManagementControls;
