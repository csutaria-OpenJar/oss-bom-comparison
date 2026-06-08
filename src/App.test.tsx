import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// @ts-expect-error This browser app does not install Node types, but Vitest runs this CSS regression in Node.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import App from "./App";
import { makeWorkbookBuffer } from "./test/testWorkbook";

describe("App", () => {
  it("starts with a streamlined upload screen", () => {
    render(<App />);

    expect(screen.queryByText(/3-stage workflow/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Original BOM -> New BOM -> Report/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Optimized for desktop and tablet workstations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Your BOM files stay in this browser/i)).not.toBeInTheDocument();
    expect(screen.getByText(/\.xlsx only\. CSV, PDF, and \.xls are not supported\./i)).toBeInTheDocument();
    expect(screen.getByText("Original BOM")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("New BOM")).toBeInTheDocument();
    expect(screen.getByText("Report")).toBeInTheDocument();
    expect(screen.queryByText("Original upload")).not.toBeInTheDocument();
  });

  it("rejects unsupported files before parsing", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/Original BOM workbook/i);
    await user.upload(input, new File(["a,b"], "bom.xlsx", { type: "text/csv" }));

    expect(screen.getByRole("alert")).toHaveTextContent(".xlsx only. CSV, PDF, and .xls are not supported.");
  });

  it("shows a next step action after selecting a valid original workbook", async () => {
    const user = userEvent.setup();
    render(<App />);

    const workbook = await makeWorkbookBuffer([
      ["Line", "MPN", "Qty"],
      ["10", "ABC-123", "2"],
    ]);
    const input = screen.getByLabelText(/Original BOM workbook/i);
    const file = new File([workbook], "original-bom.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    Object.defineProperty(file, "arrayBuffer", {
      value: () => Promise.resolve(workbook),
    });

    await user.upload(input, file);

    expect(screen.getByText(/Selected file: original-bom\.xlsx/i)).toBeInTheDocument();
    expect(screen.getByText(/Workbook is ready/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next step: map original BOM/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /map original BOM columns/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next step: map original BOM/i }));

    expect(screen.getByRole("heading", { name: /map original BOM columns/i })).toBeInTheDocument();
  });

  it("completes the full comparison workflow with uploaded workbooks", async () => {
    const user = userEvent.setup();
    render(<App />);

    const originalWorkbook = await makeWorkbookBuffer([
      ["Line", "MPN", "Qty"],
      ["10", "ABC-123", "2"],
    ]);
    const newWorkbook = await makeWorkbookBuffer([
      ["Line", "MPN", "Qty"],
      ["10", "ABC-123", "4"],
      ["20", "XYZ-789", "1"],
    ]);

    await uploadWorkbook(user, /Original BOM workbook/i, "original-bom.xlsx", originalWorkbook);
    await user.click(screen.getByRole("button", { name: /next step: map original BOM/i }));
    await user.click(screen.getByRole("button", { name: /preview original BOM/i }));
    await user.click(screen.getByRole("button", { name: /confirm original BOM/i }));

    expect(screen.getByRole("heading", { name: /upload new BOM/i })).toBeInTheDocument();

    await uploadWorkbook(user, /New BOM workbook/i, "new-bom.xlsx", newWorkbook);
    await user.click(screen.getByRole("button", { name: /next step: map new BOM/i }));
    await user.click(screen.getByRole("button", { name: /preview new BOM/i }));
    await user.click(screen.getByRole("button", { name: /confirm new BOM/i }));

    expect(screen.getByRole("heading", { name: /comparison report/i })).toBeInTheDocument();
    expect(screen.getByText(/1 added rows, 0 removed rows, 1 field changes/i)).toBeInTheDocument();
    expect(screen.getByText("XYZ-789")).toBeInTheDocument();
  });

  it("loads sample BOMs from the original upload step", async () => {
    const user = userEvent.setup();
    render(<App />);

    const sampleAction = screen.getByRole("group", { name: /sample bom action/i });
    const sampleButton = screen.getByRole("button", { name: /use sample boms/i });
    expect(sampleAction).toHaveClass("sample-bom-action");
    expect(sampleAction.lastElementChild).toBe(sampleButton);

    await user.click(screen.getByRole("button", { name: /use sample boms/i }));

    expect(screen.getByRole("heading", { name: /comparison report/i })).toBeInTheDocument();
    expect(screen.getByText(/The report uses the shared comparison key/i)).toHaveTextContent("Internal part number");
    expect(screen.getAllByText("ERJ-3EKF1002V").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CRCW060310K0FKEA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("OJ-1009").length).toBeGreaterThan(0);
  });

  it("shows a sticky OpenJar logo link and footer resources", () => {
    render(<App />);

    const logoLink = screen.getByRole("link", { name: /openjar home/i });
    expect(logoLink).toHaveAttribute("href", "https://openjartech.com/");
    expect(screen.getByAltText("OpenJar")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveClass("brand-header");

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /github repository/i })).toHaveAttribute(
      "href",
      "https://github.com/csutaria-OpenJar/oss-bom-comparison",
    );
    expect(screen.getByRole("link", { name: /openjar linkedin/i })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/company/openjartech/",
    );
    expect(screen.queryByRole("link", { name: /talk to me/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /license terms/i })).toHaveAttribute(
      "href",
      "https://github.com/csutaria-OpenJar/oss-bom-comparison?tab=MIT-1-ov-file#readme",
    );
    expect(screen.getByRole("link", { name: /openjar website/i })).toHaveAttribute(
      "href",
      "https://openjartech.com/",
    );
    expect(screen.getAllByTestId("footer-link-icon")).toHaveLength(4);
  });

  it("uses the page shell to keep the footer at the viewport bottom", () => {
    const styles = readFileSync("src/styles.css", "utf8");

    expect(styles).toMatch(/\.page-shell\s*{[^}]*display:\s*flex;/s);
    expect(styles).toMatch(/\.page-shell\s*{[^}]*flex-direction:\s*column;/s);
    expect(styles).toMatch(/\.app-shell\s*{[^}]*flex:\s*1(?:\s+0\s+auto)?;/s);
  });
});

async function uploadWorkbook(
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  fileName: string,
  workbook: ArrayBuffer,
) {
  const file = new File([workbook], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(workbook),
  });

  await user.upload(screen.getByLabelText(label), file);
}
