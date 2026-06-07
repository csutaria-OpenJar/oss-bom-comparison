import * as XLSX from "xlsx";
import type { BomRow, ColumnMapping, PreviewColumn, PreviewRow, WorksheetPreview } from "./types";
import { BOM_FIELDS } from "./fields";

export interface ParsedWorkbook {
  workbook: XLSX.WorkBook;
  sheetNames: string[];
}

export function parseWorkbook(data: ArrayBuffer): ParsedWorkbook {
  try {
    const workbook = XLSX.read(data, { type: "array", cellDates: false, bookFiles: true });
    if (!isXlsxWorkbook(workbook)) {
      throw new Error("not an xlsx workbook");
    }
    return { workbook, sheetNames: workbook.SheetNames };
  } catch (error) {
    throw new Error("Upload a valid .xlsx workbook.");
  }
}

function isXlsxWorkbook(workbook: XLSX.WorkBook): boolean {
  const files = (workbook as XLSX.WorkBook & { files?: Record<string, unknown> }).files;
  return Boolean(
    workbook.Workbook &&
      workbook.Props &&
      workbook.SheetNames.length > 0 &&
      files &&
      files["xl/workbook.xml"],
  );
}

export function previewWorksheet(
  parsed: ParsedWorkbook,
  sheetName: string,
  headerRow: number,
  sampleSize = 8,
): WorksheetPreview {
  const table = worksheetRows(parsed, sheetName);
  if (headerRow < 1 || headerRow > table.length) {
    throw new Error(`Header row ${headerRow} is outside worksheet row range 1-${table.length}.`);
  }

  const headerValues = trimTrailingEmpty(table[headerRow - 1].map(normalizeCell));
  if (headerValues.length === 0 || headerValues.every((value) => value === "")) {
    throw new Error(`Header row ${headerRow} does not contain headers.`);
  }

  const columns: PreviewColumn[] = headerValues.map((header, index) => ({
    index,
    label: columnLabel(index),
    header,
  }));

  const sampleRows: PreviewRow[] = table.slice(headerRow, headerRow + sampleSize).map((row, index) => ({
    rowNumber: headerRow + index + 1,
    values: valuesForWidth(row, headerValues.length),
    isHeader: false,
  }));

  return {
    sheetName,
    headerRow,
    headers: headerValues,
    columns,
    rows: [{ rowNumber: headerRow, values: headerValues, isHeader: true }, ...sampleRows],
  };
}

export function extractMappedRows(
  parsed: ParsedWorkbook,
  sheetName: string,
  headerRow: number,
  mapping: ColumnMapping,
): BomRow[] {
  const table = worksheetRows(parsed, sheetName);
  if (headerRow < 1 || headerRow > table.length) {
    throw new Error(`Header row ${headerRow} is outside worksheet row range 1-${table.length}.`);
  }

  const maxColumn = Math.max(0, ...table.map((row) => row.length - 1));
  for (const index of Object.values(mapping)) {
    if (index !== undefined && (index < 0 || index > maxColumn)) {
      throw new Error(`Mapped column ${index} is outside worksheet column range 0-${maxColumn}.`);
    }
  }

  return table.slice(headerRow).reduce<BomRow[]>((rows, rawRow) => {
    const normalized = emptyBomRow();
    for (const field of BOM_FIELDS) {
      const columnIndex = mapping[field];
      normalized[field] = columnIndex === undefined ? "" : normalizeCell(rawRow[columnIndex]);
    }
    if (Object.values(normalized).some((value) => value !== "")) {
      rows.push(normalized);
    }
    return rows;
  }, []);
}

function worksheetRows(parsed: ParsedWorkbook, sheetName: string): unknown[][] {
  const sheet = parsed.workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Worksheet "${sheetName}" was not found.`);
  }
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: true, defval: "" });
}

function valuesForWidth(row: unknown[], width: number): string[] {
  return Array.from({ length: width }, (_, index) => normalizeCell(row[index]));
}

function emptyBomRow(): BomRow {
  return {
    line_item: "",
    internal_part_number: "",
    customer_part_number: "",
    description: "",
    manufacturer_name: "",
    manufacturer_part_number: "",
    quantity: "",
    reference_designators: "",
  };
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function trimTrailingEmpty(values: string[]): string[] {
  const result = [...values];
  while (result.length > 0 && result[result.length - 1] === "") {
    result.pop();
  }
  return result;
}

function columnLabel(index: number): string {
  let label = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    current = Math.floor((current - 1) / 26);
  }
  return label;
}
