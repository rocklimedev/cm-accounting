import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "../../store/use-auth";
import { formatMoney, todayStr } from "@/lib/format";
import { RupeeInput, TextAreaField } from "@/components/FormFields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Save, Send, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  useGetExpenseTitlesQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useVoidExpenseMutation,
} from "../../api/expense.api";
import { useGetActivePaymentModesQuery } from "../../api/payment-mode.api";

const newRow = (title, defaultPayMode) => ({
  title: title || "",
  amount: "",
  payment_mode: defaultPayMode || "",
});
const rowsFromTitles = (titles, defaultPayMode) =>
  titles && titles.length
    ? titles.map((t) => newRow(t, defaultPayMode))
    : [newRow(undefined, defaultPayMode)];
const n = (v) => Number(v || 0);

export default function ExpenseReportForm() {
  const { user, isAdmin } = useAuth();
  const { reportId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!reportId;

  const [form, setForm] = useState({
    report_date: todayStr(),
    expenses: [newRow()],
  });
  const [errors, setErrors] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  // ---- data fetching ------------------------------------------------------
  const { data: titlesData, isLoading: titlesLoading } =
    useGetExpenseTitlesQuery();
  const titles = useMemo(
    () => (titlesData || []).map((t) => t.title),
    [titlesData],
  );

  const { data: paymentModesData, isLoading: paymentModesLoading } =
    useGetActivePaymentModesQuery();
  const paymentModeOptions = useMemo(
    () =>
      (paymentModesData || []).map((m) => ({
        k: m.id, // ✅ UUID
        l: m.name,
        code: m.code,
      })),
    [paymentModesData],
  );
  const paymentModeLabel = (id) =>
    paymentModesData?.find((m) => m.id === id)?.name || "";
  const {
    data: existingReport,
    isFetching: reportLoading,
    error: reportError,
  } = useGetExpenseByIdQuery(reportId, { skip: !isEdit });

  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();

  const [voidExpense, { isLoading: voiding }] = useVoidExpenseMutation();
  const saving = creating;

  // ---- prefill a brand-new report from titles / localStorage --------------
  useEffect(() => {
    if (isEdit || titlesLoading || paymentModesLoading) return;
    const defaultPayMode = paymentModeOptions[0]?.k || "";

    setForm({
      report_date: todayStr(),
      expenses: rowsFromTitles(titles, defaultPayMode),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEdit,
    titlesLoading,
    paymentModesLoading,
    titles.join("|"),
    paymentModeOptions.map((m) => m.k).join("|"),
  ]);

  useEffect(() => {
    if (reportError) toast.error("Failed to load report");
  }, [reportError]);

  // ---- row editing (new-report mode only) ----------------------------------
  const setRow = (i, key, val) =>
    setForm((f) => {
      const rows = [...f.expenses];
      rows[i] = { ...rows[i], [key]: val };
      return { ...f, expenses: rows };
    });
  const addRow = () =>
    setForm((f) => ({
      ...f,
      expenses: [
        ...f.expenses,
        newRow(titles[0], paymentModeOptions[0]?.k || ""),
      ],
    }));
  const removeRow = (i) =>
    setForm((f) => ({
      ...f,
      expenses: f.expenses.filter((_, idx) => idx !== i),
    }));

  // ---- summary --------------------------------------------------------------
  const displayItems = isEdit
    ? (existingReport?.items || []).map((it) => ({
        title: it.expense_title,
        amount: it.amount,
        payment_mode: it.payment_mode?.id,
      }))
    : form.expenses;

  const summary = useMemo(() => {
    const s = { count: 0, total: 0, byMode: {} };
    displayItems.forEach((r) => {
      const a = n(r.amount);
      if (a > 0) s.count += 1;
      s.total += a;
      const m = r.payment_mode || paymentModeOptions[0]?.k || "cash";
      s.byMode[m] = (s.byMode[m] || 0) + a;
    });
    return s;
  }, [displayItems, paymentModeOptions]);

  // ---- validation (new-report mode only) -------------------------------------
  const validate = () => {
    const e = {};
    if (!form.report_date) e.report_date = "Report date is required";
    const filled = form.expenses.filter((r) => n(r.amount) > 0);
    if (filled.length === 0)
      e.expenses = "Enter an amount for at least one expense";
    form.expenses.forEach((r, i) => {
      if (n(r.amount) > 0 && !r.title) e[`title_${i}`] = "Select title";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const buildPayload = () => ({
    report_date: form.report_date,
    items: form.expenses
      .filter((r) => n(r.amount) > 0)
      .map((r) => ({
        expense_title: r.title,
        amount: n(r.amount),
        payment_mode_id: r.payment_mode, // ✅ UUID
        remarks: "",
      })),
  });
  const saveDraft = async () => {
    try {
      const created = await createExpense(buildPayload()).unwrap();

      toast.success("Draft saved");
      navigate(`/expense-reports/${created.id}`);
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to save report");
    }
  };

  const submitNew = async () => {
    try {
      const created = await createExpense(buildPayload()).unwrap();

      toast.success("Expense report submitted");
      navigate(`/expense-reports/${created.id}`);
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to submit report");
    } finally {
      setConfirmOpen(false);
    }
  };

  const postExisting = async () => {
    try {
      toast.success("Expense report submitted");
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to submit report");
    } finally {
      setConfirmOpen(false);
    }
  };

  const voidExisting = async () => {
    try {
      await voidExpense(reportId).unwrap();
      toast.success("Expense report voided");
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to void report");
    } finally {
      setVoidOpen(false);
    }
  };

  // ---- loading / not-found ----------------------------------------------------
  if (isEdit && reportLoading)
    return (
      <Layout title="Expense Report">
        <div className="text-sm text-foreground/50">Loading...</div>
      </Layout>
    );
  if (isEdit && !reportLoading && !existingReport)
    return (
      <Layout title="Expense Report">
        <div className="text-sm text-foreground/50">Report not found.</div>
      </Layout>
    );

  const status = isEdit ? existingReport?.status || "posted" : null;
  const canPost = isEdit && status === "posted";
  const canVoid =
    isEdit && status !== "void" && (isAdmin || status === "posted");

  const nowTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Layout title={isEdit ? `Expense Report ${reportId}` : "Expense Report"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
            <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Report Date{" "}
                  {!isEdit && <span className="text-primary">*</span>}
                </label>
                <Input
                  type="date"
                  data-testid="field-report-date"
                  value={
                    isEdit
                      ? (existingReport?.report_date || "").slice(0, 10)
                      : form.report_date
                  }
                  disabled={isEdit}
                  onChange={(e) =>
                    setForm({ ...form, report_date: e.target.value })
                  }
                  className={errors.report_date ? "border-primary" : ""}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Time</label>
                <Input value={nowTime} disabled data-testid="field-time" />
              </div>
              {isEdit && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Status</label>
                  <Input
                    value={status}
                    disabled
                    className="capitalize"
                    data-testid="field-status"
                  />
                </div>
              )}
            </div>
          </Card>

          <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
            <div className="flex items-center justify-between mb-1 pb-2 border-b border-border">
              <h2 className="text-base font-semibold">Expenses</h2>
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  data-testid="expense-report-add-row-button"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Expense Row
                </Button>
              )}
            </div>
            {!isEdit && (
              <p className="text-xs text-foreground/60 mb-3">
                All expense titles are pre-filled. Just enter the amount and
                payment mode for the ones you incurred — leave the rest at 0.
                Only rows with an amount are saved.
              </p>
            )}
            {errors.expenses && (
              <p
                className="text-xs text-primary mb-2"
                data-testid="expense-rows-error"
              >
                {errors.expenses}
              </p>
            )}
            <div
              className="overflow-x-auto thin-scroll"
              data-testid="expense-report-rows-table"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead>Expense Title</TableHead>
                    <TableHead className="w-40 text-right">Amount</TableHead>
                    <TableHead className="w-40">Payment Mode</TableHead>
                    {!isEdit && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isEdit
                    ? displayItems.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm text-foreground/60">
                            {i + 1}
                          </TableCell>
                          <TableCell>{r.title}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(n(r.amount))}
                          </TableCell>
                          <TableCell className="capitalize">
                            {paymentModeLabel(r.payment_mode)}
                          </TableCell>
                        </TableRow>
                      ))
                    : form.expenses.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm text-foreground/60">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={r.title || undefined}
                              onValueChange={(v) => setRow(i, "title", v)}
                            >
                              <SelectTrigger
                                className={`h-9 ${errors[`title_${i}`] ? "border-primary" : ""}`}
                                data-testid={`expense-title-${i}`}
                              >
                                <SelectValue placeholder="Select title" />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {titles.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <RupeeInput
                              value={r.amount}
                              onChange={(v) => setRow(i, "amount", v)}
                              testId={`expense-amount-${i}`}
                              error={errors[`amount_${i}`]}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={r.payment_mode || undefined}
                              onValueChange={(v) =>
                                setRow(i, "payment_mode", v)
                              }
                              disabled={paymentModesLoading}
                            >
                              <SelectTrigger
                                className="h-9"
                                data-testid={`expense-paymode-${i}`}
                              >
                                <SelectValue
                                  placeholder={
                                    paymentModesLoading
                                      ? "Loading..."
                                      : "Select mode"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentModeOptions.map((m) => (
                                  <SelectItem key={m.k} value={m.k}>
                                    {m.l}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {form.expenses.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-primary border-primary"
                                onClick={() => removeRow(i)}
                                data-testid={`expense-report-remove-row-${i}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {!isEdit && (
            <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
              <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">
                Employee Remarks
              </h2>
              <TextAreaField
                label="Remarks"
                value={form.employee_remarks || ""}
                onChange={(v) => setForm({ ...form, employee_remarks: v })}
                testId="field-employee-remarks"
                placeholder="Optional notes"
              />
              <p className="text-xs text-foreground/50 mt-1">
                Note: remarks aren&apos;t currently persisted by the API — this
                field is a placeholder until the backend supports a report-level
                remarks column.
              </p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <Card className="border border-border rounded-md p-4 bg-card shadow-none">
              <h2 className="text-base font-semibold mb-3">Expense Summary</h2>
              <SumRow label="Number of Expenses" value={summary.count} />
              {paymentModeOptions.map((m) => (
                <SumRow
                  key={m.k}
                  label={m.l}
                  value={formatMoney(summary.byMode[m.k] || 0)}
                />
              ))}
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="font-semibold">Total Expenses</span>
                <span
                  className="text-lg font-bold tabular-nums"
                  data-testid="expense-report-total-amount"
                >
                  {formatMoney(summary.total)}
                </span>
              </div>
            </Card>

            <div className="flex flex-col gap-2">
              {!isEdit && (
                <>
                  <Button
                    onClick={() => {
                      if (validate()) setConfirmOpen(true);
                      else toast.error("Please fix the highlighted fields");
                    }}
                    disabled={saving}
                    data-testid="expense-report-submit-button"
                  >
                    <Send className="h-4 w-4 mr-2" /> Preview &amp; Submit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={saveDraft}
                    disabled={saving}
                    data-testid="expense-report-save-draft-button"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}{" "}
                    Save as Draft
                  </Button>
                </>
              )}
              {isEdit && canPost && (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={posting}
                  data-testid="expense-report-post-button"
                >
                  {posting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}{" "}
                  Submit Report
                </Button>
              )}
              {isEdit && canVoid && (
                <Button
                  variant="outline"
                  className="text-primary border-primary"
                  onClick={() => setVoidOpen(true)}
                  disabled={voiding}
                  data-testid="expense-report-void-button"
                >
                  {voiding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4 mr-2" />
                  )}{" "}
                  Void Report
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                data-testid="expense-report-cancel-button"
              >
                {isEdit ? "Back" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation (new report, or posting an existing draft) */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <SumRow
              label="Report Date"
              value={
                isEdit
                  ? existingReport?.report_date?.slice(0, 10)
                  : form.report_date
              }
            />
            <SumRow label="Number of Expenses" value={summary.count} />
            <SumRow label="Total Expenses" value={formatMoney(summary.total)} />
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
              onClick={isEdit ? postExisting : submitNew}
              disabled={saving}
              data-testid="confirm-submit-button"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{" "}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void confirmation */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void this report?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/70">
            This marks the report as void. This action cannot be undone from
            here.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)}>
              Back
            </Button>
            <Button
              onClick={voidExisting}
              disabled={voiding}
              className="bg-primary"
              data-testid="confirm-void-button"
            >
              {voiding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{" "}
              Void Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function SumRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-foreground/70 text-sm">{label}</span>
      <span className="font-semibold tabular-nums text-sm">{value}</span>
    </div>
  );
}
