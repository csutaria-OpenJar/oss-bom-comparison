import readXlsxFile, { type SheetData } from "read-excel-file/browser";
import type { BomRow, ColumnMapping, PreviewColumn, PreviewRow, WorksheetPreview } from "./types";
import { BOM_FIELDS } from "./fields";

export const MAX_WORKBOOK_ROWS = 3000;
export const MAX_WORKBOOK_CELLS = 200000;
export const WORKBOOK_SIZE_LIMIT_MESSAGE =
  "Workbook is too large. Upload a workbook with 3000 rows or fewer and 200000 cells or fewer.";

export interface ParsedWorkbook {
  sheets: Record<string, unknown[][]>;
  sheetNames: string[];
}

export async function parseWorkbook(data: ArrayBuffer): Promise<ParsedWorkbook> {
  try {
    const sheets = await readXlsxFile(data);
    if (sheets.length === 0) {
      throw new Error("empty workbook");
    }
    const parsed: ParsedWorkbook = {
      sheets: Object.fromEntries(sheets.map((sheet) => [sheet.sheet, normalizeSheetData(sheet.data)])),
      sheetNames: sheets.map((sheet) => sheet.sheet),
    };
    enforceWorkbookLimits(parsed);
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message === WORKBOOK_SIZE_LIMIT_MESSAGE) {
      throw error;
    }
    throw new Error("Upload a valid .xlsx workbook.");
  }
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

export function worksheetStats(parsed: ParsedWorkbook, sheetName: string, headerRow: number) {
  const table = worksheetRows(parsed, sheetName);
  const headers = table[headerRow - 1] ? trimTrailingEmpty(table[headerRow - 1].map(normalizeCell)) : [];
  return {
    dataRows: Math.max(0, table.length - headerRow),
    detectedColumns: headers.length,
  };
}

function worksheetRows(parsed: ParsedWorkbook, sheetName: string): unknown[][] {
  const sheet = parsed.sheets[sheetName];
  if (!sheet) {
    throw new Error(`Worksheet "${sheetName}" was not found.`);
  }
  return sheet;
}

function normalizeSheetData(data: SheetData): unknown[][] {
  return data.map((row) => row.map((cell) => cell ?? ""));
}

function enforceWorkbookLimits(parsed: ParsedWorkbook): void {
  const rows = Object.values(parsed.sheets).reduce((total, sheet) => total + sheet.length, 0);
  const cells = Object.values(parsed.sheets).reduce(
    (total, sheet) => total + sheet.reduce((sheetTotal, row) => sheetTotal + row.length, 0),
    0,
  );

  if (rows > MAX_WORKBOOK_ROWS || cells > MAX_WORKBOOK_CELLS) {
    throw new Error(WORKBOOK_SIZE_LIMIT_MESSAGE);
  }
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
