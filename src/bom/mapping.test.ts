import { describe, expect, it } from "vitest";
import { suggestMapping, validateMapping } from "./mapping";

describe("mapping helpers", () => {
  it("suggests likely fields from headers", () => {
    const mapping = suggestMapping(["Item", "Internal PN", "Customer PN", "Description", "Mfr", "MPN"]);
    expect(mapping).toEqual({
      line_item: 0,
      internal_part_number: 1,
      customer_part_number: 2,
      description: 3,
      manufacturer_name: 4,
      manufacturer_part_number: 5,
    });
  });

  it("rejects duplicate mappings and missing selected match key", () => {
    expect(validateMapping(["line_item", "line_item"], "line_item")).toEqual([
      "Each field can only be mapped once: Line item.",
    ]);
    expect(validateMapping(["description"], "line_item")).toEqual([
      "Map the selected match-key field before continuing.",
    ]);
  });
});
