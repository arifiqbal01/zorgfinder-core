import { createRoot } from "react-dom/client";
import AuthForms from "./components/AuthForms";
import "./style.scss";

function mountAuthForms() {
    const el = document.querySelector(".zf-auth-wrapper");
    if (!el) return;

    try {
        const root = createRoot(el);
        root.render(<AuthForms />);
    } catch (e) {
        console.error("ZORG: Auth mount failed", e);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(mountAuthForms, 50));
} else {
    setTimeout(mountAuthForms, 50);
}
