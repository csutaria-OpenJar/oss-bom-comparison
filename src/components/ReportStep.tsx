import { useMemo, useState } from "react";
import { compareBoms } from "../bom/compare";
import { downloadReport } from "../bom/exportReport";
import { BOM_FIELDS, DEFAULT_REPORT_FILTERS, FIELD_LABELS } from "../bom/fields";
import { loadPreferences, saveReportFilters } from "../bom/preferences";
import { applyReportFilters } from "../bom/reportFilters";
import type { BomField, BomRow, ComparisonResult, FieldChange, MappedBom, ReportFilters } from "../bom/types";
import { PrivacyNotice } from "./PrivacyNotice";

const INLINE_EDIT_FIELDS: BomField[] = [
  "internal_part_number",
  "customer_part_number",
  "quantity",
  "reference_designators",
];

export function ReportStep({ original, next }: { original: MappedBom; next: MappedBom }) {
  const [filters, setFilters] = useState<ReportFilters>(() => loadPreferences().reportFilters);
  const result = useMemo(() => compareBoms(original.rows, next.rows, next.matchKey), [original.rows, next.rows, next.matchKey]);
  const filtered = useMemo(() => applyReportFilters(result, filters), [result, filters]);
  const visibleChangeCount = summaryTotal(filtered.summary);
  const totalChangeCount = summaryTotal(result.summary);

  const updateFilters = (nextFilters: ReportFilters) => {
    setFilters(nextFilters);
    saveReportFilters(nextFilters);
  };

  const updateFieldFilter = (field: BomField, checked: boolean) => {
    updateFilters({
      ...filters,
      changedFields: { ...filters.changedFields, [field]: checked },
    });
  };

  const updateSectionFilter = (
    field:
      | "addedRows"
      | "removedRows"
      | "manufacturerPartAdds"
      | "manufacturerPartRemoves"
      | "unmatchedOrBlankRows",
    checked: boolean,
  ) => {
    updateFilters({ ...filters, [field]: checked });
  };

  const applyPreset = (preset: "all" | "line" | "manufacturer" | "ignoreDescriptions" | "issues") => {
    if (preset === "all") {
      updateFilters(DEFAULT_REPORT_FILTERS);
      return;
    }
    if (preset === "ignoreDescriptions") {
      updateFilters({
        ...filters,
        changedFields: { ...filters.changedFields, description: false },
      });
      return;
    }
    if (preset === "manufacturer") {
      updateFilters({
        changedFields: Object.fromEntries(BOM_FIELDS.map((field) => [field, field.includes("manufacturer")])) as ReportFilters["changedFields"],
        addedRows: false,
        removedRows: false,
        manufacturerPartAdds: true,
        manufacturerPartRemoves: true,
        unmatchedOrBlankRows: false,
      });
      return;
    }
    if (preset === "line") {
      updateFilters({
        changedFields: Object.fromEntries(
          BOM_FIELDS.map((field) => [
            field,
            ["line_item", "internal_part_number", "customer_part_number", "quantity", "reference_designators"].includes(field),
          ]),
        ) as ReportFilters["changedFields"],
        addedRows: true,
        removedRows: true,
        manufacturerPartAdds: false,
        manufacturerPartRemoves: false,
        unmatchedOrBlankRows: false,
      });
      return;
    }
    updateFilters({
      changedFields: Object.fromEntries(BOM_FIELDS.map((field) => [field, false])) as ReportFilters["changedFields"],
      addedRows: false,
      removedRows: false,
      manufacturerPartAdds: false,
      manufacturerPartRemoves: false,
      unmatchedOrBlankRows: true,
    });
  };

  return (
    <section className="section">
      <h2>Comparison report</h2>
      <p className="muted">
        The report uses the shared comparison key: <strong>{FIELD_LABELS[next.matchKey]}</strong>{" "}
        <small title="The field used to line up the original and new BOM rows before comparing values.">
          What is this?
        </small>
        . Use the filters to
        hide noisy changes from the report you are viewing and downloading.
      </p>
      <PrivacyNotice variant="report" />
      <div className="report-summary">
        <h3>Report summary</h3>
        <p>
          {summarySentence(result)} {filtered.summary.unmatchedOrBlankRows > 0
            ? `${filtered.summary.unmatchedOrBlankRows} blank-key rows are currently visible for review.`
            : "No blank-key rows are currently visible."}
        </p>
        <div className="summary-counts">
          <div>
            <span>Visible changes</span>
            <strong>{visibleChangeCount}</strong>
          </div>
          <div>
            <span>Total changes</span>
            <strong>{totalChangeCount}</strong>
          </div>
        </div>
        {visibleChangeCount === 0 && <p className="success-state">No visible changes match the current filters.</p>}
      </div>
      <div className="metric-row">
        {Object.entries(filtered.summary).map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{summaryLabel(label)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="preset-row" aria-label="Report view presets">
        <span>View presets</span>
        <button className="button secondary" type="button" onClick={() => applyPreset("all")}>
          All changes
        </button>
        <button className="button secondary" type="button" onClick={() => applyPreset("line")}>
          Line changes only
        </button>
        <button className="button secondary" type="button" onClick={() => applyPreset("manufacturer")}>
          Manufacturer changes
        </button>
        <button className="button secondary" type="button" onClick={() => applyPreset("ignoreDescriptions")}>
          Ignore descriptions
        </button>
        <button className="button secondary" type="button" onClick={() => applyPreset("issues")}>
          Issues only
        </button>
      </div>
      <div className="report-controls">
        <fieldset>
          <legend>Report sections</legend>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={filters.addedRows}
              onChange={(event) => updateSectionFilter("addedRows", event.target.checked)}
            />
            Added rows
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={filters.removedRows}
              onChange={(event) => updateSectionFilter("removedRows", event.target.checked)}
            />
            Removed rows
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={filters.manufacturerPartAdds}
              onChange={(event) => updateSectionFilter("manufacturerPartAdds", event.target.checked)}
            />
            Manufacturer part adds
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={filters.manufacturerPartRemoves}
              onChange={(event) => updateSectionFilter("manufacturerPartRemoves", event.target.checked)}
            />
            Manufacturer part removes
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={filters.unmatchedOrBlankRows}
              onChange={(event) => updateSectionFilter("unmatchedOrBlankRows", event.target.checked)}
            />
            Blank comparison keys
          </label>
        </fieldset>
        <fieldset>
          <legend>Changed fields</legend>
          <div className="filter-row" aria-label="Changed field filters">
            {BOM_FIELDS.map((field) => (
              <label className="checkbox" key={field}>
                <input
                  type="checkbox"
                  checked={filters.changedFields[field]}
                  onChange={(event) => updateFieldFilter(field, event.target.checked)}
                />
                {FIELD_LABELS[field]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <button className="button primary" onClick={() => downloadReport(result, filters)}>
        Download filtered Excel report
      </button>
      <p className="muted export-note">The downloaded workbook uses the current filters.</p>
      <AnnotatedBomSection result={filtered} />
      <h3>Changed fields</h3>
      <div className="table-wrap">
        <table>
          <caption>Changed field values for matched BOM rows</caption>
          <thead>
            <tr>
              <th>Match</th>
              <th>Field</th>
              <th>Original</th>
              <th>New</th>
            </tr>
          </thead>
          <tbody>
            {filtered.changedFields.length === 0 ? (
              <tr>
                <td colSpan={4}>No changed fields are visible with the current filters.</td>
              </tr>
            ) : (
              filtered.changedFields.map((change, index) => (
                <tr key={`${change.matchValue}-${change.field}-${index}`}>
                  <td>{change.matchValue}</td>
                  <td>{FIELD_LABELS[change.field]}</td>
                  <td>
                    <del className="inline-removed">{removedValue(change)}</del>
                  </td>
                  <td>
                    <ins className="inline-added">{addedValue(change)}</ins>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filters.addedRows && <RowsSection title="Added rows" rows={filtered.addedRows} tone="added" />}
      {filters.removedRows && <RowsSection title="Removed rows" rows={filtered.removedRows} tone="removed" />}
      {filters.manufacturerPartAdds && (
        <PartSection title="Manufacturer part adds" rows={filtered.manufacturerPartAdds} tone="added" />
      )}
      {filters.manufacturerPartRemoves && (
        <PartSection title="Manufacturer part removes" rows={filtered.manufacturerPartRemoves} tone="removed" />
      )}
      {filters.unmatchedOrBlankRows && (
        <RowsSection title="Rows with blank comparison keys" rows={filtered.unmatchedOrBlankRows} />
      )}
    </section>
  );
}

function AnnotatedBomSection({ result }: { result: ComparisonResult }) {
  return (
    <>
      <h3>Original BOM With New BOM Edits</h3>
      <div className="legend-row" aria-label="Color Key">
        <span className="legend-title">Color Key</span>
        <span>
          <span className="inline-chip unchanged-chip">Neutral oval</span> unchanged manufacturer part
        </span>
        <span>
          <span className="inline-chip added-chip">Green oval</span> manufacturer part added in new BOM
        </span>
        <span>
          <span className="inline-chip removed-chip">Red oval</span> manufacturer part removed from original BOM
        </span>
        <span>
          <del className="inline-removed">Red strikethrough</del> original value replaced by new value
        </span>
        <span>
          <ins className="inline-added">Green highlight</ins> new replacement value
        </span>
      </div>
      <div className="table-wrap compact">
        <table className="annotated-bom-table" aria-label="Original BOM with new BOM edits">
          <caption>Original BOM annotated with new BOM edits</caption>
          <thead>
            <tr>
              <th>Original line</th>
              <th>New line</th>
              <th>Internal part number</th>
              <th>Customer part number</th>
              <th>Quantity</th>
              <th>Reference designators</th>
              <th>Manufacturer</th>
              <th>MPN</th>
            </tr>
          </thead>
          <tbody>
            {result.matchedRows.length === 0 ? (
              <tr>
                <td colSpan={8}>No matched rows to annotate.</td>
              </tr>
            ) : (
              result.matchedRows.map((line, index) => (
                <tr key={`${line.matchValue}-${index}`}>
                  <td>{line.original.line_item}</td>
                  <td>{line.next.line_item}</td>
                  {INLINE_EDIT_FIELDS.map((field) => (
                    <td key={field}>
                      <InlineFieldValue field={field} row={line.original} changes={line.changes} />
                    </td>
                  ))}
                  <td className="manufacturer-pair-cell" colSpan={2}>
                    {manufacturerDisplayRows(line).map((row, rowIndex) => (
                      <div className="manufacturer-subrow" key={`${row.manufacturerPartNumber}-${rowIndex}`}>
                        <div>
                          {row.newManufacturerName ? (
                            <>
                              <del className="inline-removed">{row.manufacturerName || "(blank)"}</del>
                              <ins className="inline-added">{row.newManufacturerName || "(blank)"}</ins>
                            </>
                          ) : (
                            <ManufacturerChip status={row.status}>{row.manufacturerName}</ManufacturerChip>
                          )}
                        </div>
                        <div>
                          <ManufacturerChip status={row.status}>{row.manufacturerPartNumber}</ManufacturerChip>
                        </div>
                      </div>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InlineFieldValue({
  field,
  row,
  changes,
}: {
  field: BomField;
  row: BomRow;
  changes: FieldChange[];
}) {
  const change = changes.find((candidate) => candidate.field === field);
  if (!change) return <>{row[field]}</>;

  return (
    <>
      <del className="inline-removed">{change.originalValue || "(blank)"}</del>
      <ins className="inline-added">{change.newValue || "(blank)"}</ins>
    </>
  );
}

function ManufacturerChip({
  status,
  children,
}: {
  status: "added" | "removed" | "unchanged";
  children: string;
}) {
  return <span className={`inline-chip ${status}-chip`}>{children || "(blank)"}</span>;
}

function manufacturerDisplayRows(line: ComparisonResult["matchedRows"][number]) {
  const originalParts = partRowsByIdentity(line.originalRows);
  const newParts = partRowsByIdentity(line.newRows);
  const newPartsByMpn = partRowsByMpn(line.newRows);
  const usedNewIdentities = new Set<string>();

  const rows = [...originalParts.entries()].map(([identity, originalRow]) => {
    const matchingNewRow = newParts.get(identity);
    if (matchingNewRow) {
      usedNewIdentities.add(identity);
      return manufacturerDisplayRow("unchanged", originalRow);
    }

    const replacementByMpn = newPartsByMpn.get(normalizeText(originalRow.manufacturer_part_number));
    if (replacementByMpn) {
      usedNewIdentities.add(partIdentity(replacementByMpn));
      return {
        status: "unchanged" as const,
        manufacturerName: originalRow.manufacturer_name,
        newManufacturerName: replacementByMpn.manufacturer_name,
        manufacturerPartNumber: originalRow.manufacturer_part_number,
      };
    }

    return manufacturerDisplayRow("removed", originalRow);
  });

  for (const [identity, newRow] of newParts) {
    if (!usedNewIdentities.has(identity)) {
      rows.push(manufacturerDisplayRow("added", newRow));
    }
  }

  return rows;
}

function manufacturerDisplayRow(status: "added" | "removed" | "unchanged", row: BomRow) {
  return {
    status,
    manufacturerName: row.manufacturer_name,
    newManufacturerName: "",
    manufacturerPartNumber: row.manufacturer_part_number,
  };
}

function partRowsByIdentity(rows: BomRow[]) {
  const parts = new Map<string, BomRow>();
  for (const row of rows) {
    const identity = partIdentity(row);
    if (identity) parts.set(identity, row);
  }
  return parts;
}

function partRowsByMpn(rows: BomRow[]) {
  const parts = new Map<string, BomRow>();
  for (const row of rows) {
    const mpn = normalizeText(row.manufacturer_part_number);
    if (mpn) parts.set(mpn, row);
  }
  return parts;
}

function partIdentity(row: BomRow) {
  const mpn = normalizeText(row.manufacturer_part_number);
  if (!mpn) return "";
  return `${normalizeText(row.manufacturer_name)}|${mpn}`;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function RowsSection({ title, rows, tone }: { title: string; rows: BomRow[]; tone?: "added" | "removed" }) {
  return (
    <>
      <h3>{title}</h3>
      <div className="table-wrap">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th>Line</th>
              <th>Internal PN</th>
              <th>Customer PN</th>
              <th>Description</th>
              <th>Mfr</th>
              <th>MPN</th>
              <th>Qty</th>
              <th>Ref Des</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}>No rows in this section.</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr className={tone ? `row-${tone}` : ""} key={`${row.line_item}-${row.internal_part_number}-${index}`}>
                  <td>{row.line_item}</td>
                  <td>{row.internal_part_number}</td>
                  <td>{row.customer_part_number}</td>
                  <td>{row.description}</td>
                  <td>{row.manufacturer_name}</td>
                  <td>{row.manufacturer_part_number}</td>
                  <td>{row.quantity}</td>
                  <td>{row.reference_designators}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PartSection({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: Array<{ matchValue: string; lineItem: string; manufacturerName: string; manufacturerPartNumber: string }>;
  tone: "added" | "removed";
}) {
  return (
    <>
      <h3>{title}</h3>
      <div className="table-wrap">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th>Match</th>
              <th>Line</th>
              <th>Manufacturer</th>
              <th>Manufacturer PN</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>No manufacturer part changes in this section.</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr className={`row-${tone}`} key={`${row.matchValue}-${row.manufacturerPartNumber}-${index}`}>
                  <td>{row.matchValue}</td>
                  <td>{row.lineItem}</td>
                  <td>{row.manufacturerName}</td>
                  <td>{row.manufacturerPartNumber}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function summaryTotal(summary: ComparisonResult["summary"]): number {
  return Object.values(summary).reduce((total, value) => total + value, 0);
}

function summarySentence(result: ComparisonResult): string {
  const { addedRows, removedRows, changedFields, manufacturerPartAdds, manufacturerPartRemoves, unmatchedOrBlankRows } =
    result.summary;
  return `${addedRows} added rows, ${removedRows} removed rows, ${changedFields} field changes, ${manufacturerPartAdds} manufacturer part adds, ${manufacturerPartRemoves} manufacturer part removes, and ${unmatchedOrBlankRows} blank-key rows were found.`;
}

function summaryLabel(label: string): string {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

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
