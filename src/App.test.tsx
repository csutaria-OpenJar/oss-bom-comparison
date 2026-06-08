import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

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
});
