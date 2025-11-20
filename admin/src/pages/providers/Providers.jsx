import React, { useState, useEffect } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { Eye } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import Filters from "../../components/Filters";

import GeneralInfoForm from "./GeneralInfoForm";
import ReimbursementsForm from "./ReimbursementsForm";
import { useReimbursementForm } from "./useReimbursementForm";

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("general");

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

  // ❗ ADD BACK FILTERS
  const [filters, setFilters] = useState({
    search: "",
    type_of_care: "",
    indication_type: "",
    organization_type: "",
    religion: "",
    has_hkz: "",
  });

  // Hook for reimbursements
  const reimburse = useReimbursementForm(editing?.id);

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
  // FETCH PROVIDERS LIST
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
  const columns = [
    "Name",
    "Type of Care",
    "Email",
    "Phone",
    "Website",
    "Address",
  ];

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
  // SAVE PROVIDER
  // ================================
 const handleSave = async (e) => {
  e.preventDefault();

  const method = editing ? "PUT" : "POST";
  const url = editing
    ? `/wp-json/zorg/v1/providers/${editing.id}`
    : `/wp-json/zorg/v1/providers`;

  const payload = { ...form, has_hkz: form.has_hkz ? 1 : 0 };

  const res = await fetch(url, {
  method,
  headers: {
    "Content-Type": "application/json",
    "X-WP-Nonce": window.wpApiSettings.nonce,   // ← FIXED AUTH
  },
  body: JSON.stringify(payload),
});


  // DEBUG ─── print everything
  const text = await res.text();
  console.log("=== PROVIDER SAVE RESPONSE ===");
  console.log("Status:", res.status);
  console.log("Body:", text);

  if (!res.ok) {
    alert("Failed to save provider");
    return;
  }

  const json = JSON.parse(text);
  let providerData = editing || json.data;

  if (!editing) {
    setEditing(providerData);
    reimburse.setProviderId(providerData.id);
  }

  setTab("reimburse");
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
            reimburse.setProviderId(null);
            reimburse.setForm({
              type: "",
              description: "",
              coverage_details: "",
            });
            setTab("general");
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm"
        >
          + Add Provider
        </button>
      </div>

      {/* FILTERS */}
      <Filters
        schema={providerFilterSchema}
        filters={filters}
        setFilters={setFilters}
      />

      {/* TABLE */}
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
              setForm({ ...full, has_hkz: full.has_hkz ? 1 : 0 });
              reimburse.setProviderId(full.id);

              setTab("general");
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
              setPage(1);
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
            setTab("general");
          }}
        >
          {/* TABS */}
          <div className="border-b mb-4 flex gap-4">
            <button
              className={tab === "general" ? "active-tab" : "tab"}
              onClick={() => setTab("general")}
            >
              General Info
            </button>

            <button
              disabled={!editing?.id}
              className={
                editing?.id
                  ? tab === "reimburse"
                    ? "active-tab"
                    : "tab"
                  : "tab opacity-50 cursor-not-allowed"
              }
              onClick={() => editing?.id && setTab("reimburse")}
            >
              Reimbursements
            </button>
          </div>

          {/* GENERAL INFO TAB */}
          {tab === "general" && (
            <>
              <GeneralInfoForm
                form={form}
                setForm={setForm}
                editing={editing}
              />

              <button
                onClick={handleSave}
                className="btn btn-primary mt-6"
              >
                {editing ? "Update Provider" : "Save Provider"}
              </button>
            </>
          )}

          {/* REIMBURSEMENTS TAB */}
          {tab === "reimburse" && (
            <div className="space-y-6">
              <ReimbursementsForm
                form={reimburse.form}
                setForm={reimburse.setForm}
              />

              <button
                onClick={reimburse.saveReimbursement}
                className="btn btn-primary"
              >
                Add Reimbursement
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Providers;
