import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeWorkbookBuffer } from "../test/testWorkbook";
import { MappingStep } from "./MappingStep";

describe("MappingStep", () => {
  it("locks the new BOM to the original BOM comparison key", () => {
    render(
      <MappingStep
        label="New"
        workbook={{
          fileName: "new.xlsx",
          data: makeWorkbookBuffer([["Line", "MPN"], ["10", "ABC-123"]]),
          sheetNames: ["BOM"],
        }}
        requiredMatchKey="manufacturer_part_number"
        onMapped={vi.fn()}
      />,
    );

    expect(screen.getByText(/same comparison key selected for the original BOM/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Match key")).toHaveValue("manufacturer_part_number");
    expect(screen.getByLabelText("Match key")).toBeDisabled();
  });
});
