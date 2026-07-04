import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { useGetUsersQuery } from "../../api/users.api";
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
import { useGetExpensesQuery } from "../../api/expense.api";
export default function ExpenseReports() {
  const { isAdmin } = useAuth();
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
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-secondary/70"
                      onClick={() => navigate(`/expense-reports/${row.id}`)}
                    >
                      <TableCell className="font-medium">
                        {row.expense_no}
                      </TableCell>
                      <TableCell>{formatDate(row.report_date)}</TableCell>
                      <TableCell>{row.submitted_by_name || "—"}</TableCell>
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
                        <ReportActionMenu report={row} onChanged={refetch} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
