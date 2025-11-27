import React, { useState, useCallback, useMemo } from "react";
import Table from "../../components/Table";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import Filters from "../../components/Filters";

import Button from "../../components/Button"; // NEW REUSABLE BUTTON

import { Eye, Plus, Trash } from "lucide-react";

import GeneralInfoForm from "./GeneralInfoForm";
import ReimbursementAccordion from "./ReimbursementAccordion";

import { useProvidersList } from "./useProvidersList";
import { useProviderForm } from "./useProviderForm";
import { useReimbursements } from "./useReimbursements";

import { useToast } from "../../hooks/useToast";
import { useLoading } from "../../hooks/useLoading";

/* ---------------------------------------------------------
 * PROVIDERS PAGE
 * --------------------------------------------------------- */

const Providers = () => {
  const toast = useToast();
  const loadingOverlay = useLoading();

  /* LIST HOOK */
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
    loading,
    fetchProviders,
  } = useProvidersList();

  /* MODAL */
  const [showModal, setShowModal] = useState(false);
  const closeModal = useCallback(() => setShowModal(false), []);

  /* FORM HOOK */
  const {
    form,
    setForm,
    editing,
    loadProvider,
    saveProvider,
    reset: resetProviderForm,
  } = useProviderForm(fetchProviders, closeModal);

  /* REIMBURSEMENTS HOOK */
  const {
    list: reimburseList,
    updateType,
    loadForProvider,
    reset: resetReimbursements,
  } = useReimbursements();

  /* BULK ACTIONS */
  const [selected, setSelected] = useState([]);

  const toggleSelect = (index) => {
    const row = providers[index];
    if (!row) return;

    setSelected((prev) =>
      prev.includes(row.id)
        ? prev.filter((id) => id !== row.id)
        : [...prev, row.id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === providers.length) {
      setSelected([]);
    } else {
      setSelected(providers.map((p) => p.id));
    }
  };

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

  /* FILTER SCHEMA */
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

  /* ---------------------------------------------------------
   * OPEN EDIT MODAL
   * --------------------------------------------------------- */
  const openModalForProvider = useCallback(
    async (index) => {
      const row = providers[index];
      if (!row) return;

      try {
        loadingOverlay.show("Loading provider…");

        await loadProvider(row.id);
        await loadForProvider(row.id);

        setShowModal(true);
      } catch (err) {
        toast.error(err.message || "Failed to load provider");
      } finally {
        loadingOverlay.hide();
      }
    },
    [providers, loadProvider, loadForProvider, toast, loadingOverlay]
  );

  /* ---------------------------------------------------------
   * OPEN CREATE MODAL
   * --------------------------------------------------------- */
  const handleAddNew = () => {
    resetProviderForm();
    resetReimbursements();
    setShowModal(true);
  };

  /* ---------------------------------------------------------
   * SAVE PROVIDER
   * --------------------------------------------------------- */
  const handleSave = useCallback(async () => {
    const payloadReimbursements = Object.entries(reimburseList)
      .filter(([_, data]) => data !== null)
      .map(([type, data]) => ({
        type,
        description: data.description || "",
        coverage_details: data.coverage_details || "",
      }));

    try {
      loadingOverlay.show("Saving provider…");

      await saveProvider(payloadReimbursements);

      toast.success("Provider saved successfully");
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      loadingOverlay.hide();
    }
  }, [reimburseList, saveProvider, toast, loadingOverlay]);

  /* ---------------------------------------------------------
   * TABLE SETUP
   * --------------------------------------------------------- */
  const columns = ["Name", "Type of Care", "Email", "Phone", "Website", "Address"];
  const rows = providers.map((p) => [
    p.name,
    p.type_of_care,
    p.email,
    p.phone,
    p.website?.replace(/^https?:\/\//, ""),
    p.address,
  ]);

  const actionsRenderer = (i) => (
    <button className="text-blue-600" onClick={() => openModalForProvider(i)}>
      <Eye size={16} />
    </button>
  );

  /* ---------------------------------------------------------
   * RENDER PAGE
   * --------------------------------------------------------- */

  return (
    <div className="p-2 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        {/* LEFT: TITLE + ACTION BUTTONS */}
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Providers</h1>

          <Button variant="primary" size="md" onClick={handleAddNew}>
            <Plus size={16} className="mr-1" /> Add Provider
          </Button>

          {selected.length > 0 && (
            <Button
              variant="danger"
              size="md"
              onClick={handleBulkDelete}
            >
              <Trash size={16} className="mr-1" />
              Delete Selected ({selected.length})
            </Button>
          )}
        </div>

        {/* RIGHT: SORT + TABS */}
        <div className="flex items-center gap-3">
          <label className="text-sm">Sort:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>

          <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-1 rounded ${activeTab === "active" ? "bg-black text-white" : "bg-gray-100"}`}
            >
              Active
            </button>

            <button
              onClick={() => setActiveTab("trash")}
              className={`px-3 py-1 rounded ${activeTab === "trash" ? "bg-black text-white" : "bg-gray-100"}`}
            >
              Trash
            </button>
          </div>
        </div>

      </div>

      {/* FILTERS */}
      <Filters schema={filterSchema} filters={filters} setFilters={setFilters} />

      {/* TABLE */}
      <Table
        columns={columns}
        data={rows}
        providers={providers}
        actions={actionsRenderer}
        loading={loading}
        selected={selected}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
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
        <Modal title={editing ? `Edit Provider #${editing.id}` : "Add Provider"} onClose={closeModal}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">

            {/* LEFT — GENERAL INFO */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Provider Information</h2>
              <GeneralInfoForm form={form} setForm={setForm} editing={editing} />
            </div>

            {/* RIGHT — REIMBURSEMENTS */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Reimbursements</h2>

              <ReimbursementAccordion
                list={reimburseList}
                updateType={updateType}
              />
            </div>

          </div>

          <div className="mt-10">
            <Button variant="primary" size="lg" className="w-full" onClick={handleSave}>
              {editing ? "Update Provider" : "Save Provider"}
            </Button>
          </div>

        </Modal>
      )}

    </div>
  );
};

export default Providers;
