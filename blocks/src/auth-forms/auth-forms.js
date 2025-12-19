import { createRoot } from "react-dom/client";
import AuthForms from "./components/AuthForms";
import AuthDrawer from "./components/AuthDrawer";
import "./style.scss";

/* ===============================
 * Mount AUTH BLOCK (AuthForms)
 * =============================== */
function mountAuthBlock() {
  const el = document.querySelector(".zf-auth-block-root");
  if (!el) return;

  if (el.dataset.mounted === "true") return;
  el.dataset.mounted = "true";

  try {
    createRoot(el).render(<AuthForms />);
  } catch (err) {
    console.error("ZORG AuthForms mount failed", err);
  }
}

/* ===============================
 * Mount GLOBAL AUTH DRAWER
 * =============================== */
function mountAuthDrawer() {
  let el = document.querySelector(".zf-auth-drawer-root");

  if (!el) {
    el = document.createElement("div");
    el.className = "zf-auth-drawer-root";
    document.body.appendChild(el);
  }

  if (el.dataset.mounted === "true") return;
  el.dataset.mounted = "true";

  try {
    createRoot(el).render(<AuthDrawer />);

    // 🌍 Global opener
    window.zfOpenAuth = ({ mode = "login" } = {}) => {
      window.dispatchEvent(
        new CustomEvent("zf:open-auth", { detail: { mode } })
      );
    };
  } catch (err) {
    console.error("ZORG AuthDrawer mount failed", err);
  }
}

/* ===============================
 * Boot
 * =============================== */
function boot() {
  mountAuthBlock();
  mountAuthDrawer();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 50));
} else {
  setTimeout(boot, 50);
}
