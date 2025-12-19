import { useState } from "react";
import { Card, Button, Input } from "../../ui";

export default function RegisterForm({ onRegister }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.username || !form.email || !form.password) {
      setErr("Username, email and password are required");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const response = await fetch("/wp-json/zorg/v1/auth/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
        },
        body: JSON.stringify(form),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setErr(json.message || "Registration failed");
        setLoading(false);
        return;
      }

      window.zorgFinderApp = window.zorgFinderApp || {};
      window.zorgFinderApp.nonce = json.nonce || window.zorgFinderApp.nonce;
      window.zorgFinderApp.isLoggedIn = true;
      onRegister(json.user);
    } catch {
      setErr("Network error");
    }

    setLoading(false);
  };

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Create account</h2>

      {err && (
        <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
          {err}
        </div>
      )}

      <Input label="Username" value={form.username} onChange={set("username")} />
      <Input label="Email" type="email" value={form.email} onChange={set("email")} />
      <Input label="Password" type="password" value={form.password} onChange={set("password")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="First name" value={form.first_name} onChange={set("first_name")} />
        <Input label="Last name" value={form.last_name} onChange={set("last_name")} />
      </div>

      <Input label="Phone" value={form.phone} onChange={set("phone")} />

      <Button full disabled={loading} onClick={submit}>
        {loading ? "Creating…" : "Register"}
      </Button>
    </Card>
  );
}
