/* global React */
import React from "react";
import { createRoot } from "react-dom/client";
import AppointmentForm from "./AppointmentForm";
import AppointmentDrawer from "./AppointmentDrawer";

/* ===============================
 * Mount INLINE APPOINTMENT BLOCK
 * =============================== */
function mountAppointmentBlock() {
  const nodes = document.querySelectorAll(".zf-appointment-form-wrapper");
  if (!nodes.length) return;

  nodes.forEach((node) => {
    try {
      if (node.dataset.mounted === "true") return;
      node.dataset.mounted = "true";

      const providerId = parseInt(node.dataset.provider || 0, 10);
      const title = node.dataset.title || "Request appointment";
      const requireProvider = Boolean(providerId);

      createRoot(node).render(
        <AppointmentForm
          providerId={providerId}
          requireProvider={requireProvider}
          title={title}
        />
      );
    } catch (err) {
      console.error("ZORG: appointment block mount failed", err);
    }
  });
}

/* ===============================
 * Mount GLOBAL APPOINTMENT DRAWER
 * =============================== */
function mountAppointmentDrawer() {
  let el = document.querySelector(".zf-appointment-drawer-root");

  if (!el) {
    el = document.createElement("div");
    el.className = "zf-appointment-drawer-root";
    document.body.appendChild(el);
  }

  if (el.dataset.mounted === "true") return;
  el.dataset.mounted = "true";

  try {
    createRoot(el).render(<AppointmentDrawer />);

    // 🌍 Global opener (same pattern as auth)
    window.zfOpenAppointment = (options = {}) => {
      window.dispatchEvent(
        new CustomEvent("zf:open-appointment", { detail: options })
      );
    };
  } catch (err) {
    console.error("ZORG: appointment drawer mount failed", err);
  }
}

/* ===============================
 * Boot
 * =============================== */
function boot() {
  mountAppointmentBlock();
  mountAppointmentDrawer();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () =>
    setTimeout(boot, 50)
  );
} else {
  setTimeout(boot, 50);
}
