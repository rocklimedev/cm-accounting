import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { useAuth } from "../../store/use-auth";
import { useGetDashboardQuery } from "../../api/reports.api"; // adjust path to where reportsApi lives
import { formatMoney, formatNumber, formatDate } from "../../lib/format";
import { TimelineFilter } from "../../components/TimelineFilter";
import { StatusBadge } from "../../components/StatusBadge";
import { CHART, SLICE_FILLS } from "../../components/chartTheme";
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function SummaryCard({ label, value, sub, testId, accent }) {
  return (
    <Card
      data-testid={testId}
      className={`border border-border rounded-md p-4 bg-card shadow-none ${accent ? "border-l-2 border-l-primary" : ""}`}
    >
      <div className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
      {sub && <div className="text-xs text-foreground/60 mt-1">{sub}</div>}
    </Card>
  );
}

function ChartCard({ title, subtitle, children, testId, empty }) {
  return (
    <Card
      data-testid={testId}
      className="border border-border rounded-md p-4 bg-card shadow-none"
    >
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && (
          <span className="text-xs text-foreground/60">{subtitle}</span>
        )}
      </div>
      {empty ? (
        <div className="h-56 flex items-center justify-center text-sm text-foreground/50">
          No data for the selected period
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

const TL = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  last_3_months: "Last 3 Months",
  last_6_months: "Last 6 Months",
  custom: "Custom Range",
  date_to_date: "Custom Range",
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [timeline, setTimeline] = useState("this_month");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  // Only these get sent to the query — decoupled from the raw
  // date inputs so typing doesn't trigger a fetch on every keystroke.
  const [appliedRange, setAppliedRange] = useState({ start: "", end: "" });

  const isCustom = timeline === "custom" || timeline === "date_to_date";

  const queryParams = useMemo(() => {
    const params = { timeline };
    if (isCustom) {
      params.start = appliedRange.start;
      params.end = appliedRange.end;
    }
    return params;
  }, [timeline, isCustom, appliedRange]);

  const shouldSkip = isCustom && (!appliedRange.start || !appliedRange.end);

  const { data, isFetching } = useGetDashboardQuery(queryParams, {
    skip: shouldSkip,
  });

  const onApply = () => {
    if (start && end) setAppliedRange({ start, end });
  };

  const loading = isFetching && !data;

  const c = data?.cards || {};
  const subLabel = TL[timeline] || timeline;

  const debtorTrendData = data
    ? [
        { label: "Opening", value: data.debtor_trend.opening },
        { label: "New Debtor", value: data.debtor_trend.new_debtor },
        { label: "Received", value: data.debtor_trend.received },
        { label: "Closing", value: data.debtor_trend.closing },
      ]
    : [];

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-foreground/60">
              Welcome back,{" "}
              <span className="font-semibold text-foreground">
                {user?.name}
              </span>
            </div>
            <div className="text-xs text-foreground/50">
              Chhabra Marble accounting overview &middot; {subLabel}
            </div>
          </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-2 lg:grid-cols-6 gap-3"
            data-testid="dashboard-summary-cards"
          >
            <SummaryCard
              label="Cash Opening"
              value={formatMoney(c.cash_opening)}
              testId="card-cash-opening"
            />
            <SummaryCard
              label="Retail Sales"
              value={formatMoney(c.retail_sales)}
              testId="card-retail-sales"
            />
            <SummaryCard
              label="Debtor Received"
              value={formatMoney(c.debtor_received)}
              testId="card-debtor-received"
            />
            <SummaryCard
              label="Outstanding Debtor"
              value={formatMoney(c.outstanding_debtor)}
              testId="card-outstanding-debtor"
              accent
            />
            <SummaryCard
              label="Total Expenses"
              value={formatMoney(c.total_expenses)}
              testId="card-total-expenses"
            />
            <SummaryCard
              label="Net Cash in Hand"
              value={formatMoney(c.net_cash_in_hand)}
              testId="card-net-cash"
              accent
            />
          </div>
        )}

        {!loading && data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SummaryCard
                label="Total Realised Sales"
                value={formatMoney(c.total_realised_sales)}
                sub="Total Retail + Debtor Received"
                testId="card-total-realised"
              />
              <SummaryCard
                label="New Debtor Added"
                value={formatMoney(c.new_debtor_added)}
                sub={
                  c.new_debtor_last_date
                    ? formatDate(c.new_debtor_last_date)
                    : "No new debtor in period"
                }
                testId="card-new-debtor-added"
              />
              <SummaryCard
                label="Draft Reports"
                value={formatNumber(c.draft_count || 0)}
                sub="Pending submission"
                testId="card-reports-count"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartCard
                  title="Retail, Debtor Received & Expenses"
                  subtitle={subLabel}
                  testId="chart-retail-expenses"
                  empty={!data.series?.length}
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.series}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={CHART.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: CHART.label }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: CHART.label }} />
                      <Tooltip formatter={(v) => formatMoney(v)} />
                      <Legend />
                      <Bar
                        dataKey="retail"
                        name="Retail"
                        fill={CHART.sales}
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="debtor_received"
                        name="Debtor Received"
                        fill={SLICE_FILLS[2]}
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="expenses"
                        name="Expenses"
                        fill={CHART.expenses}
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <ChartCard
                title="Realised Receipts by Mode"
                subtitle="Retail + Debtor Received"
                testId="chart-payment-mode"
                empty={!(data.payment_receipts || []).some((p) => p.amount > 0)}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={(data.payment_receipts || []).filter(
                        (p) => p.amount > 0,
                      )}
                      dataKey="amount"
                      nameKey="label"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="#fff"
                    >
                      {(data.payment_receipts || [])
                        .filter((p) => p.amount > 0)
                        .map((e, i) => (
                          <Cell
                            key={i}
                            fill={SLICE_FILLS[i % SLICE_FILLS.length]}
                          />
                        ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {(data.payment_receipts || []).map((p, i) => (
                    <div
                      key={p.key}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{
                            background: SLICE_FILLS[i % SLICE_FILLS.length],
                          }}
                        />
                        {p.label}
                      </span>
                      <span className="tabular-nums font-medium">
                        {formatMoney(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ChartCard
                  title="Outstanding Debtor Trend"
                  subtitle={subLabel}
                  testId="chart-debtor-trend"
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={debtorTrendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={CHART.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: CHART.label }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: CHART.label }} />
                      <Tooltip formatter={(v) => formatMoney(v)} />
                      <Bar dataKey="value" name="Amount" radius={[2, 2, 0, 0]}>
                        {debtorTrendData.map((e, i) => (
                          <Cell
                            key={i}
                            fill={
                              i === 3
                                ? CHART.sales
                                : i === 2
                                  ? SLICE_FILLS[2]
                                  : CHART.label
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <Card
                className="border border-border rounded-md p-4 bg-card shadow-none"
                data-testid="payment-mode-summary"
              >
                <h2 className="text-base font-semibold mb-3">
                  Payment Mode Net Movement
                </h2>
                <div className="space-y-2">
                  {(data.payment_mode_summary || []).map((p) => (
                    <div
                      key={p.key}
                      className="flex items-center justify-between text-sm border-b border-border pb-1.5"
                    >
                      <span className="font-medium">{p.label}</span>
                      <span
                        className={`tabular-nums font-semibold ${p.net_movement < 0 ? "text-primary" : ""}`}
                      >
                        {formatMoney(p.net_movement)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">Net Cash in Hand</span>
                  <span className="tabular-nums font-bold">
                    {formatMoney(c.net_cash_in_hand)}
                  </span>
                </div>
              </Card>
            </div>

            <Card
              className="border border-border rounded-md bg-card shadow-none overflow-hidden"
              data-testid="recent-reports-table"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-base font-semibold">Recent Reports</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(isAdmin ? "/all-reports" : "/sales-reports")
                  }
                  data-testid="view-all-reports-button"
                >
                  View all
                </Button>
              </div>
              <div className="overflow-x-auto thin-scroll">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.recent_reports || []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-sm text-foreground/50 py-8"
                        >
                          No reports yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recent_reports.map((r) => (
                        <TableRow
                          key={r.report_id}
                          className="cursor-pointer hover:bg-secondary/70"
                          onClick={() => navigate(`/reports/${r.report_id}`)}
                        >
                          <TableCell className="font-medium">
                            {r.report_id}
                          </TableCell>
                          <TableCell>{formatDate(r.report_date)}</TableCell>
                          <TableCell className="capitalize">
                            {r.report_type}
                          </TableCell>
                          <TableCell>{r.submitted_by_name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(r.amount)}
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
          </>
        )}
      </div>
    </Layout>
  );
}
