import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research",
  description: "Lapenzer technical publication archive for modelling, forecasting, networks, simulation, and software.",
};

const archiveFields = ["Title", "Project", "Date", "Summary", "Methods", "Status", "PDF", "Code"];

export default function ResearchPage() {
  return (
    <div className="shell page-shell">
      <header className="page-header">
        <p className="eyebrow">Research</p>
        <h1>Technical publication archive.</h1>
        <p>Research is presented as a record of methods, assumptions, results, limitations, and implementation status rather than as a blog feed.</p>
      </header>

      <section className="archive-schema" aria-labelledby="archive-schema-title">
        <div>
          <p className="eyebrow">Archive format</p>
          <h2 id="archive-schema-title">Every item carries enough context to evaluate what it actually represents.</h2>
        </div>
        <div className="schema-grid">
          {archiveFields.map((field, index) => <div key={field}><span>{String(index + 1).padStart(2, "0")}</span>{field}</div>)}
        </div>
      </section>

      <section className="research-empty-state">
        <div>
          <span className="status-chip">No items published here yet</span>
          <h2>Research will be added when source files and publication links are ready.</h2>
        </div>
        <p>The archive does not invent paper titles, dates, PDFs, or code links. Future filters such as Mathematical Modelling, Forecasting, Networks, Simulation, and Software should appear only when enough published material exists to justify them.</p>
      </section>
    </div>
  );
}
