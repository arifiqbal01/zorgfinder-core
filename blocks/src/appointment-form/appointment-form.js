/* global React */
console.log("🔥 appointment-form.js loaded");

import React from "react";
import { createRoot } from "react-dom/client";
import AppointmentForm from "./AppointmentForm";

function mountAll() {
  const nodes = document.querySelectorAll(".zf-appointment-form-wrapper");
  if (!nodes.length) return;
  nodes.forEach((node, i) => {
    try {
      console.log("🔥 Mounting form on wrapper #" + i);
      const providerId = parseInt(node.dataset.provider || 0, 10);
      const title = node.dataset.title || "";

      // Create root and render
      const root = createRoot(node);
      root.render(<AppointmentForm providerId={providerId} title={title} />);
    } catch (err) {
      console.error("ZORG: mount failed", err);
    }
  });
}

// Wait for DOM + React (wp-element) to be available
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // small delay to allow wp-element script to initialize
    setTimeout(mountAll, 50);
  });
} else {
  setTimeout(mountAll, 50);
}
