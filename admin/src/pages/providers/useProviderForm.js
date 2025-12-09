import { useState, useCallback } from "react";

const getNonce = () => window?.zorgFinderApp?.nonce || "";

/* Cache for instant reload */
const providerCache = new Map();

const emptyProvider = {
  id: null,
  provider: "",
  slug: "",
  target_genders: [],
  target_age_groups: [],
  type_of_care: "",
  indication_type: "",
  organization_type: "",
  religion: "",
  has_hkz: 0,
  email: "",
  phone: "",
  website: "",
  address: "",
  created_at: "",
  updated_at: "",
};

const normalizeReimbursements = (input = {}) => {
  const keys = ["WLZ", "ZVW", "WMO", "Youth"];
  const out = {};

  keys.forEach((key) => {
    out[key] = input[key]
      ? {
          description: input[key].description || "",
          coverage_details: input[key].coverage_details || "",
        }
      : { description: "", coverage_details: "" };
  });

  return out;
};

export const useProviderForm = (fetchProviders, closeModal) => {
  const [provider, setProvider] = useState(emptyProvider);
  const [reimbursements, setReimbursements] = useState(
    normalizeReimbursements()
  );
  const [editingId, setEditingId] = useState(null);

  const reset = useCallback(() => {
    setProvider(emptyProvider);
    setReimbursements(normalizeReimbursements());
    setEditingId(null);
  }, []);

  const loadProvider = useCallback(async (id) => {
    if (providerCache.has(id)) {
      const cached = providerCache.get(id);
      setProvider(cached.provider);
      setReimbursements(cached.reimbursements);
      setEditingId(id);
      return cached.provider;
    }

    const res = await fetch(
      `/wp-json/zorg/v1/providers-with-reimbursements/${id}`,
      {
        headers: { "X-WP-Nonce": getNonce() },
      }
    );

    const text = await res.text();
    const json = JSON.parse(text);
    const wrapped = json?.data || {};

    const p = wrapped.provider;
    const r = wrapped.reimbursements || {};

    if (!p) throw new Error("Provider missing");

    const normalizedProvider = {
      id: p.id,
      provider: p.provider || "",
      slug: p.slug || "",
      target_genders: Array.isArray(p.target_genders)
        ? p.target_genders
        : p.target_genders
        ? JSON.parse(p.target_genders)
        : [],
      target_age_groups: Array.isArray(p.target_age_groups)
        ? p.target_age_groups
        : p.target_age_groups
        ? JSON.parse(p.target_age_groups)
        : [],
      type_of_care: p.type_of_care || "",
      indication_type: p.indication_type || "",
      organization_type: p.organization_type || "",
      religion: p.religion || "",
      has_hkz: p.has_hkz ? 1 : 0,
      email: p.email || "",
      phone: p.phone || "",
      website: p.website || "",
      address: p.address || "",
      created_at: p.created_at || "",
      updated_at: p.updated_at || "",
    };

    const normalizedReimbs = normalizeReimbursements(r);

    setProvider(normalizedProvider);
    setReimbursements(normalizedReimbs);
    setEditingId(p.id);

    providerCache.set(id, {
      provider: normalizedProvider,
      reimbursements: normalizedReimbs,
    });

    return normalizedProvider;
  }, []);

  const saveProvider = useCallback(
    async (reimbursementsArray) => {
      const url = editingId
        ? `/wp-json/zorg/v1/providers-with-reimbursements/${editingId}`
        : `/wp-json/zorg/v1/providers-with-reimbursements`;

      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...provider,
        provider: provider.provider,
        target_genders: provider.target_genders,
        target_age_groups: provider.target_age_groups,
        reimbursements: reimbursementsArray,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": getNonce(),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json = JSON.parse(text);

      if (!res.ok) throw new Error(json?.message || "Save failed");

      if (editingId) providerCache.delete(editingId);

      fetchProviders();
      closeModal();
    },
    [editingId, provider, fetchProviders, closeModal]
  );

  const updateProviderField = useCallback(
    (field, value) => {
      setProvider((prev) => ({ ...prev, [field]: value }));

      if (editingId && providerCache.has(editingId)) {
        const cached = providerCache.get(editingId);
        cached.provider = { ...cached.provider, [field]: value };
        providerCache.set(editingId, cached);
      }
    },
    [editingId]
  );

  const updateReimbursementField = useCallback(
    (type, field, value) => {
      setReimbursements((prev) => {
        const updated = {
          ...prev,
          [type]: {
            ...prev[type],
            [field]: value,
          },
        };

        if (editingId && providerCache.has(editingId)) {
          const cached = providerCache.get(editingId);
          cached.reimbursements = updated;
          providerCache.set(editingId, cached);
        }

        return updated;
      });
    },
    [editingId]
  );

  return {
    provider,
    reimbursements,
    editingId,

    updateProviderField,
    updateReimbursementField,

    loadProvider,
    saveProvider,
    reset,
  };
};
