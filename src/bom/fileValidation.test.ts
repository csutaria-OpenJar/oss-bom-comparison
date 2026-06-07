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
});
