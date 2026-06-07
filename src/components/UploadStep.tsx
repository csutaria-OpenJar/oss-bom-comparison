import { validateWorkbookFile } from "../bom/fileValidation";
import type { UploadedWorkbook } from "../bom/types";
import { parseWorkbook } from "../bom/workbook";
import { PrivacyNotice } from "./PrivacyNotice";

interface UploadStepProps {
  label: "Original" | "New";
  onUploaded: (workbook: UploadedWorkbook) => void;
}

export function UploadStep({ label, onUploaded }: UploadStepProps) {
  const inputId = `${label.toLowerCase()}-bom-upload`;

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

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
      <label className="file-label" htmlFor={inputId}>
        {label} BOM workbook
        <input
          id={inputId}
          type="file"
          accept=".xlsx"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>
    </section>
  );
}
