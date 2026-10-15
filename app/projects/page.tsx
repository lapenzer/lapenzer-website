import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Projects",
  description: "Lapenzer project archive: problems, methods, data, results, limitations, and software status.",
};

export default function ProjectsPage() {
  return (
    <div className="shell page-shell">
      <header className="page-header">
        <p className="eyebrow">Projects</p>
        <h1>Work is documented by problem, method, evidence, and maturity.</h1>
        <p>Project records show what is being built, how it works, what has been tested, and what remains uncertain.</p>
      </header>

      <article className="project-list-card">
        <div className="project-list-index">01</div>
        <div>
          <div className="project-tags"><span>Research</span><span>Software</span><span>Mathematical modelling</span></div>
          <h2>Quantified Systems</h2>
          <p>Route prediction, probabilistic forecasting, simulation, network analysis, and applied mathematical modelling.</p>
          <div className="project-summary-grid">
            <div><span>Status</span><strong>Research + prototype work</strong></div>
            <div><span>Problem</span><strong>Estimate plausible routes and future states when several outcomes are possible.</strong></div>
            <div><span>Approach</span><strong>Generate alternatives, score or assign probabilities, then compare predictions with observed or simulated outcomes.</strong></div>
            <div><span>Methods</span><strong>Graphs, probabilities, simulation, regression, and neural ranking where applicable.</strong></div>
            <div><span>Data</span><strong>Historical, current, environmental, network, and synthetic inputs depending on model.</strong></div>
            <div><span>Current results</span><strong>No performance number is published on this site without its dataset, test procedure, metric, and model version.</strong></div>
            <div><span>Software status</span><strong>Research components and prototypes; no production deployment is claimed here.</strong></div>
            <div><span>Limitations</span><strong>Performance depends on data coverage, changing constraints, model assumptions, candidate generation, and validation scope.</strong></div>
          </div>
          <div className="project-card-links">
            <span>Research links: archive entries pending publication</span>
            <a href="https://quantifiedsystems.ca" target="_blank" rel="noreferrer">External site ↗</a>
          </div>
          <Link className="text-link" href="/projects/quantified-systems">Open project record →</Link>
        </div>
      </article>

      <section className="empty-project-slot">
        <span>02+</span>
        <div>
          <h2>More projects</h2>
          <p>Additional Lapenzer projects will be published as they move from research into working prototypes or software.</p>
        </div>
      </section>
    </div>
  );
}
