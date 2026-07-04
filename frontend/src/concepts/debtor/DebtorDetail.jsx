import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { useGetDebtorReportQuery } from "../../api/debtor.api";
import { api } from "@/lib/api";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Pencil,
  MessageSquare,
  Printer,
  FileDown,
  ArrowLeft,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "sonner";

const PAY_LABEL = { cash: "Cash", upi: "UPI", bank: "Bank", card: "Card" };

const EDIT_PATH = {
  sales: "sales-reports",
  debtor: "debtor-reports",
  expense: "expense-reports",
};

export default function DebtorDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const {
    data: report,
    isLoading: loading,
    refetch,
  } = useGetDebtorReportQuery(reportId);

  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  const addRemark = async () => {
    if (!remark.trim()) {
      toast.error("Remark required");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/${EDIT_PATH[report?.reportType]}/${reportId}/remark`, {
        remark,
      });
      toast.success("Remark added");
      setRemarkOpen(false);
      setRemark("");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add remark");
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <Layout title="Report Detail">
        <Skeleton className="h-64 w-full" />
      </Layout>
    );

  if (!report)
    return (
      <Layout title="Report Detail">
        <div className="text-sm text-foreground/50">Report not found.</div>
      </Layout>
    );

  const isOwner = report.submittedById === user?.id;
  const canEdit = isAdmin || (isOwner && report.status === "draft");
  const editPath = `/${EDIT_PATH[report.reportType]}/${reportId}/edit`;

  const adminRemarks = report.adminRemarks || [];
  const editHistory = report.editHistory || [];
  const activity = report.activity || [];

  const titleMap = {
    sales: "Sales Report",
    debtor: "Debtor Report",
    expense: "Expense Report",
  };

  return (
    <Layout title={`Report ${report.reportId || reportId}`}>
      <div className="space-y-4 print:space-y-2">
        {/* Header Card */}
        <Card className="border border-border rounded-md bg-card shadow-none p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 print:hidden"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-bold">{report.reportId}</h2>
                <StatusBadge status={report.status} />
                <span className="text-xs px-2 py-0.5 border border-border rounded-sm">
                  {titleMap[report.reportType]}
                </span>
              </div>

              <div className="text-sm text-foreground/60 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                <span>
                  Date:{" "}
                  <b className="text-foreground">
                    {formatDate(report.reportDate)}
                  </b>
                </span>
                <span>
                  Created By:{" "}
                  <b className="text-foreground">{report.createdByName}</b>
                </span>
                <span>
                  Submitted By:{" "}
                  <b className="text-foreground">{report.submittedByName}</b>
                </span>
                {report.submittedAt && (
                  <span>
                    Submitted:{" "}
                    <b className="text-foreground">
                      {formatDateTime(report.submittedAt)}
                    </b>
                  </span>
                )}
                {report.lastUpdatedBy && (
                  <span>
                    Last Updated By:{" "}
                    <b className="text-foreground">{report.lastUpdatedBy}</b>
                  </span>
                )}
                {report.lastUpdatedAt && (
                  <span>
                    Last Updated:{" "}
                    <b className="text-foreground">
                      {formatDateTime(report.lastUpdatedAt)}
                    </b>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(editPath)}
                  data-testid="report-edit-button"
                >
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              )}

              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => {
                    setRemark("");
                    setRemarkOpen(true);
                  }}
                  data-testid="report-add-remark-button"
                >
                  <MessageSquare className="h-4 w-4 mr-1" /> Add Remark
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                data-testid="report-print-button"
              >
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const token = localStorage.getItem("erp_token");
                  window.open(
                    `${import.meta.env.VITE_API_URL || "/api"}/export/report/${reportId}/pdf?token=${token}`,
                    "_blank",
                  );
                }}
                data-testid="report-pdf-button"
              >
                <FileDown className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Debtor Content */}
        <DebtorBody report={report} />

        {/* Employee Remarks */}
        {report.employeeRemarks && (
          <Card className="border border-border rounded-md bg-card shadow-none p-4">
            <h2 className="text-base font-semibold mb-2">Employee Remarks</h2>
            <p className="text-sm text-foreground/70">
              {report.employeeRemarks}
            </p>
          </Card>
        )}

        {/* Admin Remarks */}
        {adminRemarks.length > 0 && (
          <Card
            className="border border-border rounded-md bg-card shadow-none p-4"
            data-testid="report-admin-remarks"
          >
            <h2 className="text-base font-semibold mb-2">Admin Remarks</h2>
            <div className="space-y-2">
              {adminRemarks.map((r, i) => (
                <div
                  key={i}
                  className="border border-primary/30 bg-primary/5 rounded-sm px-3 py-2 text-sm"
                >
                  <div>{r.remark}</div>
                  <div className="text-xs text-foreground/50 mt-1">
                    by {r.addedBy} &middot; {formatDateTime(r.at)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Edit History */}
        {editHistory.length > 0 && (
          <Card
            className="border border-border rounded-md bg-card shadow-none p-4"
            data-testid="report-edit-history"
          >
            <h2 className="text-base font-semibold mb-3">Edit History</h2>
            <div className="space-y-3">
              {editHistory.map((h, i) => (
                <div key={i} className="border border-border rounded-sm p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{h.editedBy}</span>
                    <span className="text-xs text-foreground/50">
                      {formatDateTime(h.editedAt)}
                    </span>
                  </div>
                  {h.reason && (
                    <div className="text-sm text-foreground/70 mt-1">
                      Reason: {h.reason}
                    </div>
                  )}
                  {(h.changes || []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {h.changes.map((c, j) => (
                        <div
                          key={j}
                          className="text-xs flex items-center gap-2"
                        >
                          <span className="font-medium">{c.field}:</span>
                          <span className="text-foreground/60 line-through">
                            {formatMoney(c.old)}
                          </span>
                          <span>→</span>
                          <span className="text-primary font-medium">
                            {formatMoney(c.new)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Activity & Audit Trail */}
        <Card className="border border-border rounded-md bg-card shadow-none p-4">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <History className="h-4 w-4" /> Activity &amp; Audit Trail
          </h2>
          <div className="space-y-2">
            {activity.length === 0 ? (
              <div className="text-sm text-foreground/50">No activity yet</div>
            ) : (
              activity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 text-sm border-l-2 border-border pl-3 py-1"
                >
                  <span className="font-medium capitalize">
                    {(a.action || "").replace(/_/g, " ")}
                  </span>
                  <span className="text-foreground/60">by {a.actorName}</span>
                  {a.remark && (
                    <span className="text-foreground/60">— "{a.remark}"</span>
                  )}
                  <span className="ml-auto text-xs text-foreground/50">
                    {formatDateTime(a.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Add Remark Dialog */}
      <Dialog open={remarkOpen} onOpenChange={setRemarkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Remark — {report.reportId}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            data-testid="detail-remark-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={addRemark}
              disabled={busy}
              data-testid="detail-remark-confirm"
            >
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add
              Remark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

/* ==================== Helper Components ==================== */

function DebtorBody({ report }) {
  return (
    <div className="space-y-4">
      {/* Debtor Entries Table */}
      <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-base font-semibold">Debtor Entries</h2>
        </div>
        <div className="overflow-x-auto thin-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">S.No</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(report.entries || []).map((e, i) => (
                <TableRow key={e.id || i}>
                  <TableCell className="text-foreground/60">{i + 1}</TableCell>
                  <TableCell className="font-medium">
                    {e.entryType === "new_debtor"
                      ? "New Debtor"
                      : "Debtor Received"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatMoney(e.amount)}
                  </TableCell>
                  <TableCell>
                    {e.entryType === "debtor_received"
                      ? e.paymentMode?.name || e.paymentMode?.code || "-"
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard
          label="Opening Debtor"
          value={formatMoney(report.openingAmount)}
        />
        <MiniCard
          label="New Debtor Added"
          value={formatMoney(report.newDebtorTotal)}
        />
        <MiniCard
          label="Debtor Received"
          value={formatMoney(report.receivedTotal)}
        />
        <MiniCard
          label="Closing Debtor"
          value={formatMoney(report.closingAmount)}
          accent
        />
      </div>
    </div>
  );
}

function MiniCard({ label, value, accent }) {
  return (
    <Card
      className={`border border-border rounded-md p-3 bg-card shadow-none ${
        accent ? "border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="text-xs text-foreground/60">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </Card>
  );
}
