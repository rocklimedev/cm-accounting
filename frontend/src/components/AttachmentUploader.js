import React, { useRef, useState } from "react";
import { api, attachmentUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image as ImageIcon, X, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const ICON_BY_EXT = (ext) => (["jpg", "jpeg", "png"].includes(ext) ? ImageIcon : FileText);

export function AttachmentUploader({ attachments = [], onChange, testId = "attachments" }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      const next = [...attachments];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await api.post("/attachments", fd, { headers: { "Content-Type": "multipart/form-data" } });
          next.push(res.data);
        } catch (err) {
          toast.error(err.response?.data?.detail || `Failed to upload ${file.name}`);
        }
      }
      onChange(next);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (id) => onChange(attachments.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      <div
        className="border border-dashed border-border rounded-md p-5 text-center bg-secondary/40"
        data-testid={`${testId}-dropzone`}
      >
        <Upload className="h-6 w-6 mx-auto text-foreground/50" />
        <div className="text-sm mt-2 text-foreground/70">PDF, XLS, XLSX, JPG, PNG (max 10 MB)</div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.xls,.xlsx,.jpg,.jpeg,.png" className="hidden"
          data-testid={`${testId}-input`} onChange={(e) => handleFiles(e.target.files)} />
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={uploading}
          onClick={() => inputRef.current?.click()} data-testid={`${testId}-button`}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? "Uploading..." : "Choose files"}
        </Button>
      </div>
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((a) => {
            const Icon = ICON_BY_EXT(a.ext);
            return (
              <div key={a.id} className="flex items-center justify-between border border-border rounded-sm px-3 py-2">
                <span className="flex items-center gap-2 text-sm truncate">
                  <Icon className="h-4 w-4 text-foreground/60 shrink-0" />
                  <span className="truncate">{a.filename}</span>
                  <span className="text-xs text-foreground/50">({Math.round((a.size || 0) / 1024)} KB)</span>
                </span>
                <span className="flex items-center gap-1">
                  <a href={attachmentUrl(a.id)} target="_blank" rel="noreferrer" className="p-1 hover:bg-secondary rounded-sm" title="Preview">
                    <ExternalLink className="h-4 w-4 text-foreground/60" />
                  </a>
                  <button type="button" onClick={() => remove(a.id)} className="p-1 hover:bg-secondary rounded-sm" title="Remove" data-testid={`${testId}-remove-${a.id}`}>
                    <X className="h-4 w-4 text-primary" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
