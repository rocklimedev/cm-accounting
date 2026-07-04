import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { api, API } from "@/lib/api";
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
import { useGetExpenseByIdQuery } from "../../api/expense.api";
const PAY_LABEL = {
  UPI: "UPI",
  BANK: "Bank Transfer",
  CHEQUE: "Cheque",
  WALLET: "Wallet",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  NET_BANKING: "Net Banking",
  // Add more as needed
};

export default function ExpenseDetail() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const {
    data: report,
    isLoading: loading,
    error,
    refetch,
  } = useGetExpenseByIdQuery(reportId, {
    skip: !reportId,
  });

  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (error) {
      toast.error(error?.data?.detail || "Failed to load report");
    }
  }, [error]);

  const addRemark = async () => {
    if (!remark.trim()) {
      toast.error("Remark required");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/expense-reports/${reportId}/remark`, { remark });
      toast.success("Remark added successfully");
      setRemarkOpen(false);
      setRemark("");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add remark");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Expense Report Detail">
        <Skeleton className="h-64 w-full" />
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout title="Expense Report Detail">
        <div className="text-sm text-foreground/50">Report not found.</div>
      </Layout>
    );
  }

  // Adapt to new data structure
  const reportIdDisplay = report.expense_no || report.id;
  const reportDate = report.report_date;
  const totalAmount = report.total_amount;
  const status = report.status;
  const createdAt = report.created_at;

  const items = report.items || [];

  // Calculate summary by payment mode
  const summary = items.reduce((acc, item) => {
    const mode = item.payment_mode?.code || item.payment_mode;
    const key = mode?.toLowerCase() || "other";
    acc[key] = (acc[key] || 0) + parseFloat(item.amount || 0);
    acc.total = (acc.total || 0) + parseFloat(item.amount || 0);
    return acc;
  }, {});

  return (
    <Layout title={`Expense Report ${reportIdDisplay}`}>
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
                <h2 className="text-lg font-bold">{reportIdDisplay}</h2>
                <StatusBadge status={status} />
                <span className="text-xs px-2 py-0.5 border border-border rounded-sm">
                  Expense Report
                </span>
              </div>

              <div className="text-sm text-foreground/60 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                <span>
                  Date:{" "}
                  <b className="text-foreground">{formatDate(reportDate)}</b>
                </span>
                <span>
                  Total Amount:{" "}
                  <b className="text-foreground">{formatMoney(totalAmount)}</b>
                </span>
                {createdAt && (
                  <span>
                    Created:{" "}
                    <b className="text-foreground">
                      {formatDateTime(createdAt)}
                    </b>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => {
                    setRemark("");
                    setRemarkOpen(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-1" /> Add Remark
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${API}/export/report/${reportId}/pdf?token=${localStorage.getItem("erp_token")}`,
                    "_blank",
                  )
                }
              >
                <FileDown className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* Expense Body */}
        <ExpenseBody items={items} summary={summary} />

        {/* Activity & Audit Trail */}
        <Card className="border border-border rounded-md bg-card shadow-none p-4">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <History className="h-4 w-4" /> Activity &amp; Audit Trail
          </h2>
          <div className="text-sm text-foreground/50">
            No activity records available
          </div>
        </Card>
      </div>

      {/* Add Remark Dialog */}
      <Dialog open={remarkOpen} onOpenChange={setRemarkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remark — {reportIdDisplay}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addRemark} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Remark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function ExpenseBody({ items, summary }) {
  return (
    <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold">Expense Items</h2>
      </div>

      <div className="overflow-x-auto thin-scroll">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">S.No</TableHead>
              <TableHead>Expense Title</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment Mode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={item.id || i}>
                <TableCell className="text-foreground/60">{i + 1}</TableCell>
                <TableCell className="font-medium">
                  {item.expense_title}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(item.amount)}
                </TableCell>
                <TableCell>
                  {item.payment_mode?.name ||
                    PAY_LABEL[item.payment_mode?.code] ||
                    item.payment_mode?.code ||
                    "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="p-4 border-t border-border grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <KV label="Cash" value={formatMoney(summary.cash)} />
        <KV label="UPI" value={formatMoney(summary.upi)} />
        <KV label="Bank" value={formatMoney(summary.bank)} />
        <KV
          label="Card"
          value={formatMoney(summary.credit_card || summary.debit_card)}
        />
        <KV label="Total" value={formatMoney(summary.total)} bold />
      </div>
    </Card>
  );
}

function KV({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/70">{label}</span>
      <span className={`tabular-nums ${bold ? "font-bold" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}
