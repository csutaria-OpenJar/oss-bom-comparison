import { describe, expect, it } from "vitest";
import { validateWorkbookFile } from "./fileValidation";

function file(name: string, type = "") {
  return new File(["content"], name, { type });
}

describe("validateWorkbookFile", () => {
  it("accepts .xlsx files", () => {
    expect(validateWorkbookFile(file("bom.xlsx"))).toEqual({ ok: true });
  });

  it("rejects csv, pdf, and xls files with explicit guidance", () => {
    expect(validateWorkbookFile(file("bom.csv"))).toEqual({
      ok: false,
      message: ".xlsx only. CSV, PDF, and .xls are not supported.",
    });
    expect(validateWorkbookFile(file("bom.pdf"))).toEqual({
      ok: false,
      message: ".xlsx only. CSV, PDF, and .xls are not supported.",
    });
    expect(validateWorkbookFile(file("bom.xls"))).toEqual({
      ok: false,
      message: ".xlsx only. CSV, PDF, and .xls are not supported.",
    });
  });

  it("rejects files with unsupported browser-provided types even when the extension is xlsx", () => {
    expect(validateWorkbookFile(file("bom.xlsx", "text/csv"))).toEqual({
      ok: false,
      message: ".xlsx only. CSV, PDF, and .xls are not supported.",
    });
    expect(validateWorkbookFile(file("bom.xlsx", "application/pdf"))).toEqual({
      ok: false,
      message: ".xlsx only. CSV, PDF, and .xls are not supported.",
    });
    expect(validateWorkbookFile(file("bom.xlsx", "application/vnd.ms-excel"))).toEqual({
      ok: false,
      message: ".xlsx only. CSV, PDF, and .xls are not supported.",
    });
  });

  it("allows empty or unknown browser-provided types for xlsx filenames", () => {
    expect(validateWorkbookFile(file("bom.xlsx", ""))).toEqual({ ok: true });
    expect(validateWorkbookFile(file("bom.xlsx", "application/octet-stream"))).toEqual({
      ok: true,
    });
  });
});
