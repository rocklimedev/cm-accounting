import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { formatMoney, todayStr } from "@/lib/format";
import { Field, RupeeInput, TextAreaField } from "@/components/FormFields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trash2,
  Loader2,
  AlertTriangle,
  Save,
  Send,
  HandCoins,
  ArrowDownToLine,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetLatestReportQuery,
  useCreateDebtorReportMutation,
  useGetOutstandingDebtorAmountQuery,
} from "../../api/debtor.api";
import { useCreateDebtorEntryMutation } from "../../api/debtor.api";
import { useGetActivePaymentModesQuery } from "../../api/payment-mode.api";

const newRow = (type, defaultPaymentModeId) =>
  type === "debtor_received"
    ? {
        entry_type: "debtor_received",
        amount: "",
        payment_mode_id: defaultPaymentModeId || "",
      }
    : { entry_type: "new_debtor", amount: "" };

const blank = (defaultPaymentModeId) => ({
  report_date: todayStr(),
  entries: [newRow("new_debtor", defaultPaymentModeId)],
  employee_remarks: "",
});
const n = (v) => parseFloat(v || "0");
export default function DebtorReportForm() {
  const { user, isAdmin } = useAuth();
  // Backend keys reports by date, not an arbitrary id — route param is the date
  // for edit mode (e.g. /reports/debtor/:reportDate)
  const { reportDate: routeReportDate } = useParams();
  const navigate = useNavigate();
  const isEdit = !!routeReportDate;

  const { data: paymentModes = [], isLoading: modesLoading } =
    useGetActivePaymentModesQuery();

  const { data: outstandingData } = useGetOutstandingDebtorAmountQuery(
    undefined,
    {
      skip: isEdit,
    },
  );

  const [createReport] = useCreateDebtorReportMutation();
  const [createEntry] = useCreateDebtorEntryMutation();

  const defaultModeId = paymentModes[0]?.id;

  const [form, setForm] = useState(() => {
    if (!isEdit) {
    }
    return blank();
  });
  const [reportStatus, setReportStatus] = useState("draft");
  const [outstanding, setOutstanding] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editReason, setEditReason] = useState("");

  const adminEditing = isEdit && isAdmin && reportStatus !== "draft";

  // seed default payment mode once modes load, for any row missing one
  useEffect(() => {
    if (!defaultModeId) return;

    setForm((f) => ({
      ...f,
      entries: f.entries.map((e) =>
        e.entry_type === "debtor_received" && !e.payment_mode_id
          ? { ...e, payment_mode_id: defaultModeId }
          : e,
      ),
    }));
  }, [defaultModeId]);
  // opening balance for a NEW report = latest report's closing amount
  useEffect(() => {
    if (!isEdit && outstandingData) {
      setOutstanding(Number(outstandingData.totalOutstanding || 0));
    }
  }, [isEdit, outstandingData]);

  const setEntry = (i, key, val) =>
    setForm((f) => {
      const rows = [...f.entries];
      rows[i] = { ...rows[i], [key]: val };
      return { ...f, entries: rows };
    });
  const addRow = (type) =>
    setForm((f) => ({
      ...f,
      entries: [...f.entries, newRow(type, defaultModeId)],
    }));
  const removeRow = (i) =>
    setForm((f) => ({
      ...f,
      entries: f.entries.filter((_, idx) => idx !== i),
    }));

  const calc = useMemo(() => {
    let nw = 0,
      rc = 0;
    form.entries.forEach((e) => {
      if (e.entry_type === "new_debtor") nw += n(e.amount);
      else rc += n(e.amount);
    });
    const opening = outstanding;
    const closing = opening + nw - rc;
    return { newTotal: nw, recvTotal: rc, opening, closing };
  }, [form.entries, outstanding]);

  const overReceived = calc.closing < 0;

  const validate = () => {
    const e = {};
    if (!form.report_date) e.report_date = "Report date is required";
    if (!form.entries.length) e.entries = "Add at least one entry";

    form.entries.forEach((en, i) => {
      if (n(en.amount) <= 0) e[`amt_${i}`] = "Amount must be greater than zero";

      if (en.entry_type === "debtor_received" && !en.payment_mode_id)
        e[`mode_${i}`] = "Select a payment mode";
    });
    if (overReceived)
      e.received =
        "Debtor Received cannot exceed the current Outstanding Debtor";
    if (adminEditing && !editReason.trim())
      e.edit_reason = "A reason is required to edit a submitted report.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (status) => {
    if (status === "submitted" && !validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      // 1. create/update the report shell
      const report = await createReport({
        reportDate: form.report_date,

        status,
        ...(adminEditing ? { editReason } : {}),
      }).unwrap();
      // 2. create each entry against the new report id
      await Promise.all(
        form.entries.map((e) =>
          createEntry({
            debtorReportId: report.id,
            entryType: e.entry_type,
            amount: n(e.amount),
            paymentModeId:
              e.entry_type === "debtor_received" && e.payment_mode_id
                ? e.payment_mode_id
                : null,
          }).unwrap(),
        ),
      );

      toast.success(
        status === "submitted"
          ? "Debtor report submitted"
          : isEdit
            ? "Report updated"
            : "Draft saved",
      );
      navigate(`/reports/debtor/${report.reportDate}`);
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to save report");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (isEdit && reportLoading)
    return (
      <Layout title="Debtor Report">
        <div className="text-sm text-foreground/50">Loading...</div>
      </Layout>
    );

  return (
    <Layout
      title={
        isEdit ? `Edit Debtor Report ${form.report_date}` : "Debtor Report"
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Report Date" required error={errors.report_date}>
                <Input
                  type="date"
                  data-testid="field-report-date"
                  value={form.report_date}
                  onChange={(e) =>
                    setForm({ ...form, report_date: e.target.value })
                  }
                  className={errors.report_date ? "border-primary" : ""}
                />
              </Field>

              <Field label="Current Outstanding Debtor">
                <Input
                  value={formatMoney(calc.opening)}
                  disabled
                  data-testid="field-current-outstanding"
                  className="font-semibold"
                />
              </Field>
            </div>
          </Section>

          <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h2 className="text-base font-semibold">Debtor</h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addRow("new_debtor")}
                  data-testid="add-new-debtor-button"
                >
                  <HandCoins className="h-4 w-4 mr-1" /> New Debtor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addRow("debtor_received")}
                  data-testid="add-debtor-received-button"
                >
                  <ArrowDownToLine className="h-4 w-4 mr-1" /> Debtor Received
                </Button>
              </div>
            </div>
            <div className="space-y-3" data-testid="debtor-entries">
              {form.entries.map((en, i) => (
                <div key={i} className="border border-border rounded-sm p-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Entry Type</label>
                      <Select
                        value={en.entry_type}
                        onValueChange={(v) => setEntry(i, "entry_type", v)}
                      >
                        <SelectTrigger
                          className="h-9 w-44"
                          data-testid={`entry-type-${i}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_debtor">New Debtor</SelectItem>
                          <SelectItem value="debtor_received">
                            Debtor Received
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">
                        {en.entry_type === "debtor_received"
                          ? "Amount Received"
                          : "New Debtor Amount"}
                      </label>
                      <div className="w-40">
                        <RupeeInput
                          value={en.amount}
                          onChange={(v) => setEntry(i, "amount", v)}
                          testId={`entry-amount-${i}`}
                          error={errors[`amt_${i}`]}
                        />
                      </div>
                    </div>
                    {en.entry_type === "debtor_received" && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium">
                          Payment Mode
                        </label>
                        <Select
                          value={en.payment_mode_id}
                          onValueChange={(v) =>
                            setEntry(i, "payment_mode_id", v)
                          }
                          disabled={modesLoading}
                        >
                          <SelectTrigger
                            className="h-9 w-36"
                            data-testid={`entry-mode-${i}`}
                          >
                            <SelectValue
                              placeholder={
                                modesLoading ? "Loading..." : "Select"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentModes.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`mode_${i}`] && (
                          <div className="text-xs text-primary">
                            {errors[`mode_${i}`]}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="ml-auto">
                      {form.entries.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-primary border-primary"
                          onClick={() => removeRow(i)}
                          data-testid={`remove-entry-${i}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {en.entry_type === "new_debtor" && (
                    <div className="text-xs text-foreground/55 mt-2">
                      No payment received — increases Outstanding Debtor only.
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.received && (
              <div
                className="text-xs text-primary mt-3 flex items-center gap-1"
                data-testid="received-error"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> {errors.received}
              </div>
            )}
          </Card>

          <Section title="Employee Remarks">
            <TextAreaField
              label="Remarks"
              value={form.employee_remarks}
              onChange={(v) => setForm({ ...form, employee_remarks: v })}
              testId="field-employee-remarks"
              placeholder="Optional notes"
            />
          </Section>

          {adminEditing && (
            <Section title="Reason for Edit (required)">
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={2}
                placeholder="Explain why this submitted report is being edited"
                data-testid="field-edit-reason"
                className={errors.edit_reason ? "border-primary" : ""}
              />
              {errors.edit_reason && (
                <div className="text-xs text-primary mt-1">
                  {errors.edit_reason}
                </div>
              )}
            </Section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <Card className="border border-border rounded-md p-4 bg-card shadow-none">
              <h2 className="text-base font-semibold mb-3">Running Balance</h2>
              <SumRow
                label="Opening Debtor"
                value={formatMoney(calc.opening)}
              />
              <SumRow
                label="New Debtor Added"
                value={formatMoney(calc.newTotal)}
              />
              <SumRow
                label="Debtor Received"
                value={formatMoney(calc.recvTotal)}
              />
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="font-semibold">Closing Debtor</span>
                <span
                  className={`text-lg font-bold tabular-nums ${overReceived ? "text-primary" : ""}`}
                  data-testid="calc-closing-debtor"
                >
                  {formatMoney(calc.closing)}
                </span>
              </div>
            </Card>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  if (validate()) setConfirmOpen(true);
                  else toast.error("Please fix the highlighted fields");
                }}
                disabled={saving}
                data-testid="debtor-report-submit-button"
              >
                <Send className="h-4 w-4 mr-2" />{" "}
                {adminEditing ? "Save Changes" : "Preview & Submit"}
              </Button>
              {!adminEditing && (
                <Button
                  variant="outline"
                  onClick={() => save("draft")}
                  disabled={saving}
                  data-testid="debtor-report-save-draft-button"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}{" "}
                  Save as Draft
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                data-testid="debtor-report-cancel-button"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adminEditing ? "Confirm Changes" : "Confirm Submission"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <SumRow label="Opening Debtor" value={formatMoney(calc.opening)} />
            <SumRow
              label="New Debtor Added"
              value={formatMoney(calc.newTotal)}
            />
            <SumRow
              label="Debtor Received"
              value={formatMoney(calc.recvTotal)}
            />
            <SumRow label="Closing Debtor" value={formatMoney(calc.closing)} />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              data-testid="confirm-cancel-button"
            >
              Back
            </Button>
            <Button
              onClick={() => save(adminEditing ? reportStatus : "submitted")}
              disabled={saving}
              data-testid="confirm-submit-button"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{" "}
              {adminEditing ? "Save Changes" : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function Section({ title, children }) {
  return (
    <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
      <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </Card>
  );
}
function SumRow({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-foreground/70 text-sm">{label}</span>
      <span
        className={`font-semibold tabular-nums text-sm ${warn ? "text-primary" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
