import React, { useEffect, useState } from "react";

export default function QuickNav() {
    const items = [
        { id: "features", label: "Features" },
        { id: "reimbursements", label: "Reimbursements" },
        { id: "reviews", label: "Reviews" },
        { id: "appointments", label: "Appointments" },
        { id: "details", label: "Details" },
    ];

    const [active, setActive] = useState("features");

    // Detect active section on scroll
    useEffect(() => {
        const handler = () => {
            let current = active;
            items.forEach(item => {
                const el = document.getElementById(item.id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top < 140 && rect.bottom > 140) {
                        current = item.id;
                    }
                }
            });
            setActive(current);
        };
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b mb-6">
            <div className="flex gap-8 py-3 px-1 text-sm overflow-x-auto">
                {items.map(item => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`relative pb-2 transition ${
                            active === item.id
                                ? "text-blue-600 font-medium"
                                : "text-gray-500"
                        }`}
                    >
                        {item.label}
                        {active === item.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>
                        )}
                    </a>
                ))}
            </div>
        </div>
    );
}
