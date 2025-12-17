export const FavouriteSchema = {
  id: {
    type: "number",
  },

  user_id: {
    type: "number",
  },

  provider_id: {
    type: "number",
    labelKey: "favourite.provider",
  },

  provider_name: {
    type: "string",
    labelKey: "favourite.provider_name",
  },

  user_name: {
    type: "string",
    labelKey: "favourite.user_name",
    optional: true, // admin-only views
  },

  created_at: {
    type: "string",
    format: "datetime",
  },
};
