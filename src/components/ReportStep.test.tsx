import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("renders every report row on screen without first-100 download guidance", () => {
    const originalRows = Array.from({ length: 120 }, (_, index) => ({
      ...baseRow,
      line_item: `${index + 1}`,
      internal_part_number: `ORIGINAL-IPN-${index + 1}`,
      manufacturer_name: "Yageo",
      manufacturer_part_number: `KEEP-${index + 1}`,
    }));
    const nextRows = Array.from({ length: 120 }, (_, index) => ({
      ...baseRow,
      line_item: `${index + 1}`,
      internal_part_number: `NEW-IPN-${index + 1}`,
      manufacturer_name: "Yageo",
      manufacturer_part_number: `KEEP-${index + 1}`,
    }));

    render(<ReportStep original={mapped(originalRows)} next={mapped(nextRows)} />);

    const annotatedTable = screen.getByRole("table", { name: "Original BOM with new BOM edits" });
    expect(within(annotatedTable).getByText("ORIGINAL-IPN-101")).toBeInTheDocument();
    expect(within(annotatedTable).getByText("NEW-IPN-120")).toBeInTheDocument();
    expect(screen.queryByText(/Showing first 100/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Download the Excel report for all rows/i)).not.toBeInTheDocument();
  });

  it("shows an executive summary, visible-versus-total counts, filter presets, and filtered export copy", async () => {
    const user = userEvent.setup();
    const original = mapped([
      {
        ...baseRow,
        line_item: "10",
        description: "Old description",
        manufacturer_part_number: "KEEP",
      },
      {
        ...baseRow,
        line_item: "20",
        manufacturer_part_number: "REMOVE",
      },
      {
        ...baseRow,
        line_item: "",
        manufacturer_part_number: "BLANK",
      },
    ]);
    const next = mapped([
      {
        ...baseRow,
        line_item: "10",
        description: "New description",
        manufacturer_part_number: "KEEP",
      },
      {
        ...baseRow,
        line_item: "30",
        manufacturer_part_number: "ADD",
      },
    ]);

    render(<ReportStep original={original} next={next} />);

    expect(screen.getByRole("heading", { name: /Report summary/i })).toBeInTheDocument();
    expect(screen.getByText(/Visible changes/i)).toBeInTheDocument();
    expect(screen.getByText(/Total changes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Manufacturer changes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ignore descriptions/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Issues only/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download filtered Excel report/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ignore descriptions/i }));

    expect(screen.getByText(/No changed fields are visible with the current filters/i)).toBeInTheDocument();
  });
});
