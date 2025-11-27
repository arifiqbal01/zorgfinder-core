const GeneralInfoForm = ({ form, setForm, editing }) => {
  return (
    <form className="space-y-2">
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
    </form>
  );
};

export default GeneralInfoForm;
