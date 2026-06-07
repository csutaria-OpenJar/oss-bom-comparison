# Open-Source Browser BOM Comparison App Design

## Status

Approved for written specification on 2026-06-07.

## Goal

Build an open-source, static web app for comparing two Excel BOM files entirely in the user's browser. The app must be easy for first-time users to follow, must support BOMs with at least 500 lines, and must produce both an on-screen comparison report and a downloadable Excel report.

The app must not transmit BOM contents to a remote server, must not retain BOM contents after refresh or tab close, and must not require authentication.

## Users And Deployment Context

The app is intended for public open-source distribution. The primary hosted deployment target is GitHub Pages.

Production deployment is static hosting only:

- Static HTML, CSS, JavaScript, and assets.
- No application backend.
- No API routes.
- No database.
- No authentication.
- No manufacturing-system integration.
- No ERP integration.
- No server-side upload handling.

The repository should also include local development and preview commands for contributors. Those commands may serve the compiled static app locally, but they must not receive, process, store, or log BOM file contents.

## Privacy And Retention Requirements

The app must explicitly tell users that BOM data is processed locally in their browser and is not transmitted to a remote server by this app.

Required UI messaging:

- Header or persistent top-of-page message: "Your BOM files stay in this browser. Nothing is uploaded to a server."
- Upload-step message near each file input: "This file is parsed locally in your browser."
- Report-step message: "Reports are generated locally. Refreshing or closing the tab clears the current comparison."

The app should avoid vague claims such as "secure" or "private" without concrete explanation. The copy should say what the app does and does not do:

- No BOM upload to an application server.
- No server-side processing.
- No account required.
- No saved comparison history.
- No database retention.

The app may use browser local storage for non-BOM convenience preferences only:

- Recent column mapping preferences by header name.
- Preferred report filter choices.
- Preferred match key.

The app must not store uploaded workbook bytes, parsed BOM rows, comparison results, or generated report bytes in local storage. BOM data and comparison results are in-memory only and disappear on refresh or tab close.

## File Support

Version 1 supports `.xlsx` files only.

The upload UI and validation messages must explicitly state:

- `.xlsx only. CSV, PDF, and .xls are not supported.`

The app should reject unsupported file types before parsing when the file extension or browser-provided file type indicates an unsupported input. Parser errors should also produce clear guidance that the user must upload a valid `.xlsx` workbook.

## Architecture

The app should be built as a static browser application, preferably using Vite, React, and TypeScript.

This stack is recommended because:

- Vite produces static output suitable for GitHub Pages.
- React provides a straightforward component model for a multi-step wizard.
- TypeScript helps keep parsed workbook rows, mappings, comparison results, and report filters explicit.

Runtime responsibilities:

- Read uploaded `.xlsx` files with browser file APIs.
- Parse workbooks in the browser.
- Let users select worksheet and header row.
- Let users map source columns to known BOM fields.
- Normalize original and new BOM rows.
- Compare the two normalized BOMs in memory.
- Render the report in the browser.
- Generate the downloadable `.xlsx` report in the browser.

The app must not include application server routes for upload, comparison, history, or export.

## User Workflow

The app uses separate wizard screens to keep each step focused and reduce visual clutter.

Screens:

1. Upload original BOM.
2. Map original BOM columns.
3. Preview normalized original BOM and confirm.
4. Upload new BOM.
5. Map new BOM columns.
6. Preview normalized new BOM and confirm.
7. View comparison report, adjust filters, and download Excel report.

The app opens directly into the comparison workflow. It should not use a marketing landing page as the first screen.

Each step includes short inline guidance immediately above or beside the control the user is about to use. Guidance should not be hidden in side panels because users are unlikely to read them at the point of action.

## Upload, Worksheet, And Header Selection

Each upload screen accepts a single `.xlsx` workbook.

After upload, the app shows:

- Workbook filename.
- Available worksheets.
- Header row selector.
- A worksheet preview after the user selects a worksheet and header row.

The preview should show:

- The selected header row.
- Several sample data rows below the header.
- Row numbers.
- Column letters.

The selected header row should be visually marked.

## Column Mapping

The mapping UI should closely mirror the old BOM comparison app's mapping grid because that flow already supports flexible customer-supplied BOM formats.

For each source column, the grid shows:

- A dropdown for mapping the column to a known BOM field.
- A match-key selector for choosing the comparison key column.
- Previewed source values underneath.

The app should preselect likely mappings from header names and remembered local-storage preferences when available. Users must be able to override every suggestion.

Mapped fields:

- Line item.
- Internal part number.
- Customer part number.
- Description.
- Manufacturer name.
- Manufacturer part number.
- Quantity.
- Reference designators.

Match key choices:

- Line item.
- Internal part number.
- Customer part number.
- Manufacturer part number.

Validation must prevent duplicate field mappings. It must also require the selected match-key field and at least one reportable comparison field to be mapped before the user can confirm a BOM.

Mapped fields other than the selected match key are allowed to be omitted because real BOM exports vary. Omitted fields are excluded from changed-field comparison and the app must clearly explain which report sections will be limited. Manufacturer name and manufacturer part number are needed for useful manufacturer part number add/remove reporting.

## Normalized BOM Model

Each normalized row uses these fields:

- `line_item`
- `internal_part_number`
- `customer_part_number`
- `description`
- `manufacturer_name`
- `manufacturer_part_number`
- `quantity`
- `reference_designators`

All parsed values should be normalized to trimmed strings for comparison and display.

Comparison normalization:

- Match keys compare case-insensitively after trimming.
- General text fields compare case-insensitively after trimming.
- Reference designators compare after trimming comma-separated tokens and ignoring spacing around commas.
- Quantity compares as a normalized string in v1 unless a clear numeric parser is added and tested.

