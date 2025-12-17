export const ProviderSchema = {
  id: { type: "number" },

  provider: {
    type: "string",
    labelKey: "provider.name",
  },

  slug: { type: "string" },

  type_of_care: {
    type: "enum",
    labelKey: "provider.type_of_care",
  },

  indication_type: {
    type: "enum",
    labelKey: "provider.indication_type",
  },

  organization_type: {
    type: "enum",
    labelKey: "provider.organization_type",
  },

  religion: {
    type: "enum",
    labelKey: "provider.religion",
    optional: true,
  },

  has_hkz: {
    type: "boolean",
    labelKey: "provider.hkz",
  },

  target_genders: {
    type: "array",
    labelKey: "provider.target_genders",
  },

  target_age_groups: {
    type: "array",
    labelKey: "provider.target_age_groups",
  },

  address: {
    type: "string",
    labelKey: "provider.address",
  },

  email: {
    type: "string",
    labelKey: "provider.email",
  },

  phone: {
    type: "string",
    labelKey: "provider.phone",
  },

  website: {
    type: "string",
    labelKey: "provider.website",
  },

  logo: {
    type: "string",
    optional: true,
  },

  reviews: {
    type: "object",
    labelKey: "provider.reviews",
    fields: {
      overall: { labelKey: "review.overall" },
      staff: { labelKey: "review.staff" },
      communication: { labelKey: "review.communication" },
      cleanliness: { labelKey: "review.cleanliness" },
      facilities: { labelKey: "review.facilities" },
      professionalism: { labelKey: "review.professionalism" },
      count: { labelKey: "review.count" },
    },
  },

  reimbursements: {
    type: "array",
    labelKey: "provider.reimbursements",
  },

  is_favourite: {
    type: "boolean",
  },
};
