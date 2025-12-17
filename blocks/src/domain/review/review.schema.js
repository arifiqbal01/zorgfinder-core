export const ReviewSchema = {
  provider_id: { type: "number" },

  rating_overall: {
    type: "number",
    labelKey: "review.overall",
  },

  rating_staff: {
    type: "number",
    labelKey: "review.staff",
  },

  rating_communication: {
    type: "number",
    labelKey: "review.communication",
  },

  rating_cleanliness: {
    type: "number",
    labelKey: "review.cleanliness",
  },

  rating_facilities: {
    type: "number",
    labelKey: "review.facilities",
  },

  rating_professionalism: {
    type: "number",
    labelKey: "review.professionalism",
  },

  comment: {
    type: "string",
    labelKey: "review.comment",
  },

  approved: {
    type: "boolean",
  },
};
