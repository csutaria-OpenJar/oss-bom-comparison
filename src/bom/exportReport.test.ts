import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { DEFAULT_REPORT_FILTERS } from "./fields";
import { buildReportWorkbook, excelSafeValue } from "./exportReport";
import type { ComparisonResult } from "./types";

describe("exportReport", () => {
  it("escapes formula-like strings", () => {
    expect(excelSafeValue('=HYPERLINK("https://example.test")')).toBe(
      '\'=HYPERLINK("https://example.test")',
    );
    expect(excelSafeValue("+ASM")).toBe("'+ASM");
    expect(excelSafeValue("-1+2")).toBe("'-1+2");
    expect(excelSafeValue("@SUM(1,2)")).toBe("'@SUM(1,2)");
  });

  it("builds an xlsx workbook with visible filtered sections", () => {
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

    const bytes = buildReportWorkbook(result, DEFAULT_REPORT_FILTERS);
    const workbook = XLSX.read(bytes, { type: "array" });

    expect(workbook.SheetNames).toContain("Summary");
    expect(workbook.SheetNames).toContain("Added Rows");
    expect(workbook.SheetNames).toContain("Rows With Blank Keys");
    const summary = XLSX.utils.sheet_to_json(workbook.Sheets.Summary, {
      header: 1,
    }) as unknown[][];
    expect(summary[6][0]).toBe("Rows with blank keys");
    const addedRows = XLSX.utils.sheet_to_json(workbook.Sheets["Added Rows"], {
      header: 1,
    }) as unknown[][];
    expect(addedRows[1][1]).toBe("'=PN");
  });
});
