import { describe, expect, it } from "vitest";
import { compareBoms, validateMatchKeys } from "./compare";
import type { BomRow } from "./types";

const baseRow: BomRow = {
  line_item: "",
  internal_part_number: "",
  customer_part_number: "",
  description: "",
  manufacturer_name: "",
  manufacturer_part_number: "",
  quantity: "",
  reference_designators: "",
};

describe("compareBoms", () => {
  it("detects changed fields, added rows, removed rows, and manufacturer part changes", () => {
    const original = [
      { ...baseRow, line_item: "10", internal_part_number: "PN-1", description: "Old desc", manufacturer_name: "Yageo", manufacturer_part_number: "OLD", quantity: "2", reference_designators: "R1, R2" },
      { ...baseRow, line_item: "20", internal_part_number: "PN-2", manufacturer_name: "TI", manufacturer_part_number: "KEEP", quantity: "1" },
    ];
    const next = [
      { ...baseRow, line_item: "10", internal_part_number: "PN-1", description: "New desc", manufacturer_name: "Yageo", manufacturer_part_number: "NEW", quantity: "2", reference_designators: "R1,R2" },
      { ...baseRow, line_item: "30", internal_part_number: "PN-3", manufacturer_name: "Murata", manufacturer_part_number: "ADD", quantity: "1" },
    ];

    const result = compareBoms(original, next, "line_item");

    expect(result.summary.changedFields).toBe(2);
    expect(result.changedFields.map((change) => change.field)).toEqual([
      "description",
      "manufacturer_part_number",
    ]);
    expect(result.summary.addedRows).toBe(1);
    expect(result.summary.removedRows).toBe(1);
    expect(result.summary.manufacturerPartAdds).toBe(1);
    expect(result.summary.manufacturerPartRemoves).toBe(1);
  });

  it("surfaces blank and duplicate match keys", () => {
    const validation = validateMatchKeys([
      { ...baseRow, line_item: "10" },
      { ...baseRow, line_item: "10" },
      { ...baseRow, line_item: "" },
    ], "line_item");

    expect(validation.blankRowIndexes).toEqual([2]);
    expect(validation.duplicateGroups).toEqual([{ key: "10", rowIndexes: [0, 1] }]);
  });

  it("treats manufacturer plus MPN as the manufacturer-part identity", () => {
    const original = [
      { ...baseRow, line_item: "10", manufacturer_name: "Mfr A", manufacturer_part_number: "Y" },
      { ...baseRow, line_item: "10", manufacturer_name: "Mfr B", manufacturer_part_number: "Z" },
    ];
    const next = [
      { ...baseRow, line_item: "10", manufacturer_name: "Mfr B", manufacturer_part_number: "Y" },
      { ...baseRow, line_item: "10", manufacturer_name: "Mfr B", manufacturer_part_number: "Z" },
    ];

    const result = compareBoms(original, next, "line_item");

    expect(result.manufacturerPartAdds).toEqual([
      {
        matchKey: "line_item",
        matchValue: "10",
        lineItem: "10",
        manufacturerName: "Mfr B",
        manufacturerPartNumber: "Y",
      },
    ]);
    expect(result.manufacturerPartRemoves).toEqual([
      {
        matchKey: "line_item",
        matchValue: "10",
        lineItem: "10",
        manufacturerName: "Mfr A",
        manufacturerPartNumber: "Y",
      },
    ]);
  });

  it("keeps grouped original and new manufacturer rows for inline report annotations", () => {
    const original = [
      { ...baseRow, line_item: "10", internal_part_number: "PN-1", customer_part_number: "C-1", manufacturer_name: "Yageo", manufacturer_part_number: "KEEP" },
      { ...baseRow, line_item: "10", internal_part_number: "PN-1", customer_part_number: "C-1", manufacturer_name: "TDK", manufacturer_part_number: "REMOVE" },
    ];
    const next = [
      { ...baseRow, line_item: "10", internal_part_number: "PN-1", customer_part_number: "C-1", manufacturer_name: "Yageo", manufacturer_part_number: "KEEP" },
      { ...baseRow, line_item: "10", internal_part_number: "PN-1", customer_part_number: "C-1", manufacturer_name: "Murata", manufacturer_part_number: "ADD" },
    ];

    const result = compareBoms(original, next, "line_item");

    expect(result.matchedRows[0].originalRows.map((row) => row.manufacturer_part_number)).toEqual(["KEEP", "REMOVE"]);
    expect(result.matchedRows[0].newRows.map((row) => row.manufacturer_part_number)).toEqual(["KEEP", "ADD"]);
  });
});
