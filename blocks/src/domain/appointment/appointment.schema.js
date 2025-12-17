export const AppointmentSchema = {
  provider_id: {
    type: "number",
    labelKey: "appointment.provider",
  },

  name: {
    type: "string",
    labelKey: "appointment.name",
  },

  email: {
    type: "string",
    labelKey: "appointment.email",
  },

  phone: {
    type: "string",
    labelKey: "appointment.phone",
  },

  status: {
    type: "enum",
    labelKey: "appointment.status",
  },

  notes: {
    type: "string",
    labelKey: "appointment.notes",
    optional: true,
  },
};
