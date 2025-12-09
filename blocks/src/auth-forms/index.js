import React from "react";
import { createRoot } from "react-dom/client";
import AuthForms from "./components/AuthForms";
import "./style.scss";

function mount() {
  const el = document.querySelector(".zf-auth-forms-wrapper");
  if (!el) return;
  try {
    const root = createRoot(el);
    root.render(<AuthForms />);
  } catch (e) {
    console.error("AuthForms mount failed", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  setTimeout(mount, 50);
}
