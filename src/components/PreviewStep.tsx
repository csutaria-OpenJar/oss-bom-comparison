import type { MappedBom } from "../bom/types";

export function PreviewStep({
  label,
  mapped,
  onConfirm,
}: {
  label: "Original" | "New";
  mapped: MappedBom;
  onConfirm: () => void;
}) {
  return (
    <section className="section">
      <h2>Preview {label.toLowerCase()} BOM</h2>
      <p className="muted">Review the normalized rows before continuing. Showing the first 20 rows.</p>
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
      <button className="button primary" onClick={onConfirm}>
        Confirm {label.toLowerCase()} BOM
      </button>
    </section>
  );
}
