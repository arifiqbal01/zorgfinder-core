import { useState, useCallback } from 'react';

const API_ROOT = window.zorgApiRoot || '/wp-json/zorg/v1';

export default function useCompare() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCompare = useCallback(async (ids = []) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ ids: ids.join(',') }).toString();
      const res = await fetch(`${API_ROOT}/compare?${qs}`, {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Fetch failed');
      }
      const json = await res.json();
      // Assume wrapper { success: true, data: [...] } from BaseController.respond
      const payload = json.data ?? json;
      setData(payload);
      setLoading(false);
      return payload;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, []);

  return { data, loading, error, fetchCompare };
}
