import Accordion from "../../components/Accordion";

const ReimbursementAccordion = ({ list, updateType }) => {
  const TYPES = {
    WLZ: "WLZ — Long-term Care",
    ZVW: "ZVW — Health Insurance",
    WMO: "WMO — Social Support",
    Youth: "Youth Care",
  };

  const items = Object.keys(TYPES).map((type) => {
    const item = list[type] || {};

    return {
      id: type,
      title: TYPES[type],
      checked: !!item.description || !!item.coverage_details,
      content: (
        <div className="space-y-4">
          <div>
            <label className="label">Description</label>
            <textarea
              className="textarea h-24"
              value={item.description || ""}
              onChange={(e) =>
                updateType(type, "description", e.target.value)
              }
            />
          </div>

          <div>
            <label className="label">Coverage Details</label>
            <textarea
              className="textarea h-24"
              value={item.coverage_details || ""}
              onChange={(e) =>
                updateType(type, "coverage_details", e.target.value)
              }
            />
          </div>
        </div>
      ),
    };
  });

  return (
    <Accordion
      items={items}
      showCheckbox={true}
      defaultOpen={["WLZ"]}
    />
  );
};

export default ReimbursementAccordion;
