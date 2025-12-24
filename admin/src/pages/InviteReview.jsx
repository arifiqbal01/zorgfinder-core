import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import Button from "../components/Button";
import Filters from "../components/Filters";
import ToastContainer from "../components/ToastContainer";
import { Copy } from "lucide-react";

const getNonce = () => window?.zorgFinderApp?.nonce || "";

export default function InviteReview() {
  const [items, setItems] = useState([]);
  const [providers, setProviders] = useState({});
  const [showModal, setShowModal] = useState(false);

  // Invite form
  const [providerIds, setProviderIds] = useState([]);
  const [emails, setEmails] = useState("");

  // Generated links (modal only)
  const [generatedLinks, setGeneratedLinks] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    provider_id: "",
    status: "",
  });

  // Bulk selection
  const [selected, setSelected] = useState([]);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const pushToast = (type, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  };

  /* ===============================
   * CLIPBOARD
   * =============================== */
  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      pushToast("success", "Invite link copied");
    } catch {
      pushToast("error", "Failed to copy invite link");
    }
  };

  /* ===============================
   * LOAD INVITES
   * =============================== */
  const load = async () => {
    try {
      const qs = new URLSearchParams(filters).toString();
      const res = await fetch(
        `/wp-json/zorg/v1/review-invites?${qs}`,
        { headers: { "X-WP-Nonce": getNonce() } }
      );

      const json = await res.json();
      if (json?.success) {
        setItems(json.data || []);
        setSelected([]);
      } else {
        pushToast("error", "Failed to load review invites");
      }
    } catch {
      pushToast("error", "Network error while loading invites");
    }
  };

  /* ===============================
   * INITIAL LOAD
   * =============================== */
  useEffect(() => {
    load();

    fetch("/wp-json/zorg/v1/providers?per_page=999", {
      headers: { "X-WP-Nonce": getNonce() },
    })
      .then((r) => r.json())
      .then((j) => {
        const map = {};
        (j?.data || []).forEach((p) => {
          map[p.id] = p.provider;
        });
        setProviders(map);
      })
      .catch(() => {
        pushToast("error", "Failed to load providers");
      });
  }, []);

  useEffect(() => {
    load();
  }, [filters]);

  /* ===============================
   * SEND INVITES
   * =============================== */
  const sendInvite = async () => {
    const emailList = emails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (!emailList.length || !providerIds.length) {
      pushToast("error", "Select provider and at least one email");
      return;
    }

    try {
      const res = await fetch("/wp-json/zorg/v1/review-invites/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": getNonce(),
        },
        body: JSON.stringify({
          provider_ids: providerIds,
          emails: emailList,
        }),
      });

      const json = await res.json();

      if (json?.success) {
        setGeneratedLinks(json.links || []);
        setEmails("");
        setProviderIds([]);
        load();
        pushToast("success", "Review invites sent");
      } else {
        pushToast("error", json?.message || "Failed to send invites");
      }
    } catch {
      pushToast("error", "Network error while sending invites");
    }
  };

  /* ===============================
   * BULK DELETE
   * =============================== */
  const bulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} invite(s)?`)) return;

    try {
      await fetch("/wp-json/zorg/v1/review-invites/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": getNonce(),
        },
        body: JSON.stringify({ ids: selected }),
      });

      setSelected([]);
      load();
      pushToast("success", "Invites deleted");
    } catch {
      pushToast("error", "Failed to delete invites");
    }
  };

  /* ===============================
   * TABLE
   * =============================== */
  const columns = ["Provider", "Email", "Status", "Created", "Expires"];

  const rows = items.map((i) => [
    providers[i.provider_id] || `#${i.provider_id}`,
    i.email,
    i.used_at
      ? "Used"
      : i.expires_at && new Date(i.expires_at) < new Date()
      ? "Expired"
      : "Pending",
    i.created_at,
    i.expires_at ? new Date(i.expires_at).toLocaleString() : "—",
  ]);

  const actions = (index) => {
    const invite = items[index];
    if (!invite?.token) return null;

    const isUsed = Boolean(invite.used_at);
    const isExpired =
      invite.expires_at && new Date(invite.expires_at) < new Date();

    if (isUsed || isExpired) return null;

    const url = `${window.location.origin}/submit-review?token=${invite.token}`;

    return (
      <div className="flex justify-end">
        <button
          title="Copy invite link"
          onClick={() => copyToClipboard(url)}
          className="text-gray-700 hover:text-black"
        >
          <Copy size={16} />
        </button>
      </div>
    );
  };

  /* ===============================
   * RENDER
   * =============================== */
  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Review Invites</h1>
        <Button onClick={() => setShowModal(true)}>
          Invite reviewers
        </Button>
      </div>

      <Filters
        schema={[
          { type: "search", key: "search", placeholder: "Search email…" },
          {
            type: "select",
            key: "provider_id",
            placeholder: "Provider",
            options: Object.entries(providers).map(([id, name]) => ({
              value: id,
              label: name,
            })),
          },
          {
            type: "select",
            key: "status",
            placeholder: "Status",
            options: [
              { value: "pending", label: "Pending" },
              { value: "used", label: "Used" },
              { value: "expired", label: "Expired" },
            ],
          },
        ]}
        filters={filters}
        setFilters={setFilters}
      />

      {selected.length > 0 && (
        <div className="flex gap-4 bg-white border p-3 rounded-xl">
          <span className="text-sm">{selected.length} selected</span>
          <Button size="sm" variant="danger" onClick={bulkDelete}>
            Delete selected
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        data={rows}
        providers={items}
        selected={selected}
        setSelected={setSelected}
        actions={actions}
      />

      {showModal && (
        <Modal
          title="Invite Reviewers"
          onClose={() => {
            setShowModal(false);
            setGeneratedLinks([]);
          }}
        >
          <div className="space-y-4">
            <select
              multiple
              className="input w-full min-h-[140px]"
              value={providerIds}
              onChange={(e) =>
                setProviderIds(
                  Array.from(e.target.selectedOptions).map((o) => o.value)
                )
              }
            >
              {Object.entries(providers).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            <textarea
              className="input w-full min-h-[120px]"
              placeholder="Emails (comma or new line)"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />

            <Button
              onClick={sendInvite}
              disabled={!emails.trim() || !providerIds.length}
            >
              Send Invites
            </Button>

            {generatedLinks.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-medium">
                  Invite links (copy & share)
                </h4>

                {generatedLinks.map((l, i) => (
                  <div
                    key={i}
                    className="flex gap-3 bg-gray-50 border rounded-lg p-3 text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {providers[l.provider_id]}
                      </div>
                      <div className="truncate text-gray-500">
                        {l.url}
                      </div>
                      <div className="text-xs text-gray-400">
                        Expires on{" "}
                        {new Date(l.expires_at).toLocaleString()}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyToClipboard(l.url)}
                    >
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
