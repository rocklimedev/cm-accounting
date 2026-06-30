import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { ReportActionMenu } from "@/components/ReportActionMenu";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileEdit } from "lucide-react";

export default function Drafts() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/drafts"); setRows(res.data.rows); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <Layout title="Drafts">
      <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
        <div className="p-3 border-b border-border text-sm text-foreground/70">{rows.length} draft{rows.length !== 1 ? "s" : ""}</div>
        <div className="overflow-x-auto thin-scroll" data-testid="reports-table">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Report ID</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead><TableHead>Last Updated</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
              : rows.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-sm text-foreground/50 py-12"><FileEdit className="h-6 w-6 mx-auto mb-2 text-foreground/30" />No drafts. Start a new report from Add Report.</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.report_id} className="cursor-pointer hover:bg-secondary/70" onClick={() => navigate(`/reports/${r.report_id}`)}>
                  <TableCell className="font-medium">{r.report_id}</TableCell>
                  <TableCell>{formatDate(r.report_date)}</TableCell>
                  <TableCell className="capitalize">{r.report_type}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(r.main_amount)}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(r.updated_at)}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}><ReportActionMenu report={r} onChanged={load} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Layout>
  );
}
