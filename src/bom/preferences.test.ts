import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_REPORT_FILTERS } from "./fields";
import { loadPreferences, saveMappingPreference, saveReportFilters } from "./preferences";

describe("preferences", () => {
  beforeEach(() => localStorage.clear());

  it("stores mapping and filter preferences without BOM rows", () => {
    saveMappingPreference(["Item", "Internal PN"], { line_item: 0, internal_part_number: 1 }, "line_item");
    saveReportFilters({ ...DEFAULT_REPORT_FILTERS, addedRows: false });

    const raw = localStorage.getItem("oss-bom-comparison/preferences");
    expect(raw).toContain("headerMappings");
    expect(raw).not.toContain('manufacturer_part_number":"SECRET');
    expect(loadPreferences().reportFilters.addedRows).toBe(false);
  });
});
