import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { Eye, Trash2 } from "lucide-react";
import { useFetch } from "../hooks/useFetch";

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = {
    name: "",
    slug: "",
    type_of_care: "",
    indication_type: "",
    organization_type: "",
    religion: "",
    has_hkz: 0,
    email: "",
    phone: "",
    website: "",
    address: "",
  };

  const [form, setForm] = useState(emptyForm);

  const fetchProviders = async () => {
    const res = await fetch("/wp-json/zorg/v1/providers");
    const json = await res.json();
    setProviders(json.data || []);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const columns = [
    "Name",
    "Type of Care",
    "Email",
    "Phone",
    "Website",
    "Address",
  ];

  const data = providers.map((p) => [
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium">
        {p.name?.charAt(0)}
      </div>
      <span className="font-medium text-gray-800">{p.name}</span>
    </div>,
    p.type_of_care,
    <a href={`mailto:${p.email}`} className="text-blue-600 hover:underline">
      {p.email}
    </a>,
    p.phone,
    <a href={p.website} className="text-blue-600 hover:underline">
      {p.website?.replace(/^https?:\/\//, "")}
    </a>,
    <span className="truncate max-w-[200px] text-gray-600">{p.address}</span>,
  ]);

  // SAVE (POST or PUT)
  const handleSave = async (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `/wp-json/zorg/v1/providers/${editing.id}`
      : `/wp-json/zorg/v1/providers`;

    const payload = {
      ...form,
      has_hkz: form.has_hkz ? 1 : 0,
    };

    const result = await useFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      alert("Failed to save provider");
      console.error(result);
      return;
    }

    setShowModal(false);
    setEditing(null);
    fetchProviders();
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Delete this provider?")) return;

    const result = await useFetch(`/wp-json/zorg/v1/providers/${id}`, {
      method: "DELETE",
    });

    if (!result.ok) {
      alert("Failed to delete");
      return;
    }

    fetchProviders();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Providers</h1>

        <button
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
        >
          + Add Provider
        </button>
      </div>

      <Table
        columns={columns}
        data={data}
        actions={(index) => (
          <div className="flex gap-3 items-center">

            {/* Edit using Eye icon */}
            <button
              onClick={() => {
                setEditing(providers[index]);
                setForm({
                  ...providers[index],
                  has_hkz: providers[index].has_hkz ? 1 : 0,
                });
                setShowModal(true);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              <Eye size={18} />
            </button>

            {/* Delete */}
            <button
              onClick={() => handleDelete(providers[index].id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      />

      {/* Modal */}
      {showModal && (
        <Modal
          title={editing ? "Edit Provider" : "Add Provider"}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleSave} className="space-y-4">

            {/* Fields */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-300 rounded-md p-2"
                required
              />

              <input
                type="text"
                placeholder="Slug (optional)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="border border-gray-300 rounded-md p-2"
              />

              {/* ENUM Fixed */}
              <select
                value={form.type_of_care}
                onChange={(e) =>
                  setForm({ ...form, type_of_care: e.target.value })
                }
                className="border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Type of Care</option>
                <option value="disability">Disability</option>
                <option value="GGZ">GGZ</option>
                <option value="youth">Youth</option>
                <option value="elderly">Elderly</option>
              </select>

              {/* ENUM */}
              <select
                value={form.indication_type}
                onChange={(e) =>
                  setForm({ ...form, indication_type: e.target.value })
                }
                className="border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Indication Type</option>
                <option value="PGB">PGB</option>
                <option value="ZIN">ZIN</option>
              </select>

              <select
                value={form.organization_type}
                onChange={(e) =>
                  setForm({ ...form, organization_type: e.target.value })
                }
                className="border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Organization</option>
                <option value="BV">BV</option>
                <option value="Stichting">Stichting</option>
              </select>

              <select
                value={form.religion}
                onChange={(e) =>
                  setForm({ ...form, religion: e.target.value })
                }
                className="border border-gray-300 rounded-md p-2"
              >
                <option value="">Select Religion</option>
                <option value="Islamic">Islamic</option>
                <option value="Jewish">Jewish</option>
                <option value="Christian">Christian</option>
                <option value="None">None</option>
              </select>

              {/* HKZ */}
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.has_hkz == 1}
                  onChange={(e) =>
                    setForm({ ...form, has_hkz: e.target.checked ? 1 : 0 })
                  }
                />
                HKZ Certified
              </label>

              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="border border-gray-300 rounded-md p-2"
              />

              <input
                type="text"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="border border-gray-300 rounded-md p-2"
              />

              <input
                type="url"
                placeholder="Website"
                value={form.website}
                onChange={(e) =>
                  setForm({ ...form, website: e.target.value })
                }
                className="border border-gray-300 rounded-md p-2"
              />
            </div>

            <textarea
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="border border-gray-300 rounded-md p-2 w-full"
              rows="3"
            />

            <div className="flex justify-end gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditing(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white"
              >
                {editing ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Providers;
