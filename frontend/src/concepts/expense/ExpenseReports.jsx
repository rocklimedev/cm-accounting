import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { api } from "@/lib/api";
import { downloadCsv } from "@/lib/reportsApi";
import { formatMoney, formatDate } from "@/lib/format";
import { ReportFilters } from "@/components/ReportFilters";
import { ReportActionMenu } from "@/components/ReportActionMenu";
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
import { Download } from "lucide-react";
import { useGetExpensesQuery } from "../../api/expense.api"; // <-- adjust path to wherever expenseApi.js actually lives

export default function ExpenseReports() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const def = {
    search: "",
    timeline: "all",
    status: "all",
    submitted_by: "all",
    payment_mode: "all",
    min_amount: "",
    max_amount: "",
  };
  const [filters, setFilters] = useState(def);
  const [applied, setApplied] = useState(def);
  const [employees, setEmployees] = useState([]);

  React.useEffect(() => {
    if (isAdmin)
      api
        .get("/users")
        .then((r) => setEmployees(r.data))
        .catch(() => {});
  }, [isAdmin]);

  // RTK Query: getExpenses has no params, so we always fetch the full set
  const {
    data: allRows = [],
    isFetching: loading,
    refetch,
  } = useGetExpensesQuery();

  // All filtering happens client-side since expenseApi exposes no query params
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
      )
        return false;
      if (applied.status !== "all" && r.status !== applied.status) return false;
      if (
        applied.submitted_by !== "all" &&
        String(r.submitted_by) !== String(applied.submitted_by)
      )
        return false;
      if (
        applied.payment_mode !== "all" &&
        !(r.expense_detail || {})[applied.payment_mode] // e.g. "cash"/"upi"/"bank"/"card" > 0
      )
        return false;
      const total = Number(r.expense_detail?.total) || 0;
      if (applied.min_amount && total < Number(applied.min_amount))
        return false;
      if (applied.max_amount && total > Number(applied.max_amount))
        return false;
      if (applied.timeline !== "all") {
        // adapt this to however ReportFilters encodes timeline (preset key vs date range)
      }
      return true;
    });
  }, [allRows, applied]);

  const exportCsv = () => {
    const cols = [
      { label: "Expense Report ID", get: (r) => r.report_id },
      { label: "Date", get: (r) => r.report_date },
      { label: "Submitted By", get: (r) => r.submitted_by_name },
      { label: "Total Expenses", get: (r) => r.expense_detail?.total },
      { label: "Cash", get: (r) => r.expense_detail?.cash },
      { label: "UPI", get: (r) => r.expense_detail?.upi },
      { label: "Bank", get: (r) => r.expense_detail?.bank },
      { label: "Card", get: (r) => r.expense_detail?.card },
      { label: "Status", get: (r) => r.status },
    ];
    downloadCsv(`chhabra_marble_expenses_${Date.now()}.csv`, rows, cols);
  };

  return (
    <Layout title="Expense Reports">
      <div className="space-y-4">
        <ReportFilters
          filters={filters}
          setFilters={setFilters}
          onApply={() => setApplied(filters)}
          onReset={() => {
            setFilters(def);
            setApplied(def);
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
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              data-testid="expense-export-button"
            >
              <Download className="h-4 w-4 mr-1" /> Export CSV
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
                  <TableHead className="text-right">Total Expenses</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">UPI</TableHead>
                  <TableHead className="text-right">Bank</TableHead>
                  <TableHead className="text-right">Card</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={10}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-sm text-foreground/50 py-12"
                    >
                      No expense reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const d = r.expense_detail || {};
                    return (
                      <TableRow
                        key={r.report_id}
                        className="cursor-pointer hover:bg-secondary/70"
                        onClick={() => navigate(`/reports/${r.report_id}`)}
                      >
                        <TableCell className="font-medium">
                          {r.report_id}
                        </TableCell>
                        <TableCell>{formatDate(r.report_date)}</TableCell>
                        <TableCell>{r.submitted_by_name}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatMoney(d.total)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(d.cash)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(d.upi)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(d.bank)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(d.card)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ReportActionMenu report={r} onChanged={refetch} />
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
    </Layout>
  );
}
