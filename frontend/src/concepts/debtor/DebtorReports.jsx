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

import {
  useGetLatestReportQuery,
  useGetDebtorBalanceQuery,
} from "../../api/debtor.api";

const BASE_ROUTE = "debtor-reports";

export default function DebtorReports() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const defaultFilters = {
    search: "",
    timeline: "all",
    status: "all",
    submitted_by: "all",
    transaction_type: "all",
    payment_mode: "all",
    min_amount: "",
    max_amount: "",
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  // Row-action state (previously inside ReportActionMenu)
  const [activeReport, setActiveReport] = useState(null);
  const [dialog, setDialog] = useState(null); // { type: "remark" | "delete" }
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  // Latest debtor report (raw API shape)
  const {
    data: rawReports = [],
    isFetching: loading,
    refetch,
  } = useGetLatestReportQuery();

  // Fetch users only if admin
  const { data: employees = [] } = useGetUsersQuery(undefined, {
    skip: !isAdmin,
  });

  // Outstanding balance
  const { data: balanceData } = useGetDebtorBalanceQuery(applied.search, {
    skip: !applied.search,
  });

  // Lookup map for submitter names (id -> name)
  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      map[emp.id] = emp.name || emp.full_name || emp.username;
    });
    return map;
  }, [employees]);

  // Normalize the raw API report shape into the flat row shape the
  // table/filter logic below expects (report_date, new_debtor, etc.)
  const allRows = useMemo(() => {
    return rawReports.map((report) => {
      const entries = report.entries || [];
      const firstEntry = entries[0] || {};

      return {
        report_id: report.id,
        report_date: report.reportDate,
        debtor_no: report.debtorNo,
        submitted_by: report.submittedBy,
        submitted_by_id: report.submittedBy,
        submitted_by_name:
          employeeMap[report.submittedBy] || report.submittedBy,
        new_debtor: Number(report.newDebtorTotal) || 0,
        debtor_received: Number(report.receivedTotal) || 0,
        closing_debtor: Number(report.closingAmount) || 0,
        status: report.status,
        transaction_type: firstEntry.entryType || null,
        payment_mode: firstEntry.paymentMode?.code || null,
        payment_mode_name: firstEntry.paymentMode?.name || null,
        entries,
      };
    });
  }, [rawReports, employeeMap]);

  const outstanding = applied.search
    ? balanceData?.outstanding_debtor || 0
    : allRows.reduce((sum, row) => sum + (Number(row.closing_debtor) || 0), 0);

  const rows = useMemo(() => {
    return allRows.filter((row) => {
      if (applied.status !== "all" && row.status !== applied.status) {
        return false;
      }

      if (
        applied.submitted_by !== "all" &&
        String(row.submitted_by) !== String(applied.submitted_by)
      ) {
        return false;
      }

      if (
        applied.transaction_type !== "all" &&
        row.transaction_type !== applied.transaction_type
      ) {
        return false;
      }

      if (
        applied.payment_mode !== "all" &&
        row.payment_mode !== applied.payment_mode
      ) {
        return false;
      }

      if (
        applied.min_amount &&
        Number(row.closing_debtor) < Number(applied.min_amount)
      ) {
        return false;
      }

      if (
        applied.max_amount &&
        Number(row.closing_debtor) > Number(applied.max_amount)
      ) {
        return false;
      }

      return true;
    });
  }, [allRows, applied]);

  const exportCsv = () => {
    const columns = [
      { label: "Debtor Report ID", get: (row) => row.report_id },
      { label: "Date", get: (row) => row.report_date },
      { label: "Submitted By", get: (row) => row.submitted_by_name },
      { label: "New Debtor", get: (row) => row.new_debtor },
      { label: "Debtor Received", get: (row) => row.debtor_received },
      { label: "Closing Debtor", get: (row) => row.closing_debtor },
      { label: "Status", get: (row) => row.status },
    ];

    downloadCsv(`chhabra_marble_debtor_${Date.now()}.csv`, rows, columns);
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
      await api.post(`/${BASE_ROUTE}/${activeReport.report_id}/remark`, {
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
      await api.delete(`/reports/${activeReport.report_id}`);

      toast.success("Report deleted");
      closeDialog();
      refetch?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  // --- Filter helpers (previously inside <ReportFilters />) ---
  // showType={false}, showTransaction={true}, showPaymentMode={true}
  const updateFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const resetFilters = () => {
    setFilters(defaultFilters);
    setApplied(defaultFilters);
  };

  return (
    <Layout title="Debtor Reports">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground/60">
            Current Outstanding Debtor:{" "}
            <span
              className="font-bold text-foreground"
              data-testid="debtor-outstanding-total"
            >
              {formatMoney(outstanding)}
            </span>
          </div>
        </div>

        {/* Inlined filter bar (previously <ReportFilters />) */}
        <Card className="border border-border rounded-md bg-card shadow-none p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="debtor-search">Search</Label>
              <Input
                id="debtor-search"
                placeholder="Debtor no..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Timeline</Label>
              <Select
                value={filters.timeline}
                onValueChange={(value) => updateFilter("timeline", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilter("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div className="space-y-1">
                <Label>Submitted By</Label>
                <Select
                  value={filters.submitted_by}
                  onValueChange={(value) => updateFilter("submitted_by", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={String(emp.id)}>
                        {emp.name || emp.full_name || emp.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* showTransaction */}
            <div className="space-y-1">
              <Label>Transaction Type</Label>
              <Select
                value={filters.transaction_type}
                onValueChange={(value) =>
                  updateFilter("transaction_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* showPaymentMode */}
            <div className="space-y-1">
              <Label>Payment Mode</Label>
              <Select
                value={filters.payment_mode}
                onValueChange={(value) => updateFilter("payment_mode", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="min-amount">Min Amount</Label>
              <Input
                id="min-amount"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={filters.min_amount}
                onChange={(e) => updateFilter("min_amount", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="max-amount">Max Amount</Label>
              <Input
                id="max-amount"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={filters.max_amount}
                onChange={(e) => updateFilter("max_amount", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button size="sm" onClick={() => setApplied(filters)}>
              Apply Filters
            </Button>
          </div>
        </Card>

        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="text-sm text-foreground/70">
              {rows.length} debtor report{rows.length !== 1 ? "s" : ""}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              data-testid="debtor-export-button"
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
                  <TableHead className="text-right">New Debtor</TableHead>
                  <TableHead className="text-right">Debtor Received</TableHead>
                  <TableHead className="text-right">Closing Debtor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-sm text-foreground/50 py-12"
                    >
                      No debtor reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const isOwner = row.submitted_by_id === user?.id;
                    const isDraft = row.status === "draft";
                    const canDelete = isAdmin || (isOwner && isDraft);
                    const viewPath = `/${BASE_ROUTE}/${row.report_id}`;

                    return (
                      <TableRow
                        key={row.report_id}
                        className="cursor-pointer hover:bg-secondary/70"
                        onClick={() =>
                          navigate(`/debtor-reports/${row.report_id}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {row.debtor_no}
                        </TableCell>

                        <TableCell>{formatDate(row.report_date)}</TableCell>

                        <TableCell>{row.submitted_by_name}</TableCell>

                        <TableCell className="text-right tabular-nums">
                          {formatMoney(row.new_debtor)}
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {formatMoney(row.debtor_received)}
                        </TableCell>

                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatMoney(row.closing_debtor)}
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
                ? `Delete Report - ${activeReport?.report_id}`
                : `Add Remark - ${activeReport?.report_id}`}
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
