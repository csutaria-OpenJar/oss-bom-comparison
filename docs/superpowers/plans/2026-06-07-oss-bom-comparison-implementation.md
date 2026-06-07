# OSS BOM Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static GitHub Pages app that compares two `.xlsx` BOMs entirely in the browser, shows an on-screen report, and exports a filtered `.xlsx` report.

**Architecture:** The app is a Vite + React + TypeScript static frontend with no backend routes, database, authentication, or upload API. Workbook parsing, normalization, comparison, filtering, and report export happen in browser memory; local storage stores only non-BOM preferences.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, SheetJS `xlsx`, GitHub Pages static build.

---

## File Structure

- Create `package.json`: npm scripts and dependency declarations.
- Create `index.html`: Vite entry document.
- Create `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.setup.ts`: TypeScript, Vite, and test configuration.
- Create `src/main.tsx`: React entry point.
- Create `src/App.tsx`: top-level wizard state and screen routing.
- Create `src/styles.css`: app layout, mapping grid, preview table, report styling, responsive behavior.
- Create `src/bom/types.ts`: shared BOM, mapping, preview, comparison, filter, and export types.
- Create `src/bom/fields.ts`: supported fields, labels, match-key options, aliases, and default filters.
- Create `src/bom/fileValidation.ts`: `.xlsx`-only upload validation.
- Create `src/bom/workbook.ts`: browser workbook parsing, worksheet preview, mapped row extraction, and test workbook helpers.
- Create `src/bom/mapping.ts`: mapping suggestions, validation, and preference-safe mapping helpers.
- Create `src/bom/preferences.ts`: local-storage persistence for mappings, filters, and preferred match key only.
- Create `src/bom/compare.ts`: pure comparison logic.
- Create `src/bom/reportFilters.ts`: pure filtered-report selectors and summary calculations.
- Create `src/bom/exportReport.ts`: browser `.xlsx` report generation with Excel formula escaping.
- Create `src/components/PrivacyNotice.tsx`: repeated privacy messaging.
- Create `src/components/ProgressSteps.tsx`: wizard progress indicator.
- Create `src/components/UploadStep.tsx`: `.xlsx` upload step.
- Create `src/components/MappingStep.tsx`: worksheet/header selection and mapping grid.
- Create `src/components/PreviewStep.tsx`: normalized BOM preview confirmation.
- Create `src/components/ReportStep.tsx`: report filters, tracked-change report tables, and download button.
- Create `src/test/testWorkbook.ts`: test workbook construction helpers.
- Create `src/**/*.test.ts` and `src/**/*.test.tsx`: focused unit and component tests.
- Create `README.md`: open-source usage, privacy model, local development, and GitHub Pages deployment.
- Create `.gitignore`: Node and build output ignores.

---

### Task 1: Project Scaffold And Static App Baseline

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `.gitignore`

- [ ] **Step 1: Create the npm project files**

Add `package.json`:

```json
{
  "name": "oss-bom-comparison",
  "version": "0.1.0",
  "private": false,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit --pretty false"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.0",
    "typescript": "^5.7.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.1",
    "vitest": "^3.2.6"
  }
}
```

Add `.gitignore`:

```gitignore
node_modules/
dist/
coverage/
.vite/
*.log
```

- [ ] **Step 2: Create TypeScript and Vite config**

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "vite.config.ts", "vitest.setup.ts"]
}
```

Add `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.setup.ts"]
}
```

Add `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "jsdom",
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
});
```

Add `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Create the first static React screen**

Add `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BOM Comparison</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Add `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Add `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Browser-only BOM comparison</p>
          <h1>Compare two Excel BOMs</h1>
        </div>
        <p className="trust-banner">
          Your BOM files stay in this browser. Nothing is uploaded to a server.
        </p>
      </header>
      <section className="section">
        <h2>Upload original BOM</h2>
        <p className="muted">
          Start with the original Excel workbook. .xlsx only. CSV, PDF, and .xls
          are not supported.
        </p>
      </section>
    </main>
  );
}
```

Add `src/styles.css`:

```css
:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --panel: #ffffff;
  --text: #1f2933;
  --muted: #64748b;
  --line: #d7dde5;
  --accent: #146c70;
  --accent-dark: #0e5558;
  --added-bg: #e8f3ee;
  --added-text: #176c43;
  --removed-bg: #fff0f0;
  --removed-text: #a33131;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 15px;
  line-height: 1.5;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  margin: 0 auto;
  max-width: 1440px;
  padding: 28px 24px 48px;
}

.topbar {
  align-items: flex-start;
  display: flex;
  gap: 24px;
  justify-content: space-between;
  margin-bottom: 22px;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  font-size: 30px;
  line-height: 1.15;
  margin-bottom: 0;
}

h2 {
  font-size: 18px;
}

.eyebrow {
  color: var(--accent-dark);
  font-size: 13px;
  font-weight: 750;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.muted {
  color: var(--muted);
}

.trust-banner,
.notice {
  background: var(--added-bg);
  border: 1px solid #b9d8ca;
  border-radius: 8px;
  color: #155e3d;
  margin: 0;
  padding: 10px 12px;
}

.section {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 5: Verify baseline build**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully and create `dist/`.

- [ ] **Step 6: Commit scaffold**

```bash
git add .gitignore index.html package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts vitest.setup.ts src/main.tsx src/App.tsx src/styles.css
git commit -m "feat: scaffold static BOM comparison app"
```

---

### Task 2: Core BOM Types, Fields, And Upload Validation

**Files:**
- Create: `src/bom/types.ts`
- Create: `src/bom/fields.ts`
- Create: `src/bom/fileValidation.ts`
- Create: `src/bom/fileValidation.test.ts`

- [ ] **Step 1: Write failing upload validation tests**

Add `src/bom/fileValidation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run validation test to verify it fails**

Run: `npm test -- src/bom/fileValidation.test.ts`

Expected: FAIL because `src/bom/fileValidation.ts` does not exist.

- [ ] **Step 3: Add shared types and field definitions**

Add `src/bom/types.ts`:

```ts
export type BomField =
  | "line_item"
  | "internal_part_number"
  | "customer_part_number"
  | "description"
  | "manufacturer_name"
  | "manufacturer_part_number"
  | "quantity"
  | "reference_designators";

export type MatchKey =
  | "line_item"
  | "internal_part_number"
  | "customer_part_number"
  | "manufacturer_part_number";

export type ColumnMapping = Partial<Record<BomField, number>>;

export interface BomRow {
  line_item: string;
  internal_part_number: string;
  customer_part_number: string;
  description: string;
  manufacturer_name: string;
  manufacturer_part_number: string;
  quantity: string;
  reference_designators: string;
}

export interface PreviewColumn {
  index: number;
  label: string;
  header: string;
}

export interface PreviewRow {
  rowNumber: number;
  values: string[];
  isHeader: boolean;
}

export interface WorksheetPreview {
  sheetName: string;
  headerRow: number;
  headers: string[];
  columns: PreviewColumn[];
  rows: PreviewRow[];
}

export interface UploadedWorkbook {
  fileName: string;
  data: ArrayBuffer;
  sheetNames: string[];
}

export interface MappedBom {
  fileName: string;
  sheetName: string;
  headerRow: number;
  mapping: ColumnMapping;
  matchKey: MatchKey;
  rows: BomRow[];
}

export interface DuplicateGroup {
  key: string;
  rowIndexes: number[];
}

export interface MatchKeyValidation {
  blankRowIndexes: number[];
  duplicateGroups: DuplicateGroup[];
}

export interface FieldChange {
  matchKey: MatchKey;
  matchValue: string;
  field: BomField;
  originalValue: string;
  newValue: string;
}

export interface ManufacturerPartChange {
  matchKey: MatchKey;
  matchValue: string;
  lineItem: string;
  manufacturerName: string;
  manufacturerPartNumber: string;
}

export interface ComparisonResult {
  summary: {
    addedRows: number;
    removedRows: number;
    changedFields: number;
    manufacturerPartAdds: number;
    manufacturerPartRemoves: number;
    unmatchedOrBlankRows: number;
  };
  addedRows: BomRow[];
  removedRows: BomRow[];
  changedFields: FieldChange[];
  manufacturerPartAdds: ManufacturerPartChange[];
  manufacturerPartRemoves: ManufacturerPartChange[];
  unmatchedOrBlankRows: BomRow[];
  matchedRows: Array<{
    matchKey: MatchKey;
    matchValue: string;
    original: BomRow;
    next: BomRow;
    changes: FieldChange[];
  }>;
}

export type ReportFilters = {
  changedFields: Record<BomField, boolean>;
  addedRows: boolean;
  removedRows: boolean;
  manufacturerPartAdds: boolean;
  manufacturerPartRemoves: boolean;
  unmatchedOrBlankRows: boolean;
};
```

