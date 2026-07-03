/* Mirrors the server's DEFAULT_APPEARANCE so the UI renders instantly
   before the settings request returns. */
export const DEFAULTS = {
  preset: "classic",
  textScale: 1,
  ratings: {
    green: { color: "#16A34A", label: "Worth it" },
    yellow: { color: "#F59E0B", label: "Reasonable" },
    red: { color: "#EF4444", label: "Regret it" },
  },
};
