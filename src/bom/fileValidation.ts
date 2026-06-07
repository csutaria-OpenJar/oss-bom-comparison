export type FileValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export const XLSX_ONLY_MESSAGE =
  ".xlsx only. CSV, PDF, and .xls are not supported.";

const UNSUPPORTED_TYPES = new Set([
  "text/csv",
  "application/csv",
  "application/pdf",
  "application/vnd.ms-excel",
]);

export function validateWorkbookFile(file: File): FileValidationResult {
  const name = file.name.trim().toLowerCase();
  const type = file.type.trim().toLowerCase();
  if (name.endsWith(".xlsx") && !UNSUPPORTED_TYPES.has(type)) {
    return { ok: true };
  }
  return { ok: false, message: XLSX_ONLY_MESSAGE };
}
