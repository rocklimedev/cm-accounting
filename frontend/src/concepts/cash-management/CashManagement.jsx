import React, { useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../store/use-auth";
import {
  formatMoney,
  formatDate,
  formatDateTime,
  todayStr,
} from "../../lib/format";
import { RupeeInput } from "@/components/FormFields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Banknote, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import {
  useGetCashSummaryQuery,
  useGetLatestCashOpeningQuery,
  useGetCashOpeningQuery,
  useGetCashAdjustmentsQuery,
  useCreateCashOpeningMutation,
  useCreateCashAdjustmentMutation,
} from "../../api/cash.api";

export default function CashManagement() {
  const { user, isAdmin } = useAuth();
  const allowed = isAdmin || (user?.permissions || []).includes("manage_cash");

  const today = todayStr();

  // Date the "history" tables below are filtered by. Defaults to today.
  const [historyDate, setHistoryDate] = useState(today);

  const [openForm, setOpenForm] = useState({
    date: today,
    amount: "",
    reason: "",
  });
  const [adjForm, setAdjForm] = useState({
    date: today,
    type: "add",
    amount: "",
    reason: "",
  });

  // ------------------------------------------------------------------
  // Reads — all driven by RTK Query, so results are cached and refetch
  // automatically whenever a mutation below invalidates their tags.
  // ------------------------------------------------------------------
  const { data: summary, isFetching: summaryLoading } =
    useGetCashSummaryQuery(today);

  const { data: latestOpening } = useGetLatestCashOpeningQuery();

  const { data: opening, isFetching: openingLoading } =
    useGetCashOpeningQuery(historyDate);

  const { data: adjustments = [], isFetching: adjustmentsLoading } =
    useGetCashAdjustmentsQuery(historyDate);

  // ------------------------------------------------------------------
  // Writes — mutations invalidate CashOpening/CashAdjustment/CashSummary
  // tags, so the queries above refetch on their own; no manual `load()`.
  // ------------------------------------------------------------------
  const [createCashOpening, { isLoading: savingOpen }] =
    useCreateCashOpeningMutation();
  const [createCashAdjustment, { isLoading: savingAdj }] =
    useCreateCashAdjustmentMutation();

  const submitOpening = async () => {
    if (Number(openForm.amount || 0) < 0) {
      toast.error("Cash Opening cannot be negative");
      return;
    }
    try {
      await createCashOpening({
        date: openForm.date,
        amount: Number(openForm.amount || 0),
        reason: openForm.reason,
      }).unwrap();
      toast.success("Cash Opening saved");
      setOpenForm({ date: today, amount: "", reason: "" });
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to save cash opening");
    }
  };

  const submitAdjustment = async () => {
    if (Number(adjForm.amount || 0) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    if (!adjForm.reason.trim()) {
      toast.error("A reason is mandatory");
      return;
    }
    try {
      await createCashAdjustment({
        date: adjForm.date,
        type: adjForm.type,
        amount: Number(adjForm.amount || 0),
        reason: adjForm.reason,
      }).unwrap();
      toast.success("Cash Adjustment recorded");
      setAdjForm({ date: today, type: "add", amount: "", reason: "" });
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to record adjustment");
    }
  };

  const s = summary || {};

  return (
    <Layout title="Cash Management">
      <div className="space-y-4">
        {/* Net cash snapshot — fields match CashService.getDailySummary() */}
        <div
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
          data-testid="cash-snapshot"
        >
          <Snap
            label="Cash Opening (Today)"
            value={formatMoney(s.openingAmount)}
            loading={summaryLoading}
          />
          <Snap
            label="Cash In (Income)"
            value={formatMoney(s.income)}
            loading={summaryLoading}
          />
          <Snap
            label="Cash Expenses"
            value={formatMoney(s.expense)}
            loading={summaryLoading}
          />
          <Snap
            label="Adjustments"
            value={formatMoney(s.adjustmentTotal)}
            loading={summaryLoading}
          />
          <Snap
            label="Net Cash in Hand"
            value={formatMoney(s.closing)}
            accent
            testId="cash-net-cash"
            loading={summaryLoading}
          />
        </div>

        {!allowed && (
          <div className="text-sm text-foreground/60 border border-border rounded-md p-3 bg-card">
            You have read-only access to Cash Management. Contact an admin for
            permission to record openings or adjustments.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Enter Cash Opening */}
          <Card className="border border-border rounded-md p-4 bg-card shadow-none">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Enter Cash Opening
            </h2>
            {latestOpening && (
              <p className="text-xs text-foreground/60 mb-3">
                Most recent opening: {formatMoney(latestOpening.amount)} on{" "}
                {formatDate(latestOpening.openingDate)}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={openForm.date}
                  onChange={(e) =>
                    setOpenForm({ ...openForm, date: e.target.value })
                  }
                  data-testid="opening-date"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cash Opening Amount</Label>
                <RupeeInput
                  value={openForm.amount}
                  onChange={(v) => setOpenForm({ ...openForm, amount: v })}
                  testId="opening-amount"
                />
              </div>
            </div>
            <div className="space-y-1 mt-3">
              <Label className="text-xs">
                Reason (required when changing an existing opening)
              </Label>
              <Textarea
                rows={2}
                value={openForm.reason}
                onChange={(e) =>
                  setOpenForm({ ...openForm, reason: e.target.value })
                }
                data-testid="opening-reason"
                placeholder="e.g. Initial opening / correction reason"
              />
            </div>
            <Button
              className="mt-3"
              onClick={submitOpening}
              disabled={savingOpen || !allowed}
              data-testid="opening-submit"
            >
              {savingOpen ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}{" "}
              Save Cash Opening
            </Button>
          </Card>

          {/* Add Cash Adjustment */}
          <Card className="border border-border rounded-md p-4 bg-card shadow-none">
            <h2 className="text-base font-semibold mb-3">
              Add Cash Adjustment
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={adjForm.date}
                  onChange={(e) =>
                    setAdjForm({ ...adjForm, date: e.target.value })
                  }
                  data-testid="adj-date"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={adjForm.type}
                  onValueChange={(v) => setAdjForm({ ...adjForm, type: v })}
                >
                  <SelectTrigger data-testid="adj-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Cash</SelectItem>
                    <SelectItem value="reduce">Reduce Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount</Label>
                <RupeeInput
                  value={adjForm.amount}
                  onChange={(v) => setAdjForm({ ...adjForm, amount: v })}
                  testId="adj-amount"
                />
              </div>
            </div>
            <div className="space-y-1 mt-3">
              <Label className="text-xs">Reason (mandatory)</Label>
              <Textarea
                rows={2}
                value={adjForm.reason}
                onChange={(e) =>
                  setAdjForm({ ...adjForm, reason: e.target.value })
                }
                data-testid="adj-reason"
                placeholder="Reason for adjustment"
              />
            </div>
            <Button
              className="mt-3"
              onClick={submitAdjustment}
              disabled={savingAdj || !allowed}
              data-testid="adj-submit"
            >
              {savingAdj ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}{" "}
              Record Adjustment
            </Button>
          </Card>
        </div>

        {/* History — filtered by a single date, since the backend's
            GET /cash/openings and GET /cash/adjustments both take a
            ?date= query param rather than returning an all-time list. */}
        <div className="flex items-center gap-2">
          <Label className="text-xs">History date</Label>
          <Input
            type="date"
            className="w-40"
            value={historyDate}
            onChange={(e) => setHistoryDate(e.target.value)}
            data-testid="history-date"
          />
        </div>

        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="p-3 border-b border-border font-semibold text-sm">
            Cash Opening — {formatDate(historyDate)}
          </div>
          <div
            className="overflow-x-auto thin-scroll"
            data-testid="opening-history"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Entered By</TableHead>
                  <TableHead>Entered At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openingLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : !opening ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-foreground/50 py-6"
                    >
                      No cash opening entry for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={opening.id}>
                    <TableCell>{formatDate(opening.openingDate)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatMoney(opening.amount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {opening.previousAmount != null
                        ? formatMoney(opening.previousAmount)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {opening.reason || "-"}
                    </TableCell>
                    <TableCell>{opening.user?.name || "-"}</TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(opening.createdAt)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="p-3 border-b border-border font-semibold text-sm">
            Cash Adjustments — {formatDate(historyDate)}
          </div>
          <div
            className="overflow-x-auto thin-scroll"
            data-testid="adjustment-history"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Added At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    </TableCell>
                  </TableRow>
                ) : adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-foreground/50 py-6"
                    >
                      No adjustments for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{formatDate(a.adjustmentDate)}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-sm border ${a.type === "add" ? "border-border" : "border-primary/40 text-primary"}`}
                        >
                          {a.type === "add" ? "Add Cash" : "Reduce Cash"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatMoney(a.amount)}
                      </TableCell>
                      <TableCell className="text-xs">{a.reason}</TableCell>
                      <TableCell>{a.user?.name || "-"}</TableCell>
                      <TableCell className="text-xs">
                        {formatDateTime(a.createdAt)}
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

function Snap({ label, value, accent, testId, loading }) {
  return (
    <Card
      data-testid={testId}
      className={`border border-border rounded-md p-4 bg-card shadow-none ${accent ? "border-l-2 border-l-primary" : ""}`}
    >
      <div className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums mt-1">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : value}
      </div>
    </Card>
  );
}
