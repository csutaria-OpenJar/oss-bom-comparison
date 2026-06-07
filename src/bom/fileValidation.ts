export type FileValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export const XLSX_ONLY_MESSAGE =
  ".xlsx only. CSV, PDF, and .xls are not supported.";

export function validateWorkbookFile(file: File): FileValidationResult {
  const name = file.name.trim().toLowerCase();
  if (name.endsWith(".xlsx")) {
    return { ok: true };
  }
  return { ok: false, message: XLSX_ONLY_MESSAGE };
}
