import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { api, API } from "@/lib/api";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, MessageSquare, Printer, FileDown, ArrowLeft, Loader2, History } from "lucide-react";
import { toast } from "sonner";

const PAY_LABEL = { cash: "Cash", upi: "UPI", bank: "Bank", card: "Card" };
const EDIT_PATH = { sales: "sales-reports", debtor: "debtor-reports", expense: "expense-reports" };

export default function ReportDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get(`/reports-detail/${reportId}`); setReport(res.data); }
    catch (err) { toast.error(err.response?.data?.detail || "Failed to load"); }
    finally { setLoading(false); }
  }, [reportId]);
  useEffect(() => { load(); }, [load]);

  const addRemark = async () => {
    if (!remark.trim()) { toast.error("Remark required"); return; }
    setBusy(true);
    try {
      await api.post(`/${EDIT_PATH[report.report_type]}/${reportId}/remark`, { remark });
      toast.success("Remark added"); setRemarkOpen(false); setRemark(""); load();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  if (loading) return <Layout title="Report Detail"><Skeleton className="h-64 w-full" /></Layout>;
  if (!report) return <Layout title="Report Detail"><div className="text-sm text-foreground/50">Report not found.</div></Layout>;

  const isOwner = report.submitted_by_id === user?.id;
  const canEdit = isAdmin || (isOwner && report.status === "draft");
  const editPath = `/${EDIT_PATH[report.report_type]}/${reportId}/edit`;
  const adminRemarks = report.admin_remarks || [];
  const editHistory = report.edit_history || [];
  const token = localStorage.getItem("erp_token");

  const titleMap = { sales: "Sales Report", debtor: "Debtor Report", expense: "Expense Report" };

  return (
    <Layout title={`Report ${reportId}`}>
      <div className="space-y-4 print:space-y-2">
        <Card className="border border-border rounded-md bg-card shadow-none p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="icon" className="h-8 w-8 print:hidden" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
                <h2 className="text-lg font-bold">{report.report_id}</h2>
                <StatusBadge status={report.status} />
                <span className="text-xs px-2 py-0.5 border border-border rounded-sm">{titleMap[report.report_type]}</span>
              </div>
              <div className="text-sm text-foreground/60 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                <span>Date: <b className="text-foreground">{formatDate(report.report_date)}</b></span>
                <span>Created By: <b className="text-foreground">{report.created_by_name}</b></span>
                <span>Submitted By: <b className="text-foreground">{report.submitted_by_name}</b></span>
                <span>Submitted: <b className="text-foreground">{formatDateTime(report.submitted_at)}</b></span>
                {report.last_updated_by && <span>Last Updated By: <b className="text-foreground">{report.last_updated_by}</b></span>}
                {report.last_updated_at && <span>Last Updated: <b className="text-foreground">{formatDateTime(report.last_updated_at)}</b></span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              {canEdit && <Button variant="outline" size="sm" onClick={() => navigate(editPath)} data-testid="report-edit-button"><Pencil className="h-4 w-4 mr-1" /> Edit</Button>}
              {isAdmin && <Button size="sm" onClick={() => { setRemark(""); setRemarkOpen(true); }} data-testid="report-add-remark-button"><MessageSquare className="h-4 w-4 mr-1" /> Add Remark</Button>}
              <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="report-print-button"><Printer className="h-4 w-4 mr-1" /> Print</Button>
              <Button variant="outline" size="sm" onClick={() => window.open(`${API}/export/report/${reportId}/pdf?token=${token}`, "_blank")} data-testid="report-pdf-button"><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
            </div>
          </div>
        </Card>

        {report.report_type === "sales" && <SalesBody report={report} />}
        {report.report_type === "debtor" && <DebtorBody report={report} />}
        {report.report_type === "expense" && <ExpenseBody report={report} />}

        {report.employee_remarks && (
          <Card className="border border-border rounded-md bg-card shadow-none p-4">
            <h2 className="text-base font-semibold mb-2">Employee Remarks</h2>
            <p className="text-sm text-foreground/70">{report.employee_remarks}</p>
          </Card>
        )}

        {adminRemarks.length > 0 && (
          <Card className="border border-border rounded-md bg-card shadow-none p-4" data-testid="report-admin-remarks">
            <h2 className="text-base font-semibold mb-2">Admin Remarks</h2>
            <div className="space-y-2">
              {adminRemarks.map((r, i) => (
                <div key={i} className="border border-primary/30 bg-primary/5 rounded-sm px-3 py-2 text-sm">
                  <div>{r.remark}</div>
                  <div className="text-xs text-foreground/50 mt-1">by {r.added_by} &middot; {formatDateTime(r.at)}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {editHistory.length > 0 && (
          <Card className="border border-border rounded-md bg-card shadow-none p-4" data-testid="report-edit-history">
            <h2 className="text-base font-semibold mb-3">Edit History</h2>
            <div className="space-y-3">
              {editHistory.map((h, i) => (
                <div key={i} className="border border-border rounded-sm p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{h.edited_by}</span>
                    <span className="text-xs text-foreground/50">{formatDateTime(h.edited_at)}</span>
                  </div>
                  {h.reason && <div className="text-sm text-foreground/70 mt-1">Reason: {h.reason}</div>}
                  {(h.changes || []).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {h.changes.map((c, j) => (
                        <div key={j} className="text-xs flex items-center gap-2">
                          <span className="font-medium">{c.field}:</span>
                          <span className="text-foreground/60 line-through">{formatMoney(c.old)}</span>
                          <span>&rarr;</span>
                          <span className="text-primary font-medium">{formatMoney(c.new)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="border border-border rounded-md bg-card shadow-none p-4">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><History className="h-4 w-4" /> Activity &amp; Audit Trail</h2>
          <div className="space-y-2">
            {(report.activity || []).length === 0 ? <div className="text-sm text-foreground/50">No activity yet</div>
            : report.activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-sm border-l-2 border-border pl-3 py-1">
                <span className="font-medium capitalize">{(a.action || "").replace(/_/g, " ")}</span>
                <span className="text-foreground/60">by {a.actor_name}</span>
                {a.remark && <span className="text-foreground/60">&mdash; "{a.remark}"</span>}
                <span className="ml-auto text-xs text-foreground/50">{formatDateTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Dialog open={remarkOpen} onOpenChange={(o) => !o && setRemarkOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Admin Remark &mdash; {reportId}</DialogTitle></DialogHeader>
          <Textarea placeholder="Enter remark" value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} data-testid="detail-remark-input" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkOpen(false)}>Cancel</Button>
            <Button onClick={addRemark} disabled={busy} data-testid="detail-remark-confirm">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add Remark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function DetailCard({ title, children }) {
  return (
    <Card className="border border-border rounded-md bg-card shadow-none p-4">
      <h2 className="text-base font-semibold mb-3 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </Card>
  );
}
function KV({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/70">{label}</span>
      <span className={`tabular-nums ${bold ? "font-bold" : "font-medium"}`}>{value}</span>
    </div>
  );
}

function SalesBody({ report }) {
  const r = report.retail || {};
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DetailCard title="Sales Summary">
        <KV label="Gross Amount" value={formatMoney(report.gross_amount)} />
        <KV label="Total Retail" value={formatMoney(report.total_retail)} />
        <KV label="Debtor" value={formatMoney(report.debtor)} bold />
      </DetailCard>
      <DetailCard title="Retail by Payment Mode">
        <KV label="Cash" value={formatMoney(r.cash)} />
        <KV label="UPI" value={formatMoney(r.upi)} />
        <KV label="Bank" value={formatMoney(r.bank)} />
        <KV label="Card" value={formatMoney(r.card)} />
        <KV label="Total Retail" value={formatMoney(report.total_retail)} bold />
      </DetailCard>
    </div>
  );
}

function DebtorBody({ report }) {
  const run = report.running || {};
  return (
    <div className="space-y-4">
      <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
        <div className="p-4 border-b border-border"><h2 className="text-base font-semibold">Debtor Entries</h2></div>
        <div className="overflow-x-auto thin-scroll">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-12">S.No</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Payment Mode</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(report.entries || []).map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="text-foreground/60">{i + 1}</TableCell>
                  <TableCell className="font-medium">{e.entry_type === "new_debtor" ? "New Debtor" : "Debtor Received"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(e.amount)}</TableCell>
                  <TableCell>{e.entry_type === "debtor_received" ? (PAY_LABEL[e.payment_mode] || e.payment_mode) : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard label="Opening Debtor" value={formatMoney(run.opening)} />
        <MiniCard label="New Debtor Added" value={formatMoney(report.new_debtor_total)} />
        <MiniCard label="Debtor Received" value={formatMoney(report.debtor_received_total)} />
        <MiniCard label="Closing Debtor" value={formatMoney(run.closing)} accent />
      </div>
    </div>
  );
}

function ExpenseBody({ report }) {
  const sm = report.summary || {};
  return (
    <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
      <div className="p-4 border-b border-border"><h2 className="text-base font-semibold">Expenses</h2></div>
      <div className="overflow-x-auto thin-scroll">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-12">S.No</TableHead><TableHead>Expense Title</TableHead>
            <TableHead className="text-right">Amount</TableHead><TableHead>Payment Mode</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {(report.expenses || []).map((e, i) => (
              <TableRow key={i}>
                <TableCell className="text-foreground/60">{i + 1}</TableCell>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(e.amount)}</TableCell>
                <TableCell>{PAY_LABEL[e.payment_mode] || e.payment_mode}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="p-4 border-t border-border grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <KV label="Cash" value={formatMoney(sm.cash)} />
        <KV label="UPI" value={formatMoney(sm.upi)} />
        <KV label="Bank" value={formatMoney(sm.bank)} />
        <KV label="Card" value={formatMoney(sm.card)} />
        <KV label="Total" value={formatMoney(sm.total)} bold />
      </div>
    </Card>
  );
}

function MiniCard({ label, value, accent }) {
  return (
    <Card className={`border border-border rounded-md p-3 bg-card shadow-none ${accent ? "border-l-2 border-l-primary" : ""}`}>
      <div className="text-xs text-foreground/60">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </Card>
  );
}
