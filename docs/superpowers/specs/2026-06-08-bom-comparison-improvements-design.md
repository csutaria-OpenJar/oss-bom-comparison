# BOM Comparison Improvements Design

## Status

Approved for written specification on 2026-06-08.

## Goal

Improve the reliability and usefulness of BOM comparisons while preserving the current browser-only privacy model.

This work adds:

- Match-key quality scoring.
- Composite match keys.
- Quantity-aware comparison.
- Reference designator set comparison.
- In-session review status for report items.
- An annotated BOM worksheet in the Excel export.
- User-defined comparison fields.

This work does not add impact summaries, broader duplicate-handling redesign, severity labels, report templates, CSV support, backend storage, authentication, or persisted comparison history.

## Current Constraints

The app remains a static Vite/React browser app. Uploaded BOM bytes, parsed rows, comparison results, review statuses, and generated reports stay in memory and are not stored in local storage.

Local storage may continue to hold non-BOM preferences such as mappings, filters, and preferred match-key choices.

The app continues to support `.xlsx` files only.

## Data Model

### Match Key Configuration

Replace the current single-field `MatchKey` usage in comparison flow with a match-key configuration:

- Single field: one canonical BOM field.
- Composite field: two or more canonical BOM fields.

The first implementation should allow composite keys from existing canonical BOM fields only. User-defined fields are compared as additional fields, but they are not used in match keys.

The comparison identity is built by normalizing each selected field and joining the normalized parts with a stable separator. A composite key is blank if all selected parts normalize to blank. A composite key with some blank parts remains valid but should reduce the quality score.

Display labels should show composite keys as joined labels, for example `Internal part number + Manufacturer part number`.

### User-Defined Fields

Mapped rows gain an `extraFields` record:

```ts
Record<string, string>
```

The key is a stable field id derived from the source header, and the display label is the original header text. Custom fields are optional and comparable. They are excluded from manufacturer-part identity, match-key choices, and required mapping validation.

The changed-fields result can include either a canonical BOM field or a custom field reference. Report labels must use canonical labels for built-in fields and source headers for custom fields.

## Match-Key Quality

Before comparison, the app should evaluate likely match-key options against both BOMs:

- Each single-field match key currently offered by the app.
- Useful composite candidates:
  - Internal part number + manufacturer part number.
  - Customer part number + manufacturer part number.
  - Line item + manufacturer part number.

For each candidate, compute:

- Blank key rows in original BOM.
- Blank key rows in new BOM.
- Duplicate key groups in original BOM.
- Duplicate key groups in new BOM.
- Matched key count.
- Added key count.
- Removed key count.
- Partial composite rows, where at least one selected field is blank but not all are blank.

The UI should recommend the candidate with the best score. The score favors more matched keys and penalizes blanks, duplicates, added keys, removed keys, and partial composite keys. The exact numeric score should stay internal; users need the recommendation and the diagnostic counts.

Users can still override the recommendation.

## Quantity-Aware Comparison

Quantity comparison should normalize numeric-looking values before comparison:

- Trim whitespace.
- Accept comma grouping.
- Accept equivalent decimal forms such as `1`, `1.0`, and `1.00`.
- Ignore common unit suffixes only when the numeric portion is unambiguous, such as `pcs`, `pc`, `ea`, `each`, or `units`.

If either side is not safely numeric, fall back to existing normalized text comparison.

Display values remain the original cell text. The changed-fields report should suppress differences that are numeric equivalents.

## Reference Designator Comparison

Reference designators should be parsed as sets rather than compared as raw comma-separated strings.

Supported parsing:

- Comma-separated tokens.
- Whitespace around tokens.
- Case-insensitive comparison.
- Simple same-prefix numeric ranges such as `R1-R4`, expanding to `R1`, `R2`, `R3`, `R4`.

If both sides parse into non-empty sets, compare the sets. If parsing produces no usable tokens, fall back to normalized text comparison.

For changed reference designators, include added and removed reference tokens in the result so the UI and export can show precise additions/removals.

## Review Status

Report items should support an in-session status:

- `needs_review`
- `expected`
- `ignored`

The default is `needs_review`.

Review status applies to visible change items, including:

- Added rows.
- Removed rows.
- Changed fields.
- Manufacturer part adds.
- Manufacturer part removes.
- Blank-key rows.

Statuses live in React state and are not persisted. Export includes the current status for report rows. Ignored items remain visible unless filtered out by a review-status filter.

The report should add review-status filtering with all statuses enabled by default.

## Annotated BOM Export

The Excel report should include a worksheet named `Annotated BOM` that mirrors the existing on-screen annotated BOM view:

- Original line.
- New line.
- Canonical line-level fields.
- Manufacturer and manufacturer part annotations.
- Change markers in plain text where Excel rich text is not available.

The worksheet should respect the current report filters, including review-status filters.

The existing export formula-safety behavior must apply to all new worksheets and custom-field values.

## User Interface

### Mapping Step

The mapping step should support:

- Single-field match-key selection.
- Composite match-key selection from approved candidate combinations.
- Clear display of which mapped fields are required for the selected match key.
- Custom comparison fields from unmapped source columns.

Custom fields should be opt-in per column. A source column may map to one canonical field, one custom comparison field, or neither.

### Match-Key Diagnostics

After both BOMs are mapped, show diagnostics before the report:

- Recommended match key.
- Counts for each candidate.
- Warnings for blank, duplicate, or partial composite keys.

Because diagnostics need both BOMs, this belongs after the second BOM is previewed and before the report is finalized, or at the top of the report with an option to switch match keys and recompute.

The first implementation should place diagnostics at the top of the report with a match-key selector so users can recompute without re-uploading files.

### Report Step

The report should:

- Show review-status controls for each report row.
- Add review-status filters.
- Display precise reference-designator additions/removals when available.
- Display custom-field changes alongside canonical changed fields.

## Testing

Add focused tests for:

- Single and composite match-key identity generation.
- Match-key quality diagnostics and recommendation.
- Quantity normalization equivalence and fallback.
- Reference designator set parsing, range expansion, and fallback.
- Custom-field comparison and labels.
- Review-status filtering.
- Annotated BOM export sheet creation.
- Formula-safe handling for custom fields and annotated export values.

Existing tests for file validation, workbook parsing, mapping, comparison, report filters, and export should continue to pass.

## Migration And Compatibility

Existing remembered single-field match-key preferences should continue to work. If a stored preference does not match the new match-key configuration shape, the app should fall back to the default single-field match key.

Existing canonical-field mappings should continue to work unchanged. Custom fields are additive.
