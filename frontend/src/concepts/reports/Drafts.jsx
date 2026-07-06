import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Eye, MessageSquare, Trash2, Loader2, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/use-auth"; // adjust path if needed
import { api } from "@/lib/api";
import { useGetDraftReportsQuery } from "../../api/reports.api";

export default function Drafts() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const { data, isFetching: loading, refetch } = useGetDraftReportsQuery();

  const rows = data?.rows ?? [];

  // Dialog state
  const [dialog, setDialog] = useState(null);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  const openDialog = (type, report) => {
    setRemark("");
    setDialog({ type, report });
  };

  const closeDialog = () => {
    setDialog(null);
    setRemark("");
  };

  const addRemark = async () => {
    if (!remark.trim()) {
      toast.error("A remark is required");
      return;
    }

    setBusy(true);
    const report = dialog?.report;
    const type = (report.report_type || "expense").toLowerCase();
    const base =
      type === "sales"
        ? "sales-reports"
        : type === "debtor"
          ? "debtor-reports"
          : "expense-reports";
    const id = report.id;

    try {
      await api.post(`/${base}/${id}/remark`, { remark });
      toast.success("Remark added");
      closeDialog();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add remark");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    const report = dialog?.report;
    const id = report.id;

    try {
      await api.delete(`/reports/${id}`);
      toast.success("Report deleted");
      closeDialog();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const getBaseRoute = (reportType) => {
    const type = (reportType || "expense").toLowerCase();
    if (type === "sales") return "sales-reports";
    if (type === "debtor") return "debtor-reports";
    return "expense-reports";
  };

  return (
    <Layout title="Drafts">
      <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
        <div className="p-3 border-b border-border text-sm text-foreground/70">
          {data?.total ?? 0} draft{(data?.total ?? 0) !== 1 ? "s" : ""}
        </div>

        <div
          className="overflow-x-auto thin-scroll"
          data-testid="reports-table"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-foreground/50 py-12"
                  >
                    <FileEdit className="h-6 w-6 mx-auto mb-2 text-foreground/30" />
                    No drafts. Start a new report from Add Report.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const isOwner = r.submitted_by_id === user?.id;
                  const isDraft = r.status === "draft";
                  const canDelete = isAdmin || (isOwner && isDraft);
                  const baseRoute = getBaseRoute(r.report_type);
                  const viewPath = `/${baseRoute}/${r.report_id}`;

                  return (
                    <TableRow
                      key={r.report_id}
                      className="cursor-pointer hover:bg-secondary/70"
                      onClick={() => navigate(viewPath)}
                    >
                      <TableCell className="font-medium">
                        {r.report_no}
                      </TableCell>
                      <TableCell>{formatDate(r.report_date)}</TableCell>
                      <TableCell className="capitalize">
                        {r.report_type}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(r.amount)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDateTime(r.created_at)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>

                      {/* Actions Column - Directly in table */}
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(viewPath)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openDialog("remark", r)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => openDialog("delete", r)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialogs */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "delete"
                ? `Delete Report - ${
                    dialog?.report?.report_id ||
                    dialog?.report?.expense_no ||
                    dialog?.report?.id ||
                    "Unknown"
                  }`
                : `Add Remark - ${
                    dialog?.report?.report_id ||
                    dialog?.report?.expense_no ||
                    dialog?.report?.id ||
                    "Unknown"
                  }`}
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
