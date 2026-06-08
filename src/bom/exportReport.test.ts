import { readSheet } from "read-excel-file/browser";
import { describe, expect, it } from "vitest";
import { DEFAULT_REPORT_FILTERS } from "./fields";
import { buildReportWorkbook, excelSafeValue } from "./exportReport";
import type { ComparisonResult } from "./types";
import { blobToArrayBuffer } from "../test/testWorkbook";

describe("exportReport", () => {
  it("escapes formula-like strings", () => {
    expect(excelSafeValue('=HYPERLINK("https://example.test")')).toBe(
      '\'=HYPERLINK("https://example.test")',
    );
    expect(excelSafeValue("+ASM")).toBe("'+ASM");
    expect(excelSafeValue("-1+2")).toBe("'-1+2");
    expect(excelSafeValue("@SUM(1,2)")).toBe("'@SUM(1,2)");
  });

  it("builds an xlsx workbook with visible filtered sections", async () => {
    const result: ComparisonResult = {
      summary: {
        addedRows: 1,
        removedRows: 0,
        changedFields: 1,
        manufacturerPartAdds: 0,
        manufacturerPartRemoves: 0,
        unmatchedOrBlankRows: 0,
      },
      addedRows: [
        {
          line_item: "30",
          internal_part_number: "=PN",
          customer_part_number: "",
          description: "",
          manufacturer_name: "",
          manufacturer_part_number: "",
          quantity: "",
          reference_designators: "",
        },
      ],
      removedRows: [],
      changedFields: [
        {
          matchKey: "line_item",
          matchValue: "10",
          field: "description",
          originalValue: "Old",
          newValue: "New",
        },
      ],
      manufacturerPartAdds: [],
      manufacturerPartRemoves: [],
      unmatchedOrBlankRows: [],
      matchedRows: [],
    };

    const blob = await buildReportWorkbook(result, DEFAULT_REPORT_FILTERS);
    const bytes = await blobToArrayBuffer(blob);
    const summary = await readSheet(bytes, "Summary");
    expect(summary[6][0]).toBe("Rows with blank keys");
    const addedRows = await readSheet(bytes, "Added Rows");
    expect(addedRows[1][1]).toBe("'=PN");
  });

  it("adds an annotated BOM worksheet that respects filters and formula safety", async () => {
    const result: ComparisonResult = {
      summary: {
        addedRows: 0,
        removedRows: 0,
        changedFields: 2,
        manufacturerPartAdds: 1,
        manufacturerPartRemoves: 1,
        unmatchedOrBlankRows: 0,
      },
      addedRows: [],
      removedRows: [],
      changedFields: [
        {
          matchKey: "line_item",
          matchValue: "10",
          field: "quantity",
          originalValue: "=1",
          newValue: "2",
        },
        {
          matchKey: "line_item",
          matchValue: "10",
          field: "reference_designators",
          originalValue: "R1,R2",
          newValue: "R1,R3",
          referenceDesignatorDiff: {
            added: ["R3"],
            removed: ["R2"],
          },
        },
      ],
      manufacturerPartAdds: [
        {
          matchKey: "line_item",
          matchValue: "10",
          lineItem: "10",
          manufacturerName: "Murata",
          manufacturerPartNumber: "+NEW",
        },
      ],
      manufacturerPartRemoves: [
        {
          matchKey: "line_item",
          matchValue: "10",
          lineItem: "10",
          manufacturerName: "TDK",
          manufacturerPartNumber: "OLD",
        },
      ],
      unmatchedOrBlankRows: [],
      matchedRows: [
        {
          matchKey: "line_item",
          matchValue: "10",
          original: {
            line_item: "10",
            internal_part_number: "PN-1",
            customer_part_number: "C-1",
            description: "",
            manufacturer_name: "TDK",
            manufacturer_part_number: "OLD",
            quantity: "=1",
            reference_designators: "R1,R2",
          },
          originalRows: [
            {
              line_item: "10",
              internal_part_number: "PN-1",
              customer_part_number: "C-1",
              description: "",
              manufacturer_name: "TDK",
              manufacturer_part_number: "OLD",
              quantity: "=1",
              reference_designators: "R1,R2",
            },
          ],
          next: {
            line_item: "10",
            internal_part_number: "PN-1",
            customer_part_number: "C-1",
            description: "",
            manufacturer_name: "Murata",
            manufacturer_part_number: "+NEW",
            quantity: "2",
            reference_designators: "R1,R3",
          },
          newRows: [
            {
              line_item: "10",
              internal_part_number: "PN-1",
              customer_part_number: "C-1",
              description: "",
              manufacturer_name: "Murata",
              manufacturer_part_number: "+NEW",
              quantity: "2",
              reference_designators: "R1,R3",
            },
          ],
          changes: [
            {
              matchKey: "line_item",
              matchValue: "10",
              field: "quantity",
              originalValue: "=1",
              newValue: "2",
            },
            {
              matchKey: "line_item",
              matchValue: "10",
              field: "reference_designators",
              originalValue: "R1,R2",
              newValue: "R1,R3",
              referenceDesignatorDiff: {
                added: ["R3"],
                removed: ["R2"],
              },
            },
          ],
        },
      ],
    };

    const filters = {
      ...DEFAULT_REPORT_FILTERS,
      changedFields: {
        ...DEFAULT_REPORT_FILTERS.changedFields,
        reference_designators: false,
      },
    };

    const blob = await buildReportWorkbook(result, filters);
    const bytes = await blobToArrayBuffer(blob);
    const annotated = await readSheet(bytes, "Annotated BOM");

    expect(annotated[0]).toEqual([
      "Original line",
      "New line",
      "Internal part number",
      "Customer part number",
      "Quantity",
      "Reference designators",
      "Manufacturer annotations",
      "Manufacturer part annotations",
    ]);
    expect(annotated[1][4]).toBe("CHANGED: =1 -> 2");
    expect(annotated[1][5]).toBe("UNCHANGED: R1,R2");
    expect(annotated[1][7]).toContain("ADDED: +NEW");
  });
});
