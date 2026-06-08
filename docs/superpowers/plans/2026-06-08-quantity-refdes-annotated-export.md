# Quantity, Ref Des, And Annotated Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add quantity-aware comparison, reference-designator set comparison with added/removed details, and an `Annotated BOM` worksheet in the filtered Excel export.

**Architecture:** Keep the current single-field match-key model unchanged. Add small parsing helpers inside `src/bom/compare.ts`, extend `FieldChange` with optional reference-designator details, update the existing report display, and build the annotated export from filtered `matchedRows`.

**Tech Stack:** Vite, React, TypeScript, Vitest, `write-excel-file/browser`, `read-excel-file/browser`.

---

### Task 1: Quantity-Aware Comparison

**Files:**
- Modify: `src/bom/types.ts`
- Modify: `src/bom/compare.ts`
- Test: `src/bom/compare.test.ts`

- [ ] **Step 1: Write failing quantity tests**

Add these cases to `describe("compareBoms", ...)` in `src/bom/compare.test.ts`:

```ts
  it("treats equivalent numeric quantities as unchanged", () => {
    const original = [
      { ...baseRow, line_item: "10", quantity: "1,000 pcs" },
      { ...baseRow, line_item: "20", quantity: "3 each" },
    ];
    const next = [
      { ...baseRow, line_item: "10", quantity: "1000.00" },
      { ...baseRow, line_item: "20", quantity: "3.0" },
    ];

    const result = compareBoms(original, next, "line_item");

    expect(result.changedFields).toEqual([]);
    expect(result.summary.changedFields).toBe(0);
  });

  it("falls back to text comparison for ambiguous quantities", () => {
    const original = [{ ...baseRow, line_item: "10", quantity: "3 reels" }];
    const next = [{ ...baseRow, line_item: "10", quantity: "3" }];

    const result = compareBoms(original, next, "line_item");

    expect(result.changedFields).toEqual([
      {
        matchKey: "line_item",
        matchValue: "10",
        field: "quantity",
        originalValue: "3 reels",
        newValue: "3",
      },
    ]);
  });
```

- [ ] **Step 2: Run quantity tests and verify failure**

Run:

```bash
npm test -- src/bom/compare.test.ts
```

Expected: the first new test fails because current quantity comparison treats `1,000 pcs` and `1000.00` as different text.

- [ ] **Step 3: Implement quantity normalization**

In `src/bom/compare.ts`, add helper functions near `compareValue`:

```ts
const QUANTITY_UNITS = new Set(["pc", "pcs", "ea", "each", "unit", "units"]);

function compareValue(field: BomField, value: string): string {
  if (field === "quantity") {
    return normalizeQuantity(value) ?? normalizeText(value);
  }
  if (field === "reference_designators") {
    return value
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
      .join(",");
  }
  return normalizeText(value);
}

function normalizeQuantity(value: string): string | undefined {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^([+-]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(?:\s*([a-z]+))?$/);
  if (!match) return undefined;

  const unit = match[2];
  if (unit && !QUANTITY_UNITS.has(unit)) return undefined;

  const numeric = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return undefined;

  return String(numeric);
}
```

- [ ] **Step 4: Run quantity tests and verify pass**

Run:

```bash
npm test -- src/bom/compare.test.ts
```

Expected: all compare tests pass.

- [ ] **Step 5: Commit quantity comparison**

Run:

```bash
git add src/bom/compare.ts src/bom/compare.test.ts
git commit -m "Add quantity-aware BOM comparison"
```

### Task 2: Reference Designator Set Comparison

**Files:**
- Modify: `src/bom/types.ts`
- Modify: `src/bom/compare.ts`
- Modify: `src/components/ReportStep.tsx`
- Test: `src/bom/compare.test.ts`

- [ ] **Step 1: Extend the field-change type**

Modify `FieldChange` in `src/bom/types.ts`:

```ts
export interface FieldChange {
  matchKey: MatchKey;
  matchValue: string;
  field: BomField;
  originalValue: string;
  newValue: string;
  referenceDesignatorDiff?: {
    added: string[];
    removed: string[];
  };
}
```

- [ ] **Step 2: Write failing ref-des tests**

Add these cases to `src/bom/compare.test.ts`:

