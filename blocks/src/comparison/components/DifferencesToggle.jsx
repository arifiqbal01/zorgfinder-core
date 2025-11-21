import React from "react";

export default function DifferencesToggle({ value, onChange }) {
    return (
        <div className="flex items-center gap-2 my-6">
            <input type="checkbox" checked={value} onChange={onChange} />
            <span className="text-sm">Show only the differences</span>
        </div>
    );
}
