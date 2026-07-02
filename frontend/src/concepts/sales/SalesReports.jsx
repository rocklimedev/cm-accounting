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
import { useGetSalesQuery } from "../../api/sales.api"; // <-- adjust path to wherever salesApi.js actually lives

export default function SalesReports() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const def = {
    search: "",
    timeline: "all",
    status: "all",
    submitted_by: "all",
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

  const {
    data: allRows = [],
    isFetching: loading,
    refetch,
  } = useGetSalesQuery();

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
      const gross = Number(r.gross_amount) || 0;
      if (applied.min_amount && gross < Number(applied.min_amount))
        return false;
      if (applied.max_amount && gross > Number(applied.max_amount))
        return false;
      if (applied.timeline !== "all") {
        // adapt to however ReportFilters encodes timeline
      }
      return true;
    });
  }, [allRows, applied]);

  const exportCsv = () => {
    const cols = [
      { label: "Sales Report ID", get: (r) => r.report_id },
      { label: "Date", get: (r) => r.report_date },
      { label: "Submitted By", get: (r) => r.submitted_by_name },
      { label: "Gross Amount", get: (r) => r.gross_amount },
      { label: "Retail", get: (r) => r.retail },
      { label: "Debtor", get: (r) => r.debtor },
      { label: "Status", get: (r) => r.status },
    ];
    downloadCsv(`chhabra_marble_sales_${Date.now()}.csv`, rows, cols);
  };

  return (
    <Layout title="Sales Reports">
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
                  <TableHead className="text-right">Gross Amount</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead className="text-right">Debtor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
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
                      No sales reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
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
                        {formatMoney(r.gross_amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(r.retail)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(r.debtor)}
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
