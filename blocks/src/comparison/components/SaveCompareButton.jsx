import {
  savedComparesStore,
  useSavedComparesStore,
} from "../../context/savedComparesStore";
import { buildCompareHash } from "../utils/compareHash";

export default function SaveCompareButton({ providerIds }) {
  const saved = useSavedComparesStore();

  // ⛔ don’t render until valid
  if (!Array.isArray(providerIds) || providerIds.length < 2) {
    return null;
  }

  const hash = buildCompareHash(providerIds);
  const isSaved = saved.includes(hash);

  const onClick = async () => {
    if (!window?.zorgFinderApp?.isLoggedIn) {
      sessionStorage.setItem(
        "zf_pending_save_compare",
        JSON.stringify(providerIds)
      );
      window.zfOpenAuth?.({ mode: "login" });
      return;
    }

    // 🔥 instant optimistic UI
    savedComparesStore.toggle(hash);

    try {
      await fetch("/wp-json/zorg/v1/compare/save", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": window.zorgFinderApp?.nonce || "",
        },
        body: JSON.stringify({ provider_ids: providerIds }),
      });
    } catch {
      // UI already updated — ignore
    }
  };

  return (
    <button
      onClick={onClick}
      aria-pressed={isSaved}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full border ${
        isSaved
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-transparent text-indigo-700 border-indigo-300 hover:bg-indigo-50"
      }`}
    >
      <span className="text-xl">{isSaved ? "♥" : "♡"}</span>
      <span>{isSaved ? "Bewaard" : "Bewaren"}</span>
    </button>
  );
}
