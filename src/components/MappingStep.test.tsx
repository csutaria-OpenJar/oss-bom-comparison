import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        onBack={vi.fn()}
        onMapped={vi.fn()}
      />,
    );

    expect(screen.getByText(/same comparison key selected for the original BOM/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Match key")).toHaveValue("manufacturer_part_number");
    expect(screen.getByLabelText("Match key")).toBeDisabled();
  });

  it("lets users go back from the table mapping controls", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <MappingStep
        label="Original"
        workbook={{
          fileName: "original.xlsx",
          data: makeWorkbookBuffer([["Line", "MPN"], ["10", "ABC-123"]]),
          sheetNames: ["BOM"],
        }}
        onBack={onBack}
        onMapped={vi.fn()}
      />,
    );

    const actions = screen.getByRole("group", { name: /map original bom actions/i });
    const back = screen.getByRole("button", { name: /back/i });
    const preview = screen.getByRole("button", { name: /preview original bom/i });

    expect(actions).toHaveClass("step-actions");
    expect(actions.lastElementChild).toBe(preview);

    await user.click(back);

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
