import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Capabilities",
  description: "Lapenzer capabilities across software, mathematical modelling, data analysis, simulation, and forecasting.",
};

const modelMethods = [
  ["Graph theory", "Represents entities as nodes and relationships as edges so routes, dependencies, connectivity, and network structure can be measured."],
  ["Optimization", "Searches for decisions or configurations that best satisfy a defined objective while respecting constraints."],
  ["Probability models", "Represent uncertainty directly rather than reducing uncertain outcomes to a single deterministic answer."],
  ["Markov models", "Represent transitions between states where the next state is modelled from the current state and transition structure."],
  ["Monte Carlo simulation", "Runs a model repeatedly with varied random inputs to estimate the distribution and frequency of possible outcomes."],
  ["Regression", "Estimates relationships between variables and can be used for explanation, prediction, and statistical testing when assumptions are appropriate."],
  ["Scenario analysis", "Compares model outputs under different assumptions, constraints, resources, probabilities, or environmental conditions."],
] as const;

export default function CapabilitiesPage() {
  return (
    <div className="shell page-shell">
      <header className="page-header">
        <p className="eyebrow">Capabilities</p>
        <h1>Software and mathematical methods connected to testable outputs.</h1>
        <p>Lapenzer builds the software needed to operate models, process data, run controlled tests, and expose how results were produced.</p>
      </header>

      <section className="capability-detail-block">
        <div><p className="eyebrow">01 · Software</p><h2>Applications, interfaces, pipelines, and research tooling.</h2></div>
        <div className="bullet-columns">
          <ul><li>Data-processing pipelines</li><li>Analytical web applications</li><li>Research interfaces</li></ul>
          <ul><li>Simulation tools</li><li>Dashboards based on real project outputs</li><li>Software for historical or synthetic model testing</li></ul>
        </div>
      </section>

      <section className="capability-detail-block">
        <div><p className="eyebrow">02 · Mathematical modelling</p><h2>Represent a real system with variables, constraints, probabilities, relationships, and objectives.</h2></div>
        <div className="method-grid compact-methods">
          {modelMethods.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="capability-detail-block two-up">
        <article><p className="eyebrow">03 · Data analysis</p><h2>Use data to test assumptions and measure model performance.</h2><p>Work includes data cleaning, exploratory analysis, statistical analysis, model evaluation, visualization, historical comparison, and validation.</p></article>
        <article><p className="eyebrow">04 · Simulation</p><h2>Change conditions and observe how system behaviour changes.</h2><p>Scenarios can vary weather conditions, route constraints, resource levels, probabilities, network states, or strategic assumptions.</p></article>
      </section>

      <section className="capability-detail-block">
        <div><p className="eyebrow">05 · Forecasting</p><h2>Estimate possible future outcomes without hiding uncertainty.</h2></div>
        <p className="wide-copy">Forecasting combines historical information, current conditions, mathematical models, and uncertainty. Outputs should include probabilities, ranges, calibration, confidence where statistically justified, and comparisons between predicted and observed outcomes rather than presenting a forecast as certainty.</p>
      </section>
    </div>
  );
}
