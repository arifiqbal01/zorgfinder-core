import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Eye, Trash2 } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import Filters from "../components/Filters";

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // Form
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

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    type_of_care: "",
    indication_type: "",
    organization_type: "",
    religion: "",
    has_hkz: "",
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Filter Schema
  const providerFilterSchema = [
    { type: "search", key: "search", placeholder: "Search providers…" },
    {
      type: "select",
      key: "type_of_care",
      placeholder: "Type of care",
      options: [
        { value: "disability", label: "Disability" },
        { value: "GGZ", label: "GGZ" },
        { value: "youth", label: "Youth" },
        { value: "elderly", label: "Elderly" },
      ],
    },
    {
      type: "select",
      key: "indication_type",
      placeholder: "Indication",
      options: [
        { value: "PGB", label: "PGB" },
        { value: "ZIN", label: "ZIN" },
      ],
    },
    {
      type: "select",
      key: "organization_type",
      placeholder: "Organization",
      options: [
        { value: "BV", label: "BV" },
        { value: "Stichting", label: "Stichting" },
      ],
    },
    {
      type: "select",
      key: "religion",
      placeholder: "Religion",
      options: [
        { value: "Islamic", label: "Islamic" },
        { value: "Jewish", label: "Jewish" },
        { value: "Christian", label: "Christian" },
        { value: "None", label: "None" },
      ],
    },
    { type: "checkbox", key: "has_hkz", label: "HKZ Only" },
  ];

  // Fetch Providers
  const fetchProviders = async () => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "") params.append(key, value);
    });

    params.append("page", page);
    params.append("per_page", perPage);

    const res = await fetch(`/wp-json/zorg/v1/providers?${params.toString()}`);
    const json = await res.json();

    setProviders(json.data || []);
    setTotal(json.total || 0);
  };

  useEffect(() => {
    fetchProviders();
  }, [filters, page]);

  // Columns
  const columns = ["Name", "Type of Care", "Email", "Phone", "Website", "Address"];

  // ✅ FIXED DATA CELLS — fully constrained, no width breaking
  const data = providers.map((p) => [
    // NAME
    <div className="flex items-center gap-3 w-full overflow-hidden truncate">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center text-blue-700 font-medium">
        {p.name?.charAt(0)}
      </div>
      <span className="font-medium text-gray-800 overflow-hidden truncate">
        {p.name}
      </span>
    </div>,

    // TYPE OF CARE
    <span className="block w-full truncate">{p.type_of_care}</span>,

    // EMAIL
    <a
      href={`mailto:${p.email}`}
      className="block w-full text-blue-600 hover:underline truncate"
    >
      {p.email}
    </a>,

    // PHONE
    <span className="block w-full truncate">{p.phone}</span>,

    // WEBSITE
    <a
      href={p.website}
      className="block w-full text-blue-600 hover:underline truncate"
    >
      {p.website?.replace(/^https?:\/\//, "")}
    </a>,

    // ADDRESS
    <span className="block w-full truncate text-gray-600">{p.address}</span>,
  ]);

  // Save Provider
  const handleSave = async (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `/wp-json/zorg/v1/providers/${editing.id}`
      : `/wp-json/zorg/v1/providers`;

    const payload = { ...form, has_hkz: form.has_hkz ? 1 : 0 };

    const result = await useFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (!result.ok) {
      alert("Failed to save provider");
      return;
    }

    setShowModal(false);
    setEditing(null);
    fetchProviders();
  };

  // Delete Single
  const handleDelete = async (id) => {
    if (!confirm("Delete this provider?")) return;

    await useFetch(`/wp-json/zorg/v1/providers/${id}`, { method: "DELETE" });
    fetchProviders();
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} providers?`)) return;

    for (const id of selectedIds) {
      await useFetch(`/wp-json/zorg/v1/providers/${id}`, { method: "DELETE" });
    }

    setSelectedIds([]);
    fetchProviders();
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
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

      {/* Filters */}
      <Filters schema={providerFilterSchema} filters={filters} setFilters={setFilters} />

      {/* Bulk Delete */}
      {selectedIds.length > 0 && (
        <button
          onClick={handleBulkDelete}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm"
        >
          Delete Selected ({selectedIds.length})
        </button>
      )}

      {/* Table */}
      <Table
        columns={columns}
        data={data}
        providers={providers}
        selected={selectedIds}
        setSelected={setSelectedIds}
        actions={(index) => (
          <div className="flex gap-3 items-center">

            <button
              onClick={() => {
                setEditing(providers[index]);
                setForm({
                  ...providers[index],
                  has_hkz: providers[index].has_hkz ? 1 : 0,
                });
                setShowModal(true);
              }}
              className="text-blue-600 hover:text-blue-800 p-1"
            >
              <Eye size={16} />
            </button>

            <button
              onClick={() => handleDelete(providers[index].id)}
              className="text-red-500 hover:text-red-700 p-1 rounded"
            >
              <Trash2 size={14} />
            </button>

          </div>
        )}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        perPage={perPage}
        total={total}
        onChange={(newPage) => setPage(newPage)}
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
          {/* form unchanged */}
        </Modal>
      )}
    </div>
  );
};

export default Providers;
