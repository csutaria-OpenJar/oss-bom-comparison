import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_REPORT_FILTERS } from "./fields";
import { loadPreferences, saveMappingPreference, saveReportFilters } from "./preferences";

describe("preferences", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("stores mapping and filter preferences without BOM rows", () => {
    saveMappingPreference(["Item", "Internal PN"], { line_item: 0, internal_part_number: 1 }, "line_item");
    saveReportFilters({ ...DEFAULT_REPORT_FILTERS, addedRows: false });

    const raw = localStorage.getItem("oss-bom-comparison/preferences");
    expect(raw).toContain("headerMappings");
    expect(raw).not.toContain("Internal PN");
    expect(raw).not.toContain('manufacturer_part_number":"SECRET');
    expect(loadPreferences().reportFilters.addedRows).toBe(false);
  });

  it("sanitizes unexpected data from stored preferences", () => {
    localStorage.setItem(
      "oss-bom-comparison/preferences",
      JSON.stringify({
        headerMappings: {
          "SECRET HEADER|mpn": {
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
    expect(preferences.headerMappings).toEqual({});
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

  it("loads mapping preferences by hashed header signature without storing header text", () => {
    saveMappingPreference(["Customer SECRET", "MPN"], { manufacturer_part_number: 1 }, "manufacturer_part_number");

    const raw = localStorage.getItem("oss-bom-comparison/preferences") ?? "";
    expect(raw).not.toContain("Customer SECRET");
    expect(loadPreferences().headerMappings).toEqual({
      "headers:19lnv20": { manufacturer_part_number: 1 },
    });
  });

  it("falls back when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(loadPreferences()).toEqual({
      headerMappings: {},
      preferredMatchKey: "line_item",
      reportFilters: DEFAULT_REPORT_FILTERS,
    });
  });

  it("does not block the workflow when saving preferences fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() =>
      saveMappingPreference(["Item"], { line_item: 0 }, "line_item"),
    ).not.toThrow();
    expect(() => saveReportFilters({ ...DEFAULT_REPORT_FILTERS, addedRows: false })).not.toThrow();
  });
});
