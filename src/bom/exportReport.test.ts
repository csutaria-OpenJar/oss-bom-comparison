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
});
