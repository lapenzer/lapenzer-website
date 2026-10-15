import Link from "next/link";
import { NetworkDiagram } from "@/components/NetworkDiagram";
import { ProcessDiagram } from "@/components/ProcessDiagram";
import { ScrollShowcase } from "@/components/ScrollShowcase";
import { SectionHeading } from "@/components/SectionHeading";

const capabilities = [
  ["Software", "Web applications, technical interfaces, data pipelines, simulation tools, and custom software built around real operational needs."],
  ["Mathematical modelling", "Forecasting, optimization, graph models, probability, regression, Monte Carlo methods, and scenario analysis."],
  ["Data analysis", "Data cleaning, exploration, visualization, statistical analysis, model evaluation, and performance measurement."],
  ["Simulation", "Software for testing systems under changing conditions, constraints, network states, and resource levels."],
  ["Forecasting", "Models that estimate likely future outcomes from historical data, current conditions, and uncertainty."],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-kicker">Software / Models / Data</div>
        <h1>LAPENZER</h1>
        <p className="hero-subtitle">Software for prediction, simulation, and data-intensive systems.</p>
        <p className="hero-copy">
          Lapenzer builds software, models, and analytical tools for forecasting, network analysis, simulation,
          and decision support.
        </p>
        <div className="button-row">
          <Link className="button button-primary" href="/projects">View projects</Link>
          <Link className="button button-secondary" href="/research">Research</Link>
        </div>
        <div className="hero-rule" />
        <div className="hero-metrics" aria-label="Company focus areas">
          <div><span>01</span><strong>Software</strong></div>
          <div><span>02</span><strong>Modelling</strong></div>
          <div><span>03</span><strong>Data</strong></div>
          <div><span>04</span><strong>Systems</strong></div>
        </div>
      </section>

      <ScrollShowcase />

      <section className="section shell split-section">
        <SectionHeading eyebrow="What we do" title="Build software for complex, data-heavy problems." />
        <div className="prose-large">
          <p>
            We work on forecasting, simulation, route and network analysis, data processing, and software that turns
            mathematical models into usable tools.
          </p>
          <p>
            Projects can range from research prototypes to deployable applications and technical systems.
          </p>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="Capabilities" title="Engineering and analysis" description="Software development, mathematical modelling, simulation, forecasting, and data analysis." />
        <div className="capability-grid">
          {capabilities.map(([title, text], index) => (
            <article className="capability-card" key={title}>
              <span className="card-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="section-link"><Link href="/capabilities">See capabilities →</Link></div>
      </section>

      <section className="section shell project-feature">
        <div className="project-feature-header">
          <div>
            <p className="eyebrow">Featured project</p>
            <h2>Quantified Systems</h2>
          </div>
          <div className="project-tags">
            <span>Prediction</span><span>Simulation</span><span>Network analysis</span>
          </div>
        </div>
        <div className="project-feature-grid">
          <div>
            <p className="project-lead">
              A software and modelling project for route prediction, forecasting, simulation, and network analysis.
            </p>
            <dl className="project-facts">
              <div><dt>Route prediction</dt><dd>Generate and rank possible routes using graph structure, historical movement, and contextual information.</dd></div>
              <div><dt>Forecasting</dt><dd>Estimate likely outcomes and compare competing scenarios.</dd></div>
              <div><dt>Simulation</dt><dd>Run repeated scenarios under changing assumptions and conditions.</dd></div>
              <div><dt>Network analysis</dt><dd>Map connected systems, dependencies, paths, bottlenecks, and failure points.</dd></div>
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
        <SectionHeading eyebrow="How we build" title="From model to working software" description="Define the system, build the model, implement it, test it, measure performance, and ship the result." />
        <ProcessDiagram />
      </section>

      <section className="section shell future-block">
        <p className="eyebrow">Projects</p>
        <h2>New software and research projects will be added as they are developed.</h2>
        <Link href="/projects">View all →</Link>
      </section>
    </>
  );
}
