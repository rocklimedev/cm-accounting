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

import {
  useGetLatestReportQuery,
  useGetDebtorBalanceQuery,
} from "../../api/debtor.api";

export default function DebtorReports() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const defaultFilters = {
    search: "",
    timeline: "all",
    status: "all",
    submitted_by: "all",
    transaction_type: "all",
    payment_mode: "all",
    min_amount: "",
    max_amount: "",
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);

  // Latest debtor report (raw API shape)
  const {
    data: rawReports = [],
    isFetching: loading,
    refetch,
  } = useGetLatestReportQuery();

  // Fetch users only if admin
  const { data: employees = [] } = useGetUsersQuery(undefined, {
    skip: !isAdmin,
  });

  // Outstanding balance
  const { data: balanceData } = useGetDebtorBalanceQuery(applied.search, {
    skip: !applied.search,
  });

  // Lookup map for submitter names (id -> name)
  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach((emp) => {
      map[emp.id] = emp.name || emp.full_name || emp.username;
    });
    return map;
  }, [employees]);

  // Normalize the raw API report shape into the flat row shape the
  // table/filter logic below expects (report_date, new_debtor, etc.)
  const allRows = useMemo(() => {
    return rawReports.map((report) => {
      const entries = report.entries || [];
      // A report can contain multiple entries (e.g. split across payment
      // modes). We surface the first entry's type/mode for filtering &
      // display; totals still come from the report-level fields.
      const firstEntry = entries[0] || {};

      return {
        report_id: report.id,
        report_date: report.reportDate,
        submitted_by: report.submittedBy,
        submitted_by_name:
          employeeMap[report.submittedBy] || report.submittedBy,
        new_debtor: Number(report.newDebtorTotal) || 0,
        debtor_received: Number(report.receivedTotal) || 0,
        closing_debtor: Number(report.closingAmount) || 0,
        status: report.status,
        transaction_type: firstEntry.entryType || null,
        payment_mode: firstEntry.paymentMode?.code || null,
        payment_mode_name: firstEntry.paymentMode?.name || null,
        entries,
      };
    });
  }, [rawReports, employeeMap]);

  const outstanding = applied.search
    ? balanceData?.outstanding_debtor || 0
    : allRows.reduce((sum, row) => sum + (Number(row.closing_debtor) || 0), 0);

  const rows = useMemo(() => {
    return allRows.filter((row) => {
      if (applied.status !== "all" && row.status !== applied.status) {
        return false;
      }

      if (
        applied.submitted_by !== "all" &&
        String(row.submitted_by) !== String(applied.submitted_by)
      ) {
        return false;
      }

      if (
        applied.transaction_type !== "all" &&
        row.transaction_type !== applied.transaction_type
      ) {
        return false;
      }

      if (
        applied.payment_mode !== "all" &&
        row.payment_mode !== applied.payment_mode
      ) {
        return false;
      }

      if (
        applied.min_amount &&
        Number(row.closing_debtor) < Number(applied.min_amount)
      ) {
        return false;
      }

      if (
        applied.max_amount &&
        Number(row.closing_debtor) > Number(applied.max_amount)
      ) {
        return false;
      }

      return true;
    });
  }, [allRows, applied]);

  const exportCsv = () => {
    const columns = [
      {
        label: "Debtor Report ID",
        get: (row) => row.report_id,
      },
      {
        label: "Date",
        get: (row) => row.report_date,
      },
      {
        label: "Submitted By",
        get: (row) => row.submitted_by_name,
      },
      {
        label: "New Debtor",
        get: (row) => row.new_debtor,
      },
      {
        label: "Debtor Received",
        get: (row) => row.debtor_received,
      },
      {
        label: "Closing Debtor",
        get: (row) => row.closing_debtor,
      },
      {
        label: "Status",
        get: (row) => row.status,
      },
    ];

    downloadCsv(`chhabra_marble_debtor_${Date.now()}.csv`, rows, columns);
  };

  return (
    <Layout title="Debtor Reports">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground/60">
            Current Outstanding Debtor:{" "}
            <span
              className="font-bold text-foreground"
              data-testid="debtor-outstanding-total"
            >
              {formatMoney(outstanding)}
            </span>
          </div>
        </div>

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
          showTransaction
          showPaymentMode
        />

        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="text-sm text-foreground/70">
              {rows.length} debtor report{rows.length !== 1 ? "s" : ""}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              data-testid="debtor-export-button"
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
                  <TableHead className="text-right">New Debtor</TableHead>
                  <TableHead className="text-right">Debtor Received</TableHead>
                  <TableHead className="text-right">Closing Debtor</TableHead>
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
                      No debtor reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.report_id}
                      className="cursor-pointer hover:bg-secondary/70"
                      onClick={() => navigate(`/reports/${row.report_id}`)}
                    >
                      <TableCell className="font-medium">
                        {row.report_id}
                      </TableCell>

                      <TableCell>{formatDate(row.report_date)}</TableCell>

                      <TableCell>{row.submitted_by_name}</TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.new_debtor)}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.debtor_received)}
                      </TableCell>

                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatMoney(row.closing_debtor)}
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
