export const UserSchema = {
  id: {
    type: "number",
  },

  name: {
    type: "string",
    labelKey: "user.name",
  },

  email: {
    type: "string",
    labelKey: "user.email",
  },

  role: {
    type: "array",
    labelKey: "user.role",
  },

  phone: {
    type: "string",
    labelKey: "user.phone",
    optional: true,
  },

  language: {
    type: "string",
    labelKey: "user.language",
    optional: true,
  },
};
