const ReimbursementsForm = ({ form, setForm }) => {
  return (
    <form className="space-y-6">

      {/* TYPE */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Type</label>
        <select
          value={form.type}
          className="input select"
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="">Select</option>
          <option value="WLZ">WLZ</option>
          <option value="ZVW">ZVW</option>
          <option value="WMO">WMO</option>
          <option value="Youth">Youth</option>
        </select>
      </div>

      {/* DESCRIPTION */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="textarea h-24"
        />
      </div>

      {/* COVERAGE DETAILS */}
      <div className="flex flex-col gap-1.5">
        <label className="label">Coverage Details</label>
        <textarea
          value={form.coverage_details}
          onChange={(e) => setForm({ ...form, coverage_details: e.target.value })}
          className="textarea h-24"
        />
      </div>

    </form>
  );
};

export default ReimbursementsForm;
