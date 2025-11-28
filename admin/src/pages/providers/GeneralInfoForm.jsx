const GeneralInfoForm = ({ provider, updateProviderField, editingId }) => {
  return (
    <form className="space-y-2">

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
        <span><strong>ID:</strong> {editingId || "New"}</span>

        {editingId && (
          <>
            <span><strong>Created:</strong> {provider.created_at}</span>
            <span><strong>Updated:</strong> {provider.updated_at}</span>
          </>
        )}
      </div>

      {/* Name + Slug */}
      <div className="form-grid-2 gap-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="label">Name</label>
          <input
            value={provider.name}
            onChange={(e) => updateProviderField("name", e.target.value)}
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Slug</label>
          <input
            value={provider.slug}
            onChange={(e) => updateProviderField("slug", e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Care / Indication */}
      <div className="form-grid-2 gap-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="label">Type of Care</label>
          <select
            value={provider.type_of_care}
            className="input select"
            onChange={(e) => updateProviderField("type_of_care", e.target.value)}
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
            value={provider.indication_type}
            className="input select"
            onChange={(e) =>
              updateProviderField("indication_type", e.target.value)
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
            value={provider.organization_type}
            className="input select"
            onChange={(e) =>
              updateProviderField("organization_type", e.target.value)
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
            value={provider.religion}
            className="input select"
            onChange={(e) =>
              updateProviderField("religion", e.target.value)
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
          checked={!!provider.has_hkz}
          onChange={(e) =>
            updateProviderField("has_hkz", e.target.checked ? 1 : 0)
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
            value={provider.email}
            onChange={(e) => updateProviderField("email", e.target.value)}
            className="input"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="label">Phone</label>
          <input
            value={provider.phone}
            onChange={(e) => updateProviderField("phone", e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Website */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Website</label>
        <input
          value={provider.website}
          onChange={(e) => updateProviderField("website", e.target.value)}
          className="input"
        />
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Address</label>
        <textarea
          value={provider.address}
          onChange={(e) =>
            updateProviderField("address", e.target.value)
          }
          className="textarea h-24"
        />
      </div>

    </form>
  );
};

export default GeneralInfoForm;
