// Pure in-memory cache
const memoryCache = {};

export function getCache(key) {
    // Memory first
    if (memoryCache[key]) return memoryCache[key].value;

    // LocalStorage fallback
    const saved = localStorage.getItem(key);
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    // Expired?
    if (parsed.expires && parsed.expires < Date.now()) {
        localStorage.removeItem(key);
        return null;
    }

    memoryCache[key] = parsed;
    return parsed.value;
}

export function setCache(key, value, ttlSeconds = 60) {
    const expires = Date.now() + ttlSeconds * 1000;

    const data = { value, expires };

    // Save memory
    memoryCache[key] = data;

    // Save disk
    localStorage.setItem(key, JSON.stringify(data));
}
