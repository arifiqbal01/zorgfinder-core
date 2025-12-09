import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import Filters from "../components/Filters";
import Modal from "../components/Modal";

const getNonce = () => window?.zorgFinderApp?.nonce || "";

const Clients = () => {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: "", language: "" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const headers = { "X-WP-Nonce": getNonce() };

  const fetchItems = async () => {
  let url = `/wp-json/wp/v2/users?roles=zf_client&_fields=id,name,email,meta,roles&per_page=${perPage}&page=${page}`;

  if (filters.search) url += `&search=${filters.search}`;
  if (filters.language) url += `&meta_key=language&meta_value=${filters.language}`;

  const res = await fetch(url, {
    headers: {
    "X-WP-Nonce": wpApiSettings.nonce
    },
    credentials: "same-origin"

  });

  const data = await res.json();

  setItems(Array.isArray(data) ? data : []);
  setTotal(parseInt(res.headers.get("X-WP-Total") || "0"));
};


  useEffect(() => {
    fetchItems();
  }, [page, perPage, filters]);

  const deleteClient = async (id) => {
  await fetch(`/wp-json/wp/v2/users/${id}?force=false`, {
    method: "DELETE",
    headers,
    credentials: "same-origin"
  });
  fetchItems();
};


  const columns = ["Name", "Email", "Phone", "Language"];

  const rows = items.map((u) => [
    u.name || "—",
    u.email || "—",
    u.meta?.phone || "—",
    u.meta?.language || "—",
  ]);

  const openItem = (u) => {
    setEditing(u);
    setShowModal(true);
  };

  return (
    <div className="p-2 space-y-6">
      <h1 className="text-2xl font-semibold">Clients</h1>

      <Filters
        schema={[
          { type: "search", key: "search", placeholder: "Search users…" },
          {
            type: "select",
            key: "language",
            placeholder: "Language",
            options: [
              { value: "en", label: "English" },
              { value: "nl", label: "Dutch" },
              { value: "fr", label: "French" },
            ]
          }
        ]}
        filters={filters}
        setFilters={setFilters}
      />

      <Table
        columns={columns}
        data={rows}
        providers={items}
        selected={selected}
        setSelected={setSelected}
        actions={(i) => {
          const u = items[i];
          return (
            <div className="flex items-center gap-3">
              <button onClick={() => openItem(u)} className="text-blue-600">
                View
              </button>
              <button onClick={() => deleteClient(u.id)} className="text-red-600">
                Delete
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
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          />
        }
      />

      {/* Modal */}
      {showModal && editing && (
        <Modal
          title={`Client #${editing.id}`}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        >
          <div className="space-y-4 text-sm">
            <div><strong>Name:</strong> {editing.name}</div>
            <div><strong>Email:</strong> {editing.email}</div>
            <div><strong>Phone:</strong> {editing.meta?.phone || "—"}</div>
            <div><strong>Language:</strong> {editing.meta?.language || "—"}</div>
            <div><strong>Role:</strong> {editing.roles?.join(", ")}</div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Clients;
