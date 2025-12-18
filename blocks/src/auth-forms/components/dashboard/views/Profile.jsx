import { useState } from "react";
import { Card, Section, Button, Drawer, Input } from "../../../../ui";

export default function Profile({ user }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: user.phone || "",
  });

  const save = async () => {
    const res = await fetch("/wp-json/zorg/v1/auth/profile", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
      },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (json?.success) {
      window.location.reload();
    }
  };

  return (
    <>
      <Card className="space-y-4 max-w-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Profile</h2>
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Edit
          </Button>
        </div>

        <Section label="Name">
          <div className="text-sm">{user.name}</div>
        </Section>

        <Section label="Email">
          <div className="text-sm">{user.email}</div>
        </Section>

        {user.phone && (
          <Section label="Phone">
            <div className="text-sm">{user.phone}</div>
          </Section>
        )}
      </Card>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
         <Input
            label="First name"
            maxLength={50}
            value={form.first_name}
            onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
            }
            />

            <Input
            label="Last name"
            maxLength={50}
            value={form.last_name}
            onChange={(e) =>
                setForm({ ...form, last_name: e.target.value })
            }
            />

            <Input
            label="Phone"
            placeholder="+123456789"
            value={form.phone}
            onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
            }
            />


          <Button full onClick={save}>
            Save changes
          </Button>
        </div>
      </Drawer>
    </>
  );
}
