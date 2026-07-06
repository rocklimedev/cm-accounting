import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Eye, Plus } from "lucide-react";

import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "../../api/rbac.api";

import { MODULE_LABELS } from "../../lib/config";
import PermCell from "./PermCell";

export default function RolesTab() {
  const [viewRole, setViewRole] = useState(null);

  const [open, setOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const { data: rolesData, isLoading } = useGetRolesQuery();

  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const roles = rolesData?.data || rolesData || [];

  const resetForm = () => {
    setEditingRole(null);
    setForm({
      name: "",
      description: "",
      is_active: true,
    });
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || "",
      is_active: role.is_active,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole({
          id: editingRole.id,
          ...form,
        }).unwrap();
      } else {
        await createRole(form).unwrap();
      }

      setOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Are you sure you want to delete "${role.name}"?`))
      return;

    try {
      await deleteRole(role.id).unwrap();
    } catch (err) {
      console.error(err);
      alert("Unable to delete role.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roles</h2>

        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Table */}

      <Card className="border border-border rounded-md bg-card shadow-none overflow-hidden">
        <div className="overflow-x-auto thin-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : roles.length ? (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>

                    <TableCell className="text-foreground/70">
                      {role.description || "—"}
                    </TableCell>

                    <TableCell>
                      <Badge variant={role.is_active ? "default" : "secondary"}>
                        {role.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setViewRole(role)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No roles found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit Role */}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Role Name</Label>

              <Input
                placeholder="Enter role name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>

              <Input
                placeholder="Enter description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>

              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    is_active: checked,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button onClick={handleSubmit} disabled={creating || updating}>
              {editingRole
                ? updating
                  ? "Updating..."
                  : "Update Role"
                : creating
                  ? "Creating..."
                  : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Permissions */}

      <Dialog
        open={!!viewRole}
        onOpenChange={(open) => !open && setViewRole(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewRole?.name} — Permissions</DialogTitle>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead className="text-center">Create</TableHead>
                <TableHead className="text-center">Read</TableHead>
                <TableHead className="text-center">Update</TableHead>
                <TableHead className="text-center">Delete</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {(viewRole?.permissions || []).map((permission) => (
                <TableRow key={permission.module}>
                  <TableCell>
                    {MODULE_LABELS[permission.module] || permission.module}
                  </TableCell>

                  <PermCell value={permission.can_create} />
                  <PermCell value={permission.can_read} />
                  <PermCell value={permission.can_update} />
                  <PermCell value={permission.can_delete} />
                </TableRow>
              ))}

              {!viewRole?.permissions?.length && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No permissions configured for this role.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRole(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
