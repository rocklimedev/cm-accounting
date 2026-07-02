import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { api } from "@/lib/api";
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
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Save,
  Send,
  HandCoins,
  ArrowDownToLine,
} from "lucide-react";
import { toast } from "sonner";

const PAY_MODES = [
  { k: "cash", l: "Cash" },
  { k: "upi", l: "UPI" },
  { k: "bank", l: "Bank" },
  { k: "card", l: "Card" },
];
const newRow = (type) =>
  type === "debtor_received"
    ? { entry_type: "debtor_received", amount: "", payment_mode: "cash" }
    : { entry_type: "new_debtor", amount: "" };
const blank = () => ({
  report_date: todayStr(),
  entries: [newRow("new_debtor")],
  employee_remarks: "",
});
const n = (v) => Number(v || 0);

export default function DebtorReportForm() {
  const { user, isAdmin } = useAuth();
  const { reportId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!reportId;
  const storageKey = "debtor_draft_new";

  const [form, setForm] = useState(() => {
    if (!reportId) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return { ...blank(), ...JSON.parse(saved) };
        } catch {
          /* noop */
        }
      }
    }
    return blank();
  });
  const [reportStatus, setReportStatus] = useState("draft");
  const [outstanding, setOutstanding] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [loaded, setLoaded] = useState(!isEdit);

  const adminEditing = isEdit && isAdmin && reportStatus !== "draft";

  useEffect(() => {
    api
      .get("/debtor-reports/outstanding")
      .then((r) => setOutstanding(r.data.outstanding_debtor || 0))
      .catch(() => {});
    if (isEdit) {
      api
        .get(`/debtor-reports/${reportId}`)
        .then((res) => {
          const d = res.data;
          setReportStatus(d.status || "draft");
          setForm({
            report_date: (d.report_date || todayStr()).slice(0, 10),
            entries: (d.entries && d.entries.length
              ? d.entries
              : [newRow("new_debtor")]
            ).map((e) => ({
              entry_type: e.entry_type,
              amount: e.amount ?? "",
              payment_mode: e.payment_mode || "cash",
            })),
            employee_remarks: d.employee_remarks || "",
          });
          // opening = closing - net of this report
          if (d.running) setOutstanding(d.running.opening || 0);
        })
        .catch(() => toast.error("Failed to load report"))
        .finally(() => setLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  useEffect(() => {
    if (!isEdit) localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, isEdit]);

  const setEntry = (i, key, val) =>
    setForm((f) => {
      const rows = [...f.entries];
      rows[i] = { ...rows[i], [key]: val };
      return { ...f, entries: rows };
    });
  const addRow = (type) =>
    setForm((f) => ({ ...f, entries: [...f.entries, newRow(type)] }));
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
    });
    if (overReceived)
      e.received =
        "Debtor Received cannot exceed the current Outstanding Debtor";
    if (adminEditing && !editReason.trim())
      e.edit_reason = "A reason is required to edit a submitted report.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = (status) => ({
    report_date: form.report_date,
    entries: form.entries.map((e) =>
      e.entry_type === "debtor_received"
        ? {
            entry_type: "debtor_received",
            amount: n(e.amount),
            payment_mode: e.payment_mode,
          }
        : { entry_type: "new_debtor", amount: n(e.amount) },
    ),
    employee_remarks: form.employee_remarks,
    status,
    ...(adminEditing ? { edit_reason: editReason } : {}),
  });

  const save = async (status) => {
    if (status === "submitted" && !validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(status);
      const res = isEdit
        ? await api.put(`/debtor-reports/${reportId}`, payload)
        : await api.post("/debtor-reports", payload);
      localStorage.removeItem(storageKey);
      toast.success(
        status === "submitted"
          ? "Debtor report submitted"
          : isEdit
            ? "Report updated"
            : "Draft saved",
      );
      navigate(`/reports/${res.data.report_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save report");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (!loaded)
    return (
      <Layout title="Debtor Report">
        <div className="text-sm text-foreground/50">Loading...</div>
      </Layout>
    );
  const nowTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Layout title={isEdit ? `Edit Debtor Report ${reportId}` : "Debtor Report"}>
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
              <Field label="Submitted By">
                <Input
                  value={user?.name || ""}
                  disabled
                  data-testid="field-submitted-by"
                />
              </Field>
              <Field label="Employee ID">
                <Input
                  value={user?.employee_id || ""}
                  disabled
                  data-testid="field-employee-id"
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
                          value={en.payment_mode}
                          onValueChange={(v) => setEntry(i, "payment_mode", v)}
                        >
                          <SelectTrigger
                            className="h-9 w-36"
                            data-testid={`entry-mode-${i}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAY_MODES.map((m) => (
                              <SelectItem key={m.k} value={m.k}>
                                {m.l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      No payment received \u2014 increases Outstanding Debtor
                      only.
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
