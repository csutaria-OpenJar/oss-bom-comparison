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
  appendSheet(sheets, "Annotated BOM", annotatedBomRows(filtered));

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

function annotatedBomRows(result: ComparisonResult): unknown[][] {
  return [
    [
      "Original line",
      "New line",
      "Internal part number",
      "Customer part number",
      "Quantity",
      "Reference designators",
      "Manufacturer annotations",
      "Manufacturer part annotations",
    ],
    ...result.matchedRows.map((line) => [
      line.original.line_item,
      line.next.line_item,
      annotatedFieldValue(line, "internal_part_number"),
      annotatedFieldValue(line, "customer_part_number"),
      annotatedFieldValue(line, "quantity"),
      annotatedFieldValue(line, "reference_designators"),
      manufacturerAnnotations(line, "manufacturer_name"),
      manufacturerAnnotations(line, "manufacturer_part_number"),
    ]),
  ];
}

function annotatedFieldValue(
  line: ComparisonResult["matchedRows"][number],
  field: "internal_part_number" | "customer_part_number" | "quantity" | "reference_designators",
): string {
  const change = line.changes.find((candidate) => candidate.field === field);
  if (!change) return `UNCHANGED: ${line.original[field]}`;

  if (field === "reference_designators" && change.referenceDesignatorDiff) {
    const parts = [`CHANGED: ${change.originalValue} -> ${change.newValue}`];
    if (change.referenceDesignatorDiff.removed.length) {
      parts.push(`removed ${change.referenceDesignatorDiff.removed.join(", ")}`);
    }
    if (change.referenceDesignatorDiff.added.length) {
      parts.push(`added ${change.referenceDesignatorDiff.added.join(", ")}`);
    }
    return parts.join("; ");
  }

  return `CHANGED: ${change.originalValue} -> ${change.newValue}`;
}

function manufacturerAnnotations(
  line: ComparisonResult["matchedRows"][number],
  field: "manufacturer_name" | "manufacturer_part_number",
): string {
  const originalParts = partRowsByIdentity(line.originalRows);
  const newParts = partRowsByIdentity(line.newRows);
  const annotations: string[] = [];

  for (const [identity, originalRow] of originalParts) {
    if (newParts.has(identity)) {
      annotations.push(`UNCHANGED: ${originalRow[field]}`);
    } else {
      annotations.push(`REMOVED: ${originalRow[field]}`);
    }
  }

  for (const [identity, newRow] of newParts) {
    if (!originalParts.has(identity)) {
      annotations.push(`ADDED: ${newRow[field]}`);
    }
  }

  return annotations.join("; ");
}

function partRowsByIdentity(rows: BomRow[]): Map<string, BomRow> {
  const parts = new Map<string, BomRow>();
  for (const row of rows) {
    const mpn = normalizeText(row.manufacturer_part_number);
    if (mpn) parts.set(`${normalizeText(row.manufacturer_name)}|${mpn}`, row);
  }
  return parts;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}
