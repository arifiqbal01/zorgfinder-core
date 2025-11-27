import { useState, useCallback } from "react";

const getNonce = () =>
  window?.wpApiSettings?.nonce || "";

export const useProviderForm = (fetchProviders, closeModal) => {
  const emptyForm = {
    name: "",
    slug: "",
    type_of_care: "",
    indication_type: "",
    organization_type: "",
    religion: "",
    has_hkz: 0,
    email: "",
    phone: "",
    website: "",
    address: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  /* LOAD SINGLE PROVIDER */
  const loadProvider = useCallback(async (id) => {
    const res = await fetch(`/wp-json/zorg/v1/providers/${id}`, {
      headers: { "X-WP-Nonce": getNonce() },
    });

    const json = await res.json();
    setEditing(json?.data || null);

    setForm({
      ...json?.data,
      has_hkz: json?.data?.has_hkz ? 1 : 0,
    });

    return json?.data;
  }, []);

  /* SAVE PROVIDER + REIMBURSEMENTS */
  const saveProvider = useCallback(
    async (reimbursements) => {
      const isEditing = !!editing?.id;

      /* ---------------------------------------------------
       * VALIDATION: At least one reimbursement must exist
       * --------------------------------------------------- */
      if (!Array.isArray(reimbursements) || reimbursements.length === 0) {
        throw new Error("At least one reimbursement type must be filled.");
      }

      /* ---------------------------------------------------
       * VALIDATION: One type must have description or coverage
       * --------------------------------------------------- */
      const hasValid = reimbursements.some(
        (r) =>
          (r.description && r.description.trim() !== "") ||
          (r.coverage_details && r.coverage_details.trim() !== "")
      );

      if (!hasValid) {
        throw new Error(
          "Please fill at least one reimbursement (description or coverage)."
        );
      }

      const url = isEditing
        ? `/wp-json/zorg/v1/providers-with-reimbursements/${editing.id}`
        : `/wp-json/zorg/v1/providers-with-reimbursements`;

      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...form,
        has_hkz: form.has_hkz ? 1 : 0,
        reimbursements,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": getNonce(),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.message || "Save failed");

      fetchProviders();
      closeModal();
    },
    [editing, form, fetchProviders, closeModal]
  );

  const reset = useCallback(() => {
    setForm(emptyForm);
    setEditing(null);
  }, []);

  return {
    form,
    setForm,
    editing,
    loadProvider,
    saveProvider,
    reset,
  };
};
