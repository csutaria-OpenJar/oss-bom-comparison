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
    <nav className="wizard-steps" aria-label="Comparison workflow">
      {STEPS.map((step, index) => (
        <span className={index === current ? "active" : ""} key={step}>
          {step}
        </span>
      ))}
    </nav>
  );
}
