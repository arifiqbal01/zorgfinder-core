import React from "react";

export default function UserPanel({ user }) {
  const logout = async () => {
    await fetch("/wp-json/zorg/v1/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
      },
    });
    // full reload to ensure cookies cleared & WP state re-evaluates
    window.location.reload();
  };

  return (
    <div className="bg-white shadow rounded-2xl p-6 border border-gray-100 space-y-4">
      <h2 className="text-xl font-semibold">Welcome, {user.name}</h2>

      <div className="text-sm text-gray-700 space-y-1">
        <div><strong>Email:</strong> {user.email || "—"}</div>
        {user.phone ? <div><strong>Phone:</strong> {user.phone}</div> : null}
      </div>

      <button onClick={logout} className="w-full bg-black text-white py-2 rounded">
        Logout
      </button>
    </div>
  );
}
