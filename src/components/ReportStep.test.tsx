import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BomRow, MappedBom } from "../bom/types";
import { ReportStep } from "./ReportStep";

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

function mapped(rows: BomRow[]): MappedBom {
  return {
    fileName: "bom.xlsx",
    sheetName: "BOM",
    headerRow: 1,
    mapping: {},
    matchKey: "line_item",
    rows,
  };
}

describe("ReportStep", () => {
  it("renders original BOM with inline new BOM edits and no Manex wording", () => {
    const original = mapped([
      {
        ...baseRow,
        line_item: "10",
        internal_part_number: "IPN-1",
        customer_part_number: "CPN-1",
        manufacturer_name: "Yageo",
        manufacturer_part_number: "KEEP",
        quantity: "1",
      },
      {
        ...baseRow,
        line_item: "10",
        internal_part_number: "IPN-1",
        customer_part_number: "CPN-1",
        manufacturer_name: "TDK",
        manufacturer_part_number: "REMOVE",
        quantity: "1",
      },
    ]);
    const next = mapped([
      {
        ...baseRow,
        line_item: "10",
        internal_part_number: "IPN-1A",
        customer_part_number: "CPN-1",
        manufacturer_name: "Yageo",
        manufacturer_part_number: "KEEP",
        quantity: "2",
      },
      {
        ...baseRow,
        line_item: "10",
        internal_part_number: "IPN-1A",
        customer_part_number: "CPN-1",
        manufacturer_name: "Murata",
        manufacturer_part_number: "ADD",
        quantity: "2",
      },
    ]);

    render(<ReportStep original={original} next={next} />);

    expect(screen.getByRole("heading", { name: "Original BOM With New BOM Edits" })).toBeInTheDocument();
    expect(screen.queryByText(/Manex/i)).not.toBeInTheDocument();

    const annotatedTable = screen.getByRole("table", { name: "Original BOM with new BOM edits" });
    expect(within(annotatedTable).getByText("IPN-1").tagName.toLowerCase()).toBe("del");
    expect(within(annotatedTable).getByText("IPN-1A").tagName.toLowerCase()).toBe("ins");
    expect(within(annotatedTable).getByText("KEEP")).toHaveClass("unchanged-chip");
    expect(within(annotatedTable).getByText("REMOVE")).toHaveClass("removed-chip");
    expect(within(annotatedTable).getByText("ADD")).toHaveClass("added-chip");
  });
});
