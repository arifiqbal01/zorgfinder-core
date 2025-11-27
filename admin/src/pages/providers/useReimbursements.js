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

  // Not used much anymore
  const [form, setForm] = useState({
    type: "",
    description: "",
    coverage_details: "",
  });

  /* ============================================================
   * LOAD REIMBURSEMENTS FOR PROVIDER — with logs
   * ============================================================ */
  const loadForProvider = useCallback(async (id) => {
    console.log("%c[useReimbursements] 🔵 loadForProvider called", "color:#2980ff", { id });

    try {
      const url = `/wp-json/zorg/v1/reimbursements?provider_id=${id}`;
      console.log("[useReimbursements] Fetching:", url);

      const res = await fetch(url, {
        headers: { "X-WP-Nonce": getNonce() },
      });

      console.log("[useReimbursements] Response status:", res.status);

      const text = await res.text();
      console.log("[useReimbursements] Raw response text:", text);

      let json = {};
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error("[useReimbursements] ❌ JSON parse failed:", err);
        return;
      }

      console.log("[useReimbursements] Parsed JSON:", json);

      const rows = Array.isArray(json?.data) ? json.data : [];
      console.log("[useReimbursements] Rows array:", rows);

      // Normalize
      const normalized = emptyStructured();

      rows.forEach((r) => {
        const type = (r.type || "").toUpperCase().trim();

        console.log("[useReimbursements] Processing row:", r, "-> type:", type);

        if (normalized.hasOwnProperty(type)) {
          normalized[type] = {
            id: r.id ?? null,
            type,
            description: r.description ?? "",
            coverage_details: r.coverage_details ?? "",
          };
        } else {
          console.warn("[useReimbursements] ⚠️ Unknown type from DB:", r);
        }
      });

      console.log("%c[useReimbursements] ✅ Normalized mapped list:", "color:green", normalized);

      setList(normalized);
      return normalized;
    } catch (err) {
      console.error("[useReimbursements] ❌ loadForProvider error:", err);
      setList(emptyStructured());
    }
  }, []);

  /* Reset */
  const reset = useCallback(() => {
    console.log("[useReimbursements] ♻️ reset()");
    setList(emptyStructured());
    setForm({ type: "", description: "", coverage_details: "" });
  }, []);

  /* Update one type */
  const updateType = useCallback((type, data) => {
    console.log("[useReimbursements] ✏️ updateType()", type, data);

    setList((prev) => {
      const updated = {
        ...prev,
        [type]: {
          ...(prev[type] || { id: null, type }),
          ...data,
        },
      };

      console.log("[useReimbursements] Updated structured list:", updated);
      return updated;
    });
  }, []);

  return {
    list,
    setList,
    updateType,
    form,
    setForm,
    loadForProvider,
    reset,

    // legacy
    addEntry: () => console.warn("addEntry() not used"),
    removeEntry: () => console.warn("removeEntry() not used"),
  };
};
