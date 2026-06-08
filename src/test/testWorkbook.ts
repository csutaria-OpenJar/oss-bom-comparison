import writeXlsxFile, { type SheetData } from "write-excel-file/browser";

export async function makeWorkbookBuffer(rows: unknown[][], sheetName = "BOM"): Promise<ArrayBuffer> {
  const blob = await writeXlsxFile([{ sheet: sheetName, data: toSheetData(rows) }]).toBlob();
  return blobToArrayBuffer(blob);
}

function toSheetData(rows: unknown[][]): SheetData {
  return rows.map((row) =>
    row.map((value) =>
      typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value instanceof Date
        ? value
        : value == null
          ? null
          : String(value),
    ),
  );
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
