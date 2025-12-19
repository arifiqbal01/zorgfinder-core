// Canonical compare key – MUST match PHP exactly
export function buildCompareHash(providerIds) {
  if (!Array.isArray(providerIds)) return "";

  return providerIds
    .map(Number)
    .sort((a, b) => a - b)
    .join(",");
}
