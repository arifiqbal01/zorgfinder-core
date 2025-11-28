import { useState, useCallback } from "react";

const getNonce = () => window?.wpApiSettings?.nonce || "";

/* Allowed types */
const TYPES = ["WLZ", "ZVW", "WMO", "Youth"];

/* Empty structured list */
const emptyStructured = () =>
  TYPES.reduce((acc, t) => {
    acc[t] = null;
    return acc;
  }, {});

export const useReimbursements = () => {
  const [list, setList] = useState(emptyStructured());

  const [form, setForm] = useState({
    type: "",
    description: "",
    coverage_details: "",
  });

  /* Load reimbursements for provider */
  const loadForProvider = useCallback(async (id) => {
    try {
      const res = await fetch(
        `/wp-json/zorg/v1/reimbursements?provider_id=${id}`,
        {
          headers: { "X-WP-Nonce": getNonce() },
        }
      );

      const text = await res.text();
      let json = {};

      try {
        json = JSON.parse(text);
      } catch {
        return;
      }

      const rows = Array.isArray(json?.data) ? json.data : [];
      const normalized = emptyStructured();

      rows.forEach((r) => {
        const type = (r.type || "").toUpperCase().trim();

        if (normalized.hasOwnProperty(type)) {
          normalized[type] = {
            id: r.id ?? null,
            type,
            description: r.description ?? "",
            coverage_details: r.coverage_details ?? "",
          };
        }
      });

      setList(normalized);
      return normalized;
    } catch {
      setList(emptyStructured());
    }
  }, []);

  /* Reset state */
  const reset = useCallback(() => {
    setList(emptyStructured());
    setForm({ type: "", description: "", coverage_details: "" });
  }, []);

  /* Update one reimbursement type */
  const updateType = useCallback((type, data) => {
    setList((prev) => ({
      ...prev,
      [type]: {
        ...(prev[type] || { id: null, type }),
        ...data,
      },
    }));
  }, []);

  return {
    list,
    setList,
    updateType,
    form,
    setForm,
    loadForProvider,
    reset,

    // legacy (kept for compatibility)
    addEntry: () => {},
    removeEntry: () => {},
  };
};
