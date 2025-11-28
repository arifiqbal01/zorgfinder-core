import React from "react";
import Button from "./Button";

const BulkActionsBar = ({
  count = 0,
  onDelete,
  onRestore,
  onClearSelection,
  showRestore = false,
  showDelete = true,
}) => {
  if (count === 0) return null; // Nothing selected → nothing shown

  return (
    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">

      {/* LEFT: COUNT */}
      <span className="text-sm text-blue-700 font-medium">
        {count} selected
      </span>

      {/* RIGHT: BUTTONS */}
      <div className="flex items-center gap-2">
        {showRestore && (
          <Button variant="success" size="sm" onClick={onRestore}>
            Restore Selected
          </Button>
        )}

        {showDelete && (
          <Button variant="danger" size="sm" onClick={onDelete}>
            Delete Selected
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsBar;
