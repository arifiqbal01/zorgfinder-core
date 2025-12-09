import React, { useState } from "react";

export default function RegisterForm({ onRegister }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    first_name: "",
    last_name: "",
    language: "en",
    consent: true,
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
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
      onRegister(json.user);
    } catch (e) {
      console.error(e);
      setErr("Network error");
    }

    setLoading(false);
  };

  const Input = ({ name, placeholder, type = "text" }) => (
    <input
      type={type}
      value={form[name]}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      placeholder={placeholder}
      className="w-full border rounded px-3 py-2"
    />
  );

  return (
    <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 space-y-3">
      <h2 className="text-xl font-semibold">Create an account</h2>

      {err && <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{err}</div>}

      {Input({ name: "username", placeholder: "Username" })}
      {Input({ name: "email", placeholder: "Email" })}
      {Input({ name: "password", placeholder: "Password", type: "password" })}
      {Input({ name: "phone", placeholder: "Phone" })}
      {Input({ name: "first_name", placeholder: "First name" })}
      {Input({ name: "last_name", placeholder: "Last name" })}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        {loading ? "Creating…" : "Register"}
      </button>
    </div>
  );
}
