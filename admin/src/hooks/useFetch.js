export const useFetch = async (url, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    "X-WP-Nonce": zorgFinderApp.nonce,
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data: json.data,
    raw: json,
  };
};
