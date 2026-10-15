import type { Metadata } from "next";
import { NetworkDiagram } from "@/components/NetworkDiagram";

export const metadata: Metadata = {
  title: "Quantified Systems",
  description: "Quantified Systems project record: route prediction, forecasting, simulation, and network analysis.",
};

const methods = [
  ["Weighted graphs", "Locations or states are represented as nodes; possible connections are edges. Weights express cost, likelihood, distance, time, risk, or another route-relevant quantity."],
  ["Shortest-path methods", "Algorithms search the graph for routes that minimize a defined cost function. The cheapest route is not automatically treated as the only plausible route."],
  ["Candidate route generation", "Multiple feasible routes are generated so the system can compare alternatives rather than force one deterministic answer."],
  ["Transition probabilities", "Observed or estimated movement between nodes can be represented as probabilities and used to score route sequences."],
  ["Contextual scoring", "Candidate routes can be re-ranked using constraints and context such as terrain, environmental conditions, or changing network states."],
  ["Neural ranking", "Where applicable, a learned ranking model can combine route features and training examples to order candidates. Its performance must be evaluated separately from deterministic baselines."],
] as const;

export default function QuantifiedSystemsPage() {
  return (
    <div className="shell page-shell">
      <header className="project-detail-header">
        <div>
          <p className="eyebrow">Project 01 · Quantified Systems</p>
          <h1>Route prediction, forecasting, simulation, and network analysis.</h1>
          <p className="page-intro">A research and software project using applied mathematics and software to represent movement, uncertainty, connected systems, and alternative outcomes.</p>
        </div>
        <aside className="status-panel">
          <div><span>Category</span><strong>Research / Software / Mathematical Modelling</strong></div>
          <div><span>Maturity</span><strong>Research + prototype work</strong></div>
          <div><span>External site</span><a href="https://quantifiedsystems.ca" target="_blank" rel="noreferrer">quantifiedsystems.ca ↗</a></div>
        </aside>
      </header>

      <section className="detail-section">
        <p className="eyebrow">Problem</p>
        <h2>Estimate plausible movement through a network when more than one route or future state is possible.</h2>
        <p className="wide-copy">The system is designed around uncertainty. It generates alternatives, assigns scores or probabilities, and records the assumptions that influence the ranking. The output is a set of candidate routes or outcomes rather than an unsupported claim of certainty.</p>
      </section>

      <section className="detail-section two-column-detail">
        <div>
          <p className="eyebrow">Route prediction</p>
          <h2>Represent movement as a graph and rank candidate paths.</h2>
          <p>A graph is a mathematical structure made of nodes and edges. Nodes represent locations or states. Edges represent possible movement or relationships between them.</p>
        </div>
        <NetworkDiagram />
      </section>

      <section className="detail-section">
        <p className="eyebrow">Methods</p>
        <div className="method-grid">
          {methods.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="detail-section triad-grid">
        <article>
          <p className="eyebrow">Forecasting</p>
          <h2>Probabilities over several possible outcomes.</h2>
          <p>Forecasting combines historical data, current information, model assumptions, and uncertainty. Predicted and observed outcomes can then be compared to measure calibration and error.</p>
        </article>
        <article>
          <p className="eyebrow">Simulation</p>
          <h2>Repeated runs under changed or random conditions.</h2>
          <p>Monte Carlo simulation runs a model many times with different random inputs to estimate the range and frequency of possible outcomes.</p>
        </article>
        <article>
          <p className="eyebrow">Network analysis</p>
          <h2>Study dependencies, bottlenecks, and alternatives.</h2>
          <p>Connected systems are represented as nodes and relationships so routes, dependencies, influence, bottlenecks, failure points, and alternative paths can be analysed.</p>
        </article>
      </section>

      <section className="detail-section">
        <p className="eyebrow">Evidence and limitations</p>
        <div className="evidence-grid">
          <div><h3>Data used</h3><p>Inputs vary by model and can include historical movement, current information, node and edge behaviour, environmental context, constraints, and synthetic data for controlled tests.</p></div>
          <div><h3>Current results</h3><p>Results should be published only with the exact dataset, test procedure, metric, and model version that produced them. This page intentionally does not present unverified performance numbers.</p></div>
          <div><h3>Limitations</h3><p>Predictions depend on data coverage, changes in the environment, graph construction, model assumptions, candidate generation, and whether validation data represents the conditions being predicted.</p></div>
          <div><h3>Software status</h3><p>Research components and prototypes should be labelled separately from working or production software. No production deployment is claimed here.</p></div>
        </div>
      </section>

      <section className="detail-section">
        <p className="eyebrow">Research record</p>
        <div className="research-record placeholder-record">
          <div><span className="status-chip">Archive structure ready</span><h3>Published papers, frameworks, technical notes, and documented prototypes</h3></div>
          <p>Items will be listed with an explicit maturity label: theory, prototype, tested prototype, working software, or production system.</p>
        </div>
      </section>
    </div>
  );
}
