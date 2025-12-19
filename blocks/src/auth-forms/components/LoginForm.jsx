import { useState } from "react";
import { Card, Button, Input } from "../../ui";

export default function LoginForm({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | forgot
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const submitLogin = async () => {
    if (!username || !password) {
      setErr("Username and password are required");
      return;
    }

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

      window.zorgFinderApp = window.zorgFinderApp || {};
      window.zorgFinderApp.nonce = json.nonce || window.zorgFinderApp.nonce;
      window.zorgFinderApp.isLoggedIn = true;
      onLogin(json.user);
    } catch {
      setErr("Network error");
    }

    setLoading(false);
  };

  const submitForgot = async () => {
    if (!email) {
      setErr("Email is required");
      return;
    }

    setLoading(true);
    setErr("");
    setSuccess("");

    try {
      const res = await fetch("/wp-json/zorg/v1/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
        },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErr(json.message || "Unable to send reset email");
        setLoading(false);
        return;
      }

      setSuccess(
        "If an account exists, a password reset email has been sent."
      );
    } catch {
      setErr("Network error");
    }

    setLoading(false);
  };

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">
        {mode === "login" ? "Login" : "Reset password"}
      </h2>

      {err && (
        <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
          {err}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
          {success}
        </div>
      )}

      {mode === "login" ? (
        <>
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button full disabled={loading} onClick={submitLogin}>
            {loading ? "Logging in…" : "Login"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setErr("");
              setSuccess("");
            }}
            className="text-sm text-indigo-600 hover:underline"
          >
            Forgot password?
          </button>
        </>
      ) : (
        <>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <Button full disabled={loading} onClick={submitForgot}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErr("");
              setSuccess("");
            }}
            className="text-sm text-gray-600 hover:underline"
          >
            Back to login
          </button>
        </>
      )}
    </Card>
  );
}
