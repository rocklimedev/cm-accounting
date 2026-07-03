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
import { useGetSalesQuery } from "../../api/sales.api";

export default function SalesReports() {
  const { isAdmin } = useAuth();
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
                  rows.map((report) => (
                    <TableRow
                      key={report.report_id}
                      className="cursor-pointer hover:bg-secondary/70"
                      onClick={() => navigate(`/reports/${report.report_id}`)}
                    >
                      <TableCell className="font-medium">
                        {report.sales_no}
                      </TableCell>

                      <TableCell>{formatDate(report.report_date)}</TableCell>

                      <TableCell>{report.submitted_by_name}</TableCell>

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
                        <ReportActionMenu report={report} onChanged={refetch} />
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
