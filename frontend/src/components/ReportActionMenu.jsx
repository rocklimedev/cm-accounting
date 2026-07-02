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
  Pencil,
  MessageSquare,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function ReportActionMenu({ report, onChanged }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState(null); // {type: "remark"|"delete"}
  const [remark, setRemark] = useState("");
  const [busy, setBusy] = useState(false);

  const rid = report.report_id;
  const isOwner = report.submitted_by_id === user?.id;
  const isDraft = report.status === "draft";
  const canEdit = isAdmin || (isOwner && isDraft);
  const canDelete = isAdmin || (isOwner && isDraft);
  const editPath =
    report.report_type === "sales"
      ? `/sales-reports/${rid}/edit`
      : report.report_type === "debtor"
        ? `/debtor-reports/${rid}/edit`
        : `/expense-reports/${rid}/edit`;

  const remarkBase =
    report.report_type === "sales"
      ? "sales-reports"
      : report.report_type === "debtor"
        ? "debtor-reports"
        : "expense-reports";

  const addRemark = async () => {
    if (!remark.trim()) {
      toast.error("A remark is required");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/${remarkBase}/${rid}/remark`, { remark });
      toast.success("Remark added");
      setDialog(null);
      setRemark("");
      onChanged && onChanged();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/reports/${rid}`);
      toast.success("Report deleted");
      setDialog(null);
      onChanged && onChanged();
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
            data-testid={`reports-table-row-action-${rid}`}
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
          <DropdownMenuItem
            onClick={() => navigate(`/reports/${rid}`)}
            data-testid={`action-view-${rid}`}
          >
            <Eye className="h-4 w-4 mr-2" /> View Details
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem
              onClick={() => navigate(editPath)}
              data-testid={`action-edit-${rid}`}
            >
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem
              onClick={() => {
                setRemark("");
                setDialog({ type: "remark" });
              }}
              data-testid={`action-remark-${rid}`}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Add Remark
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDialog({ type: "delete" })}
                className="text-primary"
                data-testid={`action-delete-${rid}`}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "delete" ? "Delete Report" : "Add Remark"}{" "}
              &mdash; {rid}
            </DialogTitle>
            {dialog?.type === "delete" && (
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            )}
          </DialogHeader>
          {dialog?.type === "remark" && (
            <Textarea
              placeholder="Enter remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              data-testid="action-remark-input"
              rows={3}
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog(null)}
              data-testid="action-dialog-cancel"
            >
              Cancel
            </Button>
            {dialog?.type === "delete" ? (
              <Button
                onClick={doDelete}
                disabled={busy}
                className="bg-background text-primary border border-primary hover:bg-primary/10"
                data-testid="action-dialog-confirm-delete"
              >
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{" "}
                Delete
              </Button>
            ) : (
              <Button
                onClick={addRemark}
                disabled={busy}
                data-testid="action-dialog-confirm"
              >
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add
                Remark
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
