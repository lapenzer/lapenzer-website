import Link from "next/link";
import { NetworkDiagram } from "@/components/NetworkDiagram";
import { ProcessDiagram } from "@/components/ProcessDiagram";
import { SectionHeading } from "@/components/SectionHeading";

const capabilities = [
  ["Software", "Web applications, technical interfaces, research software, data-processing pipelines, simulation tools, and software for testing models against historical or synthetic data."],
  ["Mathematical modelling", "Models represent systems with variables, constraints, probabilities, relationships, and objectives. Current methods include graphs, optimization, Markov models, Monte Carlo simulation, regression, and scenario analysis."],
  ["Data analysis", "Data is cleaned, explored, compared, visualized, and tested so assumptions and model performance can be measured rather than implied."],
  ["Simulation", "Systems are run under changing inputs, constraints, probabilities, resource levels, network states, and alternative assumptions to measure how outcomes change."],
  ["Forecasting", "Possible future outcomes are estimated from historical information, current conditions, mathematical models, and uncertainty. Forecasts are expressed as probabilities rather than certainty."],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-kicker"><span className="status-dot" /> Independent technical company</div>
        <h1>LAPENZER</h1>
        <p className="hero-subtitle">Software, research, mathematical models, and technical systems.</p>
        <p className="hero-copy">
          Lapenzer develops software and research projects for problems involving prediction, forecasting, simulation,
          networks, data, and complex systems. Projects are built around clearly defined problems and documented with
          their methods, assumptions, results, and limitations.
        </p>
        <div className="button-row">
          <Link className="button button-primary" href="/projects">Explore projects</Link>
          <Link className="button button-secondary" href="/research">View research</Link>
        </div>
        <div className="hero-rule" />
        <div className="hero-metrics" aria-label="Company focus areas">
          <div><span>01</span><strong>Software</strong></div>
          <div><span>02</span><strong>Models</strong></div>
          <div><span>03</span><strong>Research</strong></div>
          <div><span>04</span><strong>Systems</strong></div>
        </div>
      </section>

      <section className="section shell split-section">
        <SectionHeading eyebrow="Mission" title="Turn difficult problems into models, software, and measurable results." />
        <div className="prose-large">
          <p>
            The company focuses on problems that can be represented mathematically or computationally: predicting
            possible routes, estimating future outcomes, simulating alternative scenarios, studying networks, and
            analysing structured data.
          </p>
          <p>
            Each project should make its assumptions visible and provide a clear explanation of how its output was produced.
          </p>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="Capabilities" title="What Lapenzer builds" description="Technical language is used where it improves precision; the implementation behind the term remains visible." />
        <div className="capability-grid">
          {capabilities.map(([title, text], index) => (
            <article className="capability-card" key={title}>
              <span className="card-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="section-link"><Link href="/capabilities">Detailed capabilities →</Link></div>
      </section>

      <section className="section shell project-feature">
        <div className="project-feature-header">
          <div>
            <p className="eyebrow">Project 01</p>
            <h2>Quantified Systems</h2>
          </div>
          <div className="project-tags">
            <span>Research</span><span>Software</span><span>Mathematical modelling</span>
          </div>
        </div>
        <div className="project-feature-grid">
          <div>
            <p className="project-lead">
              A research and software project focused on route prediction, forecasting, simulation, network analysis,
              and applied mathematical modelling.
            </p>
            <dl className="project-facts">
              <div><dt>Route prediction</dt><dd>Weighted graphs, candidate route generation, transition probabilities, contextual scoring, and ranking.</dd></div>
              <div><dt>Forecasting</dt><dd>Probability distributions over possible outcomes with assumptions and uncertainty exposed.</dd></div>
              <div><dt>Simulation</dt><dd>Repeated model runs under changed assumptions or random conditions, including Monte Carlo methods.</dd></div>
              <div><dt>Network analysis</dt><dd>Connected systems represented as nodes and relationships to study routes, dependencies, bottlenecks, and failure points.</dd></div>
            </dl>
            <div className="button-row">
              <Link className="button button-primary" href="/projects/quantified-systems">View project</Link>
              <a className="button button-secondary" href="https://quantifiedsystems.ca" target="_blank" rel="noreferrer">Open Quantified Systems ↗</a>
            </div>
          </div>
          <NetworkDiagram />
        </div>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="Technical approach" title="A six-stage development process" description="The process is designed to keep assumptions, implementation, validation, and limitations connected." />
        <ProcessDiagram />
      </section>

      <section className="section shell future-block">
        <p className="eyebrow">More projects</p>
        <h2>Additional Lapenzer projects will be published as they move from research into working prototypes or software.</h2>
        <Link href="/projects">Project archive →</Link>
      </section>
    </>
  );
}
