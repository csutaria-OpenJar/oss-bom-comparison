const STEPS = [
  { label: "Original BOM", detail: "Upload, map, preview", start: 0, end: 2, total: 3 },
  { label: "New BOM", detail: "Upload, map, preview", start: 3, end: 5, total: 3 },
  { label: "Report", detail: "Review and export", start: 6, end: 6, total: 1 },
];

export function ProgressSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Comparison workflow">
      <ol className="wizard-steps">
        {STEPS.map((step) => {
          const isActive = current >= step.start && current <= step.end;
          const completed = Math.min(step.total, Math.max(0, current - step.start + 1));

          return (
            <li key={step.label}>
              <span className={isActive ? "active" : ""}>
                <span aria-current={isActive ? "step" : undefined} className="wizard-step-label">
                  {step.label}
                </span>
                <small>{step.detail}</small>
                <span
                  aria-label={`${step.label} progress ${completed} of ${step.total}`}
                  className="wizard-step-progress"
                >
                  {Array.from({ length: step.total }, (_, index) => (
                    <span
                      aria-hidden="true"
                      className={index < completed ? "complete" : ""}
                      key={`${step.label}-${index}`}
                    />
                  ))}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
