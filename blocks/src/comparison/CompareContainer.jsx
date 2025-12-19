import { useEffect } from "react";
import { useCompareCart } from "../context/CompareContext";
import useCompare from "./hooks/useCompare";
import CompareLayout from "./CompareLayout";
import { comparisonSchema } from "./schema/comparisonSchema";

export default function CompareContainer() {
  const { ids } = useCompareCart();
  const { data, loading, error, fetchCompare } = useCompare();

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
