import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { useGetUsersQuery } from "../../api/users.api";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/reportsApi";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Download,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useGetSalesQuery } from "../../api/sales.api";

// This page only ever deals with sales reports, so the action menu
// always routes/posts against the sales-reports base path.
const BASE_ROUTE = "sales-reports";

// Status values coming back from the API are upper-cased
// (DRAFT / SUBMITTED / EDITED_BY_ADMIN), so the filter options
// below match that shape exactly instead of guessing at lowercase.
const STATUSES = [
  { v: "all", l: "All Statuses" },
  { v: "DRAFT", l: "Draft" },
  { v: "SUBMITTED", l: "Submitted" },
  { v: "EDITED_BY_ADMIN", l: "Edited by Admin" },
];

const RANGES = [
  { v: "all", l: "All Time" },
  { v: "today", l: "Today" },
  { v: "this_week", l: "This Week" },
  { v: "this_month", l: "This Month" },
  { v: "last_3_months", l: "Last 3 Months" },
  { v: "last_6_months", l: "Last 6 Months" },
];

// Returns true if `dateStr` (YYYY-MM-DD) falls within the given range key.
function isWithinRange(dateStr, rangeKey) {
  if (!rangeKey || rangeKey === "all") return true;
  if (!dateStr) return false;

  const reportDate = new Date(dateStr);
  if (Number.isNaN(reportDate.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  switch (rangeKey) {
    case "today":
      return reportDate >= startOfToday;
    case "this_week": {
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - dayOfWeek);
      return reportDate >= startOfWeek;
    }
    case "this_month": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return reportDate >= startOfMonth;
    }
    case "last_3_months": {
      const cutoff = new Date(
        now.getFullYear(),
        now.getMonth() - 3,
        now.getDate(),
      );
      return reportDate >= cutoff;
    }
    case "last_6_months": {
      const cutoff = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        now.getDate(),
      );
      return reportDate >= cutoff;
    }
    default:
      return true;
  }
}

