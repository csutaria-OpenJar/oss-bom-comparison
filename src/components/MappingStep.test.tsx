import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeWorkbookBuffer } from "../test/testWorkbook";
import { parseWorkbook } from "../bom/workbook";
import { MappingStep } from "./MappingStep";

describe("MappingStep", () => {
  it("locks the new BOM to the original BOM comparison key", async () => {
    const workbook = await uploadedWorkbook("new.xlsx", [["Line", "MPN"], ["10", "ABC-123"]]);

    render(
      <MappingStep
        label="New"
        workbook={workbook}
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
    const workbook = await uploadedWorkbook("original.xlsx", [["Line", "MPN"], ["10", "ABC-123"]]);

    render(
      <MappingStep
        label="Original"
        workbook={workbook}
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

  it("shows workbook context and keeps match-key quality diagnostics collapsed by default", async () => {
    const user = userEvent.setup();
    const workbook = await uploadedWorkbook("original.xlsx", [
      ["Line", "MPN", "Qty"],
      ["", "BLANK-KEY", "1"],
      ["10", "ABC-123", "2"],
      ["10", "DEF-456", "3"],
    ]);

    render(
      <MappingStep
        label="Original"
        workbook={workbook}
        onBack={vi.fn()}
        onMapped={vi.fn()}
      />,
    );

    expect(screen.getByText(/original.xlsx/i)).toBeInTheDocument();
    expect(screen.getByText(/1 worksheet/i)).toBeInTheDocument();
    expect(screen.getByText(/3 data rows/i)).toBeInTheDocument();
    expect(screen.getByText(/3 detected columns/i)).toBeInTheDocument();

    const diagnostic = screen.getByTestId("match-key-diagnostics");
    expect(diagnostic).not.toHaveAttribute("open");

    await user.click(screen.getByText(/match-key review/i));

    expect(screen.getByText(/Blank Line item keys: 1 row/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicate Line item keys: 10/i)).toBeInTheDocument();
  });

  it("marks mapped column controls and can show more preview rows", async () => {
    const user = userEvent.setup();
    const rows = [
      ["Line", "MPN", "Unmapped note"],
      ...Array.from({ length: 16 }, (_, index) => [`${index + 1}`, `MPN-${index + 1}`, `note-${index + 1}`]),
    ];
    const workbook = await uploadedWorkbook("original.xlsx", rows);

    render(
      <MappingStep
        label="Original"
        workbook={workbook}
        onBack={vi.fn()}
        onMapped={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Map column A").closest("th")).toHaveClass("mapped-column");
    expect(screen.getByLabelText("Map column C").closest("th")).toHaveClass("ignored-column");
    expect(screen.queryByText("MPN-16")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /view more preview rows/i }));

    expect(screen.getByText("MPN-16")).toBeInTheDocument();
  });
});

async function uploadedWorkbook(fileName: string, rows: unknown[][]) {
  const workbook = await parseWorkbook(await makeWorkbookBuffer(rows));
  return { fileName, workbook, sheetNames: workbook.sheetNames };
}
