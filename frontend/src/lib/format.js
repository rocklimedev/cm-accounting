export const CURRENCY = "INR";

export function formatMoney(value, opts = {}) {
  const n = Math.round(Number(value || 0));
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: opts.decimals ?? 0,
    maximumFractionDigits: opts.decimals ?? 0,
  }).format(Math.abs(n));
  const sign = n < 0 ? "-" : "";
  return `${sign}\u20B9${formatted}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

export function formatDate(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d.length === 10 ? d + "T00:00:00" : d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export function formatDateTime(d) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return d;
  }
}

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  edited_by_admin: "Edited by Admin",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  correction_required: "Correction Required",
  resubmitted: "Resubmitted",
  converted: "Converted to Expense",
  declined: "Declined",
  changes_requested: "Changes Requested",
  revised: "Revised",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
