import { useState } from "react";

export function useAppointment(providerId) {
  const [loading, setLoading] = useState(false);

  const submit = async ({ provider_id, name, email, phone, notes }) => {
    setLoading(true);
    try {
      const res = await fetch("/wp-json/zorg/v1/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": window.zorgFinderApp?.nonce || "",
        },
        body: JSON.stringify({ provider_id, name, email, phone, notes }),
      });
      const json = await res.json();
      setLoading(false);
      return !!json?.success;
    } catch {
      setLoading(false);
      return false;
    }
  };

  return { loading, submit };
}
