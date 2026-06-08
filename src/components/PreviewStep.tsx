import { mappedFieldLabels, matchKeyDiagnosticMessages, omittedFieldLabels } from "../bom/diagnostics";
import type { MappedBom } from "../bom/types";

export function PreviewStep({
  label,
  mapped,
  onBack,
  onConfirm,
}: {
  label: "Original" | "New";
  mapped: MappedBom;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const mappedFields = mappedFieldLabels(mapped.mapping);
  const omittedFields = omittedFieldLabels(mapped.mapping);
  const diagnostics = matchKeyDiagnosticMessages(mapped.rows, mapped.matchKey);

  return (
    <section className="section">
      <h2>Preview {label.toLowerCase()} BOM</h2>
      <p className="muted">Review the normalized rows before continuing. Showing the first 20 rows.</p>
      <div className="context-grid" aria-label={`${label} preview summary`}>
        <div>
          <span>Rows</span>
          <strong>{mapped.rows.length} total normalized rows</strong>
        </div>
        <div>
          <span>Mapped fields</span>
          <strong>Mapped fields: {mappedFields.join(", ")}</strong>
        </div>
        <div>
          <span>Omitted fields</span>
          <strong>Omitted fields: {omittedFields.length > 0 ? omittedFields.join(", ") : "None"}</strong>
        </div>
      </div>
      {diagnostics.length > 0 && (
        <div className="diagnostic-panel" role="status">
          <strong>Match-key review</strong>
          {diagnostics.map((message) => (
            <p key={message}>{message}</p>
          ))}
          <small>Confirm only if these rows are expected for this BOM.</small>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <caption>First 20 normalized {label.toLowerCase()} BOM rows</caption>
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
            {mapped.rows.slice(0, 20).map((row, index) => (
              <tr key={`${row.line_item}-${index}`}>
                <td>{row.line_item}</td>
                <td>{row.internal_part_number}</td>
                <td>{row.customer_part_number}</td>
                <td>{row.description}</td>
                <td>{row.manufacturer_name}</td>
                <td>{row.manufacturer_part_number}</td>
                <td>{row.quantity}</td>
                <td>{row.reference_designators}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="step-actions" role="group" aria-label={`Preview ${label.toLowerCase()} BOM actions`}>
        <button className="button secondary" onClick={onBack}>
          Back
        </button>
        <button className="button primary" onClick={onConfirm}>
          Confirm {label.toLowerCase()} BOM
        </button>
      </div>
    </section>
  );
}
