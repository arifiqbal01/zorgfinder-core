export const useCachedFetch = async (key, url, options = {}, ttlMinutes = 10) => {
  const now = Date.now();

  // Check existing cache
  const cached = localStorage.getItem(key);
  if (cached) {
    const parsed = JSON.parse(cached);

    // If not expired, return cached data
    if (now - parsed.time < ttlMinutes * 60 * 1000) {
      return { ok: true, fromCache: true, data: parsed.data };
    }
  }

  // Not cached → fetch fresh
  const headers = {
    "Content-Type": "application/json",
    "X-WP-Nonce": zorgFinderApp.nonce,
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const json = await response.json();

  // Save to cache
  localStorage.setItem(
    key,
    JSON.stringify({ time: now, data: json.data })
  );

  return {
    ok: response.ok,
    fromCache: false,
    data: json.data,
    raw: json
  };
};
