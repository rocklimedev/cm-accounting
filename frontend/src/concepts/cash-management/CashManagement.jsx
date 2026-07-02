import React, { useCallback, useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useAuth } from "../../store/use-auth";
import { api } from "../../lib/api";
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
import { Loader2, Banknote, PlusCircle, Lock } from "lucide-react";
import { toast } from "sonner";

export default function CashManagement() {
  const { user, isAdmin } = useAuth();
  const allowed = isAdmin || (user?.permissions || []).includes("manage_cash");

  const [summary, setSummary] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [openForm, setOpenForm] = useState({
    date: todayStr(),
    amount: "",
    reason: "",
  });
  const [adjForm, setAdjForm] = useState({
    date: todayStr(),
    type: "add",
    amount: "",
    reason: "",
  });
  const [savingOpen, setSavingOpen] = useState(false);
  const [savingAdj, setSavingAdj] = useState(false);

  const load = useCallback(async () => {
    const [s, o, a] = await Promise.all([
      api.get("/cash/summary", { params: { timeline: "today" } }),
      api.get("/cash/openings"),
      api.get("/cash/adjustments"),
    ]);
    setSummary(s.data);
    setOpenings(o.data.rows || []);
    setAdjustments(a.data.rows || []);
  }, []);

  const submitOpening = async () => {
    if (Number(openForm.amount || 0) < 0) {
      toast.error("Cash Opening cannot be negative");
      return;
    }
    setSavingOpen(true);
    try {
      await api.post("/cash/openings", {
        date: openForm.date,
        amount: Number(openForm.amount || 0),
        reason: openForm.reason,
      });
      toast.success("Cash Opening saved");
      setOpenForm({ date: todayStr(), amount: "", reason: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setSavingOpen(false);
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
    setSavingAdj(true);
    try {
      await api.post("/cash/adjustments", {
        date: adjForm.date,
        type: adjForm.type,
        amount: Number(adjForm.amount || 0),
        reason: adjForm.reason,
      });
      toast.success("Cash Adjustment recorded");
      setAdjForm({ date: todayStr(), type: "add", amount: "", reason: "" });
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setSavingAdj(false);
    }
  };

  const s = summary || {};

  return (
    <Layout title="Cash Management">
      <div className="space-y-4">
        {/* Net cash snapshot */}
        <div
          className="grid grid-cols-2 lg:grid-cols-5 gap-3"
          data-testid="cash-snapshot"
        >
          <Snap
            label="Cash Opening (Today)"
            value={formatMoney(s.cash_opening)}
          />
          <Snap label="Cash Retail" value={formatMoney(s.cash_retail)} />
          <Snap
            label="Cash Debtor Received"
            value={formatMoney(s.cash_debtor_received)}
          />
          <Snap label="Cash Expenses" value={formatMoney(s.cash_expenses)} />
          <Snap
            label="Net Cash in Hand"
            value={formatMoney(s.net_cash_in_hand)}
            accent
            testId="cash-net-cash"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Enter Cash Opening */}
          <Card className="border border-border rounded-md p-4 bg-card shadow-none">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Enter Cash Opening
            </h2>
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
              disabled={savingOpen}
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
              disabled={savingAdj}
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

        {/* History */}
        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="p-3 border-b border-border font-semibold text-sm">
            Cash Opening History
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
                {openings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-foreground/50 py-6"
                    >
                      No cash opening entries yet
                    </TableCell>
                  </TableRow>
                ) : (
                  openings.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{formatDate(o.date)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatMoney(o.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {o.previous_amount != null
                          ? formatMoney(o.previous_amount)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {o.reason || "-"}
                      </TableCell>
                      <TableCell>{o.entered_by_name}</TableCell>
                      <TableCell className="text-xs">
                        {formatDateTime(o.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="p-3 border-b border-border font-semibold text-sm">
            Cash Adjustment History
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
                {adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-sm text-foreground/50 py-6"
                    >
                      No adjustments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{formatDate(a.date)}</TableCell>
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
                      <TableCell>{a.added_by_name}</TableCell>
                      <TableCell className="text-xs">
                        {formatDateTime(a.created_at)}
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

function Snap({ label, value, accent, testId }) {
  return (
    <Card
      data-testid={testId}
      className={`border border-border rounded-md p-4 bg-card shadow-none ${accent ? "border-l-2 border-l-primary" : ""}`}
    >
      <div className="text-xs font-medium text-foreground/60 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums mt-1">{value}</div>
    </Card>
  );
}
