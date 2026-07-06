import React from "react";
import { TableCell } from "@/components/ui/table";
import { Check, X } from "lucide-react";

export default function PermCell({ value }) {
  return (
    <TableCell className="text-center">
      {value ? (
        <Check className="h-4 w-4 text-emerald-600 inline" />
      ) : (
        <X className="h-4 w-4 text-foreground/30 inline" />
      )}
    </TableCell>
  );
}
