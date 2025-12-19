import { useSyncExternalStore } from "react";

const STORE_KEY = "__ZF_SAVED_COMPARES_STORE__";

if (!window[STORE_KEY]) {
  const listeners = new Set();

  let saved = (() => {
    try {
      const raw = localStorage.getItem("zf_saved_compares");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  window[STORE_KEY] = {
    get() {
      return saved;
    },

    set(next) {
      saved = next;
      localStorage.setItem("zf_saved_compares", JSON.stringify(saved));
      listeners.forEach((l) => l(saved));
    },

    toggle(hash) {
      const next = saved.includes(hash)
        ? saved.filter((h) => h !== hash)
        : [...saved, hash];

      this.set(next);
      return next;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export const savedComparesStore = window[STORE_KEY];

/**
 * ✅ React-safe subscription (NO missed updates)
 */
export function useSavedComparesStore() {
  return useSyncExternalStore(
    savedComparesStore.subscribe,
    savedComparesStore.get,
    savedComparesStore.get
  );
}