```ts
  it("treats reordered and ranged reference designators as unchanged", () => {
    const original = [{ ...baseRow, line_item: "10", reference_designators: "R1-R3" }];
    const next = [{ ...baseRow, line_item: "10", reference_designators: "r3, R2, R1" }];

    const result = compareBoms(original, next, "line_item");

    expect(result.changedFields).toEqual([]);
  });

  it("reports precise reference designator additions and removals", () => {
    const original = [{ ...baseRow, line_item: "10", reference_designators: "C1-C3" }];
    const next = [{ ...baseRow, line_item: "10", reference_designators: "C2,C3,C4" }];

    const result = compareBoms(original, next, "line_item");

    expect(result.changedFields).toEqual([
      {
        matchKey: "line_item",
        matchValue: "10",
        field: "reference_designators",
        originalValue: "C1-C3",
        newValue: "C2,C3,C4",
        referenceDesignatorDiff: {
          added: ["C4"],
          removed: ["C1"],
        },
      },
    ]);
  });
```

- [ ] **Step 3: Run ref-des tests and verify failure**

Run:

```bash
npm test -- src/bom/compare.test.ts
```

Expected: the range/reorder test fails because current comparison does not expand ranges or sort tokens.

- [ ] **Step 4: Implement ref-des parsing and diffing**

In `src/bom/compare.ts`, replace `changedFieldsForRows` with a version that delegates to `fieldChangeForRows`:

```ts
function changedFieldsForRows(original: BomRow, next: BomRow, matchKey: MatchKey): FieldChange[] {
  return BOM_FIELDS
    .filter((field) => field !== matchKey)
    .map((field) => fieldChangeForRows(field, original, next, matchKey))
    .filter((change): change is FieldChange => change !== undefined);
}

function fieldChangeForRows(
  field: BomField,
  original: BomRow,
  next: BomRow,
  matchKey: MatchKey,
): FieldChange | undefined {
  if (field === "reference_designators") {
    const diff = referenceDesignatorDiff(original[field], next[field]);
    if (diff && diff.added.length === 0 && diff.removed.length === 0) return undefined;
    if (diff) {
      return {
        matchKey,
        matchValue: next[matchKey],
        field,
        originalValue: original[field],
        newValue: next[field],
        referenceDesignatorDiff: diff,
      };
    }
  }

  if (compareValue(field, original[field]) === compareValue(field, next[field])) return undefined;
  return {
    matchKey,
    matchValue: next[matchKey],
    field,
    originalValue: original[field],
    newValue: next[field],
  };
}
```

Add helper functions below `normalizeQuantity`:

```ts
function referenceDesignatorDiff(
  originalValue: string,
  nextValue: string,
): { added: string[]; removed: string[] } | undefined {
  const originalRefs = parseReferenceDesignators(originalValue);
  const nextRefs = parseReferenceDesignators(nextValue);
  if (originalRefs.length === 0 || nextRefs.length === 0) return undefined;

  const originalSet = new Set(originalRefs.map((ref) => ref.toLowerCase()));
  const nextSet = new Set(nextRefs.map((ref) => ref.toLowerCase()));
  const originalDisplay = new Map(originalRefs.map((ref) => [ref.toLowerCase(), ref]));
  const nextDisplay = new Map(nextRefs.map((ref) => [ref.toLowerCase(), ref]));

  return {
    added: nextRefs.filter((ref) => !originalSet.has(ref.toLowerCase())).map((ref) => nextDisplay.get(ref.toLowerCase()) ?? ref),
    removed: originalRefs.filter((ref) => !nextSet.has(ref.toLowerCase())).map((ref) => originalDisplay.get(ref.toLowerCase()) ?? ref),
  };
}

function parseReferenceDesignators(value: string): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();
  for (const rawToken of value.split(",")) {
    const token = rawToken.trim();
    if (!token) continue;
    const expanded = expandReferenceRange(token);
    for (const ref of expanded) {
      const normalized = ref.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        refs.push(ref.toUpperCase());
      }
    }
  }
  return refs;
}

function expandReferenceRange(token: string): string[] {
  const range = token.match(/^([a-z]+)(\d+)\s*-\s*\1(\d+)$/i);
  if (!range) return isReferenceToken(token) ? [token] : [];

  const prefix = range[1];
  const start = Number(range[2]);
  const end = Number(range[3]);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end - start > 1000) {
    return [];
  }

  return Array.from({ length: end - start + 1 }, (_, index) => `${prefix}${start + index}`);
}

function isReferenceToken(token: string): boolean {
  return /^[a-z]+\d+[a-z0-9-]*$/i.test(token.trim());
}
```

- [ ] **Step 5: Update report display for ref-des details**

In `src/components/ReportStep.tsx`, update the changed-fields table cells for original/new values:

```tsx
                  <td>
                    <del className="inline-removed">{removedValue(change)}</del>
                  </td>
                  <td>
                    <ins className="inline-added">{addedValue(change)}</ins>
                  </td>
```

