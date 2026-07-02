import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Search } from "lucide-react";

export default function SearchResults() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(sp.get("q") || "");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const run = (term) => {
    if (!term || !term.trim()) {
      setRows([]);
      return;
    }
    setLoading(true);
    api
      .get("/search", { params: { q: term } })
      .then((r) => setRows(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    run(sp.get("q") || ""); /* eslint-disable-next-line */
  }, [sp.get("q")]);

  const submit = (e) => {
    e.preventDefault();
    setSp({ q });
  };

  return (
    <Layout title="Search">
      <div className="space-y-4">
        <form onSubmit={submit} className="flex gap-2 max-w-xl">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by report ID, employee, expense name, reference..."
            data-testid="search-page-input"
          />
          <Button type="submit" data-testid="search-page-button">
            <Search className="h-4 w-4 mr-1" /> Search
          </Button>
        </form>
        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="p-3 border-b border-border text-sm text-foreground/70">
            {rows.length} result{rows.length !== 1 ? "s" : ""}
            {sp.get("q") ? ` for \u201c${sp.get("q")}\u201d` : ""}
          </div>
          <div className="overflow-x-auto thin-scroll">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-foreground/50 py-10"
                    >
                      No results. Try a different search term.
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
                      <TableCell className="capitalize">
                        {r.report_type}
                      </TableCell>
                      <TableCell>{formatDate(r.report_date)}</TableCell>
                      <TableCell>{r.submitted_by_name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(r.main_amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
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
