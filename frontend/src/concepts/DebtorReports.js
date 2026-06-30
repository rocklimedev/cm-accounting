import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { buildParams, fetchReports, downloadCsv } from "@/lib/reportsApi";
import { formatMoney, formatDate } from "@/lib/format";
import { ReportFilters } from "@/components/ReportFilters";
import { ReportActionMenu } from "@/components/ReportActionMenu";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

export default function DebtorReports() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const def = { search: "", timeline: "all", status: "all", submitted_by: "all", transaction_type: "all", payment_mode: "all", min_amount: "", max_amount: "" };
  const [filters, setFilters] = useState(def);
  const [applied, setApplied] = useState(def);
  const [rows, setRows] = useState([]);
  const [outstanding, setOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (isAdmin) api.get("/users").then((r) => setEmployees(r.data)).catch(() => {});
    api.get("/debtor-reports/outstanding").then((r) => setOutstanding(r.data.outstanding_debtor || 0)).catch(() => {});
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams(applied, { report_type: "debtor", page: 1, page_size: 500 });
      const res = await fetchReports(params);
      setRows(res.rows);
    } finally { setLoading(false); }
  }, [applied]);
  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const cols = [
      { label: "Debtor Report ID", get: (r) => r.report_id }, { label: "Date", get: (r) => r.report_date },
      { label: "Submitted By", get: (r) => r.submitted_by_name }, { label: "New Debtor", get: (r) => r.new_debtor },
      { label: "Debtor Received", get: (r) => r.debtor_received }, { label: "Closing Debtor", get: (r) => r.closing_debtor }, { label: "Status", get: (r) => r.status },
    ];
    downloadCsv(`chhabra_marble_debtor_${Date.now()}.csv`, rows, cols);
  };

  return (
    <Layout title="Debtor Reports">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-foreground/60">Current Outstanding Debtor: <span className="font-bold text-foreground" data-testid="debtor-outstanding-total">{formatMoney(outstanding)}</span></div>
        </div>
        <ReportFilters filters={filters} setFilters={setFilters} onApply={() => setApplied(filters)} onReset={() => { setFilters(def); setApplied(def); }} employees={isAdmin ? employees : []} showType={false} showTransaction showPaymentMode />
        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="text-sm text-foreground/70">{rows.length} debtor report{rows.length !== 1 ? "s" : ""}</div>
            <Button variant="outline" size="sm" onClick={exportCsv} data-testid="debtor-export-button"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          </div>
          <div className="overflow-x-auto thin-scroll" data-testid="reports-table">
            <Table>
              <TableHeader><TableRow>
                <TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Submitted By</TableHead>
                <TableHead className="text-right">New Debtor</TableHead><TableHead className="text-right">Debtor Received</TableHead><TableHead className="text-right">Closing Debtor</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
                : rows.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-sm text-foreground/50 py-12">No debtor reports found</TableCell></TableRow>
                : rows.map((r) => (
                  <TableRow key={r.report_id} className="cursor-pointer hover:bg-secondary/70" onClick={() => navigate(`/reports/${r.report_id}`)}>
                    <TableCell className="font-medium">{r.report_id}</TableCell>
                    <TableCell>{formatDate(r.report_date)}</TableCell>
                    <TableCell>{r.submitted_by_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.new_debtor)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(r.debtor_received)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{formatMoney(r.closing_debtor)}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}><ReportActionMenu report={r} onChanged={load} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
