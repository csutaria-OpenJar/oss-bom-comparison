import { useState } from "react";
import { validateWorkbookFile } from "../bom/fileValidation";
import type { UploadedWorkbook } from "../bom/types";
import { parseWorkbook } from "../bom/workbook";
import { PrivacyNotice } from "./PrivacyNotice";

interface UploadStepProps {
  label: "Original" | "New";
  onUploaded: (workbook: UploadedWorkbook) => void;
  onUseSampleBoms?: () => void;
}

export function UploadStep({ label, onUploaded, onUseSampleBoms }: UploadStepProps) {
  const inputId = `${label.toLowerCase()}-bom-upload`;
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setSelectedFileName(file.name);

    const validation = validateWorkbookFile(file);
    if (!validation.ok) {
      window.dispatchEvent(new CustomEvent("app-error", { detail: validation.message }));
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const parsed = parseWorkbook(data);
      onUploaded({ fileName: file.name, data, sheetNames: parsed.sheetNames });
    } catch (error) {
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: error instanceof Error ? error.message : "Upload a valid .xlsx workbook.",
        }),
      );
    }
  };

  return (
    <section className="section">
      <h2>Upload {label.toLowerCase()} BOM</h2>
      <p className="muted">.xlsx only. CSV, PDF, and .xls are not supported.</p>
      <PrivacyNotice variant="upload" />
      <label
        className={`file-label ${isDragging ? "dragging" : ""}`}
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        <span>{label} BOM workbook</span>
        <strong>Drop an .xlsx file here or choose a file</strong>
        {selectedFileName && <small>Selected file: {selectedFileName}</small>}
        <input
          id={inputId}
          type="file"
          accept=".xlsx"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>
      {onUseSampleBoms && (
        <div className="sample-bom-action">
          <p className="muted">No workbook handy? Load two sample BOMs with line-item, quantity, and MPN changes.</p>
          <button className="button secondary" type="button" onClick={onUseSampleBoms}>
            Use sample BOMs
          </button>
        </div>
      )}
    </section>
  );
}
