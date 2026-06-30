import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatMoney, todayStr } from "@/lib/format";
import { RupeeInput, TextAreaField } from "@/components/FormFields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

const PAY_MODES = [{ k: "cash", l: "Cash" }, { k: "upi", l: "UPI" }, { k: "bank", l: "Bank" }, { k: "card", l: "Card" }];
const newRow = (title) => ({ title: title || "", amount: "", payment_mode: "cash" });
const rowsFromTitles = (titles) => (titles && titles.length ? titles.map((t) => newRow(t)) : [newRow()]);
const blank = (title) => ({ report_date: todayStr(), expenses: [newRow(title)], employee_remarks: "" });
const n = (v) => Number(v || 0);

export default function ExpenseReportForm() {
  const { user, isAdmin } = useAuth();
  const { reportId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!reportId;
  const storageKey = "expense_draft_new_v3";

  const [titles, setTitles] = useState([]);
  const [form, setForm] = useState(blank());
  const [reportStatus, setReportStatus] = useState("draft");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [loaded, setLoaded] = useState(!isEdit);

  const adminEditing = isEdit && isAdmin && reportStatus !== "draft";

  useEffect(() => {
    api.get("/settings").then((r) => {
      const t = r.data.expense_titles || [];
      setTitles(t);
      if (!isEdit) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const hasData = parsed.expenses && parsed.expenses.some((r) => Number(r.amount) > 0);
            if (hasData) { setForm({ ...blank(), ...parsed }); return; }
          } catch { /* noop */ }
        }
        // Pre-fill a row for every preset title; user only enters amount + payment mode.
        setForm({ report_date: todayStr(), expenses: rowsFromTitles(t), employee_remarks: "" });
      }
    }).catch(() => {});
    if (isEdit) {
      api.get(`/expense-reports/${reportId}`).then((res) => {
        const d = res.data;
        setReportStatus(d.status || "draft");
        setForm({
          report_date: (d.report_date || todayStr()).slice(0, 10),
          expenses: (d.expenses && d.expenses.length ? d.expenses : [newRow()]).map((e) => ({
            title: e.title || "", amount: e.amount ?? "", payment_mode: e.payment_mode || "cash",
          })),
          employee_remarks: d.employee_remarks || "",
        });
      }).catch(() => toast.error("Failed to load report")).finally(() => setLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  useEffect(() => { if (!isEdit && loaded) localStorage.setItem(storageKey, JSON.stringify(form)); }, [form, isEdit, loaded]);
  useEffect(() => { if (!isEdit) setLoaded(true); }, [isEdit]);

  const setRow = (i, key, val) => setForm((f) => { const rows = [...f.expenses]; rows[i] = { ...rows[i], [key]: val }; return { ...f, expenses: rows }; });
  const addRow = () => setForm((f) => ({ ...f, expenses: [...f.expenses, newRow(titles[0])] }));
  const removeRow = (i) => setForm((f) => ({ ...f, expenses: f.expenses.filter((_, idx) => idx !== i) }));

  const summary = useMemo(() => {
    const s = { count: 0, total: 0, cash: 0, upi: 0, bank: 0, card: 0 };
    form.expenses.forEach((r) => { const a = n(r.amount); if (a > 0) s.count += 1; s.total += a; const m = r.payment_mode || "cash"; if (s[m] !== undefined) s[m] += a; });
    return s;
  }, [form.expenses]);

  const validate = () => {
    const e = {};
    if (!form.report_date) e.report_date = "Report date is required";
    const filled = form.expenses.filter((r) => n(r.amount) > 0);
    if (filled.length === 0) e.expenses = "Enter an amount for at least one expense";
    form.expenses.forEach((r, i) => {
      if (n(r.amount) > 0 && !r.title) e[`title_${i}`] = "Select title";
    });
    if (adminEditing && !editReason.trim()) e.edit_reason = "A reason is required to edit a submitted report.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = (status) => ({
    report_date: form.report_date,
    expenses: form.expenses.filter((r) => n(r.amount) > 0).map((r) => ({ title: r.title, amount: n(r.amount), payment_mode: r.payment_mode })),
    employee_remarks: form.employee_remarks,
    status,
    ...(adminEditing ? { edit_reason: editReason } : {}),
  });

  const save = async (status) => {
    if (status === "submitted" && !validate()) { toast.error("Please fix the highlighted fields"); return; }
    setSaving(true);
    try {
      const payload = buildPayload(status);
      const res = isEdit ? await api.put(`/expense-reports/${reportId}`, payload) : await api.post("/expense-reports", payload);
      localStorage.removeItem(storageKey);
      toast.success(status === "submitted" ? "Expense report submitted" : (isEdit ? "Report updated" : "Draft saved"));
      navigate(`/reports/${res.data.report_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save report");
    } finally { setSaving(false); setConfirmOpen(false); }
  };

  if (!loaded) return <Layout title="Expense Report"><div className="text-sm text-foreground/50">Loading...</div></Layout>;
  const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Layout title={isEdit ? `Edit Expense Report ${reportId}` : "Expense Report"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
            <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Report Date <span className="text-primary">*</span></label>
                <Input type="date" data-testid="field-report-date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} className={errors.report_date ? "border-primary" : ""} />
              </div>
              <div className="space-y-1.5"><label className="text-sm font-medium">Submitted By</label><Input value={user?.name || ""} disabled data-testid="field-submitted-by" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">Employee ID</label><Input value={user?.employee_id || ""} disabled data-testid="field-employee-id" /></div>
              <div className="space-y-1.5"><label className="text-sm font-medium">Time</label><Input value={nowTime} disabled data-testid="field-time" /></div>
            </div>
          </Card>

          <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
            <div className="flex items-center justify-between mb-1 pb-2 border-b border-border">
              <h2 className="text-base font-semibold">Expenses</h2>
              <Button type="button" variant="outline" size="sm" onClick={addRow} data-testid="expense-report-add-row-button"><Plus className="h-4 w-4 mr-1" /> Add Expense Row</Button>
            </div>
            <p className="text-xs text-foreground/60 mb-3">All expense titles are pre-filled. Just enter the amount and payment mode for the ones you incurred — leave the rest at 0. Only rows with an amount are saved.</p>
            {errors.expenses && <p className="text-xs text-primary mb-2" data-testid="expense-rows-error">{errors.expenses}</p>}
            <div className="overflow-x-auto thin-scroll" data-testid="expense-report-rows-table">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-12">S.No</TableHead>
                  <TableHead>Expense Title</TableHead>
                  <TableHead className="w-40 text-right">Amount</TableHead>
                  <TableHead className="w-40">Payment Mode</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {form.expenses.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm text-foreground/60">{i + 1}</TableCell>
                      <TableCell>
                        <Select value={r.title || undefined} onValueChange={(v) => setRow(i, "title", v)}>
                          <SelectTrigger className={`h-9 ${errors[`title_${i}`] ? "border-primary" : ""}`} data-testid={`expense-title-${i}`}><SelectValue placeholder="Select title" /></SelectTrigger>
                          <SelectContent className="max-h-72">{titles.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <RupeeInput value={r.amount} onChange={(v) => setRow(i, "amount", v)} testId={`expense-amount-${i}`} error={errors[`amount_${i}`]} />
                      </TableCell>
                      <TableCell>
                        <Select value={r.payment_mode} onValueChange={(v) => setRow(i, "payment_mode", v)}>
                          <SelectTrigger className="h-9" data-testid={`expense-paymode-${i}`}><SelectValue /></SelectTrigger>
                          <SelectContent>{PAY_MODES.map((m) => <SelectItem key={m.k} value={m.k}>{m.l}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {form.expenses.length > 1 && (
                          <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-primary border-primary" onClick={() => removeRow(i)} data-testid={`expense-report-remove-row-${i}`}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
            <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Employee Remarks</h2>
            <TextAreaField label="Remarks" value={form.employee_remarks} onChange={(v) => setForm({ ...form, employee_remarks: v })} testId="field-employee-remarks" placeholder="Optional notes" />
          </Card>

          {adminEditing && (
            <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
              <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">Reason for Edit (required)</h2>
              <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={2} placeholder="Explain why this submitted report is being edited" data-testid="field-edit-reason" className={errors.edit_reason ? "border-primary" : ""} />
              {errors.edit_reason && <div className="text-xs text-primary mt-1">{errors.edit_reason}</div>}
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <Card className="border border-border rounded-md p-4 bg-card shadow-none">
              <h2 className="text-base font-semibold mb-3">Expense Summary</h2>
              <SumRow label="Number of Expenses" value={summary.count} />
              <SumRow label="Cash" value={formatMoney(summary.cash)} />
              <SumRow label="UPI" value={formatMoney(summary.upi)} />
              <SumRow label="Bank" value={formatMoney(summary.bank)} />
              <SumRow label="Card" value={formatMoney(summary.card)} />
              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <span className="font-semibold">Total Expenses</span>
                <span className="text-lg font-bold tabular-nums" data-testid="expense-report-total-amount">{formatMoney(summary.total)}</span>
              </div>
            </Card>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { if (validate()) setConfirmOpen(true); else toast.error("Please fix the highlighted fields"); }} disabled={saving} data-testid="expense-report-submit-button">
                <Send className="h-4 w-4 mr-2" /> {adminEditing ? "Save Changes" : "Preview & Submit"}
              </Button>
              {!adminEditing && (
                <Button variant="outline" onClick={() => save("draft")} disabled={saving} data-testid="expense-report-save-draft-button">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save as Draft
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(-1)} data-testid="expense-report-cancel-button">Cancel</Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{adminEditing ? "Confirm Changes" : "Confirm Submission"}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <SumRow label="Report Date" value={form.report_date} />
            <SumRow label="Number of Expenses" value={summary.count} />
            <SumRow label="Total Expenses" value={formatMoney(summary.total)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="confirm-cancel-button">Back</Button>
            <Button onClick={() => save(adminEditing ? reportStatus : "submitted")} disabled={saving} data-testid="confirm-submit-button">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {adminEditing ? "Save Changes" : "Submit Report"}
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
