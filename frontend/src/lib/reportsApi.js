import { api } from "@/lib/api";

export function buildParams(filters, extra = {}) {
  const p = { ...extra };
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === "all") return;
    p[k] = v;
  });
  return p;
}

export async function fetchReports(params) {
  const res = await api.get("/reports", { params });
  return res.data;
}

export function downloadCsv(filename, rows, columns) {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const val = c.get(r);
        const s = val === null || val === undefined ? "" : String(val);
        return `"${s.replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
