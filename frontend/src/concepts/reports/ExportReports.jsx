import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";

// RTK Query for employees (users)
import { useGetUsersQuery } from "../../api/users.api"; // Adjust path as needed

const BACKEND_URL = "http://localhost:3005"; // Keep consistent

function buildExportUrl(path, params) {
  const token = localStorage.getItem("erp_token");

  const queryParams = new URLSearchParams({
    token,
    ...params,
  });

  // Clean empty / default values
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === "" || value === "all" || value == null) {
      queryParams.delete(key);
    }
  });

  return `${BACKEND_URL}${path}?${queryParams.toString()}`;
}

export default function ExportReports() {
  const [reportType, setReportType] = useState("all");
  const [timeline, setTimeline] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [submittedBy, setSubmittedBy] = useState("all");

  // Fetch employees using RTK Query
  const { data: usersData, isLoading: employeesLoading } = useGetUsersQuery();
  const employees = usersData?.data || usersData || [];

  const isCustom = timeline === "custom" || timeline === "date_to_date";

  const getParams = () => ({
    report_type: reportType,
    timeline,
    start,
    end,
    submitted_by: submittedBy,
  });

  const exportReport = (path, extra) => {
    const url = buildExportUrl(path, { ...getParams(), ...extra });
    window.open(url, "_blank");
    toast.success("Export started in new tab");
  };

  return (
    <Layout title="Export Reports">
      <div className="max-w-4xl space-y-6">
        {/* Filtered Reports Export */}
        <Card className="border border-border rounded-md p-6 bg-card shadow-none">
          <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">
            Filtered Reports Export
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="export-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="debtor">Debtor</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date Range</Label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger data-testid="export-timeline">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Submitted By</Label>
              <Select
                value={submittedBy}
                onValueChange={setSubmittedBy}
                disabled={employeesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isCustom && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => exportReport("/export/reports/pdf")}
              data-testid="export-pdf-button"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </Card>

        {/* Consolidated Summary */}
        <Card className="border border-border rounded-md p-6 bg-card shadow-none">
          <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">
            Consolidated Summary Export (PDF)
          </h2>
          <p className="text-sm text-foreground/60 mb-4">
            Uses the same filters and date range selected above.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                exportReport("/export/summary/pdf", { group_by: "employee" })
              }
              data-testid="export-summary-employee"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Employee-wise
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                exportReport("/export/summary/pdf", { group_by: "date" })
              }
              data-testid="export-summary-date"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Date-wise
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="border border-border rounded-md p-6 bg-card shadow-none">
          <h2 className="text-base font-semibold mb-2">
            Per-report PDF &amp; Print
          </h2>
          <p className="text-sm text-foreground/60">
            Open any individual report detail page and use the{" "}
            <span className="font-medium text-foreground">PDF</span> or{" "}
            <span className="font-medium text-foreground">Print</span> buttons
            for a formatted export with full breakdown and organization header.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
