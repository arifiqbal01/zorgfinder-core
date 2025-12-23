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
    out[key] = {
      description: input?.[key]?.description || "",
      coverage_details: input?.[key]?.coverage_details || "",
    };
  });

  return out;
};

export const useProviderForm = (fetchProviders, closeModal) => {
  const [provider, setProvider] = useState(emptyProvider);
  const [reimbursements, setReimbursements] = useState(
    normalizeReimbursements()
  );
  const [editingId, setEditingId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false); // 🔑 critical

  /* =====================
     RESET
  ====================== */
  const reset = useCallback(() => {
    setProvider(emptyProvider);
    setReimbursements(normalizeReimbursements());
    setEditingId(null);
    setIsLoaded(false);
  }, []);

  /* =====================
     LOAD PROVIDER
  ====================== */
  const loadProvider = useCallback(async (id) => {
    if (!id) return;

    setIsLoaded(false);

    // ✅ cache hit (safe)
    if (providerCache.has(id)) {
      const cached = providerCache.get(id);
      if (cached?.provider?.id) {
        setProvider(cached.provider);
        setReimbursements(cached.reimbursements);
        setEditingId(id);
        setIsLoaded(true);
        return cached.provider;
      }
      providerCache.delete(id);
    }

    const res = await fetch(
      `/wp-json/zorg/v1/providers-with-reimbursements/${id}`,
      { headers: { "X-WP-Nonce": getNonce() } }
    );

    if (!res.ok) {
      throw new Error("Failed to load provider");
    }

    let json;
    try {
      json = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    const container = json?.data ?? json ?? {};
    const p = container.provider;
    const r = container.reimbursements || {};

    if (!p || !p.id) {
      throw new Error("Provider not found or inaccessible");
    }

    const normalizedProvider = {
      id: p.id,
      provider: p.provider || "",
      slug: p.slug || "",
      target_genders: Array.isArray(p.target_genders)
        ? p.target_genders
        : [],
      target_age_groups: Array.isArray(p.target_age_groups)
        ? p.target_age_groups
        : [],
      type_of_care: p.type_of_care || "",
      indication_type: p.indication_type || "",
      organization_type: p.organization_type || "",
      religion: p.religion || "",
      has_hkz: Number(p.has_hkz) === 1 ? 1 : 0,
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
    setIsLoaded(true);

    // ✅ cache only fully valid data
    providerCache.set(id, {
      provider: normalizedProvider,
      reimbursements: normalizedReimbs,
    });

    return normalizedProvider;
  }, []);

  /* =====================
     SAVE PROVIDER
  ====================== */
  const saveProvider = useCallback(
    async (reimbursementsArray) => {
      if (editingId && !isLoaded) {
        throw new Error("Provider is still loading");
      }

      const url = editingId
        ? `/wp-json/zorg/v1/providers-with-reimbursements/${editingId}`
        : `/wp-json/zorg/v1/providers-with-reimbursements`;

      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...provider,
        target_genders: provider.target_genders || [],
        target_age_groups: provider.target_age_groups || [],
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

      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(json?.message || "Save failed");
      }

      providerCache.clear();
      await fetchProviders();
      closeModal();
    },
    [editingId, isLoaded, provider, fetchProviders, closeModal]
  );

  /* =====================
     FIELD UPDATERS
  ====================== */
  const updateProviderField = useCallback(
    (field, value) => {
      setProvider((prev) => ({ ...prev, [field]: value }));

      if (editingId && providerCache.has(editingId)) {
        providerCache.set(editingId, {
          ...providerCache.get(editingId),
          provider: {
            ...providerCache.get(editingId).provider,
            [field]: value,
          },
        });
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
          providerCache.set(editingId, {
            ...providerCache.get(editingId),
            reimbursements: updated,
          });
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
    isLoaded, // 👈 exposed for UI guards

    updateProviderField,
    updateReimbursementField,

    loadProvider,
    saveProvider,
    reset,
  };
};
