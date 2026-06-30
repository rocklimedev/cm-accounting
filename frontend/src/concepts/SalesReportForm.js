import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatMoney, todayStr } from "@/lib/format";
import { Field, RupeeInput, TextAreaField } from "@/components/FormFields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Save, Send } from "lucide-react";
import { toast } from "sonner";

const MODES = [
  { k: "cash", l: "Cash" }, { k: "upi", l: "UPI" }, { k: "bank", l: "Bank" }, { k: "card", l: "Card" },
];
const blank = () => ({ report_date: todayStr(), retail: { cash: "", upi: "", bank: "", card: "" }, gross_amount: "", employee_remarks: "" });
const n = (v) => Number(v || 0);

export default function SalesReportForm() {
  const { user, isAdmin } = useAuth();
  const { reportId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!reportId;
  const storageKey = "sales_draft_new_v2";

  const [form, setForm] = useState(() => {
    if (!reportId) {
      const saved = localStorage.getItem(storageKey);
      if (saved) { try { return { ...blank(), ...JSON.parse(saved) }; } catch { /* noop */ } }
    }
    return blank();
  });
  const [reportStatus, setReportStatus] = useState("draft");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [loaded, setLoaded] = useState(!isEdit);

  const adminEditing = isEdit && isAdmin && reportStatus !== "draft";

  useEffect(() => {
    if (isEdit) {
      api.get(`/sales-reports/${reportId}`).then((res) => {
        const d = res.data;
        setReportStatus(d.status || "draft");
        setForm({
          report_date: (d.report_date || todayStr()).slice(0, 10),
          gross_amount: d.gross_amount ?? "",
          retail: { cash: d.retail?.cash ?? "", upi: d.retail?.upi ?? "", bank: d.retail?.bank ?? "", card: d.retail?.card ?? "" },
          employee_remarks: d.employee_remarks || "",
        });
      }).catch(() => toast.error("Failed to load report")).finally(() => setLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  useEffect(() => { if (!isEdit) localStorage.setItem(storageKey, JSON.stringify(form)); }, [form, isEdit]);

  const setRetail = (k, v) => setForm((f) => ({ ...f, retail: { ...f.retail, [k]: v } }));

  const calc = useMemo(() => {
    const totalRetail = MODES.reduce((a, m) => a + n(form.retail[m.k]), 0);
    const debtor = n(form.gross_amount) - totalRetail;
    return { totalRetail, debtor };
  }, [form]);

  const retailExceeds = calc.totalRetail > n(form.gross_amount);

  const validate = () => {
    const e = {};
    if (!form.report_date) e.report_date = "Report date is required";
    if (n(form.gross_amount) <= 0) e.gross_amount = "Gross Amount must be greater than zero";
    if (retailExceeds) e.retail = "Total Retail cannot exceed Gross Amount";
    if (adminEditing && !editReason.trim()) e.edit_reason = "A reason is required to edit a submitted report.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = (status) => ({
    report_date: form.report_date,
    gross_amount: n(form.gross_amount),
    retail: { cash: n(form.retail.cash), upi: n(form.retail.upi), bank: n(form.retail.bank), card: n(form.retail.card) },
    employee_remarks: form.employee_remarks,
    status,
    ...(adminEditing ? { edit_reason: editReason } : {}),
  });

  const save = async (status) => {
    if (status === "submitted" && !validate()) { toast.error("Please fix the highlighted fields"); return; }
    if (retailExceeds) { toast.error("Total Retail cannot exceed Gross Amount"); return; }
    setSaving(true);
    try {
      const payload = buildPayload(status);
      const res = isEdit ? await api.put(`/sales-reports/${reportId}`, payload) : await api.post("/sales-reports", payload);
      localStorage.removeItem(storageKey);
      toast.success(status === "submitted" ? "Sales report submitted" : (isEdit ? "Report updated" : "Draft saved"));
      navigate(`/reports/${res.data.report_id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save report");
    } finally { setSaving(false); setConfirmOpen(false); }
  };

  if (!loaded) return <Layout title="Sales Report"><div className="text-sm text-foreground/50">Loading...</div></Layout>;
  const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <Layout title={isEdit ? `Edit Sales Report ${reportId}` : "Daily Sales Report"}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Report Date" required error={errors.report_date}>
                <Input type="date" data-testid="field-report-date" value={form.report_date}
                  onChange={(e) => setForm({ ...form, report_date: e.target.value })} className={errors.report_date ? "border-primary" : ""} />
              </Field>
              <Field label="Submitted By"><Input value={user?.name || ""} disabled data-testid="field-submitted-by" /></Field>
              <Field label="Employee ID"><Input value={user?.employee_id || ""} disabled data-testid="field-employee-id" /></Field>
              <Field label="Time"><Input value={nowTime} disabled data-testid="field-time" /></Field>
            </div>
          </Section>

          <Section title="Gross Amount">
            <Field label="Gross Amount (complete sale value)" required error={errors.gross_amount}>
              <RupeeInput value={form.gross_amount} onChange={(v) => setForm({ ...form, gross_amount: v })} testId="field-gross-amount" error={errors.gross_amount} />
            </Field>
          </Section>

          <Section title="Retail">
            <p className="text-xs text-foreground/60 mb-3">Amount received immediately at the time of sale. Total Retail must not exceed Gross Amount.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {MODES.map((m) => (
                <Field key={m.k} label={`${m.l} Retail`}>
                  <RupeeInput value={form.retail[m.k]} onChange={(v) => setRetail(m.k, v)} testId={`field-retail-${m.k}`} />
                </Field>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border border-border rounded-sm px-3 py-2 bg-secondary/50">
              <span className="text-sm font-medium">Total Retail (auto)</span>
              <span className="text-lg font-bold tabular-nums" data-testid="calc-total-retail">{formatMoney(calc.totalRetail)}</span>
            </div>
            {errors.retail && <div className="text-xs text-primary mt-2 flex items-center gap-1" data-testid="retail-error"><AlertTriangle className="h-3.5 w-3.5" /> {errors.retail}</div>}
          </Section>

          <Section title="Debtor">
            <div className={`flex items-center justify-between rounded-sm px-3 py-3 border ${retailExceeds ? "border-primary bg-primary/5" : "border-border bg-secondary/50"}`}>
              <div>
                <div className="text-sm font-medium">Debtor (auto-calculated, read-only)</div>
                <div className="text-xs text-foreground/55">Debtor = Gross Amount &minus; Total Retail</div>
              </div>
              <span className="text-xl font-bold tabular-nums" data-testid="calc-debtor">{formatMoney(Math.max(0, calc.debtor))}</span>
            </div>
            <p className="text-xs text-foreground/55 mt-2">This amount becomes new Outstanding Debtor on submission. It is not added to cash or realised sales until received.</p>
          </Section>

          <Section title="Employee Remarks">
            <TextAreaField label="Remarks" value={form.employee_remarks} onChange={(v) => setForm({ ...form, employee_remarks: v })} testId="field-employee-remarks" placeholder="Optional notes about today's sale" />
          </Section>

          {adminEditing && (
            <Section title="Reason for Edit (required)">
              <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={2} placeholder="Explain why this submitted report is being edited"
                data-testid="field-edit-reason" className={errors.edit_reason ? "border-primary" : ""} />
              {errors.edit_reason && <div className="text-xs text-primary mt-1">{errors.edit_reason}</div>}
            </Section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <Card className="border border-border rounded-md p-4 bg-card shadow-none">
              <h2 className="text-base font-semibold mb-3">Live Summary</h2>
              <SumRow label="Gross Amount" value={formatMoney(n(form.gross_amount))} />
              <SumRow label="Total Retail" value={formatMoney(calc.totalRetail)} />
              <SumRow label="Debtor" value={formatMoney(Math.max(0, calc.debtor))} warn={retailExceeds} />
            </Card>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { if (validate()) setConfirmOpen(true); else toast.error("Please fix the highlighted fields"); }} disabled={saving} data-testid="sales-report-submit-button">
                <Send className="h-4 w-4 mr-2" /> {adminEditing ? "Save Changes" : "Preview & Submit"}
              </Button>
              {!adminEditing && (
                <Button variant="outline" onClick={() => save("draft")} disabled={saving} data-testid="sales-report-save-draft-button">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save as Draft
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(-1)} data-testid="sales-report-cancel-button">Cancel</Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{adminEditing ? "Confirm Changes" : "Confirm Submission"}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <SumRow label="Report Date" value={form.report_date} />
            <SumRow label="Gross Amount" value={formatMoney(n(form.gross_amount))} />
            <SumRow label="Total Retail" value={formatMoney(calc.totalRetail)} />
            <SumRow label="Debtor" value={formatMoney(Math.max(0, calc.debtor))} />
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

function Section({ title, children }) {
  return (
    <Card className="border border-border rounded-md p-4 sm:p-5 bg-card shadow-none">
      <h2 className="text-base font-semibold mb-4 pb-2 border-b border-border">{title}</h2>
      {children}
    </Card>
  );
}
function SumRow({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-foreground/70 text-sm">{label}</span>
      <span className={`font-semibold tabular-nums text-sm ${warn ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
