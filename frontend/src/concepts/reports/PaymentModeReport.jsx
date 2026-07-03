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
import { useGetPaymentModeReportQuery } from "../../api/payment-mode.api"; // Adjust path as needed

export default function PaymentModeReport() {
  const [timeline, setTimeline] = useState("this_month");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [appliedRange, setAppliedRange] = useState({ start: "", end: "" });

  const isCustom = timeline === "custom" || timeline === "date_to_date";

  // Prepare query parameters
  const queryParams = isCustom
    ? { from: appliedRange.start, to: appliedRange.end }
    : { timeline };

  const { data: apiResponse, isFetching: loading } =
    useGetPaymentModeReportQuery(queryParams, {
      skip: isCustom && (!appliedRange.start || !appliedRange.end),
    });

  const report = apiResponse?.data || [];

  const onApply = () => {
    if (start && end) {
      setAppliedRange({ start, end });
    }
  };

  // Calculate Grand Totals
  const totals = report.reduce(
    (acc, item) => ({
      expenses: acc.expenses + (item.totalExpenses || 0),
      debtorReceived: acc.debtorReceived + (item.totalDebtorReceived || 0),
      newDebtors: acc.newDebtors + (item.totalNewDebtors || 0),
      netMovement: acc.netMovement + (item.netAmount || 0),
    }),
    {
      expenses: 0,
      debtorReceived: 0,
      newDebtors: 0,
      netMovement: 0,
    },
  );

  return (
    <Layout title="Payment Mode Reconciliation Report">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/60 max-w-xl">
            Payment mode wise reconciliation based on Expenses and Debtor
            Entries.{" "}
            <span className="font-medium">
              Net Movement = Debtor Received - Expenses
            </span>
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
          <Skeleton className="h-80 w-full rounded-md" />
        ) : report.length > 0 ? (
          <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
            <div
              className="overflow-x-auto thin-scroll"
              data-testid="payment-mode-report-table"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">
                      Debtor Received
                    </TableHead>
                    <TableHead className="text-right">New Debtors</TableHead>
                    <TableHead className="text-right">Net Movement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.map((item) => (
                    <TableRow key={item.paymentModeId}>
                      <TableCell className="font-medium">
                        {item.paymentModeName}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({item.paymentModeCode})
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.totalExpenses)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.totalDebtorReceived)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(item.totalNewDebtors)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums font-semibold ${
                          item.netAmount >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatMoney(item.netAmount)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total Row */}
                  <TableRow className="bg-secondary/80 font-bold border-t-2">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(totals.expenses)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(totals.debtorReceived)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(totals.newDebtors)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(totals.netMovement)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No data available for the selected period.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
