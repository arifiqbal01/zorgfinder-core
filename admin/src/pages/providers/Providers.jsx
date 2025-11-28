import React, { useState, useCallback, useMemo } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Filters from "../../components/Filters";
import BulkActionsBar from "../../components/BulkActionsBar";

import Button from "../../components/Button";
import { Eye, Plus, Trash } from "lucide-react";

import GeneralInfoForm from "./GeneralInfoForm";
import ReimbursementAccordion from "./ReimbursementAccordion";

import { useProvidersList } from "./useProvidersList";
import { useProviderForm } from "./useProviderForm";

import { useToast } from "../../hooks/useToast";
import { useLoading } from "../../hooks/useLoading";

const Providers = () => {
  const toast = useToast();
  const loadingOverlay = useLoading();

  const {
    providers,
    total,
    filters,
    setFilters,
    sort,
    setSort,
    activeTab,
    setActiveTab,
    page,
    setPage,
    perPage,
    setPerPage,
    fetchProviders,
  } = useProvidersList();

  const [showModal, setShowModal] = useState(false);
  const closeModal = useCallback(() => setShowModal(false), []);

  const {
    provider,
    reimbursements,
    editingId,
    updateProviderField,
    updateReimbursementField,
    loadProvider,
    saveProvider,
    reset: resetProviderForm,
  } = useProviderForm(fetchProviders, closeModal);

  const [selected, setSelected] = useState([]);

  /* ---------------------------------------
     BULK DELETE (Active Tab)
  ---------------------------------------- */
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected providers?`)) return;

    try {
      loadingOverlay.show("Deleting…");

      await Promise.all(
        selected.map((id) =>
          fetch(`/wp-json/zorg/v1/providers/${id}`, {
            method: "DELETE",
            headers: { "X-WP-Nonce": window.wpApiSettings.nonce },
          })
        )
      );

      toast.success("Selected providers deleted");
      setSelected([]);
      fetchProviders();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      loadingOverlay.hide();
    }
  };

  /* ---------------------------------------
     BULK RESTORE (Trash Tab)
  ---------------------------------------- */
  const handleBulkRestore = async () => {
    if (!confirm(`Restore ${selected.length} providers?`)) return;

    try {
      loadingOverlay.show("Restoring…");

      await Promise.all(
        selected.map((id) =>
          fetch(`/wp-json/zorg/v1/providers/${id}/restore`, {
            method: "PATCH",
            headers: { "X-WP-Nonce": window.wpApiSettings.nonce },
          })
        )
      );

      toast.success("Providers restored");
      setSelected([]);
      fetchProviders();
    } catch (err) {
      toast.error("Restore failed");
    } finally {
      loadingOverlay.hide();
    }
  };

  /* ---------------------------------------
     FILTER SCHEMA
  ---------------------------------------- */
  const filterSchema = useMemo(
    () => [
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
    ],
    []
  );

  /* ---------------------------------------
     OPEN EDIT PROVIDER
  ---------------------------------------- */
  const openModalForProvider = useCallback(
    async (index) => {
      const row = providers[index];
      if (!row) return;

      setShowModal(true);

      try {
        loadingOverlay.show("Loading provider…");
        await loadProvider(row.id);
      } catch (err) {
        toast.error(err.message || "Failed to load provider");
      } finally {
        loadingOverlay.hide();
      }
    },
    [providers, loadProvider, toast, loadingOverlay]
  );

  /* ---------------------------------------
     ADD NEW PROVIDER
  ---------------------------------------- */
  const handleAddNew = () => {
    resetProviderForm();
    setShowModal(true);
  };

  /* ---------------------------------------
     SAVE PROVIDER
  ---------------------------------------- */
  const handleSave = useCallback(async () => {
    try {
      loadingOverlay.show("Saving provider…");

      const payloadReimbursements = Object.entries(reimbursements).map(
        ([type, data]) => ({
          type,
          description: data.description || "",
          coverage_details: data.coverage_details || "",
        })
      );

      await saveProvider(payloadReimbursements);

      toast.success("Provider saved successfully");
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      loadingOverlay.hide();
    }
  }, [reimbursements, saveProvider, toast, loadingOverlay]);

  /* ---------------------------------------
     BADGE SYSTEM
  ---------------------------------------- */
  const badge = (label, color) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );

  const badgeColors = {
    disability: "bg-blue-100 text-blue-700",
    GGZ: "bg-purple-100 text-purple-700",
    youth: "bg-pink-100 text-pink-700",
    elderly: "bg-orange-100 text-orange-700",
    PGB: "bg-green-100 text-green-700",
    ZIN: "bg-teal-100 text-teal-700",
    BV: "bg-yellow-100 text-yellow-700",
    Stichting: "bg-indigo-100 text-indigo-700",
    Islamic: "bg-emerald-100 text-emerald-700",
    Jewish: "bg-amber-100 text-amber-700",
    Christian: "bg-sky-100 text-sky-700",
    None: "bg-gray-100 text-gray-700",
  };

  /* ---------------------------------------
     TABLE
  ---------------------------------------- */
  const columns = [
    "Name",
    "Type of Care",
    "Indication",
    "Organization",
    "Religion",
    "HKZ",
  ];

  const rows = providers.map((p) => [
    p.name,
    badge(p.type_of_care, badgeColors[p.type_of_care] || "bg-gray-100"),
    badge(p.indication_type, badgeColors[p.indication_type] || "bg-gray-100"),
    badge(p.organization_type, badgeColors[p.organization_type] || "bg-gray-100"),
    badge(p.religion, badgeColors[p.religion] || "bg-gray-100"),
    Number(p.has_hkz) === 1
      ? badge("HKZ", "bg-green-100 text-green-700")
      : badge("No", "bg-gray-200 text-gray-600"),
  ]);

  const actionsRenderer = (i) => (
    <button className="text-blue-600" onClick={() => openModalForProvider(i)}>
      <Eye size={16} />
    </button>
  );

  /* ---------------------------------------
     RENDER
  ---------------------------------------- */
  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* LEFT */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Providers</h1>

          <Button variant="primary" size="md" onClick={handleAddNew}>
            <Plus size={16} className="mr-1" />
            Add Provider
          </Button>
        </div>

        {/* RIGHT: Toggle + Sort */}
        <div className="flex items-center gap-4">

          {/* Active/Trash */}
          <div className="flex bg-white shadow-sm rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "active"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab("trash")}
              className={`px-4 py-2 text-sm font-medium border-l ${
                activeTab === "trash"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Trash
            </button>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <label className="text-sm">Sort:</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input min-w-[140px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
          </div>

        </div>
      </div>

      {/* FILTERS */}
      <Filters schema={filterSchema} filters={filters} setFilters={setFilters} />

      {/* BULK ACTIONS */}
      <BulkActionsBar
        count={selected.length}
        onDelete={activeTab === "active" ? handleBulkDelete : undefined}
        onRestore={activeTab === "trash" ? handleBulkRestore : undefined}
        onClearSelection={() => setSelected([])}
        showDelete={activeTab === "active"}
        showRestore={activeTab === "trash"}
      />

      {/* TABLE */}
      <Table
        columns={columns}
        data={rows}
        providers={providers}
        actions={actionsRenderer}
        selected={selected}
        setSelected={setSelected}
        pagination={
          <Pagination
            page={page}
            perPage={perPage}
            total={total}
            onChange={setPage}
            onPerPageChange={(v) => {
              setPerPage(v);
              setPage(1);
            }}
          />
        }
      />

      {/* MODAL */}
      {showModal && (
        <Modal
          title={editingId ? `Edit Provider #${editingId}` : "Add Provider"}
          onClose={closeModal}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Provider Information
              </h2>
              <GeneralInfoForm
                provider={provider}
                updateProviderField={updateProviderField}
                editingId={editingId}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">
                Reimbursements
              </h2>
              <ReimbursementAccordion
                list={reimbursements}
                updateType={updateReimbursementField}
              />
            </div>
          </div>

          <div className="mt-10">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSave}
            >
              {editingId ? "Update Provider" : "Save Provider"}
            </Button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Providers;
