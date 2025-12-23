import { useEffect, useState } from "react";
import { Drawer } from "../ui";
import AppointmentForm from "./AppointmentForm";

export default function AppointmentDrawer() {
  const [open, setOpen] = useState(false);
  const [providerId, setProviderId] = useState(0);
  const [title, setTitle] = useState("Request appointment");
  const [requireProvider, setRequireProvider] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};

      setProviderId(detail.providerId || 0);
      setTitle(detail.title || "Request appointment");
      setRequireProvider(Boolean(detail.providerId));
      setOpen(true);
    };

    window.addEventListener("zf:open-appointment", handler);
    return () =>
      window.removeEventListener("zf:open-appointment", handler);
  }, []);

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      title={title}
      subtitle="Leave your details and we’ll connect you with the provider"
    >
      <AppointmentForm
        providerId={providerId}
        requireProvider={requireProvider}
        onSuccess={() => setOpen(false)}
      />
    </Drawer>
  );
}
