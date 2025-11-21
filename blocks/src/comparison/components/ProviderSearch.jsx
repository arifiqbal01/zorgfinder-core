import React, { useState } from "react";

export default function ProviderSearch({ onSelect }) {
    const [q, setQ] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    async function search(term) {
        if (!term) {
            setResults([]);
            return;
        }

        setLoading(true);

        try {
            const url =
                window.zorgFinderApp.restUrl +
                "providers?search=" +
                encodeURIComponent(term);

            const res = await fetch(url, {
                headers: {
                    Accept: "application/json"
                }
            });

            const json = await res.json();
            setResults(json?.data || []);
        } catch (e) {
            console.error("Search failed", e);
        }

        setLoading(false);
    }

    function handleSelect(provider) {
        onSelect(provider.id);
        setQ("");
        setResults([]);
    }

    return (
        <div className="mb-8 relative">
            <input
                className="w-full border border-gray-300 p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Search providers…"
                value={q}
                onChange={(e) => {
                    const val = e.target.value;
                    setQ(val);
                    search(val);
                }}
            />

            {/* Loader */}
            {loading && (
                <div className="absolute top-full left-0 bg-white shadow p-3 w-full text-sm text-gray-500">
                    Searching…
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="absolute top-full left-0 bg-white shadow-lg rounded-lg mt-1 w-full border border-gray-200 z-20">
                    {results.map((p) => (
                        <div
                            key={p.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                            onClick={() => handleSelect(p)}
                        >
                            {p.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
