const TTL = 60 * 1000; // 1 minute

/**
 * Always treat localStorage as source of truth
 * Memory is just a per-bundle optimization
 */
const memory = {};

export function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) {
      localStorage.removeItem(key);
      delete memory[key];
      return null;
    }

    memory[key] = data;
    return data;
  } catch {
    return null;
  }
}

export function setCache(key, data) {
  memory[key] = data;
  localStorage.setItem(
    key,
    JSON.stringify({ data, ts: Date.now() })
  );
}

export function clearCache(key) {
  delete memory[key];
  localStorage.removeItem(key);
}

export function clearDashboardCaches() {
  [
    "dashboard_overview",
    "dashboard_favourites",
    "dashboard_compares",
  ].forEach(clearCache);
}

window.addEventListener("storage", (e) => {
  if (e.key?.startsWith("dashboard_")) {
    delete memory[e.key];
  }
});