Add helper functions near `summaryLabel`:

```tsx
function removedValue(change: FieldChange): string {
  if (change.referenceDesignatorDiff?.removed.length) {
    return `${change.originalValue || "(blank)"} (removed: ${change.referenceDesignatorDiff.removed.join(", ")})`;
  }
  return change.originalValue || "(blank)";
}

function addedValue(change: FieldChange): string {
  if (change.referenceDesignatorDiff?.added.length) {
    return `${change.newValue || "(blank)"} (added: ${change.referenceDesignatorDiff.added.join(", ")})`;
  }
  return change.newValue || "(blank)";
}
```

- [ ] **Step 6: Run compare tests and type check**

Run:

```bash
npm test -- src/bom/compare.test.ts
npm run lint
```

Expected: compare tests pass and TypeScript reports no errors.

- [ ] **Step 7: Commit ref-des comparison**

Run:

```bash
git add src/bom/types.ts src/bom/compare.ts src/bom/compare.test.ts src/components/ReportStep.tsx
git commit -m "Add reference designator diff details"
```

### Task 3: Annotated BOM Export Worksheet

**Files:**
- Modify: `src/bom/exportReport.ts`
- Test: `src/bom/exportReport.test.ts`

- [ ] **Step 1: Write failing export test**

Add this test to `src/bom/exportReport.test.ts`:

```ts
  it("adds an annotated BOM worksheet that respects filters and formula safety", async () => {
    const result: ComparisonResult = {
      summary: {
        addedRows: 0,
        removedRows: 0,
        changedFields: 2,
        manufacturerPartAdds: 1,
        manufacturerPartRemoves: 1,
        unmatchedOrBlankRows: 0,
      },
      addedRows: [],
      removedRows: [],
      changedFields: [
        {
          matchKey: "line_item",
          matchValue: "10",
          field: "quantity",
          originalValue: "=1",
          newValue: "2",
        },
        {
          matchKey: "line_item",
          matchValue: "10",
          field: "reference_designators",
          originalValue: "R1,R2",
          newValue: "R1,R3",
          referenceDesignatorDiff: {
            added: ["R3"],
            removed: ["R2"],
          },
        },
      ],
      manufacturerPartAdds: [
        {
          matchKey: "line_item",
          matchValue: "10",
          lineItem: "10",
          manufacturerName: "Murata",
          manufacturerPartNumber: "+NEW",
        },
      ],
      manufacturerPartRemoves: [
        {
          matchKey: "line_item",
          matchValue: "10",
          lineItem: "10",
          manufacturerName: "TDK",
          manufacturerPartNumber: "OLD",
        },
      ],
      unmatchedOrBlankRows: [],
      matchedRows: [
        {
          matchKey: "line_item",
          matchValue: "10",
          original: {
            line_item: "10",
            internal_part_number: "PN-1",
            customer_part_number: "C-1",
            description: "",
            manufacturer_name: "TDK",
            manufacturer_part_number: "OLD",
            quantity: "=1",
            reference_designators: "R1,R2",
          },
          originalRows: [
            {
              line_item: "10",
              internal_part_number: "PN-1",
              customer_part_number: "C-1",
              description: "",
              manufacturer_name: "TDK",
              manufacturer_part_number: "OLD",
              quantity: "=1",
              reference_designators: "R1,R2",
            },
          ],
          next: {
            line_item: "10",
            internal_part_number: "PN-1",
            customer_part_number: "C-1",
            description: "",
            manufacturer_name: "Murata",
            manufacturer_part_number: "+NEW",
            quantity: "2",
            reference_designators: "R1,R3",
          },
          newRows: [
            {
              line_item: "10",
              internal_part_number: "PN-1",
              customer_part_number: "C-1",
              description: "",
              manufacturer_name: "Murata",
              manufacturer_part_number: "+NEW",
              quantity: "2",
              reference_designators: "R1,R3",
            },
          ],
          changes: [],
        },
      ],
    };

    const filters = {
      ...DEFAULT_REPORT_FILTERS,
      changedFields: {
        ...DEFAULT_REPORT_FILTERS.changedFields,
        reference_designators: false,
      },
    };

    const blob = await buildReportWorkbook(result, filters);
    const bytes = await blobToArrayBuffer(blob);
    const annotated = await readSheet(bytes, "Annotated BOM");

    expect(annotated[0]).toEqual([
      "Original line",
      "New line",
      "Internal part number",
      "Customer part number",
      "Quantity",
      "Reference designators",
      "Manufacturer annotations",
      "Manufacturer part annotations",
    ]);
    expect(annotated[1][4]).toBe("CHANGED: =1 -> 2");
    expect(annotated[1][5]).toBe("UNCHANGED: R1,R2");
    expect(annotated[1][7]).toContain("ADDED: +NEW");
  });
```

