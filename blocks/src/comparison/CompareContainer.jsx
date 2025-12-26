// CompareContainer.jsx
import { useEffect, useRef } from "react";
import { useCompareCart } from "../context/CompareContext";
import useCompare from "./hooks/useCompare";
import CompareLayout from "./CompareLayout";
import { comparisonSchema } from "./schema/comparisonSchema";

function parseIdsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("ids");
  if (!raw) return [];
  return raw
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n));
}

export default function CompareContainer() {
  const { ids, add, clear } = useCompareCart();
  const { data, loading, error, fetchCompare } = useCompare();

  const urlHandledRef = useRef(false);

  /* ---------- URL → context ---------- */
  useEffect(() => {
    if (urlHandledRef.current) return;

    const urlIds = parseIdsFromUrl();
    if (urlIds.length >= 2) {
      clear();
      urlIds.forEach(add);
      urlHandledRef.current = true;
    }
  }, []);

  /* ---------- context → API ---------- */
  useEffect(() => {
    if (ids.length >= 2) {
      fetchCompare(ids);
    }
  }, [ids, fetchCompare]);

  if (ids.length < 2) return <p>Select at least 2 providers to compare.</p>;
  if (loading) return <p>Loading comparison…</p>;
  if (error) return <p>Failed to load comparison.</p>;
  if (!data) return null;

  return (
    <CompareLayout
      providers={data.providers ?? []}
      schema={comparisonSchema}
    />
  );
}
