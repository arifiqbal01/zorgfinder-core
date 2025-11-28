import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";
import ManagementControls from "../components/ManagementControls";
import { Eye } from "lucide-react";
import { useListManager } from "../hooks/useListManager";

const getNonce = () => window?.zorgFinderApp?.nonce || "";

const Favourites = () => {
  const [providers, setProviders] = useState([]);
  const [providerMap, setProviderMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  /* ---------------------------------------------------------
     USE LIST MANAGER (NO TRASH, NO DELETE)
  --------------------------------------------------------- */
  const {
    items,
    filters,
    setFilters,
    sort,
    setSort,
    page,
    setPage,
    perPage,
    setPerPage,
    total,
  } = useListManager(
    "/favourites",
    {
      search: "",
      provider_id: "",
      user_id: "",
    },
    true
  );

  const authHeaders = {
    "X-WP-Nonce": getNonce(),
  };

  /* ---------------------------------------------------------
     LOAD PROVIDERS + USERS
  --------------------------------------------------------- */
  useEffect(() => {
    // PROVIDERS
    (async () => {
      try {
        const res = await fetch(`/wp-json/zorg/v1/providers?per_page=999`, {
          headers: authHeaders,
        });
        const json = await res.json();

        if (json?.success) {
          const map = {};
          json.data.forEach((p) => (map[p.id] = p.name));
          setProviders(json.data);
          setProviderMap(map);
        }
      } catch {}
    })();

    // USERS
    (async () => {
      try {
        const res = await fetch(`/wp-json/wp/v2/users?per_page=100`, {
          headers: authHeaders,
        });
        const json = await res.json();

        if (Array.isArray(json)) {
          const map = {};
          json.forEach((u) => {
            map[u.id] =
              u.name || u.username || u.slug || `User #${u.id}`;
          });

          setUsersMap(map);
        }
      } catch {}
    })();
  }, []);

  /* ---------------------------------------------------------
     NORMALIZE — required because DB uses favourite_id
  --------------------------------------------------------- */
  const normalized = items.map((it) => ({
    ...it,
    id: it.favourite_id,
  }));

  /* ---------------------------------------------------------
     PROVIDER FILTER OPTIONS
  --------------------------------------------------------- */
  const filteredProviders = providers.filter((p) =>
    normalized.some((i) => i.provider_id === p.id)
  );

  /* ---------------------------------------------------------
     TABLE CONFIG (NO SELECT CHECKBOXES)
  --------------------------------------------------------- */
  const columns = ["Provider", "User", "Added"];

  const rows = normalized.map((it) => [
    providerMap[it.provider_id] || it.provider_name || "-",
    usersMap[it.user_id] || it.user_name || "-",
    it.created_at,
  ]);

  /* ---------------------------------------------------------
     FILTER SCHEMA (GDPR-SAFE)
  --------------------------------------------------------- */
  const filterSchema = [
    { type: "search", key: "search", placeholder: "Search by provider/user…" },

    {
      type: "select",
      key: "provider_id",
      placeholder: "Provider",
      options: filteredProviders.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    },

    {
      type: "select",
      key: "user_id",
      placeholder: "User",
      options: Object.entries(usersMap).map(([id, name]) => ({
        value: id,
        label: name,
      })),
    },
  ];

  /* ---------------------------------------------------------
     OPEN MODAL
  --------------------------------------------------------- */
  const openFavourite = (item) => {
    setEditing(item);
    setShowModal(true);
  };

  /* ---------------------------------------------------------
     RENDER
  --------------------------------------------------------- */
  return (
    <div className="p-2 space-y-6">

      {/* HEADER (no Trash toggle) */}
      <ManagementControls
        title="Favourites"
        sort={sort}
        setSort={setSort}
        activeTab={"active"}     // Always active
        setActiveTab={() => {}}  // Disabled
        hideTabs={true}          // You will add this prop
      />

      {/* FILTERS */}
      <Filters schema={filterSchema} filters={filters} setFilters={setFilters} />

      {/* TABLE — NO CHECKBOXES, NO DELETE */}
      <Table
        columns={columns}
        data={rows}
        providers={normalized}
        selected={[]}          // No selection
        setSelected={() => {}} // Disabled
        hideCheckboxes={true}  // You will add this prop to Table.jsx
        actions={(i) => {
          const it = normalized[i];
          return (
            <div className="flex items-center gap-3">

              {/* Only view button */}
              <button
                onClick={() => openFavourite(it)}
                className="text-blue-600"
              >
                <Eye size={16} />
              </button>
            </div>
          );
        }}
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
      {showModal && editing && (
        <Modal
          title={`Favourite #${editing.id}`}
          onClose={() => {
            setEditing(null);
            setShowModal(false);
          }}
        >
          <div className="space-y-4 text-sm">
            <div>
              <strong>Provider:</strong>
              <div>{providerMap[editing.provider_id] || editing.provider_name}</div>
            </div>

            <div>
              <strong>User:</strong>
              <div>{usersMap[editing.user_id] || editing.user_name}</div>
            </div>

            <div>
              <strong>Added:</strong>
              <div>{editing.created_at}</div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default Favourites;
