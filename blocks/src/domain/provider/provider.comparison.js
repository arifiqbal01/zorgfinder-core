import { ProviderSchema } from "./provider.schema";

export const ProviderComparisonSchema = {
  features: [
    ProviderSchema.type_of_care,
    ProviderSchema.indication_type,
    ProviderSchema.organization_type,
    ProviderSchema.has_hkz,
  ],

  target: [
    ProviderSchema.target_genders,
    ProviderSchema.target_age_groups,
  ],

  reimbursements: [
    ProviderSchema.reimbursements,
  ],

  reviews: [
    ProviderSchema.reviews.fields.overall,
    ProviderSchema.reviews.fields.staff,
    ProviderSchema.reviews.fields.communication,
    ProviderSchema.reviews.fields.cleanliness,
    ProviderSchema.reviews.fields.facilities,
    ProviderSchema.reviews.fields.professionalism,
    ProviderSchema.reviews.fields.count,
  ],

  details: [
    ProviderSchema.address,
    ProviderSchema.phone,
    ProviderSchema.email,
    ProviderSchema.website,
  ],
};
