import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const STATUSES = [
  { v: "all", l: "All Statuses" },
  { v: "draft", l: "Draft" },
  { v: "submitted", l: "Submitted" },
  { v: "edited_by_admin", l: "Edited by Admin" },
];

const RANGES = [
  { v: "all", l: "All Time" },
  { v: "today", l: "Today" },
  { v: "this_week", l: "This Week" },
  { v: "this_month", l: "This Month" },
  { v: "last_3_months", l: "Last 3 Months" },
  { v: "last_6_months", l: "Last 6 Months" },
];

const PAY_MODES = [
  { v: "all", l: "All Modes" },
  { v: "cash", l: "Cash" },
  { v: "upi", l: "UPI" },
  { v: "bank", l: "Bank" },
  { v: "card", l: "Card" },
];

export function ReportFilters({
  filters,
  setFilters,
  onApply,
  onReset,
  employees = [],
  showType = true,
  showTransaction = false,
  showPaymentMode = false,
  extra,
}) {
  const f = filters;
  const upd = (k, v) => setFilters({ ...f, [k]: v });
  return (
    <div
      className="border border-border rounded-md p-4 bg-card space-y-3"
      data-testid="reports-filters-panel"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Search Report ID</Label>
          <Input
            value={f.search || ""}
            onChange={(e) => upd("search", e.target.value)}
            placeholder="Search..."
            data-testid="reports-table-search-input"
            className="h-9"
          />
        </div>
        {showType && (
          <div className="space-y-1">
            <Label className="text-xs">Report Type</Label>
            <Select
              value={f.report_type || "all"}
              onValueChange={(v) => upd("report_type", v)}
            >
              <SelectTrigger className="h-9" data-testid="filter-report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="debtor">Debtor</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Date Range</Label>
          <Select
            value={f.timeline || "all"}
            onValueChange={(v) => upd("timeline", v)}
          >
            <SelectTrigger className="h-9" data-testid="filter-timeline">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.v} value={r.v}>
                  {r.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showTransaction && (
          <div className="space-y-1">
            <Label className="text-xs">Transaction Type</Label>
            <Select
              value={f.transaction_type || "all"}
              onValueChange={(v) => upd("transaction_type", v)}
            >
              <SelectTrigger
                className="h-9"
                data-testid="filter-transaction-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new_debtor">New Debtor</SelectItem>
                <SelectItem value="debtor_received">Debtor Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {showPaymentMode && (
          <div className="space-y-1">
            <Label className="text-xs">Payment Mode</Label>
            <Select
              value={f.payment_mode || "all"}
              onValueChange={(v) => upd("payment_mode", v)}
            >
              <SelectTrigger className="h-9" data-testid="filter-payment-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAY_MODES.map((m) => (
                  <SelectItem key={m.v} value={m.v}>
                    {m.l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select
            value={f.status || "all"}
            onValueChange={(v) => upd("status", v)}
          >
            <SelectTrigger className="h-9" data-testid="filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((st) => (
                <SelectItem key={st.v} value={st.v}>
                  {st.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {employees.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">Submitted By</Label>
            <Select
              value={f.submitted_by || "all"}
              onValueChange={(v) => upd("submitted_by", v)}
            >
              <SelectTrigger className="h-9" data-testid="filter-submitted-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Min Amount</Label>
          <Input
            type="number"
            value={f.min_amount || ""}
            onChange={(e) => upd("min_amount", e.target.value)}
            className="h-9"
            data-testid="filter-min-amount"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max Amount</Label>
          <Input
            type="number"
            value={f.max_amount || ""}
            onChange={(e) => upd("max_amount", e.target.value)}
            className="h-9"
            data-testid="filter-max-amount"
          />
        </div>
        {extra}
      </div>
      <div className="flex gap-2">
        <Button onClick={onApply} data-testid="reports-filters-apply-button">
          Apply Filters
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          data-testid="reports-filters-reset-button"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
