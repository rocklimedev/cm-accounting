import React, { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PERMISSION_LABELS = {
  view_all_reports: "View all reports", add_reports: "Add reports", edit_all_reports: "Edit all reports",
  approve_reports: "Approve reports", reject_reports: "Reject reports", delete_reports: "Delete reports",
  export_reports: "Export reports", manage_users: "Manage users", manage_permissions: "Manage permissions",
  view_activity: "View activity", view_others_financials: "View others' financials",
  manage_cash: "Manage cash opening & adjustments",
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [allPerms, setAllPerms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, p, s] = await Promise.all([
        api.get("/users"), api.get("/users/permissions/all"), api.get("/settings"),
      ]);
      setUsers(u.data); setAllPerms(p.data.permissions);
      setDepartments(s.data.departments || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", role: "accountant", department: departments[0] || "Accounts", permissions: ["add_reports"], active: true });
    setDialog("create");
  };
  const openEdit = (u) => { setForm({ ...u, password: "" }); setDialog("edit"); };

  const togglePerm = (p) => {
    const perms = form.permissions || [];
    setForm({ ...form, permissions: perms.includes(p) ? perms.filter((x) => x !== p) : [...perms, p] });
  };

  const save = async () => {
    setBusy(true);
    try {
      if (dialog === "create") {
        if (!form.name || !form.email || !form.password) { toast.error("Name, email & password required"); setBusy(false); return; }
        await api.post("/users", form);
        toast.success("User created");
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${form.id}`, payload);
        toast.success("User updated");
      }
      setDialog(null); load();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setBusy(false); }
  };

  const del = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;
    try { await api.delete(`/users/${u.id}`); toast.success("Deleted"); load(); }
    catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
  };

  return (
    <Layout title="Users & Permissions">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openCreate} data-testid="add-user-button"><Plus className="h-4 w-4 mr-1" /> Add User</Button>
        </div>
        <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
          <div className="overflow-x-auto thin-scroll">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead>
                <TableHead>Employee ID</TableHead><TableHead>Department</TableHead><TableHead>Permissions</TableHead>
                <TableHead>Active</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-6 w-full" /></TableCell></TableRow>)
                : users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="capitalize">{(u.role || "").replace(/_/g, " ")}</TableCell>
                    <TableCell>{u.employee_id}</TableCell>
                    <TableCell>{u.department}</TableCell>
                    <TableCell className="text-xs text-foreground/60">{u.role === "super_admin" ? "All" : u.role === "admin" ? "All except users" : (u.permissions || []).length + " perms"}</TableCell>
                    <TableCell>{u.active ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" className="h-8 w-8 mr-1" onClick={() => openEdit(u)} data-testid={`edit-user-${u.id}`}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-primary border-primary" onClick={() => del(u)} data-testid={`delete-user-${u.id}`}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog === "create" ? "Add User" : "Edit User"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="user-name-input" /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={dialog === "edit"} data-testid="user-email-input" /></div>
              <div className="space-y-1"><Label>{dialog === "edit" ? "New Password (optional)" : "Password"}</Label><Input type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password-input" /></div>
              <div className="space-y-1"><Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger data-testid="user-role-select"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="super_admin">Super Admin</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="accountant">Accountant</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Department</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between border border-border rounded-sm px-3 py-2">
              <Label>Active</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="user-active-switch" />
            </div>
            {form.role === "accountant" && (
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 border border-border rounded-sm p-3">
                  {allPerms.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={(form.permissions || []).includes(p)} onCheckedChange={() => togglePerm(p)} data-testid={`perm-${p}`} />
                      {PERMISSION_LABELS[p] || p}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy} data-testid="user-save-button">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
