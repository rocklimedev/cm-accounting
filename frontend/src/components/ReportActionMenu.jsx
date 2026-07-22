import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "../store/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Eye,
  MessageSquare,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function ReportActionMenu({ report, onChanged }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [dialog, setDialog] = useState(null);
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  // UUID for routes/API
  const id = report.id;

  // Human-readable report number
  const reportNo = report.report_id || report.expense_no;

  const isOwner = report.submitted_by_id === user?.id;
  const isDraft = report.status === "draft";

  const canDelete = isAdmin || (isOwner && isDraft);

  const type = (report.report_type || "expense").toLowerCase();

  const routeMap = {
    sales: "sales-reports",
    debtor: "debtor-reports",
    expense: "expense-reports",
  };

  const base = routeMap[type] || "expense-reports";

  const viewPath = `/${base}/${id}`;

  const addRemark = async () => {
    if (!remark.trim()) {
      toast.error("A remark is required");
      return;
    }

    setBusy(true);

    try {
      await api.post(`/${base}/${id}/remark`, {
        remark,
      });

      toast.success("Remark added");
      setDialog(null);
      setRemark("");
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);

    try {
      await api.delete(`/reports/${id}`);

      toast.success("Report deleted");
      setDialog(null);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-48"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem onClick={() => navigate(viewPath)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "delete"
                ? `Delete Report - ${reportNo}`
                : `Add Remark - ${reportNo}`}
            </DialogTitle>

            {dialog?.type === "delete" && (
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            )}
          </DialogHeader>

          {dialog?.type === "remark" && (
            <Textarea
              rows={3}
              placeholder="Enter remark..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>

            {dialog?.type === "delete" ? (
              <Button onClick={doDelete} disabled={busy} variant="destructive">
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            ) : (
              <Button onClick={addRemark} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Remark
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
