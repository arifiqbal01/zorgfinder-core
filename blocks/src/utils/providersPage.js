// src/utils/providersPage.js
export function getProvidersPageUrl() {
  return (
    window?.zorgFinderApp?.providersPageUrl ||
    null
  );
}
