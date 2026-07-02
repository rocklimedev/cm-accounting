import React, { useState } from "react";
import Layout from "@/components/Layout";
import { formatMoney } from "@/lib/format";
import { TimelineFilter } from "@/components/TimelineFilter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetReconciliationQuery } from "../../api/ledger.api"; // <-- adjust path to wherever ledgerApi.js actually lives

export default function PaymentModeReport() {
  const [timeline, setTimeline] = useState("this_month");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [appliedRange, setAppliedRange] = useState({ start: "", end: "" });

  const isCustom = timeline === "custom" || timeline === "date_to_date";
  const params = isCustom
    ? { timeline, start: appliedRange.start, end: appliedRange.end }
    : { timeline };

  const { data, isFetching: loading } = useGetReconciliationQuery(params, {
    skip: isCustom && (!appliedRange.start || !appliedRange.end),
  });

  const onApply = () => {
    if (start && end) setAppliedRange({ start, end });
  };

  const cash = data?.cash || {};

  return (
    <Layout title="Payment Mode Reconciliation Report">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/60 max-w-xl">
            Automatically calculated from Retail Sales, Debtor Received and
            Expenses. New Debtor is never included.{" "}
            <span className="font-medium">
              Net Movement = Retail + Debtor Received &minus; Expenses
            </span>
            .
          </p>
          <TimelineFilter
            timeline={timeline}
            setTimeline={setTimeline}
            start={start}
            end={end}
            setStart={setStart}
            setEnd={setEnd}
            onApply={onApply}
          />
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full rounded-md" />
        ) : (
          data && (
            <>
              <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
                <div
                  className="overflow-x-auto thin-scroll"
                  data-testid="reconciliation-table"
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead className="text-right">Retail</TableHead>
                        <TableHead className="text-right">
                          Debtor Received
                        </TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">
                          Net Movement
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.rows.map((r) => (
                        <TableRow
                          key={r.mode}
                          data-testid={`recon-row-${r.mode}`}
                        >
                          <TableCell className="font-medium">
                            {r.label}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(r.retail)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(r.debtor_received)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(r.expenses)}
                          </TableCell>
                          <TableCell
                            className={`text-right tabular-nums font-semibold ${r.net_movement < 0 ? "text-primary" : ""}`}
                          >
                            {formatMoney(r.net_movement)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-secondary font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(data.totals.retail)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(data.totals.debtor_received)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(data.totals.expenses)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(data.totals.net_movement)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>

              <Card
                className="border border-border rounded-md bg-card shadow-none p-4 max-w-md"
                data-testid="cash-reconciliation-summary"
              >
                <h2 className="text-base font-semibold mb-3">
                  Cash Reconciliation
                </h2>
                <Row
                  label="Cash Opening"
                  value={formatMoney(cash.cash_opening)}
                />
                <Row
                  label="Cash Retail"
                  value={formatMoney(cash.cash_retail)}
                />
                <Row
                  label="Cash Debtor Received"
                  value={formatMoney(cash.cash_debtor_received)}
                />
                <Row
                  label="Cash Expenses"
                  value={`- ${formatMoney(cash.cash_expenses)}`}
                />
                <Row
                  label="Cash Net Movement"
                  value={formatMoney(cash.cash_net_movement)}
                />
                <Row
                  label="Cash Adjustments"
                  value={formatMoney(cash.cash_adjustments)}
                />
                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                  <span className="font-semibold">Net Cash in Hand</span>
                  <span
                    className="text-lg font-bold tabular-nums"
                    data-testid="recon-net-cash"
                  >
                    {formatMoney(cash.net_cash_in_hand)}
                  </span>
                </div>
              </Card>
            </>
          )
        )}
      </div>
    </Layout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-foreground/70">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
