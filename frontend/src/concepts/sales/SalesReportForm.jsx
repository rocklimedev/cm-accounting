import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import {
  useGetSalesReportByIdQuery,
  useCreateSalesReportMutation,
  usePostSalesReportMutation,
} from "../../api/sales.api";
import { useGetActivePaymentModesQuery } from "../../api/payment-mode.api";
import { formatMoney, todayStr } from "@/lib/format";
import { Field, RupeeInput, TextAreaField } from "@/components/FormFields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Save, Send } from "lucide-react";
import { toast } from "sonner";

const DEBTOR_MODE_CODE = "DEBTOR";

const n = (v) => Number(v || 0);

const blankRetail = (modes) => Object.fromEntries(modes.map((m) => [m.k, ""]));

const blank = (modes) => ({
  report_date: todayStr(),
  retail: blankRetail(modes),
  gross_amount: "",
  employee_remarks: "",
});

export default function SalesReportForm() {
  const { user, isAdmin } = useAuth();
  const { reportId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!reportId;
  const storageKey = "sales_draft_new_v2";

  // Fetch Active Payment Modes
  const { data: paymentModesRaw = [], isLoading: modesLoading } =
    useGetActivePaymentModesQuery();

  // Transform modes — keep `id` since the backend keys items by
  // payment_mode_id (UUID FK), not by code.
  const MODES = useMemo(() => {
    return paymentModesRaw
      .filter((pm) => pm.is_active)
      .map((pm) => ({
        id: pm.id,
        k: pm.code,
        l: pm.name,
      }));
  }, [paymentModesRaw]);

  const debtorMode = useMemo(
    () => MODES.find((m) => m.k?.toUpperCase() === DEBTOR_MODE_CODE),
    [MODES],
  );

  const {
    data: reportData,
    isFetching: reportLoading,
    isError: reportError,
  } = useGetSalesReportByIdQuery(reportId, { skip: !isEdit });

  const [createSalesReport, { isLoading: creating }] =
    useCreateSalesReportMutation();
  const [postSalesReport, { isLoading: posting }] =
    usePostSalesReportMutation();

  const saving = creating || posting;

  const [form, setForm] = useState(null);
  const [reportStatus, setReportStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Backend enum values are uppercase: 'DRAFT' | 'POSTED' | 'VOID'.
  const isPosted = reportStatus === "POSTED";
  const isVoid = reportStatus === "VOID";
  const readOnly = isEdit && (isPosted || isVoid);

  // Initialize Form
  useEffect(() => {
    if (modesLoading || MODES.length === 0) return;

    if (isEdit && reportData) {
      setReportStatus(reportData.status || "DRAFT");
      setForm({
        report_date: (reportData.report_date || todayStr()).slice(0, 10),
        gross_amount: reportData.gross_amount ?? "",

        retail: Object.fromEntries(
          MODES.map((m) => {
            const item = (reportData.items || []).find(
              (it) => it.payment_mode_id === m.id,
            );
            return [m.k, item ? String(item.amount) : ""];
          }),
        ),
        employee_remarks: reportData.remarks || "",
      });
    } else if (!isEdit && !form) {
      // Restore an in-progress unsaved draft if one exists.
      try {
        const saved = localStorage.getItem(storageKey);
        setForm(saved ? JSON.parse(saved) : blank(MODES));
      } catch {
        setForm(blank(MODES));
      }
    }
  }, [modesLoading, MODES, isEdit, reportData, form]);

  useEffect(() => {
    if (reportError) toast.error("Failed to load report");
  }, [reportError]);

  useEffect(() => {
    if (!isEdit && form) {
      localStorage.setItem(storageKey, JSON.stringify(form));
    }
  }, [form, isEdit]);

  const setRetail = (k, v) =>
    setForm((f) => ({ ...f, retail: { ...f.retail, [k]: v } }));

  const calc = useMemo(() => {
    if (!form) return { totalRetail: 0, debtor: 0 };
    const totalRetail = MODES.filter((m) => m.k !== DEBTOR_MODE_CODE).reduce(
      (a, m) => a + n(form.retail[m.k]),
      0,
    );
    const debtor = n(form.gross_amount) - totalRetail;
    return { totalRetail, debtor };
  }, [form, MODES]);

  const retailExceeds = form ? calc.totalRetail > n(form.gross_amount) : false;
  const hasUnreconciledDebtor = calc.debtor > 0 && !debtorMode;

  const validate = () => {
    const e = {};
    if (!form?.report_date) e.report_date = "Report date is required";
    if (n(form?.gross_amount) <= 0)
      e.gross_amount = "Gross Amount must be greater than zero";
    if (retailExceeds) e.retail = "Total Retail cannot exceed Gross Amount";
    if (hasUnreconciledDebtor)
      e.retail =
        `Outstanding debtor amount of ${formatMoney(calc.debtor)} can't ` +
        `be recorded — no "${DEBTOR_MODE_CODE}" payment mode is configured, ` +
        "and the backend requires payment amounts to add up to the full gross amount.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Build payload matching CreateSalesReportDto exactly:
  // { report_date, gross_amount, remarks?, items: [{ payment_mode_id, amount }] }
  const buildPayload = () => {
    const items = MODES.filter((m) => m.k !== DEBTOR_MODE_CODE)
      .map((m) => ({
        payment_mode_id: m.id,
        amount: n(form.retail[m.k]),
      }))
      .filter((item) => item.amount > 0);

    if (debtorMode && calc.debtor > 0) {
      items.push({
        payment_mode_id: debtorMode.id,
        amount: calc.debtor,
      });
    }

    return {
      report_date: form.report_date,
      gross_amount: n(form.gross_amount),
      remarks: form.employee_remarks || undefined,
      items,
    };
  };

  const save = async (finalize) => {
    if (finalize && !validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (retailExceeds || hasUnreconciledDebtor) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    try {
      const payload = buildPayload();
      const created = await createSalesReport(payload).unwrap();

      if (finalize) {
        await postSalesReport({ id: created.id }).unwrap();
      }

      localStorage.removeItem(storageKey);
      toast.success(finalize ? "Sales report submitted" : "Draft saved");
      navigate(`/reports/${created.id}`);
    } catch (err) {
      const message = Array.isArray(err?.data?.message)
        ? err.data.message.join(", ")
        : err?.data?.message || "Failed to save report";
      toast.error(message);
    } finally {
      setConfirmOpen(false);
    }
  };

  if (modesLoading || (isEdit && reportLoading) || !form) {
    return (
      <Layout title="Sales Report">
        <div className="text-sm text-foreground/50">Loading...</div>
      </Layout>
    );
  }

  const nowTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Layout title={isEdit ? `Sales Report ${reportId}` : "Daily Sales Report"}>
      {readOnly && (
        <div className="mb-4 rounded-sm border border-primary/40 bg-primary/5 px-3 py-2 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This report is {isPosted ? "posted" : "void"} and can no longer be
          edited — it's part of the signed audit chain. To correct it, void it
          {isPosted ? "" : " (already void)"} and create a new report instead.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Report Date" required error={errors.report_date}>
                <Input
                  type="date"
                  data-testid="field-report-date"
                  value={form.report_date}
                  disabled={readOnly}
                  onChange={(e) =>
                    setForm({ ...form, report_date: e.target.value })
                  }
                  className={errors.report_date ? "border-primary" : ""}
                />
              </Field>

              <Field label="Time">
                <Input value={nowTime} disabled data-testid="field-time" />
              </Field>
            </div>
          </Section>

          <Section title="Gross Amount">
            <Field
              label="Gross Amount (complete sale value)"
              required
              error={errors.gross_amount}
            >
              <RupeeInput
                value={form.gross_amount}
                onChange={(v) => setForm({ ...form, gross_amount: v })}
                testId="field-gross-amount"
                error={errors.gross_amount}
                disabled={readOnly}
              />
            </Field>
          </Section>

          <Section title="Retail">
            <p className="text-xs text-foreground/60 mb-3">
              Amount received immediately at the time of sale. Total Retail must
              not exceed Gross Amount.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {MODES.filter((m) => m.k !== DEBTOR_MODE_CODE).map((m) => (
                <Field key={m.k} label={`${m.l} Retail`}>
                  <RupeeInput
                    value={form.retail[m.k]}
                    onChange={(v) => setRetail(m.k, v)}
                    testId={`field-retail-${m.k}`}
                    disabled={readOnly}
                  />
                </Field>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border border-border rounded-sm px-3 py-2 bg-secondary/50">
              <span className="text-sm font-medium">Total Retail (auto)</span>
              <span
                className="text-lg font-bold tabular-nums"
                data-testid="calc-total-retail"
              >
                {formatMoney(calc.totalRetail)}
              </span>
            </div>
            {errors.retail && (
              <div
                className="text-xs text-primary mt-2 flex items-center gap-1"
                data-testid="retail-error"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> {errors.retail}
              </div>
            )}
          </Section>

          <Section title="Debtor">
            <div
              className={`flex items-center justify-between rounded-sm px-3 py-3 border ${
                retailExceeds || hasUnreconciledDebtor
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/50"
              }`}
            >
              <div>
                <div className="text-sm font-medium">
                  Debtor (auto-calculated, read-only)
                </div>
                <div className="text-xs text-foreground/55">
                  Debtor = Gross Amount &minus; Total Retail
                </div>
              </div>
              <span
                className="text-xl font-bold tabular-nums"
                data-testid="calc-debtor"
              >
                {formatMoney(Math.max(0, calc.debtor))}
              </span>
            </div>
            <p className="text-xs text-foreground/55 mt-2">
              This amount is recorded as an outstanding debtor line item on
              submission.
            </p>
          </Section>

          <Section title="Employee Remarks">
            <TextAreaField
              label="Remarks"
              value={form.employee_remarks}
              onChange={(v) => setForm({ ...form, employee_remarks: v })}
              testId="field-employee-remarks"
              placeholder="Optional notes about today's sale"
              disabled={readOnly}
            />
          </Section>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <Card className="border border-border rounded-md p-4 bg-card shadow-none">
              <h2 className="text-base font-semibold mb-3">Live Summary</h2>
              <SumRow
                label="Gross Amount"
                value={formatMoney(n(form.gross_amount))}
              />
              <SumRow
                label="Total Retail"
                value={formatMoney(calc.totalRetail)}
              />
              <SumRow
                label="Debtor"
                value={formatMoney(Math.max(0, calc.debtor))}
                warn={retailExceeds || hasUnreconciledDebtor}
              />
            </Card>

            {!readOnly && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    if (validate()) setConfirmOpen(true);
                    else toast.error("Please fix the highlighted fields");
                  }}
                  disabled={saving}
                  data-testid="sales-report-submit-button"
                >
                  <Send className="h-4 w-4 mr-2" /> Preview & Submit
                </Button>

                <Button
                  variant="outline"
                  onClick={() => save(false)}
                  disabled={saving}
                  data-testid="sales-report-save-draft-button"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}{" "}
                  Save as Draft
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  data-testid="sales-report-cancel-button"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <SumRow label="Report Date" value={form.report_date} />
            <SumRow
              label="Gross Amount"
              value={formatMoney(n(form.gross_amount))}
            />
            <SumRow
              label="Total Retail"
              value={formatMoney(calc.totalRetail)}
            />
            <SumRow
              label="Debtor"
              value={formatMoney(Math.max(0, calc.debtor))}
            />
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
              onClick={() => save(true)}
              disabled={saving}
              data-testid="confirm-submit-button"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{" "}
              Submit Report
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
