import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { useGetReportsQuery } from "../../api/reports.api"; // ← Adjust path
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

const TYPE_LABEL = { sales: "Sales", debtor: "Debtor", expense: "Expense" };

export default function AllReports() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const initialQ = sp.get("q") || "";

  const [filters, setFilters] = useState({
    search: initialQ,
    report_type: "all",
    timeline: "all",
    status: "all",
    submitted_by: "all",
    min_amount: "",
    max_amount: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // RTK Query
  const {
    data: reportsData,
    isLoading,
    refetch,
  } = useGetReportsQuery({
    ...appliedFilters,
    page,
    page_size: pageSize,
    sort_by: "created_at",
    sort_dir: "desc",
  });

  const { data: usersData } = useGetUsersQuery(undefined, {
    skip: !isAdmin,
  });

  const employees = usersData?.data || usersData || [];

  const rows = reportsData?.rows || [];
  const total = reportsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: "",
      report_type: "all",
      timeline: "all",
      status: "all",
      submitted_by: "all",
      min_amount: "",
      max_amount: "",
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  };

  // Export Excel
  const exportXlsx = async () => {
    try {
      // You can also use a simple URL method like before
      const token = localStorage.getItem("erp_token");
      const params = new URLSearchParams({
        token,
        report_type: appliedFilters.report_type || "all",
        timeline: appliedFilters.timeline || "all",
        submitted_by: appliedFilters.submitted_by || "all",
      });

      window.open(
        `${import.meta.env.VITE_API_URL || "http://localhost:3005"}/export/reports/excel?${params}`,
        "_blank",
      );
      toast.success("Export started");
    } catch (err) {
      toast.error("Failed to start export");
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

        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border">
            <div className="text-sm text-foreground/70">
              {total} report{total !== 1 ? "s" : ""}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={exportXlsx}>
                <Download className="h-4 w-4 mr-1" /> Export Excel
              </Button>
            </div>
          </div>

          <div
            className="overflow-x-auto thin-scroll"
            data-testid="reports-table"
          >
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
                      className="text-center text-sm text-foreground/50 py-12"
                    >
                      No reports found. Adjust filters or create a new report.
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
                      <TableCell>
                        {TYPE_LABEL[r.report_type] || r.report_type}
                      </TableCell>
                      <TableCell>{r.submitted_by_name}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatMoney(r.main_amount)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDateTime(r.submitted_at)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDateTime(r.updated_at)}
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

          {/* Pagination */}
          <div className="flex items-center justify-between p-3 border-t border-border">
            <span className="text-xs text-foreground/60">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
