import SelectorPopover from "../../ui/SelectorPopover";
import { Stars } from "../../ui";

const OPTIONS = [1, 2, 3, 4, 5];

export default function StarRatingPicker({ value, onChange }) {
  return (
    <SelectorPopover
      value={value || "Rate"}
      options={OPTIONS}
      onChange={onChange}
      placement="top"
      renderLabel={(v) =>
        typeof v === "number" ? (
          <div className="flex items-center gap-1">
            <Stars value={v} size={16} />
            <span className="text-sm text-gray-600">
              {v}/5
            </span>
          </div>
        ) : (
          <span className="text-sm text-indigo-600">
            Select
          </span>
        )
      }
    />
  );
}
