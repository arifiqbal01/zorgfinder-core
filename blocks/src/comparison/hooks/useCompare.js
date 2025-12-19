import { useState, useCallback, useRef } from 'react';

const API_ROOT = window.zorgApiRoot || '/wp-json/zorg/v1';

export default function useCompare() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastKeyRef = useRef(null);

  const fetchCompare = useCallback(async (ids = []) => {
    if (!ids.length) return;

    const key = ids.join(',');
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({ ids: key }).toString();
      const res = await fetch(`${API_ROOT}/compare?${qs}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const json = await res.json();

      setData({
        providers: json.providers ?? [],
        isSavedCompare: Boolean(json.is_saved_compare),
      });

    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchCompare };
}
