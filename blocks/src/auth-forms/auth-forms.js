import { createRoot } from "react-dom/client";
import AuthForms from "./components/AuthForms";
import "./style.scss";

function mountAuthForms() {
  const el = document.querySelector(".zf-auth-wrapper");
  if (!el) return;

  // 🔒 Prevent double mount (Gutenberg preview, re-render, reusable blocks)
  if (el.dataset.mounted === "true") return;
  el.dataset.mounted = "true";

  try {
    const root = createRoot(el);
    root.render(<AuthForms />);
  } catch (err) {
    console.error("ZORG AuthForms mount failed", err);
  }
}

// Match Compare block behavior exactly
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () =>
    setTimeout(mountAuthForms, 50)
  );
} else {
  setTimeout(mountAuthForms, 50);
}