- [ ] **Step 2: Run export test and verify failure**

Run:

```bash
npm test -- src/bom/exportReport.test.ts
```

Expected: the new test fails because there is no `Annotated BOM` worksheet.

- [ ] **Step 3: Add the annotated worksheet**

In `src/bom/exportReport.ts`, after the `Summary` sheet is appended in `buildReportWorkbook`, add:

```ts
  appendSheet(sheets, "Annotated BOM", annotatedBomRows(filtered));
```

Add helper functions after `partRows`:

```ts
function annotatedBomRows(result: ComparisonResult): unknown[][] {
  return [
    [
      "Original line",
      "New line",
      "Internal part number",
      "Customer part number",
      "Quantity",
      "Reference designators",
      "Manufacturer annotations",
      "Manufacturer part annotations",
    ],
    ...result.matchedRows.map((line) => [
      line.original.line_item,
      line.next.line_item,
      annotatedFieldValue(line, "internal_part_number"),
      annotatedFieldValue(line, "customer_part_number"),
      annotatedFieldValue(line, "quantity"),
      annotatedFieldValue(line, "reference_designators"),
      manufacturerAnnotations(line, "manufacturer_name"),
      manufacturerAnnotations(line, "manufacturer_part_number"),
    ]),
  ];
}

function annotatedFieldValue(
  line: ComparisonResult["matchedRows"][number],
  field: "internal_part_number" | "customer_part_number" | "quantity" | "reference_designators",
): string {
  const change = line.changes.find((candidate) => candidate.field === field);
  if (!change) return `UNCHANGED: ${line.original[field]}`;

  if (field === "reference_designators" && change.referenceDesignatorDiff) {
    const parts = [`CHANGED: ${change.originalValue} -> ${change.newValue}`];
    if (change.referenceDesignatorDiff.removed.length) {
      parts.push(`removed ${change.referenceDesignatorDiff.removed.join(", ")}`);
    }
    if (change.referenceDesignatorDiff.added.length) {
      parts.push(`added ${change.referenceDesignatorDiff.added.join(", ")}`);
    }
    return parts.join("; ");
  }

  return `CHANGED: ${change.originalValue} -> ${change.newValue}`;
}

function manufacturerAnnotations(
  line: ComparisonResult["matchedRows"][number],
  field: "manufacturer_name" | "manufacturer_part_number",
): string {
  const originalParts = partRowsByIdentity(line.originalRows);
  const newParts = partRowsByIdentity(line.newRows);
  const annotations: string[] = [];

  for (const [identity, originalRow] of originalParts) {
    if (newParts.has(identity)) {
      annotations.push(`UNCHANGED: ${originalRow[field]}`);
    } else {
      annotations.push(`REMOVED: ${originalRow[field]}`);
    }
  }

  for (const [identity, newRow] of newParts) {
    if (!originalParts.has(identity)) {
      annotations.push(`ADDED: ${newRow[field]}`);
    }
  }

  return annotations.join("; ");
}

function partRowsByIdentity(rows: BomRow[]): Map<string, BomRow> {
  const parts = new Map<string, BomRow>();
  for (const row of rows) {
    const mpn = normalizeText(row.manufacturer_part_number);
    if (mpn) parts.set(`${normalizeText(row.manufacturer_name)}|${mpn}`, row);
  }
  return parts;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}
```

- [ ] **Step 4: Run export tests and verify pass**

Run:

```bash
npm test -- src/bom/exportReport.test.ts
```

Expected: export tests pass.

- [ ] **Step 5: Commit annotated export**

Run:

```bash
git add src/bom/exportReport.ts src/bom/exportReport.test.ts
git commit -m "Add annotated BOM export worksheet"
```

### Task 4: Full Verification

**Files:**
- No direct code edits expected.

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
npm test
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run type-check lint**

Run:

```bash
npm run lint
```

Expected: TypeScript reports no errors.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 4: Commit any verification-only fixes**

If verification required code fixes, inspect the changed paths:

```bash
git status --short
git add src/bom/compare.ts src/bom/exportReport.ts src/bom/types.ts src/components/ReportStep.tsx src/bom/compare.test.ts src/bom/exportReport.test.ts
git commit -m "Fix BOM comparison verification issues"
```

If no fixes were required, do not create an empty commit.
