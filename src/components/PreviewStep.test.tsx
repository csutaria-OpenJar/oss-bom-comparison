import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MappedBom } from "../bom/types";
import { PreviewStep } from "./PreviewStep";

const mapped: MappedBom = {
  fileName: "bom.xlsx",
  sheetName: "BOM",
  headerRow: 1,
  mapping: {},
  matchKey: "line_item",
  rows: [
    {
      line_item: "10",
      internal_part_number: "IPN-1",
      customer_part_number: "CPN-1",
      description: "Capacitor",
      manufacturer_name: "Yageo",
      manufacturer_part_number: "ABC-123",
      quantity: "1",
      reference_designators: "C1",
    },
  ],
};

describe("PreviewStep", () => {
  it("lets users go back or continue from the table footer", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onConfirm = vi.fn();

    render(<PreviewStep label="Original" mapped={mapped} onBack={onBack} onConfirm={onConfirm} />);

    const actions = screen.getByRole("group", { name: /preview original bom actions/i });
    const back = screen.getByRole("button", { name: /back/i });
    const confirm = screen.getByRole("button", { name: /confirm original bom/i });

    expect(actions).toHaveClass("step-actions");
    expect(actions.lastElementChild).toBe(confirm);

    await user.click(back);
    await user.click(confirm);

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
