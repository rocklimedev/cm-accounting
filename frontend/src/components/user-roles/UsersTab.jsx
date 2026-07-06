import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

// RTK Query Hooks
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../../api/users.api"; // ← Adjust import path
import { useGetRolesQuery } from "../../api/rbac.api"; // ← Adjust import path

export default function UsersTab() {
  const [dialog, setDialog] = useState(null); // null | "create" | "edit"
  const [form, setForm] = useState({});

  const {
    data: usersData,
    isLoading: isUsersLoading,
    refetch,
  } = useGetUsersQuery();
  const { data: rolesData, isLoading: isRolesLoading } = useGetRolesQuery();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const users = usersData?.data || usersData || [];
  const roles = rolesData?.data || rolesData || [];

  const roleName = (user) =>
    user.role?.name || roles.find((r) => r.id === user.role_id)?.name || "—";

  const openCreate = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role_id: roles[0]?.id || "",
      is_active: true,
    });
    setDialog("create");
  };

  const openEdit = (user) => {
    setForm({ ...user, password: "", role_id: user.role_id || user.role?.id });
    setDialog("edit");
  };

  const save = async () => {
    try {
      if (dialog === "create") {
        if (!form.name || !form.email || !form.password || !form.role_id) {
          toast.error("Name, email, password & role are required");
          return;
        }
        await createUser(form).unwrap();
        toast.success("User created successfully");
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;

        await updateUser({ id: form.id, ...payload }).unwrap();
        toast.success("User updated successfully");
      }

      setDialog(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}?`)) return;

    try {
      await deleteUser(user.id).unwrap();
      toast.success("User deleted successfully");
      refetch();
    } catch (err) {
      toast.error(err?.data?.detail || "Failed to delete user");
    }
  };

  const isBusy = isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} data-testid="add-user-button">
          <Plus className="h-4 w-4 mr-1" /> Add User
        </Button>
      </div>

      <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
        <div className="overflow-x-auto thin-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isUsersLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="capitalize">
                        {roleName(u)}
                      </TableCell>
                      <TableCell>{u.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 mr-1"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive border-destructive"
                          onClick={() => handleDelete(u)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog === "create" ? "Add New User" : "Edit User"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={dialog === "edit"}
                />
              </div>
              <div className="space-y-1">
                <Label>
                  {dialog === "edit" ? "New Password (optional)" : "Password"}
                </Label>
                <Input
                  type="password"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  value={form.role_id}
                  onValueChange={(v) => setForm({ ...form, role_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isRolesLoading ? "Loading…" : "Select role"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between border border-border rounded-sm px-3 py-2">
              <Label>Active</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={isBusy}>
              {isBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
