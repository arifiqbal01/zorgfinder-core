import React from "react";

export default function SectionColumn({ provider, labels, dataMapper, differencesOnly, providers }) {
    const values = dataMapper(provider);

    const filtered = values.filter((v, i) => {
        if (!differencesOnly) return true;
        const allValues = providers.map(p => dataMapper(p)[i]);
        const unique = new Set(allValues.map(x => JSON.stringify(x)));
        return unique.size > 1;
    });

    return (
        <div className="border-r border-gray-100">
            {filtered.map((value, i) => (
                <div
                    key={i}
                    className="py-4 px-5 border-b border-gray-100 text-gray-800 hover:bg-blue-50/40 transition"
                >
                    {value || <span className="text-gray-400">—</span>}
                </div>
            ))}
        </div>
    );
}
