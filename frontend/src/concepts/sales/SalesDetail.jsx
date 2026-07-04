import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { api, API } from "@/lib/api";
import { useGetSalesReportByIdQuery } from "../../api/sales.api"; // adjust path to where salesApi is defined
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
  Pencil,
  MessageSquare,
  Printer,
  FileDown,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export default function SalesDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  const {
    data: report,
    isLoading,
    isFetching,
    refetch,
  } = useGetSalesReportByIdQuery(reportId, {
    skip: !reportId,
  });

  const addRemark = async () => {
    if (!remark.trim()) {
      toast.error("Remark required");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/sales/${reportId}/remark`, { remark });
      toast.success("Remark added");
      setRemarkOpen(false);
      setRemark("");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading)
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

  // No submitted_by/ownership info in this response shape — edit is
  // gated on admin or draft status only. Adjust if ownership data is added later.
  const canEdit = isAdmin || report.status === "DRAFT";
  const editPath = `/sales-reports/${reportId}/edit`;
  const token = localStorage.getItem("erp_token");
  const items = report.items || [];
  const totals = report.totals || {};

  return (
    <Layout title={`Report ${report.sales_no || reportId}`}>
      <div className="space-y-4 print:space-y-2">
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
                <h2 className="text-lg font-bold">{report.sales_no}</h2>
                <StatusBadge status={report.status?.toLowerCase()} />
                {report.integrity_verified ? (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-emerald-500/40 text-emerald-600 rounded-sm"
                    title="Hash chain verified"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-destructive/40 text-destructive rounded-sm"
                    title="Hash chain could not be verified"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" /> Unverified
                  </span>
                )}
                {isFetching && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground/40" />
                )}
              </div>
              <div className="text-sm text-foreground/60 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                <span>
                  Date:{" "}
                  <b className="text-foreground">
                    {formatDate(report.report_date)}
                  </b>
                </span>
                <span>
                  Created:{" "}
                  <b className="text-foreground">
                    {formatDateTime(report.created_at)}
                  </b>
                </span>
                <span className="truncate" title={report.previous_hash}>
                  Prev Hash:{" "}
                  <b className="text-foreground font-mono text-xs">
                    {report.previous_hash
                      ? `${report.previous_hash.slice(0, 10)}…`
                      : "—"}
                  </b>
                </span>
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
                    setRemark(report.remarks || "");
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
                onClick={() =>
                  window.open(
                    `${API}/export/report/${reportId}/pdf?token=${token}`,
                    "_blank",
                  )
                }
                data-testid="report-pdf-button"
              >
                <FileDown className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DetailCard title="Sales Summary">
            <KV
              label="Gross Amount"
              value={formatMoney(report.gross_amount)}
              bold
            />
            <KV label="Payment Modes" value={items.length} />
          </DetailCard>
          <DetailCard title="By Payment Mode">
            {Object.keys(totals).length === 0 ? (
              <div className="text-sm text-foreground/50">
                No payment breakdown available
              </div>
            ) : (
              Object.entries(totals).map(([mode, amount]) => (
                <KV key={mode} label={mode} value={formatMoney(amount)} />
              ))
            )}
          </DetailCard>
        </div>

        <Card className="border border-border rounded-md bg-card shadow-none p-4">
          <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border">
            Payment Line Items
          </h2>
          {items.length === 0 ? (
            <div className="text-sm text-foreground/50">No items</div>
          ) : (
            <div className="space-y-1.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-foreground/80">
                      {item.paymentMode?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-foreground/40 font-mono">
                      {item.paymentMode?.code}
                    </span>
                    {item.paymentMode?.is_active === false && (
                      <span className="text-xs text-destructive/70">
                        (inactive)
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatMoney(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {report.remarks && (
          <Card className="border border-border rounded-md bg-card shadow-none p-4">
            <h2 className="text-base font-semibold mb-2">Remarks</h2>
            <p className="text-sm text-foreground/70">{report.remarks}</p>
          </Card>
        )}
      </div>

      <Dialog
        open={remarkOpen}
        onOpenChange={(o) => !o && setRemarkOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Remark &mdash; {report.sales_no || reportId}
            </DialogTitle>
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

function DetailCard({ title, children }) {
  return (
    <Card className="border border-border rounded-md bg-card shadow-none p-4">
      <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="space-y-1.5">{children}</div>
    </Card>
  );
}

function KV({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/70">{label}</span>
      <span className={`tabular-nums ${bold ? "font-bold" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}
