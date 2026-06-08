import { useEffect, useState } from "react";
import { createSampleMappedBoms } from "./bom/sampleBoms";
import type { MappedBom, UploadedWorkbook } from "./bom/types";
import { MappingStep } from "./components/MappingStep";
import { PreviewStep } from "./components/PreviewStep";
import { PrivacyNotice } from "./components/PrivacyNotice";
import { ProgressSteps } from "./components/ProgressSteps";
import { ReportStep } from "./components/ReportStep";
import { UploadStep } from "./components/UploadStep";
import openJarLogo from "../assets/Horizontal Logos/1.png";

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

  const resetComparison = () => {
    setStep(0);
    setError("");
    setOriginalWorkbook(null);
    setNewWorkbook(null);
    setOriginalBom(null);
    setNewBom(null);
  };

  return (
    <div className="page-shell">
      <header className="brand-header">
        <a className="brand-link" href="https://openjartech.com/" aria-label="OpenJar home">
          <img className="brand-logo" src={openJarLogo} alt="OpenJar" />
        </a>
      </header>
      <main className="app-shell">
        <div className="topbar">
          <div>
            <p className="eyebrow">Browser-only BOM comparison</p>
            <h1>Compare two Excel BOMs</h1>
          </div>
          <PrivacyNotice variant="header" />
        </div>
        <section className="workflow-summary" aria-label="Workflow summary">
          <div>
            <strong>3-stage workflow</strong>
            <span>Original BOM -&gt; New BOM -&gt; Report</span>
          </div>
          <div>
            <strong>Expected time</strong>
            <span>2-5 minutes for mapped Excel BOMs</span>
          </div>
          <div>
            <strong>Desktop app</strong>
            <span>Optimized for desktop and tablet workstations with wide BOM tables.</span>
          </div>
        </section>
        <ProgressSteps current={step} />
        <ComparisonContext
          originalWorkbook={originalWorkbook}
          newWorkbook={newWorkbook}
          originalBom={originalBom}
          newBom={newBom}
          onReset={step > 0 || originalWorkbook || newWorkbook || originalBom || newBom ? resetComparison : undefined}
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {step === 0 && (
          <UploadStep
            label="Original"
            onUseSampleBoms={() => {
              const sample = createSampleMappedBoms();
              setError("");
              setOriginalWorkbook(null);
              setNewWorkbook(null);
              setOriginalBom(sample.original);
              setNewBom(sample.next);
              setStep(6);
            }}
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
            onBack={() => setStep(0)}
            onMapped={(mapped) => {
              setOriginalBom(mapped);
              setStep(2);
            }}
          />
        )}
        {step === 2 && originalBom && (
          <PreviewStep label="Original" mapped={originalBom} onBack={() => setStep(1)} onConfirm={() => setStep(3)} />
        )}
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
            onBack={() => setStep(3)}
            onMapped={(mapped) => {
              setNewBom(mapped);
              setStep(5);
            }}
          />
        )}
        {step === 5 && newBom && (
          <PreviewStep label="New" mapped={newBom} onBack={() => setStep(4)} onConfirm={() => setStep(6)} />
        )}
        {step === 6 && originalBom && newBom && <ReportStep original={originalBom} next={newBom} />}
      </main>
      <footer className="app-footer">
        <a href="https://github.com/csutaria-OpenJar/oss-bom-comparison">GitHub repository</a>
        <a className="footer-icon-link" href="https://www.linkedin.com/company/openjartech/" aria-label="OpenJar LinkedIn">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="linkedin-icon">
            <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.44a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.01H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
          </svg>
          <span>LinkedIn</span>
        </a>
        <a href="https://openjartech.com/meetings/csutaria">Talk to me</a>
        <a href="https://github.com/csutaria-OpenJar/oss-bom-comparison/blob/main/LICENSE">License terms</a>
        <a href="https://openjartech.com/">OpenJar website</a>
      </footer>
    </div>
  );
}

function ComparisonContext({
  originalWorkbook,
  newWorkbook,
  originalBom,
  newBom,
  onReset,
}: {
  originalWorkbook: UploadedWorkbook | null;
  newWorkbook: UploadedWorkbook | null;
  originalBom: MappedBom | null;
  newBom: MappedBom | null;
  onReset?: () => void;
}) {
  if (!onReset) {
    return null;
  }

  return (
    <section className="comparison-context" aria-label="Current comparison">
      <div>
        <span>Original</span>
        <strong>{originalBom?.fileName ?? originalWorkbook?.fileName ?? "Not selected"}</strong>
        {originalBom && (
          <small>
            {originalBom.sheetName}, header row {originalBom.headerRow}, {originalBom.rows.length} rows
          </small>
        )}
      </div>
      <div>
        <span>New</span>
        <strong>{newBom?.fileName ?? newWorkbook?.fileName ?? "Not selected"}</strong>
        {newBom && (
          <small>
            {newBom.sheetName}, header row {newBom.headerRow}, {newBom.rows.length} rows
          </small>
        )}
      </div>
      <button className="button secondary" type="button" onClick={onReset}>
        Start over
      </button>
    </section>
  );
}
