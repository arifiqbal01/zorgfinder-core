import { createRoot } from "react-dom/client";
import React from "react";
import ComparePage from "./ComparePage";

console.log("🔥 Comparison frontend loaded");

function mountCompare() {
    const wrapper = document.querySelector(".zf-compare-wrapper");
    if (!wrapper) return;

    try {
        const root = createRoot(wrapper);
        root.render(<ComparePage />);
    } catch (err) {
        console.error("ZORG: Comparison mount failed", err);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(mountCompare, 30);
    });
} else {
    setTimeout(mountCompare, 30);
}
