/** @jsxRuntime classic */
import React, { useEffect, useState } from "react";
import { Button, Input, Section } from "../ui";

export default function AppointmentForm({
  providerId = 0,
  requireProvider = false,
  title = "Request appointment",
  onSuccess,
}) {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(providerId || "");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const nonce = window?.zorgFinderApp?.nonce || "";

  /* Load providers only when needed */
  useEffect(() => {
    if (providerId) return;

    fetch("/wp-json/zorg/v1/providers?per_page=999")
      .then((r) => r.json())
      .then((j) => j?.success && setProviders(j.data))
      .catch(() => setProviders([]));
  }, [providerId]);

  const validate = () => {
    if (requireProvider && !selectedProvider) {
      return "Please select a provider.";
    }
    if (!name.trim()) return "Name is required.";
    if (!email.trim()) return "Email is required.";
    if (!phone.trim()) return "Phone number is required.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const err = validate();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/wp-json/zorg/v1/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(nonce ? { "X-WP-Nonce": nonce } : {}),
        },
        body: JSON.stringify({
          provider_id: selectedProvider,
          name,
          email,
          phone,
          notes,
        }),
      });

      const json = await res.json();

      if (json?.success) {
        setMessage({
          type: "success",
          text:
            "Your request has been sent. The provider will contact you.",
        });

        setName("");
        setEmail("");
        setPhone("");
        setNotes("");

        window.dispatchEvent(
          new CustomEvent("zorg:appointment:created", {
            detail: json.data,
          })
        );

        onSuccess?.();
      } else {
        setMessage({
          type: "error",
          text: json?.message || "Could not submit request.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    }

    setLoading(false);
  };

  return (
    <form
      className="space-y-6"
      onSubmit={submit}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
      )}

      {message && (
        <div
          className={`
            text-sm rounded-lg px-4 py-3
            ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }
          `}
        >
          {message.text}
        </div>
      )}

      {/* Provider (contextual) */}
      {(!providerId || !requireProvider) && (
        <Section label="Provider">
          <select
            className="
              w-full h-10 px-3
              rounded-lg border border-gray-300
              text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-300
            "
            value={selectedProvider}
            onChange={(e) =>
              setSelectedProvider(Number(e.target.value))
            }
            required={requireProvider}
          >
            <option value="">Choose provider…</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.provider}
              </option>
            ))}
          </select>
        </Section>
      )}

      <Input
        label="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <Input
        label="Phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="06 1234 5678"
      />

      <Section label="Message (optional)">
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="
            w-full px-3 py-2
            rounded-lg border border-gray-300
            text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-300
          "
          placeholder="Briefly describe your situation…"
        />
      </Section>

      <Button
        full
        disabled={loading}
      >
        {loading ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
