import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { Eye } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import Filters from "../components/Filters";

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const CACHE_TTL = 10 * 60 * 1000;

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

  const [filters, setFilters] = useState({
    search: "",
    type_of_care: "",
    indication_type: "",
    organization_type: "",
    religion: "",
    has_hkz: "",
  });

  // PAGINATION
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

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

  // ================================
  // FETCH SINGLE PROVIDER
  // ================================
  const fetchProviderById = async (id) => {
    const res = await fetch(`/wp-json/zorg/v1/providers/${id}`);
    const json = await res.json();
    return json?.data || {};
  };

  // ================================
  // FETCH PROVIDERS LIST (PAGINATED)
  // ================================
  const fetchProviders = async () => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "") params.append(k, v);
    });

    params.append("page", page);
    params.append("per_page", perPage);

    const url = `/wp-json/zorg/v1/providers?${params.toString()}`;
    const cacheKey = "providers_" + params.toString();

    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const expired = Date.now() - parsed.time > CACHE_TTL;

      if (!expired) {
        setProviders(parsed.data || []);
        setTotal(parsed.total || 0);
        return;
      }
    }

    const res = await fetch(url);
    const json = await res.json();

    setProviders(json.data || []);
    setTotal(json.total || 0);

    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        time: Date.now(),
        data: json.data || [],
        total: json.total || 0,
      })
    );
  };

  useEffect(() => {
    fetchProviders();
  }, [filters, page, perPage]);

  // ================================
  // TABLE COLUMNS
  // ================================
  const columns = ["Name", "Type of Care", "Email", "Phone", "Website", "Address"];

  const data = providers.map((p) => [
    <div className="flex items-center gap-3 w-full truncate">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium">
        {p.name?.charAt(0)}
      </div>
      <span className="font-medium text-gray-800 truncate">{p.name}</span>
    </div>,
    <span className="truncate">{p.type_of_care}</span>,
    <a className="text-blue-600 truncate">{p.email}</a>,
    <span className="truncate">{p.phone}</span>,
    <a className="text-blue-600 truncate">
      {p.website?.replace(/^https?:\/\//, "")}
    </a>,
    <span className="truncate">{p.address}</span>,
  ]);

  // ================================
  // SAVE HANDLER
  // ================================
  const handleSave = async (e) => {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `/wp-json/zorg/v1/providers/${editing.id}`
      : `/wp-json/zorg/v1/providers`;

    const payload = { ...form, has_hkz: form.has_hkz ? 1 : 0 };

    const result = await useFetch(url, { method, body: JSON.stringify(payload) });

    if (!result.ok) {
      alert("Failed to save provider");
      return;
    }

    Object.keys(localStorage)
      .filter((k) => k.startsWith("providers_"))
      .forEach((k) => localStorage.removeItem(k));

    setShowModal(false);
    setEditing(null);
    fetchProviders();
  };

  // ================================
  // RENDER
  // ================================
  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
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

      {/* FILTERS */}
      <Filters schema={providerFilterSchema} filters={filters} setFilters={setFilters} />

      {/* TABLE with pagination INSIDE */}
      <Table
  columns={columns}
  data={data}
  providers={providers}
  selected={selectedIds}
  setSelected={setSelectedIds}
  actions={(i) => (
    <button
      onClick={async () => {
        const full = await fetchProviderById(providers[i].id);

        setEditing(full);
        setForm({
          ...full,
          has_hkz: full.has_hkz ? 1 : 0,
        });

        setShowModal(true);
      }}
      className="text-blue-600 hover:text-blue-800"
    >
      <Eye size={16} />
    </button>
  )}
  pagination={
    <Pagination
      page={page}
      perPage={perPage}
      total={total}
      onChange={(newPage) => setPage(newPage)}
      onPerPageChange={(newPerPage) => {
        setPerPage(newPerPage);
        setPage(1); // reset to page 1 when page size changes
      }}
    />
  }
/>


      {/* MODAL */}
      {showModal && (
        <Modal
          title={editing ? "Edit Provider" : "Add Provider"}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
            setForm(emptyForm);
          }}
        >
          {/* FORM INSIDE MODAL */}
          {/* unchanged — your full form remains untouched */}
          {/** keeping your full form code as-is */}
          <>
            <form onSubmit={handleSave} className="space-y-6">

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
                <span><strong>ID:</strong> {form.id || "New"}</span>
                {editing && (
                  <>
                    <span><strong>Created:</strong> {form.created_at}</span>
                    <span><strong>Updated:</strong> {form.updated_at}</span>
                  </>
                )}
              </div>

              {/* Name + Slug */}
              <div className="form-grid-2 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="label">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="label">Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Care / Indication */}
              <div className="form-grid-2 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="label">Type of Care</label>
                  <select
                    value={form.type_of_care}
                    className="input select"
                    onChange={(e) =>
                      setForm({ ...form, type_of_care: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option value="disability">Disability</option>
                    <option value="GGZ">GGZ</option>
                    <option value="youth">Youth</option>
                    <option value="elderly">Elderly</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="label">Indication Type</label>
                  <select
                    value={form.indication_type}
                    className="input select"
                    onChange={(e) =>
                      setForm({ ...form, indication_type: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option value="PGB">PGB</option>
                    <option value="ZIN">ZIN</option>
                  </select>
                </div>
              </div>

              {/* Org / Religion */}
              <div className="form-grid-2 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="label">Organization</label>
                  <select
                    value={form.organization_type}
                    className="input select"
                    onChange={(e) =>
                      setForm({ ...form, organization_type: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option value="BV">BV</option>
                    <option value="Stichting">Stichting</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="label">Religion</label>
                  <select
                    value={form.religion}
                    className="input select"
                    onChange={(e) =>
                      setForm({ ...form, religion: e.target.value })
                    }
                  >
                    <option value="">Select</option>
                    <option value="Islamic">Islamic</option>
                    <option value="Jewish">Jewish</option>
                    <option value="Christian">Christian</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              {/* HKZ */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={!!form.has_hkz}
                  onChange={(e) =>
                    setForm({ ...form, has_hkz: e.target.checked ? 1 : 0 })
                  }
                  className="checkbox"
                />
                <label className="label !mb-0">Has HKZ Certification</label>
              </div>

              {/* Email / Phone */}
              <div className="form-grid-2 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="label">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="label">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="flex flex-col gap-1.5">
                <label className="label">Website</label>
                <input
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  className="input"
                />
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5">
                <label className="label">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="textarea h-24"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </form>
          </>
        </Modal>
      )}

    </div>
  );
};

export default Providers;
