export default function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Browser-only BOM comparison</p>
          <h1>Compare two Excel BOMs</h1>
        </div>
        <p className="trust-banner">
          Your BOM files stay in this browser. Nothing is uploaded to a server.
        </p>
      </header>
      <section className="section">
        <h2>Upload original BOM</h2>
        <p className="muted">
          Start with the original Excel workbook. .xlsx only. CSV, PDF, and .xls
          are not supported.
        </p>
      </section>
    </main>
  );
}
