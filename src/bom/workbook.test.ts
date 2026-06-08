import { describe, expect, it } from "vitest";
import { extractMappedRows, parseWorkbook, previewWorksheet } from "./workbook";
import { makeWorkbookBuffer } from "../test/testWorkbook";

const rows = [
  ["Customer BOM", "", ""],
  ["Assembly", "ASM-100", "A"],
  ["Item", "Internal PN", "Customer PN", "Description", "Mfr", "MPN", "Qty", "Ref Des"],
  ["10", "PN-1", "C-1", "Resistor", "Yageo", "RC0603", 2, "R1, R2"],
  ["20", "PN-2", "C-2", "Regulator", "TI", "TPS7A", 1, "U1"],
];

const rowsWithBlankBeforeHeader = [
  ["Customer BOM"],
  [],
  ["Item", "Internal PN", "Customer PN", "Description", "Mfr", "MPN", "Qty", "Ref Des"],
  ["10", "PN-1", "C-1", "Resistor", "Yageo", "RC0603", 2, "R1, R2"],
];

describe("workbook parsing", () => {
  it("rejects invalid workbook bytes with clear guidance", async () => {
    const invalid = new TextEncoder().encode("not xlsx").buffer;

    await expect(parseWorkbook(invalid)).rejects.toThrow("Upload a valid .xlsx workbook.");
  });

  it("rejects zip-prefixed bytes that are not an xlsx workbook", async () => {
    const invalid = new TextEncoder().encode("PKnot a workbook").buffer;

    await expect(parseWorkbook(invalid)).rejects.toThrow("Upload a valid .xlsx workbook.");
  });

  it("extracts sheet names and preview rows", async () => {
    const workbook = await parseWorkbook(await makeWorkbookBuffer(rows));
    expect(workbook.sheetNames).toEqual(["BOM"]);

    const preview = previewWorksheet(workbook, "BOM", 3, 2);
    expect(preview.headers).toEqual([
      "Item",
      "Internal PN",
      "Customer PN",
      "Description",
      "Mfr",
      "MPN",
      "Qty",
      "Ref Des",
    ]);
    expect(preview.columns[0]).toEqual({ index: 0, label: "A", header: "Item" });
    expect(preview.rows[0].isHeader).toBe(true);
    expect(preview.rows[1].values.slice(0, 3)).toEqual(["10", "PN-1", "C-1"]);
  });

  it("preserves worksheet row numbers when blank rows appear before the header", async () => {
    const workbook = await parseWorkbook(await makeWorkbookBuffer(rowsWithBlankBeforeHeader));
    const preview = previewWorksheet(workbook, "BOM", 3, 1);
    const mapped = extractMappedRows(workbook, "BOM", 3, {
      line_item: 0,
      internal_part_number: 1,
      customer_part_number: 2,
    });

    expect(preview.rows[0].rowNumber).toBe(3);
    expect(preview.rows[0].values[0]).toBe("Item");
    expect(preview.rows[1].rowNumber).toBe(4);
    expect(mapped[0].line_item).toBe("10");
  });

  it("extracts mapped rows by column index as trimmed strings", async () => {
    const workbook = await parseWorkbook(await makeWorkbookBuffer(rows));
    const mapped = extractMappedRows(workbook, "BOM", 3, {
      line_item: 0,
      internal_part_number: 1,
      customer_part_number: 2,
      description: 3,
      manufacturer_name: 4,
      manufacturer_part_number: 5,
      quantity: 6,
      reference_designators: 7,
    });

    expect(mapped[0].quantity).toBe("2");
    expect(mapped[0].reference_designators).toBe("R1, R2");
    expect(mapped[1].manufacturer_part_number).toBe("TPS7A");
  });

  it("rejects workbooks with more than 3000 rows", async () => {
    const oversizedRows = Array.from({ length: 3001 }, (_, index) => [`Row ${index + 1}`]);

    await expect(parseWorkbook(await makeWorkbookBuffer(oversizedRows))).rejects.toThrow(
      "Workbook is too large. Upload a workbook with 3000 rows or fewer and 200000 cells or fewer.",
    );
  });

  it("rejects workbooks with more than 200000 cells", async () => {
    const oversizedCells = Array.from({ length: 1001 }, () => Array.from({ length: 200 }, () => "x"));

    await expect(parseWorkbook(await makeWorkbookBuffer(oversizedCells))).rejects.toThrow(
      "Workbook is too large. Upload a workbook with 3000 rows or fewer and 200000 cells or fewer.",
    );
  }, 15000);
});
