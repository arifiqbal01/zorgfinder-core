import React, { useState, useMemo, useCallback } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Filters from "../../components/Filters";
import BulkActionsBar from "../../components/BulkActionsBar";
import ManagementControls from "../../components/ManagementControls";

import Button from "../../components/Button";
import { Eye, Plus } from "lucide-react";

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
    isLoaded,
    updateProviderField,
    updateReimbursementField,
    loadProvider,
    saveProvider,
    reset: resetProviderForm,
  } = useProviderForm(fetchProviders, closeModal);

  const [selected, setSelected] = useState([]);

  /* =======================
     BULK ACTIONS
  ======================== */
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected providers?`)) return;

    try {
      loadingOverlay.show("Deleting…");
      await Promise.all(
        selected.map((id) =>
          fetch(`/wp-json/zorg/v1/providers/${id}`, {
            method: "DELETE",
            headers: { "X-WP-Nonce": window.wpApiSettings?.nonce },
          })
        )
      );
      toast.success("Selected providers deleted");
      setSelected([]);
      fetchProviders();
    } catch {
      toast.error("Delete failed");
    } finally {
      loadingOverlay.hide();
    }
  };

  const handleBulkRestore = async () => {
    if (!confirm(`Restore ${selected.length} providers?`)) return;

    try {
      loadingOverlay.show("Restoring…");
      await Promise.all(
        selected.map((id) =>
          fetch(`/wp-json/zorg/v1/providers/${id}/restore`, {
            method: "PATCH",
            headers: { "X-WP-Nonce": window.wpApiSettings?.nonce },
          })
        )
      );
      toast.success("Providers restored");
      setSelected([]);
      fetchProviders();
    } catch {
      toast.error("Restore failed");
    } finally {
      loadingOverlay.hide();
    }
  };

  /* =======================
     FILTERS
  ======================== */
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

  /* =======================
     MODAL
  ======================== */
  const openModalForProvider = useCallback(
    async (providerId) => {
      try {
        loadingOverlay.show("Loading provider…");
        await loadProvider(providerId);
        setShowModal(true);
      } catch {
        toast.error("Failed to load provider");
      } finally {
        loadingOverlay.hide();
      }
    },
    [loadProvider]
  );

  const handleAddNew = () => {
    resetProviderForm();
    setShowModal(true);
  };

  /* =======================
     SAVE
  ======================== */
  const handleSave = useCallback(async () => {
    if (editingId && !isLoaded) {
      toast.error("Please wait, provider is still loading.");
      return;
    }

    try {
      loadingOverlay.show("Saving provider…");

      const payloadReimbursements = Object.entries(reimbursements)
        .map(([type, data]) => ({
          type,
          description: data.description?.trim() || "",
          coverage_details: data.coverage_details?.trim() || "",
        }))
        .filter((r) => r.description || r.coverage_details);

      if (!payloadReimbursements.length) {
        toast.error("At least one reimbursement type is required.");
        return;
      }

      await saveProvider(payloadReimbursements);
      toast.success(editingId ? "Provider updated" : "Provider created");
    } catch {
      toast.error("Save failed");
    } finally {
      loadingOverlay.hide();
    }
  }, [editingId, isLoaded, reimbursements, saveProvider]);

  /* =======================
     TABLE
  ======================== */
  const columns = [
    "Provider",
    "Type of Care",
    "Indication",
    "Organization",
    "Religion",
    "HKZ",
  ];

  const rows = providers.map((p) => [
    p.provider,
    p.type_of_care,
    p.indication_type,
    p.organization_type,
    p.religion,
    p.has_hkz ? "Yes" : "No",
  ]);

  const actionsRenderer = (index) => {
    const p = providers[index];
    return (
      <button
        className="text-blue-600"
        onClick={() => openModalForProvider(p.id)}
      >
        <Eye size={16} />
      </button>
    );
  };

  return (
    <div className="p-2 space-y-6">

      <ManagementControls
        title="Providers"
        sort={sort}
        setSort={setSort}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        extraRight={
          <Button onClick={handleAddNew}>
            <Plus size={16} className="mr-1" /> Add Provider
          </Button>
        }
      />

      <Filters schema={filterSchema} filters={filters} setFilters={setFilters} />

      <BulkActionsBar
        count={selected.length}
        onDelete={activeTab === "active" ? handleBulkDelete : undefined}
        onRestore={activeTab === "trash" ? handleBulkRestore : undefined}
        onClearSelection={() => setSelected([])}
        showDelete={activeTab === "active"}
        showRestore={activeTab === "trash"}
      />

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

      {showModal && (
        <Modal
          title={editingId ? `Edit Provider #${editingId}` : "Add Provider"}
          onClose={closeModal}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            <GeneralInfoForm
              provider={provider}
              updateProviderField={updateProviderField}
              editingId={editingId}
            />
            <ReimbursementAccordion
              list={reimbursements}
              updateType={updateReimbursementField}
            />
          </div>

          <div className="mt-8">
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={editingId && !isLoaded}
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
