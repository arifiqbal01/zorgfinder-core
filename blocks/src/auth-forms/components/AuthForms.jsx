import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Dashboard from "./dashboard/Dashboard";


export default function AuthForms() {
  // If server already told us user is logged in, start in "loading" mode.
  const initialLoading = Boolean(window?.zorgFinderApp?.isLoggedIn);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(initialLoading);

  const loadMe = async () => {
    try {
      const res = await fetch("/wp-json/zorg/v1/auth/me", {
        credentials: "include",
        headers: {
          "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
        },
      });
      const json = await res.json();
      if (json && json.success && json.user) {
        setUser(json.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If server indicated not logged in, don't call /me (skip fetch) — prevents extra request.
    if (!window?.zorgFinderApp?.isLoggedIn) {
      setLoading(false);
      return;
    }
    loadMe();
  }, []);

  // While we are verifying the session, show a small loader (no forms)
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-gray-900" />
      </div>
    );
  }

  // Once loading finished: if user exists show panel, otherwise show auth forms
if (user) return <Dashboard user={user} />;

  return (
  <div className="max-w-5xl mx-auto p-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <LoginForm onLogin={(payload) => {
        window.zorgFinderApp = window.zorgFinderApp || {};
        window.zorgFinderApp.nonce = payload.nonce || window.zorgFinderApp.nonce;
        setUser(payload.user || payload);
      }} />

      <RegisterForm onRegister={(payload) => {
        window.zorgFinderApp = window.zorgFinderApp || {};
        window.zorgFinderApp.nonce = payload.nonce || window.zorgFinderApp.nonce;
        setUser(payload.user || payload);
      }} />
    </div>
  </div>
);

}