Add `src/bom/fields.ts`:

```ts
import type { BomField, MatchKey, ReportFilters } from "./types";

export const BOM_FIELDS: BomField[] = [
  "line_item",
  "internal_part_number",
  "customer_part_number",
  "description",
  "manufacturer_name",
  "manufacturer_part_number",
  "quantity",
  "reference_designators",
];

export const MATCH_KEYS: MatchKey[] = [
  "line_item",
  "internal_part_number",
  "customer_part_number",
  "manufacturer_part_number",
];

export const FIELD_LABELS: Record<BomField, string> = {
  line_item: "Line item",
  internal_part_number: "Internal part number",
  customer_part_number: "Customer part number",
  description: "Description",
  manufacturer_name: "Manufacturer name",
  manufacturer_part_number: "Manufacturer part number",
  quantity: "Quantity",
  reference_designators: "Reference designators",
};

export const HEADER_ALIASES: Record<BomField, string[]> = {
  line_item: ["item", "line", "line item", "line_item"],
  internal_part_number: ["internal pn", "internal part number", "part no", "part number"],
  customer_part_number: ["customer pn", "customer part number"],
  description: ["description", "desc"],
  manufacturer_name: ["mfr", "manufacturer", "manufacturer name"],
  manufacturer_part_number: ["mpn", "manufacturer part number", "mfr pn"],
  quantity: ["qty", "quantity"],
  reference_designators: ["ref des", "reference designators", "refs"],
};

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  changedFields: {
    line_item: true,
    internal_part_number: true,
    customer_part_number: true,
    description: true,
    manufacturer_name: true,
    manufacturer_part_number: true,
    quantity: true,
    reference_designators: true,
  },
  addedRows: true,
  removedRows: true,
  manufacturerPartAdds: true,
  manufacturerPartRemoves: true,
  unmatchedOrBlankRows: true,
};
```

- [ ] **Step 4: Implement upload validation**

Add `src/bom/fileValidation.ts`:

```ts
export type FileValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export const XLSX_ONLY_MESSAGE =
  ".xlsx only. CSV, PDF, and .xls are not supported.";

export function validateWorkbookFile(file: File): FileValidationResult {
  const name = file.name.trim().toLowerCase();
  if (name.endsWith(".xlsx")) {
    return { ok: true };
  }
  return { ok: false, message: XLSX_ONLY_MESSAGE };
}
```

- [ ] **Step 5: Run validation tests**

Run: `npm test -- src/bom/fileValidation.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit types and validation**

```bash
git add src/bom/types.ts src/bom/fields.ts src/bom/fileValidation.ts src/bom/fileValidation.test.ts
git commit -m "feat: add BOM types and xlsx validation"
```

---

### Task 3: Browser Workbook Parsing, Preview, And Mapped Extraction

**Files:**
- Create: `src/bom/workbook.ts`
- Create: `src/bom/workbook.test.ts`
- Create: `src/test/testWorkbook.ts`

- [ ] **Step 1: Write failing workbook parser tests**

Add `src/test/testWorkbook.ts`:

```ts
import * as XLSX from "xlsx";

export function makeWorkbookBuffer(rows: unknown[][], sheetName = "BOM"): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
```

Add `src/bom/workbook.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractMappedRows, parseWorkbook, previewWorksheet } from "./workbook";
import { makeWorkbookBuffer } from "../test/testWorkbook";

const rows = [
  ["Customer BOM", "", ""],
  ["Assembly", "ASM-100", "A"],
  ["Item", "Internal PN", "Customer PN", "Description", "Mfr", "MPN", "Qty", "Ref Des"],
  ["10", "PN-1", "C-1", "Resistor", "Yageo", "RC0603", 2, "R1, R2"],
  ["20", "PN-2", "C-2", "Regulator", "TI", "TPS7A", 1, "U1"],
];

describe("workbook parsing", () => {
  it("extracts sheet names and preview rows", () => {
    const workbook = parseWorkbook(makeWorkbookBuffer(rows));
    expect(workbook.sheetNames).toEqual(["BOM"]);

    const preview = previewWorksheet(workbook, "BOM", 3, 2);
    expect(preview.headers).toEqual([
      "Item",
      "Internal PN",
      "Customer PN",
      "Description",
      "Mfr",
      "MPN",
      "Qty",
      "Ref Des",
    ]);
    expect(preview.columns[0]).toEqual({ index: 0, label: "A", header: "Item" });
    expect(preview.rows[0].isHeader).toBe(true);
    expect(preview.rows[1].values.slice(0, 3)).toEqual(["10", "PN-1", "C-1"]);
  });

  it("extracts mapped rows by column index as trimmed strings", () => {
    const workbook = parseWorkbook(makeWorkbookBuffer(rows));
    const mapped = extractMappedRows(workbook, "BOM", 3, {
      line_item: 0,
      internal_part_number: 1,
      customer_part_number: 2,
      description: 3,
      manufacturer_name: 4,
      manufacturer_part_number: 5,
      quantity: 6,
      reference_designators: 7,
    });

    expect(mapped[0].quantity).toBe("2");
    expect(mapped[0].reference_designators).toBe("R1, R2");
    expect(mapped[1].manufacturer_part_number).toBe("TPS7A");
  });
});
```

- [ ] **Step 2: Run parser tests to verify they fail**

Run: `npm test -- src/bom/workbook.test.ts`

Expected: FAIL because `src/bom/workbook.ts` does not exist.

- [ ] **Step 3: Implement workbook parser**

Add `src/bom/workbook.ts`:

```ts
import * as XLSX from "xlsx";
import type { BomField, BomRow, ColumnMapping, PreviewColumn, PreviewRow, WorksheetPreview } from "./types";
import { BOM_FIELDS } from "./fields";

export interface ParsedWorkbook {
  workbook: XLSX.WorkBook;
  sheetNames: string[];
}

export function parseWorkbook(data: ArrayBuffer): ParsedWorkbook {
  try {
    const workbook = XLSX.read(data, { type: "array", cellDates: false });
    return { workbook, sheetNames: workbook.SheetNames };
  } catch (error) {
    throw new Error("Upload a valid .xlsx workbook.");
  }
}

