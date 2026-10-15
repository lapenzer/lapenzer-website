import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Lapenzer and its principles for technical ownership, measurable results, clear limitations, and implementation-oriented research.",
};

const principles = [
  ["Technical ownership", "Projects should remain portable and maintainable. Source code, documentation, data structures, and deployment should avoid unnecessary dependence on a single vendor."],
  ["Measurable results", "Where a project produces predictions or quantitative outputs, results should be tested and reported using appropriate measurements."],
  ["Clear limitations", "Technical systems should document where they work, where they fail, and what assumptions affect their results."],
  ["Research and implementation", "Research should be connected to working implementations when practical. A model should be testable in software rather than existing only as a written concept."],
] as const;

export default function AboutPage() {
  return (
    <div className="shell page-shell">
      <header className="page-header">
        <p className="eyebrow">About Lapenzer</p>
        <h1>An independent technical company developing software, mathematical models, research, and analytical systems.</h1>
        <p>The company focuses on building projects where mathematical reasoning and software can be used together to study complex problems. Work is developed as research, prototypes, and software depending on the maturity of each project.</p>
      </header>

      <section className="principles-grid">
        {principles.map(([title, text], index) => (
          <article key={title}>
            <span className="card-index">0{index + 1}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="detail-section maturity-section">
        <p className="eyebrow">Maturity labels</p>
        <h2>Research work and production systems are not presented as the same thing.</h2>
        <div className="maturity-track">
          {[
            ["Theory", "A documented concept, derivation, framework, or proposed method."],
            ["Prototype", "An implementation exists, but testing is limited or exploratory."],
            ["Tested prototype", "The implementation has been evaluated against defined data or benchmarks."],
            ["Working software", "The system performs its defined function in an operating software implementation."],
            ["Production system", "The software is deployed and operated under defined production requirements."],
          ].map(([title, text]) => <div key={title}><strong>{title}</strong><p>{text}</p></div>)}
        </div>
      </section>
    </div>
  );
}
