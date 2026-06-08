# BOM Comparison Improvements Design

## Status

Approved for narrowed written specification on 2026-06-08.

## Goal

Improve three high-value BOM comparison behaviors while preserving the current browser-only privacy model and existing static app architecture:

- Quantity-aware comparison.
- Reference designator set comparison.
- An annotated BOM worksheet in the Excel export.

This work does not add match-key quality scoring, composite match keys, review statuses, user-defined fields, impact summaries, broader duplicate-handling redesign, severity labels, report templates, CSV support, backend storage, authentication, or persisted comparison history.

## Current Constraints

The app remains a static Vite/React browser app. Uploaded BOM bytes, parsed rows, comparison results, and generated reports stay in memory and are not stored in local storage.

Local storage may continue to hold non-BOM preferences such as mappings, filters, and preferred match-key choices.

The app continues to support `.xlsx` files only. The existing single-field match-key model remains unchanged.

## Quantity-Aware Comparison

Quantity comparison should normalize numeric-looking values before comparison:

- Trim whitespace.
- Accept comma grouping.
- Accept equivalent decimal forms such as `1`, `1.0`, and `1.00`.
- Ignore common unit suffixes only when the numeric portion is unambiguous, such as `pcs`, `pc`, `ea`, `each`, or `units`.

If either side is not safely numeric, comparison falls back to the current normalized text behavior.

Display values remain the original cell text. The changed-fields report should suppress differences that are numeric equivalents.

Examples that should compare equal:

- `1` and `1.0`
- `1,000` and `1000`
- `2 pcs` and `2`
- `3 each` and `3.0`

Examples that should use text fallback:

- `1-2`
- `about 3`
- `3 reels`
- `A/R`

## Reference Designator Comparison

Reference designators should be parsed as sets rather than compared as raw comma-separated strings when both sides contain parseable reference tokens.

Supported parsing:

- Comma-separated tokens.
- Whitespace around tokens.
- Case-insensitive comparison.
- Simple same-prefix numeric ranges such as `R1-R4`, expanding to `R1`, `R2`, `R3`, `R4`.

If both sides parse into non-empty sets, compare the sets. If either side produces no usable tokens, fall back to normalized text comparison.

For changed reference designators, include added and removed reference tokens in the comparison result so the UI and export can show precise additions and removals.

Examples that should compare equal:

- `R1, R2` and `r2,r1`
- `R1-R3` and `R1,R2,R3`

Examples that should report precise differences:

- `R1,R2` to `R1,R3` reports removed `R2` and added `R3`.
- `C1-C3` to `C2,C3,C4` reports removed `C1` and added `C4`.

## Annotated BOM Export

The Excel report should include a worksheet named `Annotated BOM` that mirrors the existing on-screen annotated BOM view.

The worksheet should include:

- Original line.
- New line.
- Internal part number.
- Customer part number.
- Quantity.
- Reference designators.
- Manufacturer annotations.
- Manufacturer part number annotations.

Because the export library currently writes plain cell values, annotations should use clear text markers instead of rich text formatting. For example:

- `UNCHANGED: ABC123`
- `CHANGED: old -> new`
- `REMOVED: ABC123`
- `ADDED: XYZ789`

The worksheet should respect the current report filters. If a field-change filter hides quantity or reference-designator changes, the annotated worksheet should not mark those field values as changed. If manufacturer-part add/remove filters are disabled, those annotations should be omitted.

The existing export formula-safety behavior must apply to all annotated worksheet values.

## User Interface

The report UI should keep the current layout and filters.

Changes:

- Quantity changes that are numeric equivalents should no longer appear.
- Reference-designator changes should display precise added and removed tokens when available.
- The export button should continue to download the filtered workbook, now including the `Annotated BOM` worksheet.

No new match-key UI, review-status UI, custom-field UI, or file-format UI is included in this scope.

## Testing

Add focused tests for:

- Quantity normalization equivalence.
- Quantity text fallback.
- Reference designator token parsing.
- Reference designator range expansion.
- Reference designator added/removed detail in comparison results.
- Annotated BOM export sheet creation.
- Annotated export behavior under existing report filters.
- Formula-safe handling for annotated export values.

Existing tests for file validation, workbook parsing, mapping, comparison, report filters, and export should continue to pass.

## Migration And Compatibility

No data migration is required. Existing mappings, report filters, and preferred single-field match-key preferences continue to work unchanged.