export function previewWorksheet(
  parsed: ParsedWorkbook,
  sheetName: string,
  headerRow: number,
  sampleSize = 8,
): WorksheetPreview {
  const table = worksheetRows(parsed, sheetName);
  if (headerRow < 1 || headerRow > table.length) {
    throw new Error(`Header row ${headerRow} is outside worksheet row range 1-${table.length}.`);
  }

  const headerValues = trimTrailingEmpty(table[headerRow - 1].map(normalizeCell));
  if (headerValues.length === 0 || headerValues.every((value) => value === "")) {
    throw new Error(`Header row ${headerRow} does not contain headers.`);
  }

  const columns: PreviewColumn[] = headerValues.map((header, index) => ({
    index,
    label: columnLabel(index),
    header,
  }));

  const sampleRows: PreviewRow[] = table
    .slice(headerRow, headerRow + sampleSize)
    .map((row, index) => ({
      rowNumber: headerRow + index + 1,
      values: valuesForWidth(row, headerValues.length),
      isHeader: false,
    }));

  return {
    sheetName,
    headerRow,
    headers: headerValues,
    columns,
    rows: [
      { rowNumber: headerRow, values: headerValues, isHeader: true },
      ...sampleRows,
    ],
  };
}

export function extractMappedRows(
  parsed: ParsedWorkbook,
  sheetName: string,
  headerRow: number,
  mapping: ColumnMapping,
): BomRow[] {
  const table = worksheetRows(parsed, sheetName);
  if (headerRow < 1 || headerRow > table.length) {
    throw new Error(`Header row ${headerRow} is outside worksheet row range 1-${table.length}.`);
  }

  const maxColumn = Math.max(0, ...table.map((row) => row.length - 1));
  for (const index of Object.values(mapping)) {
    if (index !== undefined && (index < 0 || index > maxColumn)) {
      throw new Error(`Mapped column ${index} is outside worksheet column range 0-${maxColumn}.`);
    }
  }

  return table.slice(headerRow).reduce<BomRow[]>((rows, rawRow) => {
    const normalized = emptyBomRow();
    for (const field of BOM_FIELDS) {
      const columnIndex = mapping[field];
      normalized[field] = columnIndex === undefined ? "" : normalizeCell(rawRow[columnIndex]);
    }
    if (Object.values(normalized).some((value) => value !== "")) {
      rows.push(normalized);
    }
    return rows;
  }, []);
}

