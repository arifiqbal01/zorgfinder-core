import React from "react";
import { createRoot } from "react-dom/client";
import ProvidersList from "./components/ProvidersList";
import "./style.scss";


console.log("🔥 Providers frontend loaded");

function mountProviders() {
    const wrapper = document.querySelector(".zf-providers-wrapper");
    if (!wrapper) return;

    try {
        const root = createRoot(wrapper);
        root.render(<ProvidersList />);
    } catch (err) {
        console.error("ZORG: Providers mount failed", err);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(mountProviders, 50));
} else {
    setTimeout(mountProviders, 50);
}