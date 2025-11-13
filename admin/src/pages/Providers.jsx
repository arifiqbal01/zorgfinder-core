import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type_of_care: "",
    email: "",
    phone: "",
    website: "",
    address: "",
  });

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

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `/wp-json/zorg/v1/providers/${editing.id}`
      : `/wp-json/zorg/v1/providers`;
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setEditing(null);
    fetchProviders();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this provider?")) return;
    await fetch(`/wp-json/zorg/v1/providers/${id}`, { method: "DELETE" });
    fetchProviders();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Providers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
        >
          + Add Provider
        </button>
      </div>

      <Table
        columns={columns}
        data={data}
        actions={(index) => (
          <>
            <button
              onClick={() => {
                setEditing(providers[index]);
                setForm(providers[index]);
                setShowModal(true);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDelete(providers[index].id)}
              className="text-red-500 hover:text-red-700"
            >
              🗑️
            </button>
          </>
        )}
      />

      {showModal && (
        <Modal
          title={editing ? "Edit Provider" : "Add Provider"}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-300 rounded-md w-full p-2"
                required
              />
              <input
                type="text"
                placeholder="Type of Care"
                value={form.type_of_care || ""}
                onChange={(e) =>
                  setForm({ ...form, type_of_care: e.target.value })
                }
                className="border border-gray-300 rounded-md w-full p-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="border border-gray-300 rounded-md w-full p-2"
              />
              <input
                type="text"
                placeholder="Phone"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="border border-gray-300 rounded-md w-full p-2"
              />
              <input
                type="url"
                placeholder="Website"
                value={form.website || ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="border border-gray-300 rounded-md w-full p-2"
              />
            </div>
            <textarea
              placeholder="Address"
              value={form.address || ""}
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
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
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
