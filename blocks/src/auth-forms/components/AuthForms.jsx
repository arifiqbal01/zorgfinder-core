import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import Dashboard from "./dashboard/Dashboard";

export default function AuthForms() {
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
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!window?.zorgFinderApp?.isLoggedIn) {
      setLoading(false);
      return;
    }
    loadMe();
  }, []);

  /* =====================================================
   * 🔐 AUTO-SAVE PENDING COMPARE AFTER LOGIN / REGISTER
   * ===================================================== */
  useEffect(() => {
  if (!user) return;

  const nonce = window?.zorgFinderApp?.nonce;
  if (!nonce) return; // ⛔ wait for fresh nonce

  const pending = sessionStorage.getItem("zf_pending_save_compare");
  if (!pending) return;

  sessionStorage.removeItem("zf_pending_save_compare");

  fetch("/wp-json/zorg/v1/compare/save", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-WP-Nonce": nonce,
    },
    body: JSON.stringify({
      provider_ids: JSON.parse(pending),
    }),
  });
}, [user, window?.zorgFinderApp?.nonce]);

/* =====================================================
 * ❤️ AUTO-SAVE PENDING FAVOURITE AFTER LOGIN / REGISTER
 * ===================================================== */
useEffect(() => {
  if (!user) return;

  const nonce = window?.zorgFinderApp?.nonce;
  if (!nonce) return;

  const pendingFav = sessionStorage.getItem("zf_pending_favourite");
  if (!pendingFav) return;

  sessionStorage.removeItem("zf_pending_favourite");

  fetch("/wp-json/zorg/v1/favourites", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-WP-Nonce": nonce,
    },
    body: JSON.stringify({
      provider_id: Number(pendingFav),
    }),
  });
}, [user, window?.zorgFinderApp?.nonce]);



  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-gray-900" />
      </div>
    );
  }

  if (user) return <Dashboard user={user} />;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LoginForm
          onLogin={(payload) => {
            window.zorgFinderApp = window.zorgFinderApp || {};
            window.zorgFinderApp.nonce =
              payload.nonce || window.zorgFinderApp.nonce;
            setUser(payload.user || payload);
          }}
        />

        <RegisterForm
          onRegister={(payload) => {
            window.zorgFinderApp = window.zorgFinderApp || {};
            window.zorgFinderApp.nonce =
              payload.nonce || window.zorgFinderApp.nonce;
            setUser(payload.user || payload);
          }}
        />
      </div>
    </div>
  );
}
