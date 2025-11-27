import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";

/**
 * Reusable Accordion Component
 *
 * Props:
 *  - items: [
 *      {
 *         id: "WLZ",
 *         title: "WLZ — Long-term Care",
 *         checked: true/false,
 *         content: <Your JSX />
 *      }
 *    ]
 *  - defaultOpen: array (but only first is used for one-at-a-time mode)
 *  - showCheckbox: boolean
 */

const Accordion = ({
  items = [],
  defaultOpen = [],
  showCheckbox = false,
}) => {
  // Only one ID can be open at a time
  const [openId, setOpenId] = useState(defaultOpen?.[0] || null);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className="border rounded-xl bg-white shadow-sm overflow-hidden"
          >
            {/* HEADER */}
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="
                w-full flex items-center justify-between
                p-4 text-left
                hover:bg-gray-50 transition
              "
            >
              <div className="flex items-center gap-3">
                {/* Optional Checkbox */}
                {showCheckbox && (
                  <div
                    className={`
                      h-5 w-5 rounded border 
                      flex items-center justify-center
                      ${
                        item.checked
                          ? "bg-blue-600 border-blue-600"
                          : "bg-white border-gray-300"
                      }
                    `}
                  >
                    {item.checked && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                )}

                <span className="font-medium text-gray-800">
                  {item.title}
                </span>
              </div>

              <div className="text-gray-500">
                {isOpen ? <ChevronDown /> : <ChevronRight />}
              </div>
            </button>

            {/* CONTENT */}
            {isOpen && (
              <div className="p-4 bg-gray-50 animate-fadeIn">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
