import { useState } from "react";

export const useReimbursementForm = (initialProviderId) => {
  const [providerId, setProviderId] = useState(initialProviderId || null);

  const [form, setForm] = useState({
    type: "",
    description: "",
    coverage_details: "",
  });

  const saveReimbursement = async () => {
  const res = await fetch("/wp-json/zorg/v1/reimbursements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-WP-Nonce": window.wpApiSettings.nonce,
    },
    body: JSON.stringify({
      provider_id: providerId,
      type: form.type,
      description: form.description,
      coverage_details: form.coverage_details,
    }),
  });

  const text = await res.text();
  console.log("=== REIMBURSEMENT SAVE RESPONSE ===");
  console.log("Status:", res.status);
  console.log("Body:", text);

  if (!res.ok) {
    alert("Failed to add reimbursement");
    return;
  }

  // Success
};


  return {
    form,
    setForm,
    saveReimbursement,
    providerId,
    setProviderId,   // ← IMPORTANT FIX
  };
};
