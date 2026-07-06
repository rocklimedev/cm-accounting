import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { useGetReportsQuery } from "../../api/reports.api";
import { useGetUsersQuery } from "../../api/users.api";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { ReportFilters } from "@/components/ReportFilters";
import { ReportActionMenu } from "@/components/ReportActionMenu";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const TYPE_LABEL = {
  sales: "Sales",
  expense: "Expense",
  debtor: "Debtor",
};

export default function AllReports() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [filters, setFilters] = useState({
    search: searchParams.get("q") || "",
    report_type: "all",
    timeline: "all",
    status: "all",
    submitted_by: "all",
    min_amount: "",
    max_amount: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const { data, isLoading, refetch } = useGetReportsQuery({
    ...appliedFilters,
    page,
    page_size: pageSize,
    sort_by: "created_at",
    sort_dir: "desc",
  });
  const getReportRoute = (report) => {
    switch (report.report_type) {
      case "sales":
        return `/sales-reports/${report.report_id}`;

      case "expense":
        return `/expense-reports/${report.report_id}`;

      case "debtor":
        return `/debtor-reports/${report.report_id}`;

      default:
        return `/reports/${report.report_id}`;
    }
  };
  const { data: usersData } = useGetUsersQuery(undefined, {
    skip: !isAdmin,
  });

  const employees = usersData?.data || usersData || [];

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const resetFilters = () => {
    const defaults = {
      search: "",
      report_type: "all",
      timeline: "all",
      status: "all",
      submitted_by: "all",
      min_amount: "",
      max_amount: "",
    };

    setFilters(defaults);
    setAppliedFilters(defaults);
    setPage(1);
  };

  const exportXlsx = () => {
    try {
      const token = localStorage.getItem("erp_token");

      const params = new URLSearchParams({
        token,
        report_type: appliedFilters.report_type,
        timeline: appliedFilters.timeline,
        status: appliedFilters.status,
        submitted_by: appliedFilters.submitted_by,
        min_amount: appliedFilters.min_amount,
        max_amount: appliedFilters.max_amount,
      });

      window.open(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3005"
        }/export/reports/excel?${params}`,
        "_blank",
      );

      toast.success("Export started");
    } catch {
      toast.error("Failed to export");
    }
  };

  return (
    <Layout title="All Reports">
      <div className="space-y-4">
        <ReportFilters
          filters={filters}
          setFilters={setFilters}
          onApply={applyFilters}
          onReset={resetFilters}
          employees={isAdmin ? employees : []}
        />

        <Card className="border rounded-md overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="text-sm text-muted-foreground">
              {total} report{total !== 1 && "s"}
            </div>

            <div className="flex gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={exportXlsx}>
                <Download className="mr-1 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Main Amount</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No reports found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow
                      key={r.report_id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(getReportRoute(r))}
                    >
                      <TableCell className="font-medium">
                        {r.report_no}
                      </TableCell>

                      <TableCell>{formatDate(r.report_date)}</TableCell>

                      <TableCell>{TYPE_LABEL[r.report_type]}</TableCell>

                      <TableCell>{r.created_by_name || "-"}</TableCell>

                      <TableCell className="text-right font-semibold">
                        {formatMoney(r.main_amount)}
                      </TableCell>

                      <TableCell>{formatDateTime(r.submitted_at)}</TableCell>

                      <TableCell>{formatDateTime(r.updated_at)}</TableCell>

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

          <div className="flex items-center justify-between p-3 border-t">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
