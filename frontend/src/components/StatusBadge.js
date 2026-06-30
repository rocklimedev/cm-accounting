import React from "react";
import { STATUS_LABELS } from "@/lib/format";

const STYLES = {
  draft: "bg-background text-foreground border-border",
  submitted: "bg-secondary text-foreground border-border",
  edited_by_admin: "bg-primary/10 text-foreground border-primary/30",
  under_review: "bg-primary/10 text-foreground border-primary/30",
  approved: "bg-foreground text-background border-foreground",
  rejected: "bg-primary text-primary-foreground border-primary",
  correction_required: "bg-background text-primary border-primary",
  resubmitted: "bg-foreground/5 text-foreground border-border",
  converted: "bg-foreground text-background border-foreground",
  declined: "bg-primary text-primary-foreground border-primary",
  changes_requested: "bg-background text-primary border-primary",
  revised: "bg-foreground/5 text-foreground border-border",
  cancelled: "bg-secondary text-foreground/60 border-border",
  expired: "bg-secondary text-foreground/60 border-border",
};

const DOTS = {
  draft: "bg-foreground/50",
  submitted: "bg-foreground",
  edited_by_admin: "bg-primary",
  under_review: "bg-primary",
  approved: "bg-background",
  rejected: "bg-background",
  correction_required: "bg-primary",
  resubmitted: "bg-foreground",
  converted: "bg-background",
  declined: "bg-background",
  changes_requested: "bg-primary",
  revised: "bg-foreground",
  cancelled: "bg-foreground/40",
  expired: "bg-foreground/40",
};

export function StatusBadge({ status }) {
  const s = status || "draft";
  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${STYLES[s] || STYLES.draft}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[s] || DOTS.draft}`} />
      {STATUS_LABELS[s] || s}
    </span>
  );
}
