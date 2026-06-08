import writeXlsxFile, { type SheetData } from "write-excel-file/browser";
import { FIELD_LABELS } from "./fields";
import { applyReportFilters } from "./reportFilters";
import type { BomRow, ComparisonResult, ReportFilters } from "./types";

const FORMULA_PREFIXES = ["=", "+", "-", "@"];

export async function buildReportWorkbook(result: ComparisonResult, filters: ReportFilters): Promise<Blob> {
  const filtered = applyReportFilters(result, filters);
  const sheets: Array<{ sheet: string; data: SheetData }> = [];

  appendSheet(sheets, "Summary", [
    ["Metric", "Value"],
    ["Added rows", filtered.summary.addedRows],
    ["Removed rows", filtered.summary.removedRows],
    ["Changed fields", filtered.summary.changedFields],
    ["Manufacturer part adds", filtered.summary.manufacturerPartAdds],
    ["Manufacturer part removes", filtered.summary.manufacturerPartRemoves],
    ["Rows with blank keys", filtered.summary.unmatchedOrBlankRows],
    ["Active filters", JSON.stringify(filters)],
  ]);

  if (filters.addedRows) appendSheet(sheets, "Added Rows", bomRows(filtered.addedRows));
  if (filters.removedRows) appendSheet(sheets, "Removed Rows", bomRows(filtered.removedRows));
  if (filtered.changedFields.length > 0) {
    appendSheet(sheets, "Changed Fields", [
      ["Match key", "Match value", "Field", "Original value", "New value"],
      ...filtered.changedFields.map((change) => [
        change.matchKey,
        change.matchValue,
        FIELD_LABELS[change.field],
        change.originalValue,
        change.newValue,
      ]),
    ]);
  }
  if (filters.manufacturerPartAdds) {
    appendSheet(sheets, "Manufacturer Part Adds", partRows(filtered.manufacturerPartAdds));
  }
  if (filters.manufacturerPartRemoves) {
    appendSheet(sheets, "Manufacturer Part Removes", partRows(filtered.manufacturerPartRemoves));
  }
  if (filters.unmatchedOrBlankRows) {
    appendSheet(sheets, "Rows With Blank Keys", bomRows(filtered.unmatchedOrBlankRows));
  }

  return writeXlsxFile(sheets).toBlob();
}

export function downloadReport(
  result: ComparisonResult,
  filters: ReportFilters,
  filename = "bom-comparison-report.xlsx",
): void {
  void buildReportWorkbook(result, filters).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  });
}

export function excelSafeValue(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  return FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix)) ? `'${value}` : value;
}

function appendSheet(sheets: Array<{ sheet: string; data: SheetData }>, name: string, rows: unknown[][]): void {
  sheets.push({ sheet: name, data: toSheetData(rows) });
}

function toSheetData(rows: unknown[][]): SheetData {
  return rows.map((row) =>
    row.map((value) => {
      const safeValue = excelSafeValue(value);
      if (
        typeof safeValue === "string" ||
        typeof safeValue === "number" ||
        typeof safeValue === "boolean" ||
        safeValue instanceof Date
      ) {
        return safeValue;
      }
      return safeValue == null ? null : String(safeValue);
    }),
  );
}

function bomRows(rows: BomRow[]): unknown[][] {
  return [
    [
      "Line item",
      "Internal part number",
      "Customer part number",
      "Description",
      "Manufacturer name",
      "Manufacturer part number",
      "Quantity",
      "Reference designators",
    ],
    ...rows.map((row) => [
      row.line_item,
      row.internal_part_number,
      row.customer_part_number,
      row.description,
      row.manufacturer_name,
      row.manufacturer_part_number,
      row.quantity,
      row.reference_designators,
    ]),
  ];
}

function partRows(
  rows: Array<{
    matchKey: string;
    matchValue: string;
    lineItem: string;
    manufacturerName: string;
    manufacturerPartNumber: string;
  }>,
): unknown[][] {
  return [
    ["Match key", "Match value", "Line item", "Manufacturer name", "Manufacturer part number"],
    ...rows.map((row) => [
      row.matchKey,
      row.matchValue,
      row.lineItem,
      row.manufacturerName,
      row.manufacturerPartNumber,
    ]),
  ];
}
