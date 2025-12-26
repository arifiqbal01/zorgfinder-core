import ProvidersList from "./components/ProvidersList";
import { createRoot } from "react-dom/client";
import "./style.scss";

console.log("🔥 Providers frontend loaded");

function mountProviders() {
  const wrapper = document.querySelector(".zf-providers-wrapper");
  if (!wrapper) return;

  try {
    const root = createRoot(wrapper);
    root.render(<ProvidersList isEditor={false} />);

    // ✅ GLOBAL PROVIDER DRAWER OPENER
    window.zfOpenProvider = ({ providerId }) => {
      window.dispatchEvent(
        new CustomEvent("zf:open-provider", {
          detail: { providerId },
        })
      );
    };
  } catch (err) {
    console.error("ZORG: Providers mount failed", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () =>
    setTimeout(mountProviders, 50)
  );
} else {
  setTimeout(mountProviders, 50);
}