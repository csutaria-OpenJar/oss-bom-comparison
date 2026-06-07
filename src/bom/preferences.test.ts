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

  it("sanitizes unexpected data from stored preferences", () => {
    localStorage.setItem(
      "oss-bom-comparison/preferences",
      JSON.stringify({
        headerMappings: {
          "item|mpn": {
            line_item: 0,
            manufacturer_part_number: 1,
            uploadedRows: [{ manufacturer_part_number: "SECRET" }],
          },
        },
        preferredMatchKey: "description",
        reportFilters: {
          addedRows: false,
          uploadedRows: [{ manufacturer_part_number: "SECRET" }],
          changedFields: {
            description: false,
            uploadedRows: [{ manufacturer_part_number: "SECRET" }],
          },
        },
      }),
    );

    const preferences = loadPreferences();
    expect(preferences.headerMappings["item|mpn"]).toEqual({
      line_item: 0,
      manufacturer_part_number: 1,
    });
    expect(preferences.preferredMatchKey).toBe("line_item");
    expect(preferences.reportFilters.addedRows).toBe(false);
    expect(preferences.reportFilters.changedFields.description).toBe(false);
    expect(JSON.stringify(preferences)).not.toContain("SECRET");
  });

  it("sanitizes report filter objects before saving", () => {
    saveReportFilters({
      ...DEFAULT_REPORT_FILTERS,
      addedRows: false,
      uploadedRows: [{ manufacturer_part_number: "SECRET" }],
      changedFields: {
        ...DEFAULT_REPORT_FILTERS.changedFields,
        description: false,
        uploadedRows: [{ manufacturer_part_number: "SECRET" }],
      },
    } as never);

    const raw = localStorage.getItem("oss-bom-comparison/preferences") ?? "";
    expect(raw).not.toContain("SECRET");
    expect(loadPreferences().reportFilters.changedFields.description).toBe(false);
  });
});
