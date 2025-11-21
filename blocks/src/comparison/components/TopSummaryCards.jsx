import React from "react";

export default function TopSummaryCards({ providers }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
            {providers.map(p => (
                <div
                    key={p.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center transition-transform hover:-translate-y-1 hover:shadow-lg"
                >
                    <div className="inline-block px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-3">
                        {getBadge(p)}
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {p.name}
                    </h2>

                    <div className="text-5xl font-bold text-gray-900 my-4 tracking-tight">
                        {p.reviews?.avg_rating || 0}
                    </div>

                    <button className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium py-3 shadow hover:opacity-90 transition">
                        Book Appointment
                    </button>

                    <p className="text-xs text-gray-400 mt-3">
                        We arrange your appointment for free
                    </p>
                </div>
            ))}
        </div>
    );
}

function getBadge(p) {
    if (p.reviews?.avg_rating >= 4.5) return "Top Rated";
    if (p.has_hkz) return "HKZ Certified";
    return "Good Choice";
}
