import { useMemo, useState } from "react";
import { compareBoms } from "../bom/compare";
import { downloadReport } from "../bom/exportReport";
import { BOM_FIELDS, FIELD_LABELS } from "../bom/fields";
import { loadPreferences, saveReportFilters } from "../bom/preferences";
import { applyReportFilters } from "../bom/reportFilters";
import type { BomField, BomRow, MappedBom, ReportFilters } from "../bom/types";
import { PrivacyNotice } from "./PrivacyNotice";

export function ReportStep({ original, next }: { original: MappedBom; next: MappedBom }) {
  const [filters, setFilters] = useState<ReportFilters>(() => loadPreferences().reportFilters);
  const result = useMemo(() => compareBoms(original.rows, next.rows, next.matchKey), [original.rows, next.rows, next.matchKey]);
  const filtered = useMemo(() => applyReportFilters(result, filters), [result, filters]);

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

  return (
    <section className="section">
      <h2>Comparison report</h2>
      <p className="muted">
        The report uses the shared comparison key: <strong>{FIELD_LABELS[next.matchKey]}</strong>. Use the filters to
        hide noisy changes from the report you are viewing and downloading.
      </p>
      <PrivacyNotice variant="report" />
      <div className="metric-row">
        {Object.entries(filtered.summary).map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
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
        Download Excel report
      </button>
      <h3>Changed fields</h3>
      <div className="table-wrap">
        <table>
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
                    <del className="inline-removed">{change.originalValue || "(blank)"}</del>
                  </td>
                  <td>
                    <ins className="inline-added">{change.newValue || "(blank)"}</ins>
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

function RowsSection({ title, rows, tone }: { title: string; rows: BomRow[]; tone?: "added" | "removed" }) {
  return (
    <>
      <h3>{title}</h3>
      <div className="table-wrap">
        <table>
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
              rows.slice(0, 100).map((row, index) => (
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
      {rows.length > 100 && <p className="muted">Showing first 100 rows. Download the Excel report for all rows.</p>}
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
