import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { api, API } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileText } from "lucide-react";
import { toast } from "sonner";

function buildUrl(path, params) {
  const token = localStorage.getItem("erp_token");
  const q = new URLSearchParams({ token, ...params });
  Object.keys(params).forEach((k) => { if (params[k] === "" || params[k] === "all" || params[k] == null) q.delete(k); });
  return `${API}${path}?${q.toString()}`;
}

export default function ExportReports() {
  const [employees, setEmployees] = useState([]);
  const [reportType, setReportType] = useState("all");
  const [timeline, setTimeline] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [submittedBy, setSubmittedBy] = useState("all");

  useEffect(() => { api.get("/users").then((r) => setEmployees(r.data)).catch(() => {}); }, []);

  const params = () => ({ report_type: reportType, timeline, start, end, submitted_by: submittedBy });
  const go = (path, extra = {}) => {
    const url = buildUrl(path, { ...params(), ...extra });
    window.open(url, "_blank");
    toast.success("Export started");
  };

  const isCustom = timeline === "custom" || timeline === "date_to_date";

  return (
    <Layout title="Export Reports">
      <div className="max-w-4xl space-y-4">
        <Card className="border border-border rounded-md p-5 bg-card shadow-none">
          <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Filtered Reports Export</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1"><Label className="text-xs">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}><SelectTrigger data-testid="export-type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="sales">Sales</SelectItem><SelectItem value="debtor">Debtor</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Date Range</Label>
              <Select value={timeline} onValueChange={setTimeline}><SelectTrigger data-testid="export-timeline"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem><SelectItem value="today">Today</SelectItem><SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem><SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem><SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Submitted By</Label>
              <Select value={submittedBy} onValueChange={setSubmittedBy}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All</SelectItem>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            {isCustom && <>
              <div className="space-y-1"><Label className="text-xs">Start</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">End</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
            </>}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => go("/export/reports/pdf")} data-testid="export-pdf-button"><FileText className="h-4 w-4 mr-1" /> Export PDF</Button>
          </div>
        </Card>

        <Card className="border border-border rounded-md p-5 bg-card shadow-none">
          <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Consolidated Summary Export (PDF)</h2>
          <p className="text-sm text-foreground/60 mb-3">Uses the same date range selected above.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => go("/export/summary/pdf", { group_by: "employee" })} data-testid="export-summary-employee"><FileDown className="h-4 w-4 mr-1" /> Employee-wise</Button>
            <Button variant="outline" onClick={() => go("/export/summary/pdf", { group_by: "date" })} data-testid="export-summary-date"><FileDown className="h-4 w-4 mr-1" /> Date-wise</Button>
          </div>
        </Card>

        <Card className="border border-border rounded-md p-5 bg-card shadow-none">
          <h2 className="text-base font-semibold mb-2">Per-report PDF & Print</h2>
          <p className="text-sm text-foreground/60">Open any report's detail page and use the <span className="font-medium">PDF</span> or <span className="font-medium">Print</span> buttons to export an individual report with full breakdown and organisation header.</p>
        </Card>
      </div>
    </Layout>
  );
}
