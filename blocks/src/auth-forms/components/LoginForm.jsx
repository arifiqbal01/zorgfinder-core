import React, { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setLoading(true);
    setErr("");

    try {
      const response = await fetch("/wp-json/zorg/v1/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
        },
        body: JSON.stringify({ username, password }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        setErr(json.message || "Login failed");
        setLoading(false);
        return;
      }

      // update global nonce + call parent
      window.zorgFinderApp = window.zorgFinderApp || {};
      window.zorgFinderApp.nonce = json.nonce || window.zorgFinderApp.nonce;
      onLogin(json.user);
    } catch (e) {
      console.error(e);
      setErr("Network error");
    }

    setLoading(false);
  };

  return (
    <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 space-y-4">
      <h2 className="text-xl font-semibold">Login</h2>

      {err && <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{err}</div>}

      <input
        placeholder="Username"
        className="w-full border rounded px-3 py-2"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        className="w-full border rounded px-3 py-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        {loading ? "Logging in…" : "Login"}
      </button>
    </div>
  );
}