function worksheetRows(parsed: ParsedWorkbook, sheetName: string): unknown[][] {
  const sheet = parsed.workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Worksheet "${sheetName}" was not found.`);
  }
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: "" });
}

function valuesForWidth(row: unknown[], width: number): string[] {
  return Array.from({ length: width }, (_, index) => normalizeCell(row[index]));
}

function emptyBomRow(): BomRow {
  return {
    line_item: "",
    internal_part_number: "",
    customer_part_number: "",
    description: "",
    manufacturer_name: "",
    manufacturer_part_number: "",
    quantity: "",
    reference_designators: "",
  };
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function trimTrailingEmpty(values: string[]): string[] {
  const result = [...values];
  while (result.length > 0 && result[result.length - 1] === "") {
    result.pop();
  }
  return result;
}

function columnLabel(index: number): string {
  let label = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    current = Math.floor((current - 1) / 26);
  }
  return label;
}
```

- [ ] **Step 4: Run parser tests**

Run: `npm test -- src/bom/workbook.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit workbook parsing**

```bash
git add src/bom/workbook.ts src/bom/workbook.test.ts src/test/testWorkbook.ts
git commit -m "feat: parse and preview xlsx workbooks in browser"
```

---

### Task 4: Mapping Suggestions, Validation, And Preferences

**Files:**
- Create: `src/bom/mapping.ts`
- Create: `src/bom/mapping.test.ts`
- Create: `src/bom/preferences.ts`
- Create: `src/bom/preferences.test.ts`

- [ ] **Step 1: Write failing mapping and preference tests**

Add `src/bom/mapping.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { suggestMapping, validateMapping } from "./mapping";

describe("mapping helpers", () => {
  it("suggests likely fields from headers", () => {
    const mapping = suggestMapping(["Item", "Internal PN", "Customer PN", "Description", "Mfr", "MPN"]);
    expect(mapping).toEqual({
      line_item: 0,
      internal_part_number: 1,
      customer_part_number: 2,
      description: 3,
      manufacturer_name: 4,
      manufacturer_part_number: 5,
    });
  });

  it("rejects duplicate mappings and missing selected match key", () => {
    expect(validateMapping(["line_item", "line_item"], "line_item")).toEqual([
      "Each field can only be mapped once: Line item.",
    ]);
    expect(validateMapping(["description"], "line_item")).toEqual([
      "Map the selected match-key field before continuing.",
    ]);
  });
});
```

Add `src/bom/preferences.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { loadPreferences, saveMappingPreference, saveReportFilters } from "./preferences";
import { DEFAULT_REPORT_FILTERS } from "./fields";

describe("preferences", () => {
  beforeEach(() => localStorage.clear());

  it("stores mapping and filter preferences without BOM rows", () => {
    saveMappingPreference(["Item", "Internal PN"], { line_item: 0, internal_part_number: 1 }, "line_item");
    saveReportFilters({ ...DEFAULT_REPORT_FILTERS, addedRows: false });

    const raw = localStorage.getItem("oss-bom-comparison/preferences");
    expect(raw).toContain("headerMappings");
    expect(raw).not.toContain("manufacturer_part_number\":\"SECRET");
    expect(loadPreferences().reportFilters.addedRows).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/bom/mapping.test.ts src/bom/preferences.test.ts`

Expected: FAIL because `mapping.ts` and `preferences.ts` do not exist.

- [ ] **Step 3: Implement mapping helpers**

Add `src/bom/mapping.ts`:

```ts
import { BOM_FIELDS, FIELD_LABELS, HEADER_ALIASES, MATCH_KEYS } from "./fields";
import type { BomField, ColumnMapping, MatchKey } from "./types";

export function suggestMapping(headers: string[], remembered: ColumnMapping = {}): ColumnMapping {
  const suggested: ColumnMapping = {};
  const usedColumns = new Set<number>();

  for (const field of BOM_FIELDS) {
    const rememberedIndex = remembered[field];
    if (rememberedIndex !== undefined && headers[rememberedIndex] && !usedColumns.has(rememberedIndex)) {
      suggested[field] = rememberedIndex;
      usedColumns.add(rememberedIndex);
    }
  }

  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  for (const field of BOM_FIELDS) {
    if (suggested[field] !== undefined) {
      continue;
    }
    const aliases = HEADER_ALIASES[field].map(normalizeHeader);
    const index = normalizedHeaders.findIndex((header, columnIndex) => aliases.includes(header) && !usedColumns.has(columnIndex));
    if (index >= 0) {
      suggested[field] = index;
      usedColumns.add(index);
    }
  }

  return suggested;
}

export function fieldsByColumn(columnFields: Array<BomField | "">): ColumnMapping {
  return columnFields.reduce<ColumnMapping>((mapping, field, index) => {
    if (field) {
      mapping[field] = index;
    }
    return mapping;
  }, {});
}

export function validateMapping(columnFields: Array<BomField | "">, matchKey: MatchKey): string[] {
  const errors: string[] = [];
  const selected = columnFields.filter((field): field is BomField => field !== "");
  const duplicates = selected.filter((field, index) => selected.indexOf(field) !== index);
  const uniqueDuplicates = [...new Set(duplicates)];

  if (uniqueDuplicates.length > 0) {
    errors.push(`Each field can only be mapped once: ${uniqueDuplicates.map((field) => FIELD_LABELS[field]).join(", ")}.`);
  }
  if (!MATCH_KEYS.includes(matchKey) || !selected.includes(matchKey)) {
    errors.push("Map the selected match-key field before continuing.");
  }
  if (selected.filter((field) => field !== matchKey).length === 0) {
    errors.push("Map at least one comparison field before continuing.");
  }

  return errors;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}
```

- [ ] **Step 4: Implement local-storage preferences**

Add `src/bom/preferences.ts`:

```ts
import { DEFAULT_REPORT_FILTERS } from "./fields";
import type { ColumnMapping, MatchKey, ReportFilters } from "./types";

const STORAGE_KEY = "oss-bom-comparison/preferences";

interface StoredPreferences {
  headerMappings: Record<string, ColumnMapping>;
  preferredMatchKey: MatchKey;
  reportFilters: ReportFilters;
}

export function loadPreferences(): StoredPreferences {
  const fallback: StoredPreferences = {
    headerMappings: {},
    preferredMatchKey: "line_item",
    reportFilters: DEFAULT_REPORT_FILTERS,
  };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    return {
      headerMappings: parsed.headerMappings ?? {},
      preferredMatchKey: parsed.preferredMatchKey ?? "line_item",
      reportFilters: parsed.reportFilters ?? DEFAULT_REPORT_FILTERS,
    };
  } catch {
    return fallback;
  }
}

export function saveMappingPreference(headers: string[], mapping: ColumnMapping, matchKey: MatchKey): void {
  const current = loadPreferences();
  current.headerMappings[headerSignature(headers)] = mapping;
  current.preferredMatchKey = matchKey;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function loadMappingPreference(headers: string[]): ColumnMapping {
  return loadPreferences().headerMappings[headerSignature(headers)] ?? {};
}

export function saveReportFilters(reportFilters: ReportFilters): void {
  const current = loadPreferences();
  current.reportFilters = reportFilters;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

function headerSignature(headers: string[]): string {
  return headers.map((header) => header.trim().toLowerCase()).join("|");
}
```

- [ ] **Step 5: Run mapping and preference tests**

Run: `npm test -- src/bom/mapping.test.ts src/bom/preferences.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit mapping and preferences**

```bash
git add src/bom/mapping.ts src/bom/mapping.test.ts src/bom/preferences.ts src/bom/preferences.test.ts
git commit -m "feat: add mapping suggestions and local preferences"
```

---

### Task 5: Comparison Engine And Report Filters

**Files:**
- Create: `src/bom/compare.ts`
- Create: `src/bom/compare.test.ts`
- Create: `src/bom/reportFilters.ts`
- Create: `src/bom/reportFilters.test.ts`

- [ ] **Step 1: Write failing comparison tests**

Add `src/bom/compare.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { compareBoms, validateMatchKeys } from "./compare";
import type { BomRow } from "./types";

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

describe("compareBoms", () => {
  it("detects changed fields, added rows, removed rows, and manufacturer part changes", () => {
    const original = [
      { ...baseRow, line_item: "10", internal_part_number: "PN-1", description: "Old desc", manufacturer_name: "Yageo", manufacturer_part_number: "OLD", quantity: "2", reference_designators: "R1, R2" },
      { ...baseRow, line_item: "20", internal_part_number: "PN-2", manufacturer_name: "TI", manufacturer_part_number: "KEEP", quantity: "1" },
    ];
    const next = [
      { ...baseRow, line_item: "10", internal_part_number: "PN-1", description: "New desc", manufacturer_name: "Yageo", manufacturer_part_number: "NEW", quantity: "2", reference_designators: "R1,R2" },
      { ...baseRow, line_item: "30", internal_part_number: "PN-3", manufacturer_name: "Murata", manufacturer_part_number: "ADD", quantity: "1" },
    ];

    const result = compareBoms(original, next, "line_item");

    expect(result.summary.changedFields).toBe(1);
    expect(result.changedFields[0].field).toBe("description");
    expect(result.summary.addedRows).toBe(1);
    expect(result.summary.removedRows).toBe(1);
    expect(result.summary.manufacturerPartAdds).toBe(1);
    expect(result.summary.manufacturerPartRemoves).toBe(1);
  });

  it("surfaces blank and duplicate match keys", () => {
    const validation = validateMatchKeys([
      { ...baseRow, line_item: "10" },
      { ...baseRow, line_item: "10" },
      { ...baseRow, line_item: "" },
    ], "line_item");

    expect(validation.blankRowIndexes).toEqual([2]);
    expect(validation.duplicateGroups).toEqual([{ key: "10", rowIndexes: [0, 1] }]);
  });
});
```

Add `src/bom/reportFilters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_REPORT_FILTERS } from "./fields";
import { applyReportFilters } from "./reportFilters";
import type { ComparisonResult } from "./types";

describe("applyReportFilters", () => {
  it("hides noisy field categories and disabled sections", () => {
    const result: ComparisonResult = {
      summary: { addedRows: 1, removedRows: 0, changedFields: 2, manufacturerPartAdds: 0, manufacturerPartRemoves: 0, unmatchedOrBlankRows: 0 },
      addedRows: [{ line_item: "30", internal_part_number: "", customer_part_number: "", description: "", manufacturer_name: "", manufacturer_part_number: "", quantity: "", reference_designators: "" }],
      removedRows: [],
      changedFields: [
        { matchKey: "line_item", matchValue: "10", field: "description", originalValue: "Old", newValue: "New" },
        { matchKey: "line_item", matchValue: "10", field: "quantity", originalValue: "1", newValue: "2" },
      ],
      manufacturerPartAdds: [],
      manufacturerPartRemoves: [],
      unmatchedOrBlankRows: [],
      matchedRows: [],
    };

    const filtered = applyReportFilters(result, {
      ...DEFAULT_REPORT_FILTERS,
      addedRows: false,
      changedFields: { ...DEFAULT_REPORT_FILTERS.changedFields, description: false },
    });

    expect(filtered.addedRows).toEqual([]);
    expect(filtered.changedFields.map((change) => change.field)).toEqual(["quantity"]);
    expect(filtered.summary.addedRows).toBe(0);
    expect(filtered.summary.changedFields).toBe(1);
  });
});
```

- [ ] **Step 2: Run comparison tests to verify they fail**

Run: `npm test -- src/bom/compare.test.ts src/bom/reportFilters.test.ts`

Expected: FAIL because `compare.ts` and `reportFilters.ts` do not exist.

- [ ] **Step 3: Implement comparison engine**

Add `src/bom/compare.ts`:

```ts
import { BOM_FIELDS } from "./fields";
import type { BomField, BomRow, ComparisonResult, DuplicateGroup, MatchKey, MatchKeyValidation } from "./types";

export function validateMatchKeys(rows: BomRow[], matchKey: MatchKey): MatchKeyValidation {
  const occurrences = new Map<string, number[]>();
  const displayValues = new Map<string, string>();
  const blankRowIndexes: number[] = [];

  rows.forEach((row, index) => {
    const raw = row[matchKey];
    const normalized = normalizeKey(raw);
    if (!normalized) {
      blankRowIndexes.push(index);
      return;
    }
    displayValues.set(normalized, raw);
    occurrences.set(normalized, [...(occurrences.get(normalized) ?? []), index]);
  });

  const duplicateGroups: DuplicateGroup[] = [...occurrences.entries()]
    .filter(([, indexes]) => indexes.length > 1)
    .map(([key, rowIndexes]) => ({ key: displayValues.get(key) ?? key, rowIndexes }));

  return { blankRowIndexes, duplicateGroups };
}

export function compareBoms(originalRows: BomRow[], nextRows: BomRow[], matchKey: MatchKey): ComparisonResult {
  const originalGroups = groupByMatchKey(originalRows, matchKey);
  const nextGroups = groupByMatchKey(nextRows, matchKey);
  const originalKeys = new Set(originalGroups.keys());
  const nextKeys = new Set(nextGroups.keys());
  const matchedKeys = [...originalKeys].filter((key) => nextKeys.has(key));

  const addedRows = [...nextGroups.entries()]
    .filter(([key]) => !originalKeys.has(key))
    .flatMap(([, group]) => group);
  const removedRows = [...originalGroups.entries()]
    .filter(([key]) => !nextKeys.has(key))
    .flatMap(([, group]) => group);
  const unmatchedOrBlankRows = [
    ...originalRows.filter((row) => !normalizeKey(row[matchKey])),
    ...nextRows.filter((row) => !normalizeKey(row[matchKey])),
  ];

  const changedFields = [];
  const manufacturerPartAdds = [];
  const manufacturerPartRemoves = [];
  const matchedRows = [];

  for (const key of matchedKeys) {
    const originalGroup = originalGroups.get(key) ?? [];
    const nextGroup = nextGroups.get(key) ?? [];
    const original = originalGroup[0];
    const next = nextGroup[0];
    const rowChanges = changedFieldsForRows(original, next, matchKey);
    changedFields.push(...rowChanges);

    const originalParts = manufacturerParts(originalGroup);
    const nextParts = manufacturerParts(nextGroup);
    for (const [partKey, row] of nextParts) {
      if (!originalParts.has(partKey)) {
        manufacturerPartAdds.push(partChange(row, matchKey, next[matchKey]));
      }
    }
    for (const [partKey, row] of originalParts) {
      if (!nextParts.has(partKey)) {
        manufacturerPartRemoves.push(partChange(row, matchKey, original[matchKey]));
      }
    }

    matchedRows.push({ matchKey, matchValue: next[matchKey], original, next, changes: rowChanges });
  }

  return {
    summary: {
      addedRows: addedRows.length,
      removedRows: removedRows.length,
      changedFields: changedFields.length,
      manufacturerPartAdds: manufacturerPartAdds.length,
      manufacturerPartRemoves: manufacturerPartRemoves.length,
      unmatchedOrBlankRows: unmatchedOrBlankRows.length,
    },
    addedRows,
    removedRows,
    changedFields,
    manufacturerPartAdds,
    manufacturerPartRemoves,
    unmatchedOrBlankRows,
    matchedRows,
  };
}

function changedFieldsForRows(original: BomRow, next: BomRow, matchKey: MatchKey) {
  return BOM_FIELDS
    .filter((field) => field !== matchKey)
    .filter((field) => compareValue(field, original[field]) !== compareValue(field, next[field]))
    .map((field) => ({
      matchKey,
      matchValue: next[matchKey],
      field,
      originalValue: original[field],
      newValue: next[field],
    }));
}

function groupByMatchKey(rows: BomRow[], matchKey: MatchKey): Map<string, BomRow[]> {
  const groups = new Map<string, BomRow[]>();
  for (const row of rows) {
    const key = normalizeKey(row[matchKey]);
    if (!key) {
      continue;
    }
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return groups;
}

function manufacturerParts(rows: BomRow[]): Map<string, BomRow> {
  const parts = new Map<string, BomRow>();
  for (const row of rows) {
    const key = normalizeText(row.manufacturer_part_number);
    if (key) {
      parts.set(key, row);
    }
  }
  return parts;
}

function partChange(row: BomRow, matchKey: MatchKey, matchValue: string) {
  return {
    matchKey,
    matchValue,
    lineItem: row.line_item,
    manufacturerName: row.manufacturer_name,
    manufacturerPartNumber: row.manufacturer_part_number,
  };
}

function compareValue(field: BomField, value: string): string {
  if (field === "reference_designators") {
    return value.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean).join(",");
  }
  return normalizeText(value);
}

function normalizeKey(value: string): string {
  return normalizeText(value);
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}
```

- [ ] **Step 4: Implement report filters**

Add `src/bom/reportFilters.ts`:

```ts
import type { ComparisonResult, ReportFilters } from "./types";

export function applyReportFilters(result: ComparisonResult, filters: ReportFilters): ComparisonResult {
  const addedRows = filters.addedRows ? result.addedRows : [];
  const removedRows = filters.removedRows ? result.removedRows : [];
  const changedFields = result.changedFields.filter((change) => filters.changedFields[change.field]);
  const manufacturerPartAdds = filters.manufacturerPartAdds ? result.manufacturerPartAdds : [];
  const manufacturerPartRemoves = filters.manufacturerPartRemoves ? result.manufacturerPartRemoves : [];
  const unmatchedOrBlankRows = filters.unmatchedOrBlankRows ? result.unmatchedOrBlankRows : [];

  return {
    ...result,
    summary: {
      addedRows: addedRows.length,
      removedRows: removedRows.length,
      changedFields: changedFields.length,
      manufacturerPartAdds: manufacturerPartAdds.length,
      manufacturerPartRemoves: manufacturerPartRemoves.length,
      unmatchedOrBlankRows: unmatchedOrBlankRows.length,
    },
    addedRows,
    removedRows,
    changedFields,
    manufacturerPartAdds,
    manufacturerPartRemoves,
    unmatchedOrBlankRows,
  };
}
```

- [ ] **Step 5: Run comparison and filter tests**

Run: `npm test -- src/bom/compare.test.ts src/bom/reportFilters.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit comparison engine**

```bash
git add src/bom/compare.ts src/bom/compare.test.ts src/bom/reportFilters.ts src/bom/reportFilters.test.ts
git commit -m "feat: compare browser BOM rows"
```

---

### Task 6: Browser Excel Report Export

**Files:**
- Create: `src/bom/exportReport.ts`
- Create: `src/bom/exportReport.test.ts`

- [ ] **Step 1: Write failing export tests**

Add `src/bom/exportReport.test.ts`:

```ts
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { DEFAULT_REPORT_FILTERS } from "./fields";
import { buildReportWorkbook, excelSafeValue } from "./exportReport";
import type { ComparisonResult } from "./types";

describe("exportReport", () => {
  it("escapes formula-like strings", () => {
    expect(excelSafeValue("=HYPERLINK(\"https://example.test\")")).toBe("'=HYPERLINK(\"https://example.test\")");
    expect(excelSafeValue("+ASM")).toBe("'+ASM");
    expect(excelSafeValue("-1+2")).toBe("'-1+2");
    expect(excelSafeValue("@SUM(1,2)")).toBe("'@SUM(1,2)");
  });

  it("builds an xlsx workbook with visible filtered sections", () => {
    const result: ComparisonResult = {
      summary: { addedRows: 1, removedRows: 0, changedFields: 1, manufacturerPartAdds: 0, manufacturerPartRemoves: 0, unmatchedOrBlankRows: 0 },
      addedRows: [{ line_item: "30", internal_part_number: "=PN", customer_part_number: "", description: "", manufacturer_name: "", manufacturer_part_number: "", quantity: "", reference_designators: "" }],
      removedRows: [],
      changedFields: [{ matchKey: "line_item", matchValue: "10", field: "description", originalValue: "Old", newValue: "New" }],
      manufacturerPartAdds: [],
      manufacturerPartRemoves: [],
      unmatchedOrBlankRows: [],
      matchedRows: [],
    };

    const bytes = buildReportWorkbook(result, DEFAULT_REPORT_FILTERS);
    const workbook = XLSX.read(bytes, { type: "array" });

    expect(workbook.SheetNames).toContain("Summary");
    expect(workbook.SheetNames).toContain("Added Rows");
    expect(XLSX.utils.sheet_to_json(workbook.Sheets["Added Rows"], { header: 1 })[1][1]).toBe("'=PN");
  });
});
```

- [ ] **Step 2: Run export tests to verify they fail**

Run: `npm test -- src/bom/exportReport.test.ts`

Expected: FAIL because `src/bom/exportReport.ts` does not exist.

- [ ] **Step 3: Implement report export**

Add `src/bom/exportReport.ts`:

```ts
import * as XLSX from "xlsx";
import { FIELD_LABELS } from "./fields";
import { applyReportFilters } from "./reportFilters";
import type { BomRow, ComparisonResult, ReportFilters } from "./types";

const FORMULA_PREFIXES = ["=", "+", "-", "@"];

export function buildReportWorkbook(result: ComparisonResult, filters: ReportFilters): ArrayBuffer {
  const filtered = applyReportFilters(result, filters);
  const workbook = XLSX.utils.book_new();

  appendSheet(workbook, "Summary", [
    ["Metric", "Value"],
    ["Added rows", filtered.summary.addedRows],
    ["Removed rows", filtered.summary.removedRows],
    ["Changed fields", filtered.summary.changedFields],
    ["Manufacturer part adds", filtered.summary.manufacturerPartAdds],
    ["Manufacturer part removes", filtered.summary.manufacturerPartRemoves],
    ["Unmatched or blank key rows", filtered.summary.unmatchedOrBlankRows],
    ["Active filters", JSON.stringify(filters)],
  ]);

  if (filters.addedRows) appendSheet(workbook, "Added Rows", bomRows(filtered.addedRows));
  if (filters.removedRows) appendSheet(workbook, "Removed Rows", bomRows(filtered.removedRows));
  if (filtered.changedFields.length > 0) {
    appendSheet(workbook, "Changed Fields", [
      ["Match key", "Match value", "Field", "Original value", "New value"],
      ...filtered.changedFields.map((change) => [
        change.matchKey,
        change.matchValue,
        FIELD_LABELS[change.field],
        change.originalValue,
        change.newValue,
      ]),
    ]);
  }
  if (filters.manufacturerPartAdds) {
    appendSheet(workbook, "Manufacturer Part Adds", partRows(filtered.manufacturerPartAdds));
  }
  if (filters.manufacturerPartRemoves) {
    appendSheet(workbook, "Manufacturer Part Removes", partRows(filtered.manufacturerPartRemoves));
  }
  if (filters.unmatchedOrBlankRows) {
    appendSheet(workbook, "Unmatched Or Blank Key Rows", bomRows(filtered.unmatchedOrBlankRows));
  }

  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function downloadReport(result: ComparisonResult, filters: ReportFilters, filename = "bom-comparison-report.xlsx"): void {
  const bytes = buildReportWorkbook(result, filters);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function excelSafeValue(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  return FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix)) ? `'${value}` : value;
}

function appendSheet(workbook: XLSX.WorkBook, name: string, rows: unknown[][]): void {
  const safeRows = rows.map((row) => row.map(excelSafeValue));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(safeRows), name);
}

function bomRows(rows: BomRow[]): unknown[][] {
  return [
    ["Line item", "Internal part number", "Customer part number", "Description", "Manufacturer name", "Manufacturer part number", "Quantity", "Reference designators"],
    ...rows.map((row) => [
      row.line_item,
      row.internal_part_number,
      row.customer_part_number,
      row.description,
      row.manufacturer_name,
      row.manufacturer_part_number,
      row.quantity,
      row.reference_designators,
    ]),
  ];
}

function partRows(rows: Array<{ matchKey: string; matchValue: string; lineItem: string; manufacturerName: string; manufacturerPartNumber: string }>): unknown[][] {
  return [
    ["Match key", "Match value", "Line item", "Manufacturer name", "Manufacturer part number"],
    ...rows.map((row) => [row.matchKey, row.matchValue, row.lineItem, row.manufacturerName, row.manufacturerPartNumber]),
  ];
}
```

- [ ] **Step 4: Run export tests**

Run: `npm test -- src/bom/exportReport.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit export support**

```bash
git add src/bom/exportReport.ts src/bom/exportReport.test.ts
git commit -m "feat: export filtered browser xlsx report"
```

---

### Task 7: Wizard UI For Upload, Mapping, Preview, And Report

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/PrivacyNotice.tsx`
- Create: `src/components/ProgressSteps.tsx`
- Create: `src/components/UploadStep.tsx`
- Create: `src/components/MappingStep.tsx`
- Create: `src/components/PreviewStep.tsx`
- Create: `src/components/ReportStep.tsx`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write failing app flow tests**

Add `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("starts with browser-only privacy and xlsx-only upload guidance", () => {
    render(<App />);

    expect(screen.getByText(/Your BOM files stay in this browser/i)).toBeInTheDocument();
    expect(screen.getByText(/\.xlsx only\. CSV, PDF, and \.xls are not supported\./i)).toBeInTheDocument();
  });

  it("rejects unsupported files before parsing", async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByLabelText(/Original BOM workbook/i);
    await user.upload(input, new File(["a,b"], "bom.csv", { type: "text/csv" }));

    expect(screen.getByText(".xlsx only. CSV, PDF, and .xls are not supported.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run app tests to verify the unsupported-file test fails**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because the upload input is not implemented.

- [ ] **Step 3: Add reusable static components**

Add `src/components/PrivacyNotice.tsx`:

```tsx
interface PrivacyNoticeProps {
  variant: "header" | "upload" | "report";
}

export function PrivacyNotice({ variant }: PrivacyNoticeProps) {
  const text = {
    header: "Your BOM files stay in this browser. Nothing is uploaded to a server.",
    upload: "This file is parsed locally in your browser.",
    report: "Reports are generated locally. Refreshing or closing the tab clears the current comparison.",
  }[variant];

  return <p className="notice">{text}</p>;
}
```

Add `src/components/ProgressSteps.tsx`:

```tsx
const STEPS = ["Original upload", "Original mapping", "Original preview", "New upload", "New mapping", "New preview", "Report"];

export function ProgressSteps({ current }: { current: number }) {
  return (
    <nav className="wizard-steps" aria-label="Comparison workflow">
      {STEPS.map((step, index) => (
        <span className={index === current ? "active" : ""} key={step}>
          {step}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Add upload step component**

Add `src/components/UploadStep.tsx`:

```tsx
import { XLSX_ONLY_MESSAGE, validateWorkbookFile } from "../bom/fileValidation";
import { parseWorkbook } from "../bom/workbook";
import type { UploadedWorkbook } from "../bom/types";
import { PrivacyNotice } from "./PrivacyNotice";

interface UploadStepProps {
  label: "Original" | "New";
  onUploaded: (workbook: UploadedWorkbook) => void;
}

export function UploadStep({ label, onUploaded }: UploadStepProps) {
  const inputId = `${label.toLowerCase()}-bom-upload`;
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const validation = validateWorkbookFile(file);
    if (!validation.ok) {
      window.dispatchEvent(new CustomEvent("app-error", { detail: validation.message }));
      return;
    }
    const data = await file.arrayBuffer();
    const parsed = parseWorkbook(data);
    onUploaded({ fileName: file.name, data, sheetNames: parsed.sheetNames });
  };

  return (
    <section className="section">
      <h2>Upload {label.toLowerCase()} BOM</h2>
      <p className="muted">.xlsx only. CSV, PDF, and .xls are not supported.</p>
      <PrivacyNotice variant="upload" />
      <label className="file-label" htmlFor={inputId}>
        {label} BOM workbook
        <input id={inputId} type="file" accept=".xlsx" onChange={(event) => void handleFile(event.target.files?.[0])} />
      </label>
      <p className="sr-only">{XLSX_ONLY_MESSAGE}</p>
    </section>
  );
}
```

- [ ] **Step 5: Add mapping, preview, and report components**

Add `src/components/MappingStep.tsx`:

```tsx
import { useMemo, useState } from "react";
import { BOM_FIELDS, FIELD_LABELS, MATCH_KEYS } from "../bom/fields";
import { fieldsByColumn, suggestMapping, validateMapping } from "../bom/mapping";
import { extractMappedRows, parseWorkbook, previewWorksheet } from "../bom/workbook";
import type { BomField, MappedBom, MatchKey, UploadedWorkbook } from "../bom/types";

interface MappingStepProps {
  label: "Original" | "New";
  workbook: UploadedWorkbook;
  onMapped: (mapped: MappedBom) => void;
}

export function MappingStep({ label, workbook, onMapped }: MappingStepProps) {
  const parsed = useMemo(() => parseWorkbook(workbook.data), [workbook.data]);
  const [sheetName, setSheetName] = useState(workbook.sheetNames[0] ?? "");
  const [headerRow, setHeaderRow] = useState(1);
  const preview = useMemo(() => previewWorksheet(parsed, sheetName, headerRow), [parsed, sheetName, headerRow]);
  const initialMapping = suggestMapping(preview.headers);
  const [columnFields, setColumnFields] = useState<Array<BomField | "">>(() =>
    preview.columns.map((column) => {
      const entry = Object.entries(initialMapping).find(([, index]) => index === column.index);
      return (entry?.[0] as BomField | undefined) ?? "";
    }),
  );
  const [matchKey, setMatchKey] = useState<MatchKey>("line_item");
  const errors = validateMapping(columnFields, matchKey);

  return (
    <section className="section">
      <h2>Map {label.toLowerCase()} BOM columns</h2>
      <p className="muted">Choose the worksheet, header row, mapped fields, and comparison key.</p>
      <div className="form-grid">
        <label>
          Worksheet
          <select value={sheetName} onChange={(event) => setSheetName(event.target.value)}>
            {workbook.sheetNames.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label>
          Header row
          <input type="number" min={1} value={headerRow} onChange={(event) => setHeaderRow(Number(event.target.value))} />
        </label>
        <label>
          Match key
          <select value={matchKey} onChange={(event) => setMatchKey(event.target.value as MatchKey)}>
            {MATCH_KEYS.map((field) => <option key={field} value={field}>{FIELD_LABELS[field]}</option>)}
          </select>
        </label>
      </div>
      {errors.map((error) => <p className="error" key={error}>{error}</p>)}
      <div className="mapping-grid-wrap">
        <table className="mapping-grid">
          <thead>
            <tr>
              <th>Map</th>
              {preview.columns.map((column) => (
                <th key={column.index}>
                  <select
                    aria-label={`Map column ${column.label}`}
                    value={columnFields[column.index] ?? ""}
                    onChange={(event) => {
                      const next = [...columnFields];
                      next[column.index] = event.target.value as BomField | "";
                      setColumnFields(next);
                    }}
                  >
                    <option value="">Ignore column</option>
                    {BOM_FIELDS.map((field) => <option key={field} value={field}>{FIELD_LABELS[field]}</option>)}
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr className={row.isHeader ? "header-row" : ""} key={row.rowNumber}>
                <th>{row.rowNumber}</th>
                {row.values.map((value, index) => <td key={`${row.rowNumber}-${index}`}>{value}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        className="button primary"
        disabled={errors.length > 0}
        onClick={() => onMapped({
          fileName: workbook.fileName,
          sheetName,
          headerRow,
          mapping: fieldsByColumn(columnFields),
          matchKey,
          rows: extractMappedRows(parsed, sheetName, headerRow, fieldsByColumn(columnFields)),
        })}
      >
        Preview {label.toLowerCase()} BOM
      </button>
    </section>
  );
}
```

Add `src/components/PreviewStep.tsx`:

```tsx
import type { MappedBom } from "../bom/types";

export function PreviewStep({ label, mapped, onConfirm }: { label: "Original" | "New"; mapped: MappedBom; onConfirm: () => void }) {
  return (
    <section className="section">
      <h2>Preview {label.toLowerCase()} BOM</h2>
      <p className="muted">Review the normalized rows before continuing. Showing the first 20 rows.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Line</th><th>Internal PN</th><th>Customer PN</th><th>Description</th><th>Mfr</th><th>MPN</th><th>Qty</th><th>Ref Des</th></tr>
          </thead>
          <tbody>
            {mapped.rows.slice(0, 20).map((row, index) => (
              <tr key={index}><td>{row.line_item}</td><td>{row.internal_part_number}</td><td>{row.customer_part_number}</td><td>{row.description}</td><td>{row.manufacturer_name}</td><td>{row.manufacturer_part_number}</td><td>{row.quantity}</td><td>{row.reference_designators}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="button primary" onClick={onConfirm}>Confirm {label.toLowerCase()} BOM</button>
    </section>
  );
}
```

Add `src/components/ReportStep.tsx`:

```tsx
import { useState } from "react";
import { BOM_FIELDS, DEFAULT_REPORT_FILTERS, FIELD_LABELS } from "../bom/fields";
import { compareBoms } from "../bom/compare";
import { applyReportFilters } from "../bom/reportFilters";
import { downloadReport } from "../bom/exportReport";
import type { MappedBom, ReportFilters } from "../bom/types";
import { PrivacyNotice } from "./PrivacyNotice";

export function ReportStep({ original, next }: { original: MappedBom; next: MappedBom }) {
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const result = compareBoms(original.rows, next.rows, next.matchKey);
  const filtered = applyReportFilters(result, filters);

  return (
    <section className="section">
      <h2>Comparison report</h2>
      <PrivacyNotice variant="report" />
      <div className="metric-row">
        {Object.entries(filtered.summary).map(([label, value]) => <div className="metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <div className="filter-row">
        {BOM_FIELDS.map((field) => (
          <label className="checkbox" key={field}>
            <input
              type="checkbox"
              checked={filters.changedFields[field]}
              onChange={(event) => setFilters({ ...filters, changedFields: { ...filters.changedFields, [field]: event.target.checked } })}
            />
            {FIELD_LABELS[field]}
          </label>
        ))}
      </div>
      <button className="button primary" onClick={() => downloadReport(result, filters)}>Download Excel report</button>
      <h3>Changed fields</h3>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Match</th><th>Field</th><th>Original</th><th>New</th></tr></thead>
          <tbody>
            {filtered.changedFields.map((change, index) => (
              <tr key={index}><td>{change.matchValue}</td><td>{FIELD_LABELS[change.field]}</td><td><del className="inline-removed">{change.originalValue}</del></td><td><ins className="inline-added">{change.newValue}</ins></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Wire App state and errors**

Replace `src/App.tsx` with:

```tsx
import { useEffect, useState } from "react";
import type { MappedBom, UploadedWorkbook } from "./bom/types";
import { MappingStep } from "./components/MappingStep";
import { PreviewStep } from "./components/PreviewStep";
import { PrivacyNotice } from "./components/PrivacyNotice";
import { ProgressSteps } from "./components/ProgressSteps";
import { ReportStep } from "./components/ReportStep";
import { UploadStep } from "./components/UploadStep";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function App() {
  const [step, setStep] = useState<Step>(0);
  const [error, setError] = useState("");
  const [originalWorkbook, setOriginalWorkbook] = useState<UploadedWorkbook | null>(null);
  const [newWorkbook, setNewWorkbook] = useState<UploadedWorkbook | null>(null);
  const [originalBom, setOriginalBom] = useState<MappedBom | null>(null);
  const [newBom, setNewBom] = useState<MappedBom | null>(null);

  useEffect(() => {
    const handler = (event: Event) => setError((event as CustomEvent<string>).detail);
    window.addEventListener("app-error", handler);
    return () => window.removeEventListener("app-error", handler);
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Browser-only BOM comparison</p>
          <h1>Compare two Excel BOMs</h1>
        </div>
        <PrivacyNotice variant="header" />
      </header>
      <ProgressSteps current={step} />
      {error && <p className="error">{error}</p>}
      {step === 0 && <UploadStep label="Original" onUploaded={(workbook) => { setError(""); setOriginalWorkbook(workbook); setStep(1); }} />}
      {step === 1 && originalWorkbook && <MappingStep label="Original" workbook={originalWorkbook} onMapped={(mapped) => { setOriginalBom(mapped); setStep(2); }} />}
      {step === 2 && originalBom && <PreviewStep label="Original" mapped={originalBom} onConfirm={() => setStep(3)} />}
      {step === 3 && <UploadStep label="New" onUploaded={(workbook) => { setError(""); setNewWorkbook(workbook); setStep(4); }} />}
      {step === 4 && newWorkbook && <MappingStep label="New" workbook={newWorkbook} onMapped={(mapped) => { setNewBom(mapped); setStep(5); }} />}
      {step === 5 && newBom && <PreviewStep label="New" mapped={newBom} onConfirm={() => setStep(6)} />}
      {step === 6 && originalBom && newBom && <ReportStep original={originalBom} next={newBom} />}
    </main>
  );
}
```

- [ ] **Step 7: Add UI styles for new components**

Append to `src/styles.css`:

```css
.wizard-steps,
.metric-row,
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.wizard-steps span {
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  padding: 6px 10px;
}

.wizard-steps .active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.form-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 16px 0;
}

label {
  color: var(--muted);
  display: grid;
  font-weight: 650;
  gap: 6px;
}

input,
select {
  border: 1px solid var(--line);
  border-radius: 6px;
  min-height: 38px;
  padding: 8px 10px;
}

.button {
  border: 1px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  margin-top: 16px;
  min-height: 38px;
  padding: 8px 13px;
}

.button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.error {
  background: var(--removed-bg);
  border: 1px solid #e3b3b3;
  border-radius: 6px;
  color: var(--removed-text);
  padding: 10px 12px;
}

.table-wrap,
.mapping-grid-wrap {
  border: 1px solid var(--line);
  border-radius: 8px;
  margin-top: 16px;
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  min-width: 900px;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

.header-row {
  background: var(--added-bg);
  font-weight: 700;
}

.metric {
  border: 1px solid var(--line);
  border-radius: 8px;
  min-width: 150px;
  padding: 12px;
}

.metric span {
  color: var(--muted);
  display: block;
}

.metric strong {
  display: block;
  font-size: 24px;
}

.checkbox {
  align-items: center;
  display: flex;
  gap: 8px;
}

.inline-removed,
.inline-added {
  border-radius: 4px;
  display: inline-block;
  padding: 1px 5px;
}

.inline-removed {
  background: var(--removed-bg);
  color: var(--removed-text);
}

.inline-added {
  background: var(--added-bg);
  color: var(--added-text);
  text-decoration: none;
}

.sr-only {
  height: 1px;
  margin: -1px;
  overflow: hidden;
  position: absolute;
  width: 1px;
}

@media (max-width: 760px) {
  .topbar,
  .form-grid {
    display: block;
  }

  .topbar .notice {
    margin-top: 12px;
  }
}
```

- [ ] **Step 8: Run app tests**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 9: Run full test suite and build**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 10: Commit wizard UI**

```bash
git add src/App.tsx src/App.test.tsx src/styles.css src/components
git commit -m "feat: add browser BOM comparison wizard"
```

---

### Task 8: Documentation, GitHub Pages, And Final Verification

**Files:**
- Create: `README.md`
- Create: `.github/workflows/pages.yml`
- Modify: `package.json`

- [ ] **Step 1: Add README**

Add `README.md`:

```md
# BOM Comparison

Open-source browser app for comparing two Excel BOMs.

## Privacy Model

Your BOM files stay in your browser. This app does not upload BOM files to an application server, does not process BOMs server-side, and does not store comparison history in a database.

The active comparison exists only in browser memory. Refreshing or closing the tab clears uploaded workbook data, parsed BOM rows, comparison results, and generated report data.

The app may store non-BOM convenience preferences in browser local storage:

- recent column mapping preferences
- preferred report filters
- preferred match key

It does not store uploaded workbook bytes, parsed BOM rows, comparison results, or report bytes in local storage.

## Supported Files

Version 1 supports `.xlsx` files only. CSV, PDF, and `.xls` are not supported.

## User Flow

1. Upload the original BOM.
2. Select worksheet and header row.
3. Map columns and choose a match key.
4. Preview and confirm the original BOM.
5. Upload the new BOM.
6. Select worksheet and header row.
7. Map columns and choose a match key.
8. Preview and confirm the new BOM.
9. View the report, adjust filters, and download an `.xlsx` report.

## Development

```bash
npm install
npm run dev
```

Run tests:

```bash
npm test
```

Build static output:

```bash
npm run build
```

Preview the static build:

```bash
npm run preview
```

## GitHub Pages

The app builds to static files in `dist/` and is suitable for GitHub Pages.
```

- [ ] **Step 2: Add GitHub Pages workflow**

Add `.github/workflows/pages.yml`:

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [master, main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install
        run: npm ci
      - name: Test
        run: npm test
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS and `dist/` exists.

- [ ] **Step 4: Check for server/API/database drift**

Run: `rg -n "fetch\\(|XMLHttpRequest|axios|localStorage\\.setItem|indexedDB|api|server|database|auth|login" src README.md package.json`

Expected:

- No network upload calls.
- `localStorage.setItem` appears only in `src/bom/preferences.ts`.
- README server wording appears only in privacy explanations.
- No auth/login/database implementation.

- [ ] **Step 5: Commit docs and deployment**

```bash
git add README.md .github/workflows/pages.yml package.json
git commit -m "docs: add GitHub Pages deployment guidance"
```

---

## Plan Self-Review

- Spec coverage: Tasks cover static GitHub Pages deployment, no backend, `.xlsx`-only upload, worksheet/header preview, mapping grid, match keys, browser-only comparison, report filtering, Excel export, privacy copy, local-storage limits, and README documentation.
- Placeholder scan: The plan contains no deferred implementation placeholders. Each task lists concrete files, commands, expected results, and code blocks.
- Type consistency: Shared field names are `internal_part_number`, `manufacturer_part_number`, and `reference_designators` across types, mapping, parser, comparison, report filters, export, and UI.
