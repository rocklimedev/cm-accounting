export const BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://accounts-api.cmtradingco.com/api/v1"
    : "http://localhost:3000/api/v1";

export const MODULE_LABELS = {
  reports: "Reports",
  users: "Users",
  roles: "Roles & Permissions",
  activity: "Activity Log",
  cash: "Cash Opening & Adjustments",
};
