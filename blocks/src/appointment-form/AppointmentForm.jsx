/** @jsxRuntime classic */
import React, { useEffect, useState } from "react";

const DEFAULT_SLOTS = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
];

export default function AppointmentForm({ providerId = 0, title = "Book Appointment" }) {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(providerId || "");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // NEW → taken slots from availability API
  const [takenSlots, setTakenSlots] = useState([]);

  // Global object (nonce + URL)
  const ZF = (typeof window !== "undefined" && window.zorgFinderApp) ? window.zorgFinderApp : {};
  const nonce = ZF.nonce || "";

  /**
   * LOAD PROVIDERS (only if default provider not set)
   */
  useEffect(() => {
    if (providerId) {
      setSelectedProvider(providerId);
      return;
    }

    let mounted = true;

    fetch("/wp-json/zorg/v1/providers?per_page=999")
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        if (json?.success) setProviders(json.data);
      })
      .catch(() => {
        if (!mounted) return;
        setProviders([]);
      });

    return () => (mounted = false);
  }, [providerId]);

  /**
   * LOAD AVAILABILITY WHEN provider OR date CHANGES
   */
  useEffect(() => {
    if (!selectedProvider || !date) {
      setTakenSlots([]);
      return;
    }

    const url = `/wp-json/zorg/v1/appointments/availability?provider_id=${selectedProvider}&date=${date}`;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json?.success) {
          setTakenSlots(json.data.taken_slots || []);
        } else {
          setTakenSlots([]);
        }
      })
      .catch(() => setTakenSlots([]));
  }, [selectedProvider, date]);

  /**
   * Prevent booking past dates
   */
  const minDate = new Date().toISOString().split("T")[0];

  const validate = () => {
    if (!selectedProvider) return "Please select a provider.";
    if (!date) return "Please select a date.";
    if (!timeSlot) return "Please select a time slot.";
    if (takenSlots.includes(timeSlot)) return "This time slot is already booked.";
    return null;
  };

  /**
   * HANDLE SUBMIT
   */
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
          "X-WP-Nonce": nonce,
        },
        body: JSON.stringify({
          provider_id: selectedProvider,
          preferred_date: date,
          time_slot: timeSlot,
          notes,
        }),
      });

      const json = await res.json();

      if (json?.success) {
        setMessage({ type: "success", text: "Appointment requested — provider will confirm." });
        setDate("");
        setTimeSlot("");
        setNotes("");
        setTakenSlots([]);

        // fire event (optional)
        window.dispatchEvent(new CustomEvent("zorg:appointment:created", { detail: json.data }));
      } else {
        const msg = json?.message || json?.data?.message || "Could not create appointment.";
        setMessage({ type: "error", text: msg });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error — try again." });
    }

    setLoading(false);
  };

  return (
    <form className="zf-appointment-form" onSubmit={submit} aria-label="Appointment booking form">
      <h3>{title}</h3>

      {message && (
        <div role="status" aria-live="polite" className={`zf-msg zf-msg-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Provider Select */}
      {!providerId && (
        <div>
          <label htmlFor="zf-provider">Provider</label>
          <select
            id="zf-provider"
            className="input"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(Number(e.target.value))}
            required
          >
            <option value="">Choose provider…</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date */}
      <div>
        <label htmlFor="zf-date">Preferred date</label>
        <input
          id="zf-date"
          type="date"
          className="input"
          value={date}
          min={minDate}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      {/* Time slot */}
      <div>
        <label htmlFor="zf-time">Time slot</label>
        <select
          id="zf-time"
          className="input"
          value={timeSlot}
          onChange={(e) => setTimeSlot(e.target.value)}
          required
        >
          <option value="">Select time…</option>
          {DEFAULT_SLOTS.map((slot) => (
            <option key={slot} value={slot} disabled={takenSlots.includes(slot)}>
              {slot} {takenSlots.includes(slot) ? "— Booked" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="zf-notes">Notes (optional)</label>
        <textarea
          id="zf-notes"
          className="input"
          rows="4"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>
      </div>

      {/* Submit */}
      <div className="zf-actions">
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Sending…" : "Request appointment"}
        </button>
      </div>
    </form>
  );
}
