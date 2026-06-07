import * as XLSX from "xlsx";
import { FIELD_LABELS } from "./fields";
import { applyReportFilters } from "./reportFilters";
import type { BomRow, ComparisonResult, ReportFilters } from "./types";

const FORMULA_PREFIXES = ["=", "+", "-", "@"];

export function buildReportWorkbook(result: ComparisonResult, filters: ReportFilters): ArrayBuffer {
  const filtered = applyReportFilters(result, filters);
  const workbook = XLSX.utils.book_new();

  appendSheet(workbook, "Summary", [
    ["Metric", "Value"],
    ["Added rows", filtered.summary.addedRows],
    ["Removed rows", filtered.summary.removedRows],
    ["Changed fields", filtered.summary.changedFields],
    ["Manufacturer part adds", filtered.summary.manufacturerPartAdds],
    ["Manufacturer part removes", filtered.summary.manufacturerPartRemoves],
    ["Unmatched or blank key rows", filtered.summary.unmatchedOrBlankRows],
    ["Active filters", JSON.stringify(filters)],
  ]);

  if (filters.addedRows) appendSheet(workbook, "Added Rows", bomRows(filtered.addedRows));
  if (filters.removedRows) appendSheet(workbook, "Removed Rows", bomRows(filtered.removedRows));
  if (filtered.changedFields.length > 0) {
    appendSheet(workbook, "Changed Fields", [
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
    appendSheet(workbook, "Manufacturer Part Adds", partRows(filtered.manufacturerPartAdds));
  }
  if (filters.manufacturerPartRemoves) {
    appendSheet(workbook, "Manufacturer Part Removes", partRows(filtered.manufacturerPartRemoves));
  }
  if (filters.unmatchedOrBlankRows) {
    appendSheet(workbook, "Unmatched Or Blank Key Rows", bomRows(filtered.unmatchedOrBlankRows));
  }

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function downloadReport(
  result: ComparisonResult,
  filters: ReportFilters,
  filename = "bom-comparison-report.xlsx",
): void {
  const bytes = buildReportWorkbook(result, filters);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function excelSafeValue(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  return FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix)) ? `'${value}` : value;
}

function appendSheet(workbook: XLSX.WorkBook, name: string, rows: unknown[][]): void {
  const safeRows = rows.map((row) => row.map(excelSafeValue));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(safeRows), name);
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
