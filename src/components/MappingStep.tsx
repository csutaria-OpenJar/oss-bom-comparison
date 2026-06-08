import { useEffect, useMemo, useState } from "react";
import { BOM_FIELDS, FIELD_LABELS, MATCH_KEYS } from "../bom/fields";
import { matchKeyDiagnosticMessages } from "../bom/diagnostics";
import { fieldsByColumn, suggestMapping, validateMapping } from "../bom/mapping";
import { loadMappingPreference, loadPreferences, saveMappingPreference } from "../bom/preferences";
import type { BomField, MappedBom, MatchKey, UploadedWorkbook } from "../bom/types";
import { extractMappedRows, parseWorkbook, previewWorksheet, worksheetStats } from "../bom/workbook";

const INITIAL_PREVIEW_ROWS = 8;
const PREVIEW_ROW_INCREMENT = 16;

interface MappingStepProps {
  label: "Original" | "New";
  workbook: UploadedWorkbook;
  requiredMatchKey?: MatchKey;
  onBack: () => void;
  onMapped: (mapped: MappedBom) => void;
}

export function MappingStep({ label, workbook, requiredMatchKey, onBack, onMapped }: MappingStepProps) {
  const parsed = useMemo(() => parseWorkbook(workbook.data), [workbook.data]);
  const [sheetName, setSheetName] = useState(workbook.sheetNames[0] ?? "");
  const [headerRow, setHeaderRow] = useState(1);
  const [matchKey, setMatchKey] = useState<MatchKey>(() => requiredMatchKey ?? loadPreferences().preferredMatchKey);
  const [columnFields, setColumnFields] = useState<Array<BomField | "">>([]);
  const [previewRowLimit, setPreviewRowLimit] = useState(INITIAL_PREVIEW_ROWS);
  const preview = useMemo(() => {
    try {
      return { value: previewWorksheet(parsed, sheetName, headerRow, previewRowLimit), error: "" };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "Unable to preview this worksheet.",
      };
    }
  }, [parsed, sheetName, headerRow, previewRowLimit]);
  const stats = useMemo(() => {
    try {
      return worksheetStats(parsed, sheetName, headerRow);
    } catch {
      return { dataRows: 0, detectedColumns: 0 };
    }
  }, [parsed, sheetName, headerRow]);

  useEffect(() => {
    if (!preview.value) {
      setColumnFields([]);
      return;
    }

    const remembered = loadMappingPreference(preview.value.headers);
    const suggested = suggestMapping(preview.value.headers, remembered);
    setColumnFields(
      preview.value.columns.map((column) => {
        const entry = Object.entries(suggested).find(([, index]) => index === column.index);
        return (entry?.[0] as BomField | undefined) ?? "";
      }),
    );
  }, [preview]);

  const errors = preview.value ? validateMapping(columnFields, matchKey) : [];
  const mappedRows = useMemo(() => {
    if (!preview.value || errors.length > 0) {
      return [];
    }
    try {
      return extractMappedRows(parsed, sheetName, headerRow, fieldsByColumn(columnFields));
    } catch {
      return [];
    }
  }, [columnFields, errors.length, headerRow, parsed, preview.value, sheetName]);
  const keyDiagnostics = mappedRows.length > 0 ? matchKeyDiagnosticMessages(mappedRows, matchKey) : [];
  const visiblePreviewDataRows = preview.value ? Math.max(0, preview.value.rows.length - 1) : 0;
  const hiddenPreviewRows = Math.max(0, stats.dataRows - visiblePreviewDataRows);

  const updateColumnField = (columnIndex: number, field: BomField | "") => {
    const next = [...columnFields];
    next[columnIndex] = field;
    setColumnFields(next);
  };

  const confirmMapping = () => {
    if (!preview.value || errors.length > 0) {
      return;
    }
    const mapping = fieldsByColumn(columnFields);
    saveMappingPreference(preview.value.headers, mapping, matchKey);
    onMapped({
      fileName: workbook.fileName,
      sheetName,
      headerRow,
      mapping,
      matchKey,
      rows: extractMappedRows(parsed, sheetName, headerRow, mapping),
    });
  };

  return (
    <section className="section">
      <h2>Map {label.toLowerCase()} BOM columns</h2>
      <p className="muted">
        Choose the worksheet, header row, mapped fields, and comparison key. Ignore columns you do not want in the
        comparison report.
      </p>
      <div className="context-grid" aria-label={`${label} workbook context`}>
        <div>
          <span>Workbook</span>
          <strong>{workbook.fileName}</strong>
        </div>
        <div>
          <span>Worksheets</span>
          <strong>
            {workbook.sheetNames.length} {workbook.sheetNames.length === 1 ? "worksheet" : "worksheets"}
          </strong>
        </div>
        <div>
          <span>Selected range</span>
          <strong>
            {stats.dataRows} data rows, {stats.detectedColumns} detected columns
          </strong>
        </div>
      </div>
      {requiredMatchKey && (
        <p className="notice">
          The new BOM uses the same comparison key selected for the original BOM: {FIELD_LABELS[requiredMatchKey]}.
        </p>
      )}
      <div className="form-grid">
        <label>
          Worksheet
          <select
            value={sheetName}
            onChange={(event) => {
              setSheetName(event.target.value);
              setPreviewRowLimit(INITIAL_PREVIEW_ROWS);
            }}
          >
            {workbook.sheetNames.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>
            Header row{" "}
            <small title="Pick the row containing column names. The highlighted row in the preview is treated as headers.">
              What is this?
            </small>
          </span>
          <div className="number-stepper">
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setHeaderRow(Math.max(1, headerRow - 1));
                setPreviewRowLimit(INITIAL_PREVIEW_ROWS);
              }}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={headerRow}
              onChange={(event) => {
                setHeaderRow(Number(event.target.value));
                setPreviewRowLimit(INITIAL_PREVIEW_ROWS);
              }}
            />
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setHeaderRow(headerRow + 1);
                setPreviewRowLimit(INITIAL_PREVIEW_ROWS);
              }}
            >
              +
            </button>
          </div>
        </label>
        <label>
          <span>
            Match key{" "}
            <small title="The field used to line up the original and new BOM rows before comparing values.">
              What is this?
            </small>
          </span>
          <select
            aria-label="Match key"
            disabled={Boolean(requiredMatchKey)}
            value={matchKey}
            onChange={(event) => setMatchKey(event.target.value as MatchKey)}
          >
            {MATCH_KEYS.map((field) => (
              <option key={field} value={field}>
                {FIELD_LABELS[field]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {preview.error && (
        <p className="error" role="alert">
          {preview.error}
        </p>
      )}
      {errors.map((error) => (
        <p className="error" key={error} role="alert">
          {error}
        </p>
      ))}
      {keyDiagnostics.length > 0 && (
        <details className="diagnostic-panel" data-testid="match-key-diagnostics">
          <summary>
            <strong>Match-key review</strong>
            <span>{keyDiagnostics.length} note{keyDiagnostics.length === 1 ? "" : "s"} available</span>
          </summary>
          <div>
            {keyDiagnostics.map((message) => (
              <p key={message}>{message}</p>
            ))}
            <small>Duplicate keys can be expected in some BOMs. Choose the match key that best fits this comparison.</small>
          </div>
        </details>
      )}
      {preview.value && (
        <>
          <div className="mapping-grid-wrap">
            <table className="mapping-grid">
              <thead>
                <tr>
                  <th>Map</th>
                  {preview.value.columns.map((column) => (
                    <th
                      className={columnFields[column.index] ? "mapped-column" : "ignored-column"}
                      key={column.index}
                    >
                      <span className="column-label">Column {column.label}</span>
                      <select
                        aria-label={`Map column ${column.label}`}
                        value={columnFields[column.index] ?? ""}
                        onChange={(event) => updateColumnField(column.index, event.target.value as BomField | "")}
                      >
                        <option value="">Ignore column</option>
                        {BOM_FIELDS.map((field) => (
                          <option key={field} value={field}>
                            {FIELD_LABELS[field]}
                          </option>
                        ))}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.value.rows.map((row) => (
                  <tr className={row.isHeader ? "header-row" : ""} key={row.rowNumber}>
                    <th>{row.rowNumber}</th>
                    {row.values.map((value, index) => (
                      <td key={`${row.rowNumber}-${index}`}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hiddenPreviewRows > 0 && (
            <div className="preview-more-action">
              <button
                className="button secondary"
                type="button"
                onClick={() => setPreviewRowLimit((limit) => limit + PREVIEW_ROW_INCREMENT)}
              >
                View more preview rows
              </button>
            </div>
          )}
        </>
      )}
      <div className="step-actions" role="group" aria-label={`Map ${label.toLowerCase()} BOM actions`}>
        <button className="button secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="button primary"
          disabled={!preview.value || errors.length > 0}
          onClick={confirmMapping}
          title={errors.length > 0 ? errors.join(" ") : undefined}
        >
          Preview {label.toLowerCase()} BOM
        </button>
      </div>
    </section>
  );
}
