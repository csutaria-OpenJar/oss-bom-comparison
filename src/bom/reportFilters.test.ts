import { describe, expect, it } from "vitest";
import { DEFAULT_REPORT_FILTERS } from "./fields";
import { applyReportFilters } from "./reportFilters";
import type { ComparisonResult } from "./types";

describe("applyReportFilters", () => {
  it("hides noisy field categories and disabled sections", () => {
    const result: ComparisonResult = {
      summary: { addedRows: 1, removedRows: 0, changedFields: 2, manufacturerPartAdds: 0, manufacturerPartRemoves: 0, unmatchedOrBlankRows: 0 },
      addedRows: [{ line_item: "30", internal_part_number: "", customer_part_number: "", description: "", manufacturer_name: "", manufacturer_part_number: "", quantity: "", reference_designators: "" }],
      removedRows: [],
      changedFields: [
        { matchKey: "line_item", matchValue: "10", field: "description", originalValue: "Old", newValue: "New" },
        { matchKey: "line_item", matchValue: "10", field: "quantity", originalValue: "1", newValue: "2" },
      ],
      manufacturerPartAdds: [],
      manufacturerPartRemoves: [],
      unmatchedOrBlankRows: [],
      matchedRows: [
        {
          matchKey: "line_item",
          matchValue: "10",
          original: { line_item: "10", internal_part_number: "", customer_part_number: "", description: "Old", manufacturer_name: "", manufacturer_part_number: "", quantity: "1", reference_designators: "" },
          originalRows: [],
          next: { line_item: "10", internal_part_number: "", customer_part_number: "", description: "New", manufacturer_name: "", manufacturer_part_number: "", quantity: "2", reference_designators: "" },
          newRows: [],
          changes: [
            { matchKey: "line_item", matchValue: "10", field: "description", originalValue: "Old", newValue: "New" },
            { matchKey: "line_item", matchValue: "10", field: "quantity", originalValue: "1", newValue: "2" },
          ],
        },
      ],
    };

    const filtered = applyReportFilters(result, {
      ...DEFAULT_REPORT_FILTERS,
      addedRows: false,
      changedFields: { ...DEFAULT_REPORT_FILTERS.changedFields, description: false },
    });

    expect(filtered.addedRows).toEqual([]);
    expect(filtered.changedFields.map((change) => change.field)).toEqual(["quantity"]);
    expect(filtered.matchedRows[0].changes.map((change) => change.field)).toEqual(["quantity"]);
    expect(filtered.summary.addedRows).toBe(0);
    expect(filtered.summary.changedFields).toBe(1);
  });
});
