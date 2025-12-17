import { createRoot } from "react-dom/client";
import { CompareProvider } from "../context/CompareContext";
import CompareContainer from "./CompareContainer";
import "./style.scss";

console.log("🔥 Compare frontend loaded");

function mountCompare() {
  const wrapper = document.querySelector(".zf-compare-wrapper");
  if (!wrapper) return;

  // 🔒 Prevent double-mount
  if (wrapper.dataset.mounted === "true") return;
  wrapper.dataset.mounted = "true";

  try {
    const root = createRoot(wrapper);
    root.render(
      <CompareProvider>
        <CompareContainer />
      </CompareProvider>
    );
  } catch (err) {
    console.error("ZORG: Compare mount failed", err);
  }
}

// Match Providers behavior exactly
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () =>
    setTimeout(mountCompare, 50)
  );
} else {
  setTimeout(mountCompare, 50);
}
