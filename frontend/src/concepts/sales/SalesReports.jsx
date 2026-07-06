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
import { useGetSalesQuery } from "../../api/sales.api";

// This page only ever deals with sales reports, so the action menu
// always routes/posts against the sales-reports base path.
const BASE_ROUTE = "sales-reports";

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
        !String(r.submitted_by_name || "")
          .toLowerCase()
          .includes(term) &&
        !String(r.report_id || "")
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
        String(r.submitted_by) !== String(applied.submitted_by)
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

      // Timeline filtering can be added here if needed

      return true;
    });
  }, [allRows, applied]);

  const exportCsv = () => {
    const cols = [
      {
        label: "Sales Report ID",
        get: (r) => r.report_id,
      },
      {
        label: "Date",
        get: (r) => r.report_date,
      },
      {
        label: "Submitted By",
        get: (r) => r.submitted_by_name,
      },
      {
        label: "Gross Amount",
        get: (r) => r.gross_amount,
      },
      {
        label: "Retail",
        get: (r) => r.retail,
      },
      {
        label: "Debtor",
        get: (r) => r.debtor,
      },
      {
        label: "Status",
        get: (r) => r.status,
      },
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
        />

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
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-right">Debtor</TableHead>
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
                      No sales reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((report) => {
                    const isOwner = report.submitted_by_id === user?.id;
                    const isDraft = report.status === "draft";
                    const canDelete = isAdmin || (isOwner && isDraft);
                    const viewPath = `/${BASE_ROUTE}/${report.id}`;

                    return (
                      <TableRow
                        key={report.report_id}
                        className="cursor-pointer hover:bg-secondary/70"
                        onClick={() => navigate(`/sales-reports/${report.id}`)}
                      >
                        <TableCell className="font-medium">
                          {report.sales_no}
                        </TableCell>

                        <TableCell>{formatDate(report.report_date)}</TableCell>

                        <TableCell>{report?.creator?.name}</TableCell>

                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatMoney(report.gross_amount)}
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {formatMoney(report.retail)}
                        </TableCell>

                        <TableCell className="text-right tabular-nums">
                          {formatMoney(report.debtor)}
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
                ? `Delete Report - ${activeReport?.report_id || activeReport?.sales_no}`
                : `Add Remark - ${activeReport?.report_id || activeReport?.sales_no}`}
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
