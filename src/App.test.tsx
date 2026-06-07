import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("starts with browser-only privacy and xlsx-only upload guidance", () => {
    render(<App />);

    expect(screen.getByText(/Your BOM files stay in this browser/i)).toBeInTheDocument();
    expect(screen.getByText(/\.xlsx only\. CSV, PDF, and \.xls are not supported\./i)).toBeInTheDocument();
    expect(screen.getByText("Original upload")).toHaveAttribute("aria-current", "step");
  });

  it("rejects unsupported files before parsing", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/Original BOM workbook/i);
    await user.upload(input, new File(["a,b"], "bom.csv", { type: "text/csv" }));

    expect(screen.getByText(".xlsx only. CSV, PDF, and .xls are not supported.")).toBeInTheDocument();
  });
});