## Duplicate And Blank Match-Key Handling

Before comparison, the app validates the selected match key for each BOM.

The app should show:

- Blank match-key rows.
- Duplicate match-key groups.
- A short explanation that a different match key may produce a cleaner report.

Version 1 should allow duplicate match keys when they represent multiple manufacturer part numbers for the same BOM line. It should warn when the selected match key cannot uniquely identify a comparable BOM line.

The comparison model should group duplicate rows by the selected match key. The first row in a group supplies line-level fields such as quantity and description. The full group supplies manufacturer part number alternatives.

## Comparison Behavior

The app computes all supported differences once, then lets users filter what they view and export.

Computed result sections:

- Summary counts.
- Rows added in the new BOM.
- Rows removed from the original BOM.
- Changed field values for matched rows.
- Manufacturer part number additions within matched groups.
- Manufacturer part number removals within matched groups.
- Blank or unmatched rows that could not be compared cleanly.

Changed fields include:

- Internal part number.
- Customer part number.
- Description.
- Manufacturer name.
- Manufacturer part number.
- Quantity.
- Reference designators.

Description changes should be treated as normal changed fields, but report filters must make them easy to hide because they can be noisy.

## Report UI

The report screen mirrors the old tracked-change style:

- Summary count tiles at the top.
- Green styling for additions.
- Red styling for removals.
- Strikethrough for original values replaced by new values.
- Highlighted inserted values for new values.
- Tables for added rows, removed rows, changed fields, and manufacturer part number adds/removes.

The report includes an inline filter bar before the detail sections.

Filter options:

- Show or hide each changed field category.
- Show or hide row additions.
- Show or hide row removals.
- Show or hide manufacturer part number additions.
- Show or hide manufacturer part number removals.
- Show or hide blank or unmatched rows.

Filters affect both the on-screen report and the downloadable Excel report.

## Excel Report Export

The app generates the downloadable report as an `.xlsx` workbook in the browser.

The workbook should include:

- `Summary`
- `Added Rows`
- `Removed Rows`
- `Changed Fields`
- `Manufacturer Part Adds`
- `Manufacturer Part Removes`
- `Unmatched Or Blank Key Rows`

The workbook should reflect the active report filters. Hidden sections should be omitted from the exported workbook, and the `Summary` sheet should list the active filters used for the export.

The export logic must escape formula-like string values before writing cells. Any string beginning with `=`, `+`, `-`, or `@` should be prefixed so Excel treats it as text.

Generated report bytes must not be saved after download.

## UI Requirements

The UI should be practical, instructional, and easy to adopt.

Design requirements:

- Separate screens for major steps.
- Clear progress indicator.
- Inline guidance at the point of action.
- Plain-language validation errors with next steps.
- Explicit `.xlsx only` messaging near upload controls.
- Explicit browser-only processing messaging near upload and report controls.
- Mapping grid close to the old app's UI unless testing or implementation reveals a compelling simplification.
- No login, account, history, or saved-comparison screens.

The app should remain usable on smaller screens, but the mapping grid and report tables may require horizontal scrolling because BOM data is naturally tabular.

## Testing Strategy

Tests should cover privacy-critical and comparison-critical behavior.

Parser and upload tests:

- Accept valid `.xlsx` files.
- Reject CSV, PDF, `.xls`, and invalid workbook contents with clear messages.
- Extract worksheet names.
- Preview selected header row and sample rows.
- Parse mapped rows by column index.

Mapping tests:

- Suggest likely mappings from common header names.
- Apply local-storage mapping preferences without overriding explicit user choices.
- Reject duplicate field mappings.
- Require selected match-key field to be mapped.

Comparison tests:

- Detect added rows.
- Detect removed rows.
- Detect changed fields, including description changes.
- Normalize reference designator spacing.
- Detect manufacturer part number additions and removals.
- Surface blank match-key rows.
- Surface duplicate match-key groups.
- Handle at least 500 BOM lines within acceptable browser performance.

Report tests:

- Report filters hide and show expected categories.
- On-screen counts match the active filter state where applicable.
- Excel export reflects active filters.
- Excel export escapes formula-like values.

Privacy and retention tests:

- No code path uploads workbook contents to an app server.
- Local storage contains only preferences.
- Local storage does not contain workbook bytes, parsed BOM rows, comparison results, or report bytes.
- Refresh clears the active comparison.

Build and deployment tests:

- Static build succeeds.
- Built output is suitable for GitHub Pages.

## Acceptance Criteria

- Public Git repository can be published as open source.
- App can be deployed to GitHub Pages.
- User can compare two `.xlsx` BOMs with at least 500 lines in-browser.
- CSV, PDF, and `.xls` uploads are explicitly rejected or prevented.
- User can map columns for the original BOM.
- User can preview and confirm the normalized original BOM.
- User can map columns for the new BOM.
- User can preview and confirm the normalized new BOM.
- User can choose line item, internal part number, customer part number, or manufacturer part number as the match key.
- User can view an on-screen tracked-change report.
- User can hide noisy report categories such as description changes.
- User can download an `.xlsx` report generated in the browser.
- App has no authentication.
- App has no manufacturing-system or ERP integration.
- App has no application backend, API upload route, or database.
- UI explicitly says BOM data is not transmitted to a remote server by this app.
- Comparison data disappears on refresh or tab close.
- Browser local storage is limited to convenience preferences.

## Open Implementation Notes

The current `/home/chintan/oss-bom-comparison` workspace appears to have a broken empty `.git` directory mounted in the sandbox. Git commands fail because the directory does not contain repository metadata. The repository must be initialized or repaired before the design document can be committed.
