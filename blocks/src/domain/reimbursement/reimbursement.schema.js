export const ReimbursementSchema = {
  id: { type: "number" },

  provider_id: { type: "number" },

  type: {
    type: "enum",
    labelKey: "reimbursement.type",
  },

  description: {
    type: "string",
    labelKey: "reimbursement.description",
  },

  coverage_details: {
    type: "string",
    labelKey: "reimbursement.coverage",
  },
};
