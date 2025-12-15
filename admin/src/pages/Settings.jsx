import { useEffect, useState } from "react";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";

const getNonce = () => window?.zorgFinderApp?.nonce || "";

export default function Settings() {
  const [pages, setPages] = useState([]);
  const [settings, setSettings] = useState({
    compare_page_id: "",
  });
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  /* ---------------- Load data (NO global loading) ---------------- */

  useEffect(() => {
    const load = async () => {
      try {
        // Pages
        const pagesRes = await fetch("/wp-json/wp/v2/pages?per_page=100", {
          headers: { "X-WP-Nonce": getNonce() },
        });
        const pagesJson = await pagesRes.json();
        setPages(Array.isArray(pagesJson) ? pagesJson : []);

        // Settings
        const res = await fetch("/wp-json/zorg/v1/settings", {
          headers: { "X-WP-Nonce": getNonce() },
        });
        const json = await res.json();

        if (json?.data) {
          setSettings(json.data);
        }
      } catch {
        toast.error("Failed to load settings");
      }
    };

    load();
  }, []);

  /* ---------------- Save (inline feedback only) ---------------- */

  const save = async () => {
    try {
      setSaving(true);

      const res = await fetch("/wp-json/zorg/v1/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": getNonce(),
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* ================= Compare ================= */}
      <section className="space-y-4 bg-white p-4 rounded-xl border">
        <h2 className="text-lg font-medium">Comparison</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Compare Page
          </label>

          <select
            className="input w-full"
            value={settings.compare_page_id || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                compare_page_id: e.target.value,
              }))
            }
          >
            <option value="">— Select page —</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title.rendered}
              </option>
            ))}
          </select>

          <p className="text-xs text-gray-500">
            This page will be used for provider comparison.
            Users can only access it via the Providers compare flow.
          </p>
        </div>
      </section>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
