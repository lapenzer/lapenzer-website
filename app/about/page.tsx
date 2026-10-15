import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Lapenzer builds software, mathematical models, and analytical systems for forecasting, simulation, networks, and data-heavy problems.",
};

const principles = [
  ["Own the stack", "Keep source code, deployment, data structures, and documentation portable and maintainable."],
  ["Measure performance", "Test models and software against real data, benchmarks, and defined operating conditions."],
  ["Build for use", "Turn research and models into interfaces, tools, APIs, pipelines, and deployable software."],
  ["Keep improving", "Use results from testing and deployment to improve models, code, and system design."],
] as const;

export default function AboutPage() {
  return (
    <div className="shell page-shell">
      <header className="page-header">
        <p className="eyebrow">About</p>
        <h1>Lapenzer builds software, models, and systems for complex data and prediction problems.</h1>
        <p>
          Our work combines software engineering, mathematical modelling, forecasting, simulation, and data analysis.
          Projects move from early models and prototypes into working software as they mature.
        </p>
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
        <p className="eyebrow">Development stages</p>
        <h2>Projects are labelled by how far they have been built and tested.</h2>
        <div className="maturity-track">
          {[
            ["Concept", "The method or system design has been defined."],
            ["Prototype", "An initial implementation is working."],
            ["Tested prototype", "The implementation has been evaluated with defined data or benchmarks."],
            ["Working software", "The system performs its intended function as a usable application or service."],
            ["Production", "The software is deployed and operated as a live system."],
          ].map(([title, text]) => <div key={title}><strong>{title}</strong><p>{text}</p></div>)}
        </div>
      </section>
    </div>
  );
}
