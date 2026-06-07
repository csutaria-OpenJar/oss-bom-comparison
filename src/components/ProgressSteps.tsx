const STEPS = [
  "Original upload",
  "Original mapping",
  "Original preview",
  "New upload",
  "New mapping",
  "New preview",
  "Report",
];

export function ProgressSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Comparison workflow">
      <ol className="wizard-steps">
        {STEPS.map((step, index) => (
          <li key={step}>
            <span aria-current={index === current ? "step" : undefined} className={index === current ? "active" : ""}>
              {step}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
