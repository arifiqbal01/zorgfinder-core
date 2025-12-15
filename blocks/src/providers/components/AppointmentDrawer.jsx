import Drawer from "../../ui/Drawer";
import Button from "../../ui/Button";
import Section from "../../ui/Section";
import { useState } from "react";
import { useAppointment } from "../hooks/useAppointment";

export default function AppointmentDrawer({ open, onClose, provider }) {
  const { submit, loading } = useAppointment(provider?.id);

  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const handleChange = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  const handleSubmit = async () => {
    const payload = { ...form, provider_id: provider?.id };
    try {
      const ok = await submit(payload);
      if (ok) onClose();
    } catch {
      // swallow errors, use hook error handling
    }
  };

  if (!provider) return null;

  return (
    <Drawer open={open} onClose={onClose} title={`Request care – ${provider.provider}`}>
      <div className="space-y-6">
        <Section label="Your name">
          <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" />
        </Section>

        <Section label="Email">
          <input value={form.email} onChange={(e) => handleChange("email", e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" />
        </Section>

        <Section label="Phone">
          <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" />
        </Section>

        <Section label="Notes">
          <textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-300" />
        </Section>

        <Button full variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit request"}
        </Button>
      </div>
    </Drawer>
  );
}
