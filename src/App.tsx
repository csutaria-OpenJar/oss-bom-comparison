import { useEffect, useState } from "react";
import type { MappedBom, UploadedWorkbook } from "./bom/types";
import { MappingStep } from "./components/MappingStep";
import { PreviewStep } from "./components/PreviewStep";
import { PrivacyNotice } from "./components/PrivacyNotice";
import { ProgressSteps } from "./components/ProgressSteps";
import { ReportStep } from "./components/ReportStep";
import { UploadStep } from "./components/UploadStep";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export default function App() {
  const [step, setStep] = useState<Step>(0);
  const [error, setError] = useState("");
  const [originalWorkbook, setOriginalWorkbook] = useState<UploadedWorkbook | null>(null);
  const [newWorkbook, setNewWorkbook] = useState<UploadedWorkbook | null>(null);
  const [originalBom, setOriginalBom] = useState<MappedBom | null>(null);
  const [newBom, setNewBom] = useState<MappedBom | null>(null);

  useEffect(() => {
    const handler = (event: Event) => setError((event as CustomEvent<string>).detail);
    window.addEventListener("app-error", handler);
    return () => window.removeEventListener("app-error", handler);
  }, []);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Browser-only BOM comparison</p>
          <h1>Compare two Excel BOMs</h1>
        </div>
        <PrivacyNotice variant="header" />
      </header>
      <ProgressSteps current={step} />
      {error && <p className="error">{error}</p>}
      {step === 0 && (
        <UploadStep
          label="Original"
          onUploaded={(workbook) => {
            setError("");
            setOriginalWorkbook(workbook);
            setStep(1);
          }}
        />
      )}
      {step === 1 && originalWorkbook && (
        <MappingStep
          label="Original"
          workbook={originalWorkbook}
          onMapped={(mapped) => {
            setOriginalBom(mapped);
            setStep(2);
          }}
        />
      )}
      {step === 2 && originalBom && <PreviewStep label="Original" mapped={originalBom} onConfirm={() => setStep(3)} />}
      {step === 3 && (
        <UploadStep
          label="New"
          onUploaded={(workbook) => {
            setError("");
            setNewWorkbook(workbook);
            setStep(4);
          }}
        />
      )}
      {step === 4 && newWorkbook && originalBom && (
        <MappingStep
          label="New"
          workbook={newWorkbook}
          requiredMatchKey={originalBom.matchKey}
          onMapped={(mapped) => {
            setNewBom(mapped);
            setStep(5);
          }}
        />
      )}
      {step === 5 && newBom && <PreviewStep label="New" mapped={newBom} onConfirm={() => setStep(6)} />}
      {step === 6 && originalBom && newBom && <ReportStep original={originalBom} next={newBom} />}
    </main>
  );
}