export default function SalesReports() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const defaultFilters = {
    search: "",
    timeline: "all",
    status: "all",
    submitted_by: "all",
    min_amount: "",
    max_amount: "",
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const updateFilter = (key, value) => setFilters({ ...filters, [key]: value });

  // Row-action state (previously inside ReportActionMenu)
  const [activeReport, setActiveReport] = useState(null);
  const [dialog, setDialog] = useState(null); // { type: "remark" | "delete" }
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  // Fetch sales reports
  const {
    data: allRows = [],
    isFetching: loading,
    refetch,
  } = useGetSalesQuery();

  // Fetch users only if admin
  const { data: employees = [] } = useGetUsersQuery(undefined, {
    skip: !isAdmin,
  });

  const rows = useMemo(() => {
    const term = applied.search.trim().toLowerCase();

    return allRows.filter((r) => {
      if (
        term &&
        !String(r.creator?.name || "")
          .toLowerCase()
          .includes(term) &&
        !String(r.sales_no || "")
          .toLowerCase()
          .includes(term)
      ) {
        return false;
      }

      if (applied.status !== "all" && r.status !== applied.status) {
        return false;
      }

      if (
        applied.submitted_by !== "all" &&
        String(r.created_by) !== String(applied.submitted_by)
      ) {
        return false;
      }

      const gross = Number(r.gross_amount) || 0;

      if (applied.min_amount && gross < Number(applied.min_amount)) {
        return false;
      }

      if (applied.max_amount && gross > Number(applied.max_amount)) {
        return false;
      }

      if (!isWithinRange(r.report_date, applied.timeline)) {
        return false;
      }

      return true;
    });
  }, [allRows, applied]);

  const exportCsv = () => {
    const cols = [
      { label: "Sales Report ID", get: (r) => r.sales_no },
      { label: "Date", get: (r) => r.report_date },
      { label: "Submitted By", get: (r) => r.creator?.name },
      { label: "Gross Amount", get: (r) => r.gross_amount },
      { label: "Status", get: (r) => r.status },
    ];

    downloadCsv(`chhabra_marble_sales_${Date.now()}.csv`, rows, cols);
  };

  // --- Row action helpers (previously in ReportActionMenu) ---

  const openRemarkDialog = (report) => {
    setActiveReport(report);
    setRemark("");
    setDialog({ type: "remark" });
  };

  const openDeleteDialog = (report) => {
    setActiveReport(report);
    setDialog({ type: "delete" });
  };

  const closeDialog = () => {
    setDialog(null);
    setActiveReport(null);
    setRemark("");
  };

  const addRemark = async () => {
    if (!remark.trim()) {
      toast.error("A remark is required");
      return;
    }
    if (!activeReport) return;

    setBusy(true);
    try {
      await api.post(`/${BASE_ROUTE}/${activeReport.id}/remark`, {
        remark,
      });

      toast.success("Remark added");
      closeDialog();
      refetch?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!activeReport) return;

    setBusy(true);
    try {
      await api.delete(`/reports/${activeReport.id}`);

      toast.success("Report deleted");
      closeDialog();
      refetch?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Sales Reports">
      <div className="space-y-4">
        {/* Filters — inlined directly here instead of a separate <ReportFilters />
            component, and wired to the real sales-report field names. */}
        <div
          className="border border-border rounded-md p-4 bg-card space-y-3"
          data-testid="reports-filters-panel"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Search Report No.</Label>
              <Input
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Search..."
                data-testid="reports-table-search-input"
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date Range</Label>
              <Select
                value={filters.timeline}
                onValueChange={(v) => updateFilter("timeline", v)}
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

            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => updateFilter("status", v)}
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

            {isAdmin && employees.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs">Submitted By</Label>
                <Select
                  value={filters.submitted_by}
                  onValueChange={(v) => updateFilter("submitted_by", v)}
                >
                  <SelectTrigger
                    className="h-9"
                    data-testid="filter-submitted-by"
                  >
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
                value={filters.min_amount}
                onChange={(e) => updateFilter("min_amount", e.target.value)}
                className="h-9"
                data-testid="filter-min-amount"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Max Amount</Label>
              <Input
                type="number"
                value={filters.max_amount}
                onChange={(e) => updateFilter("max_amount", e.target.value)}
                className="h-9"
                data-testid="filter-max-amount"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setApplied(filters)}
              data-testid="reports-filters-apply-button"
            >
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFilters(defaultFilters);
                setApplied(defaultFilters);
              }}
              data-testid="reports-filters-reset-button"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="text-sm text-foreground/70">
              {rows.length} sales report{rows.length !== 1 ? "s" : ""}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              data-testid="sales-export-button"
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>

          <div
            className="overflow-x-auto thin-scroll"
            data-testid="reports-table"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Gross Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-foreground/50 py-12"
                    >
                      No sales reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((report) => {
                    const isOwner = report.created_by === user?.id;
                    const isDraft = report.status === "DRAFT";
                    const canDelete = isAdmin || (isOwner && isDraft);
                    const viewPath = `/${BASE_ROUTE}/${report.id}`;

                    return (
                      <TableRow
                        key={report.id}
                        className="cursor-pointer hover:bg-secondary/70"
                        onClick={() => navigate(viewPath)}
                      >
                        <TableCell className="font-medium">
                          {report.sales_no}
                        </TableCell>

                        <TableCell>{formatDate(report.report_date)}</TableCell>

                        <TableCell>{report.creator?.name}</TableCell>

                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatMoney(report.gross_amount)}
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={report.status} />
                        </TableCell>

                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-48"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={() => navigate(viewPath)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              {isAdmin && (
                                <DropdownMenuItem
                                  onClick={() => openRemarkDialog(report)}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Add Remark
                                </DropdownMenuItem>
                              )}

                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => openDeleteDialog(report)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Single shared dialog for remark/delete actions, driven by activeReport */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "delete"
                ? `Delete Report - ${activeReport?.sales_no}`
                : `Add Remark - ${activeReport?.sales_no}`}
            </DialogTitle>

            {dialog?.type === "delete" && (
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            )}
          </DialogHeader>

          {dialog?.type === "remark" && (
            <Textarea
              rows={3}
              placeholder="Enter remark..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>

            {dialog?.type === "delete" ? (
              <Button onClick={doDelete} disabled={busy} variant="destructive">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            ) : (
              <Button onClick={addRemark} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Remark
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
