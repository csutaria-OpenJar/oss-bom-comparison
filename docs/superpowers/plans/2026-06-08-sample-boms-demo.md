# Sample BOMs Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add built-in sample original and new BOMs that users can load without uploading files, including line items with multiple manufacturer part numbers.

**Architecture:** Store sample BOM row data and workbook creation in a focused BOM module. Add a single upload-screen action that creates mapped original and new BOMs using the sample rows and jumps to the report with `internal_part_number` as the shared match key.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, `xlsx`.

---

### Task 1: Sample BOM Data

**Files:**
- Create: `src/bom/sampleBoms.ts`
- Test: `src/bom/sampleBoms.test.ts`

- [x] **Step 1: Write the failing test**

Test that the sample BOM factory returns original and new mapped BOMs, uses `internal_part_number` as the match key, includes repeated rows for `OJ-1001` and `OJ-1002`, and produces manufacturer part add/remove comparison output.

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/bom/sampleBoms.test.ts`
Expected: FAIL because `src/bom/sampleBoms.ts` does not exist.

- [x] **Step 3: Write minimal implementation**

Create a module that exports `createSampleMappedBoms()` and internally defines the approved sample rows.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- src/bom/sampleBoms.test.ts`
Expected: PASS.

### Task 2: Upload Screen Shortcut

**Files:**
- Modify: `src/components/UploadStep.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

- [x] **Step 1: Write the failing test**

Test that the first upload screen exposes `Use sample BOMs`, clicking it displays the report, and the report includes sample manufacturer part add/remove rows.

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL because the button is not present.

- [x] **Step 3: Write minimal implementation**

Add an optional `onUseSampleBoms` prop to `UploadStep`, wire it from `App`, and style a compact demo action block.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`
Expected: PASS.

### Task 3: Verification

**Files:**
- Verify all touched files and project build.

- [x] **Step 1: Run full test suite**

Run: `npm test`
Expected: 34 tests pass.

- [x] **Step 2: Run typecheck/build**

Run: `npm run build`
Expected: TypeScript and Vite build succeed.
