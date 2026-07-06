import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { useGetUsersQuery } from "../../api/users.api";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/reportsApi";
import { formatMoney, formatDate } from "@/lib/format";
import { ReportFilters } from "@/components/ReportFilters";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useGetExpensesQuery } from "../../api/expense.api";

const ROUTE_MAP = {
  sales: "sales-reports",
  debtor: "debtor-reports",
  expense: "expense-reports",
};

export default function ExpenseReports() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const defaultFilters = {
    search: "",
    timeline: "all",
    status: "all",
    submitted_by: "all",
    payment_mode: "all",
    min_amount: "",
    max_amount: "",
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  // Row-action state (previously inside ReportActionMenu)
  const [activeReport, setActiveReport] = useState(null); // the report the dialog applies to
  const [dialog, setDialog] = useState(null); // { type: "remark" | "delete" }
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  // Fetch expense reports (assuming this returns full data with items)
  const {
    data: allRows = [],
    isFetching: loading,
    refetch,
  } = useGetExpensesQuery(); // Adjust query name if needed

  const { data: employees = [] } = useGetUsersQuery(undefined, {
    skip: !isAdmin,
  });

  // Client-side filtering
  const rows = useMemo(() => {
    const term = applied.search.trim().toLowerCase();

    return allRows.filter((row) => {
      // Search
      if (term) {
        const searchText =
          `${row.report_id || ""} ${row.submitted_by_name || ""}`.toLowerCase();
        if (!searchText.includes(term)) return false;
      }

      // Status filter
      if (applied.status !== "all" && row.status !== applied.status) {
        return false;
      }

      // Submitted By filter
      if (
        applied.submitted_by !== "all" &&
        String(row.submitted_by) !== String(applied.submitted_by)
      ) {
        return false;
      }

      // Payment Mode filter
      if (applied.payment_mode !== "all") {
        const hasPaymentMode = row.items?.some(
          (item) => item.payment_mode?.id === applied.payment_mode,
        );
        if (!hasPaymentMode) return false;
      }

      const total = Number(row.total_amount) || 0;

      if (applied.min_amount && total < Number(applied.min_amount))
        return false;
      if (applied.max_amount && total > Number(applied.max_amount))
        return false;

      return true;
    });
  }, [allRows, applied]);

  // Calculate payment mode totals for CSV export
  const getPaymentModeTotals = (items = []) => {
    const totals = {};
    items.forEach((item) => {
      const modeName = item.payment_mode?.name || "Unknown";
      totals[modeName] = (totals[modeName] || 0) + Number(item.amount || 0);
    });
    return totals;
  };

  const exportCsv = () => {
    const columns = [
      { label: "Report ID", get: (row) => row.report_id },
      { label: "Date", get: (row) => row.report_date },
      { label: "Submitted By", get: (row) => row.submitted_by_name },
      { label: "Total Amount", get: (row) => row.total_amount },
      { label: "Status", get: (row) => row.status },
    ];

    // Add dynamic payment mode columns
    const allModes = new Set();
    rows.forEach((row) => {
      row.items?.forEach((item) => {
        if (item.payment_mode?.name) allModes.add(item.payment_mode.name);
      });
    });

    allModes.forEach((modeName) => {
      columns.push({
        label: modeName,
        get: (row) => {
          const total = row.items
            ?.filter((i) => i.payment_mode?.name === modeName)
            .reduce((sum, i) => sum + Number(i.amount || 0), 0);
          return total || 0;
        },
      });
    });

    downloadCsv(`expense_reports_${Date.now()}.csv`, rows, columns);
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

  const getBaseRoute = (report) => {
    const type = (report?.report_type || "expense").toLowerCase();
    return ROUTE_MAP[type] || "expense-reports";
  };

  const addRemark = async () => {
    if (!remark.trim()) {
      toast.error("A remark is required");
      return;
    }
    if (!activeReport) return;

    const base = getBaseRoute(activeReport);

    setBusy(true);
    try {
      await api.post(`/${base}/${activeReport.id}/remark`, {
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
    <Layout title="Expense Reports">
      <div className="space-y-4">
        <ReportFilters
          filters={filters}
          setFilters={setFilters}
          onApply={() => setApplied(filters)}
          onReset={() => {
            setFilters(defaultFilters);
            setApplied(defaultFilters);
          }}
          employees={isAdmin ? employees : []}
          showType={false}
          showPaymentMode
        />

        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="text-sm text-foreground/70">
              {rows.length} expense report{rows.length !== 1 ? "s" : ""}
            </div>

            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto thin-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No expense reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const isOwner = row.submitted_by_id === user?.id;
                    const isDraft = row.status === "draft";
                    const canDelete = isAdmin || (isOwner && isDraft);
                    const base = getBaseRoute(row);
                    const viewPath = `/${base}/${row.id}`;

                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-secondary/70"
                        onClick={() => navigate(`/expense-reports/${row.id}`)}
                      >
                        <TableCell className="font-medium">
                          {row.expense_no}
                        </TableCell>
                        <TableCell>{formatDate(row.report_date)}</TableCell>
                        <TableCell>
                          {row?.created_by_user?.name || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatMoney(row.total_amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
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
                                  onClick={() => openRemarkDialog(row)}
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
                                    onClick={() => openDeleteDialog(row)}
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
                ? `Delete Report - ${activeReport?.report_id || activeReport?.expense_no}`
                : `Add Remark - ${activeReport?.report_id || activeReport?.expense_no}`}
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
