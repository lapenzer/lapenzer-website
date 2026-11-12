import { useMemo, useState } from "react";
import {
  Activity,
  Beaker,
  Play,
  Download,
  Info,
  TrendingUp,
  RefreshCw,
  Check,
  Square,
} from "lucide-react";
import {
  Analysis,
  View,
  Config,
  ExperimentSpec,
  ExperimentResult,
  Event,
} from "../engine/types";
import Chart from "./Chart";
import { csv, download } from "./exports";
export const metricLabel: Record<string, string> = {
  density: "Network density",
  polarization: "Opinion variance",
  isolation: "Isolated agents",
  cooperation: "Cooperation rate",
  meanTrust: "Mean trust",
  averageDegree: "Average degree",
  conflict: "Conflict rate",
  informed: "Information exposure",
};
export function Statistics({
  view,
  analysis,
  onAnalyze,
  busy,
  comparison,
}: {
  view: View;
  analysis: Analysis | null;
  onAnalyze: () => void;
  busy: boolean;
  comparison: View["metrics"] | null;
}) {
  const [metric, setMetric] = useState("density");
  const s = analysis?.summary;
  const cards = [
    ["clustering", "Mean clustering"],
    ["modularity", "Community modularity"],
    ["components", "Weak components"],
    ["averagePath", "Mean reachable path"],
    ["assortativity", "Degree assortativity"],
    ["gini", "Degree inequality"],
    ["reciprocity", "Reciprocity"],
    ["detectedCommunities", "Detected communities"],
    ["transitivity", "Global transitivity"],
    ["segregation", "Affiliation segregation"],
    ["diameter", "Global diameter"],
    ["reachableDiameter", "Max reachable distance"],
  ];
  const lines = useMemo(
    () => [
      {
        x: view.metrics.map((m) => m.tick),
        y: view.metrics.map((m) => (m as any)[metric]),
        type: "scatter",
        mode: "lines",
        line: { color: "#62dfbc", width: 2 },
        fill: "tozeroy",
        fillcolor: "#62dfbc0c",
        name: "Current run",
      },
      ...(comparison
        ? [
            {
              x: comparison.map((m) => m.tick),
              y: comparison.map((m) => (m as any)[metric]),
              type: "scatter",
              mode: "lines",
              line: { color: "#aa8bf4", width: 1.5, dash: "dot" },
              name: "Comparison run",
            },
          ]
        : []),
    ],
    [view.metrics, comparison, metric],
  );
  return (
    <div className="research-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RESEARCH ANALYTICS</span>
          <h2>Measure the structure.</h2>
          <p>Live trajectories and network science at step {view.tick}.</p>
        </div>
        <button
          className="button secondary"
          disabled={busy}
          onClick={onAnalyze}
        >
          <RefreshCw size={14} className={busy ? "spin" : ""} />
          {busy ? "Computing…" : "Compute network metrics"}
        </button>
      </div>
      <div className="analytics-grid">
        <div className="chart-card wide">
          <div className="card-heading">
            <h3>
              <Activity size={15} /> Network evolution
            </h3>
            <select
              aria-label="Time series metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              {Object.entries(metricLabel).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <Chart
            data={lines}
            layout={{
              showlegend: !!comparison,
              legend: { orientation: "h", y: 1.15 },
              yaxis: {
                gridcolor: "#202c3f",
                title: { text: metricLabel[metric], font: { size: 11 } },
              },
              xaxis: {
                gridcolor: "#202c3f",
                title: { text: "Simulation step", font: { size: 11 } },
              },
            }}
            height={290}
          />
        </div>
        <div className="chart-card">
          <div className="card-heading">
            <h3>Degree distribution</h3>
            <span className="tiny-tag">
              {analysis ? "FULL GRAPH" : "SAMPLED VIEW"}
            </span>
          </div>
          <Chart
            data={[
              {
                x: analysis?.degrees ?? view.agents.map((a) => a.degree),
                type: "histogram",
                marker: {
                  color: "#9d8bf2",
                  line: { color: "#101827", width: 1 },
                },
                xbins: { size: 1 },
              },
            ]}
            layout={{
              xaxis: { title: "Degree", gridcolor: "#202c3f" },
              yaxis: { title: "Agents", gridcolor: "#202c3f" },
            }}
          />
        </div>
        <div className="chart-card">
          <div className="card-heading">
            <h3>Community size</h3>
            <span className="tiny-tag">LABEL PROPAGATION</span>
          </div>
          {analysis ? (
            <Chart
              data={[
                {
                  x: analysis.communitySizes
                    .slice(0, 30)
                    .map((_, i) => "C" + (i + 1)),
                  y: analysis.communitySizes.slice(0, 30),
                  type: "bar",
                  marker: { color: "#62dfbc" },
                },
              ]}
              layout={{ yaxis: { title: "Agents", gridcolor: "#202c3f" } }}
            />
          ) : (
            <div className="chart-empty">
              <Beaker size={28} />
              <p>Compute network metrics to detect communities.</p>
            </div>
          )}
        </div>
      </div>
      <div className="metric-grid">
        {cards.map(([key, label]) => (
          <div className="metric-cell" key={key}>
            <span>{label}</span>
            <strong>
              {!s
                ? "—"
                : s[key] === null
                  ? "Undefined"
                  : Number.isInteger(s[key])
                    ? s[key]
                    : s[key]?.toFixed(4)}
            </strong>
            {key === "diameter" && s?.diameter === null && (
              <small>Disconnected or sampled</small>
            )}
          </div>
        ))}
      </div>
      {analysis && (
        <>
          <div className="chart-card">
            <div className="card-heading">
              <h3>
                <TrendingUp size={15} /> Influential agents
              </h3>
              <span className="muted">Top 200 by PageRank</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Degree</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>PageRank</th>
                    <th>Betweenness</th>
                    <th>Harmonic closeness</th>
                    <th>Eigenvector</th>
                    <th>Community</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.centrality.slice(0, 20).map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.name}
                        <small> #{a.id}</small>
                      </td>
                      <td>{a.degree}</td>
                      <td>{a.inDegree}</td>
                      <td>{a.outDegree}</td>
                      <td>{a.pagerank.toFixed(5)}</td>
                      <td>{a.betweenness.toFixed(5)}</td>
                      <td>{a.closeness.toFixed(4)}</td>
                      <td>{a.eigenvector.toFixed(4)}</td>
                      <td>C{a.community + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="text-button"
              onClick={() =>
                download(
                  "aisnl-centrality.csv",
                  csv(analysis.centrality),
                  "text/csv",
                )
              }
            >
              Export centrality table <Download size={12} />
            </button>
          </div>
          <div className="method-note">
            <Info size={16} />
            <div>
              <b>Metric definitions & computation</b>
              {Object.values(analysis.method).map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export function Experiments({
  config,
  result,
  onRun,
  onCancel,
  progress,
  running,
  serverAvailable,
}: {
  config: Config;
  result: ExperimentResult | null;
  onRun: (s: ExperimentSpec) => void;
  onCancel: () => void;
  progress: { done: number; total: number } | null;
  running: boolean;
  serverAvailable: boolean;
}) {
  const [spec, setSpec] = useState<ExperimentSpec>({
      variable: "agreeableness",
      values: [0.2, 0.5, 0.8],
      replications: 10,
      steps: 60,
      outcome: "density",
      seed: "experiment-42",
    }),
    [levels, setLevels] = useState("0.2, 0.5, 0.8");
  const set = <K extends keyof ExperimentSpec>(k: K, v: ExperimentSpec[K]) =>
    setSpec({ ...spec, [k]: v });
  return (
    <div className="research-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">EXPERIMENTAL LABORATORY</span>
          <h2>Turn a question into evidence.</h2>
          <p>
            Compare parameter levels across independent simulation replications.
          </p>
        </div>
        <span className="mode-tag">
          <span /> STATISTICAL MODE
        </span>
      </div>
      <div className="experiment-layout">
        <div className="chart-card experiment-config">
          <div className="card-heading">
            <h3>
              <Beaker size={15} /> Experiment design
            </h3>
          </div>
          <label className="field-label">
            Independent variable
            <select
              value={spec.variable}
              onChange={(e) =>
                set("variable", e.target.value as ExperimentSpec["variable"])
              }
            >
              <option value="agreeableness">Mean agreeableness</option>
              <option value="aggression">Mean aggression</option>
              <option value="homophily">Homophily preference</option>
              <option value="exploration">Exploration probability</option>
            </select>
          </label>
          <label className="field-label">
            Parameter levels (comma separated)
            <input value={levels} onChange={(e) => setLevels(e.target.value)} />
          </label>
          <label className="field-label">
            Outcome metric
            <select
              value={spec.outcome}
              onChange={(e) =>
                set("outcome", e.target.value as ExperimentSpec["outcome"])
              }
            >
              {[
                "density",
                "polarization",
                "isolation",
                "cooperation",
                "meanTrust",
              ].map((v) => (
                <option value={v} key={v}>
                  {metricLabel[v]}
                </option>
              ))}
            </select>
          </label>
          <div className="two-fields">
            <label className="field-label">
              Replications / level
              <input
                type="number"
                min="3"
                max="100"
                value={spec.replications}
                onChange={(e) => set("replications", +e.target.value)}
              />
            </label>
            <label className="field-label">
              Steps / run
              <input
                type="number"
                min="1"
                max="2000"
                value={spec.steps}
                onChange={(e) => set("steps", +e.target.value)}
              />
            </label>
          </div>
          <label className="field-label">
            Experiment seed
            <input
              value={spec.seed}
              onChange={(e) => set("seed", e.target.value)}
            />
          </label>
          <div className="experiment-baseline">
            <span>Controlled conditions</span>
            <p>
              {config.n} agents · {config.topology} topology
              <br />
              Trait SD {config.sd} ·{" "}
              {config.directed ? "Directed" : "Undirected"} graph
            </p>
          </div>
          <button
            className="button primary full"
            disabled={running}
            onClick={() =>
              onRun({
                ...spec,
                values: levels.split(",").map((s) => Number(s.trim())),
              })
            }
          >
            <Play size={14} />
            Run experiment
          </button>
          {running && (
            <>
              <div className="progress-track">
                <i
                  style={{
                    width: `${progress ? (progress.done / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="field-description">
                {progress?.done ?? 0} / {progress?.total ?? "…"} replications
                complete
              </p>
              <button className="button secondary full" onClick={onCancel}>
                <Square size={12} />
                Cancel experiment
              </button>
            </>
          )}
          <p className="simulation-note">
            Sweep changes apply to new populations. The current live network is
            preserved.
          </p>
        </div>
        <div className="experiment-results">
          {result ? (
            <>
              <div className="chart-card">
                <div className="card-heading">
                  <h3>
                    <Check size={15} className="green" /> Replication results
                  </h3>
                  <span className="tiny-tag">{result.rows.length} RUNS</span>
                </div>
                <p className="chart-subtitle">
                  {metricLabel[result.spec.outcome]} by {result.spec.variable}.
                  Error bars: exploratory 95% bootstrap intervals.
                </p>
                <Chart
                  data={[
                    {
                      x: result.groups.map((g) => g.level),
                      y: result.groups.map((g) => g.mean),
                      type: "scatter",
                      mode: "markers+lines",
                      marker: { color: "#62dfbc", size: 9 },
                      line: { color: "#62dfbc", width: 1.5 },
                      error_y: {
                        type: "data",
                        symmetric: false,
                        array: result.groups.map((g) => g.hi - g.mean),
                        arrayminus: result.groups.map((g) => g.mean - g.lo),
                        color: "#62dfbc",
                        thickness: 1.5,
                        width: 6,
                      },
                    },
                  ]}
                  height={310}
                  layout={{
                    xaxis: {
                      title: result.spec.variable,
                      gridcolor: "#202c3f",
                    },
                    yaxis: {
                      title: metricLabel[result.spec.outcome],
                      gridcolor: "#202c3f",
                    },
                  }}
                />
                <table>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Runs</th>
                      <th>Mean</th>
                      <th>SD</th>
                      <th>95% CI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.groups.map((g) => (
                      <tr key={g.level}>
                        <td>{g.level}</td>
                        <td>{g.n}</td>
                        <td>{g.mean.toFixed(5)}</td>
                        <td>{g.sd.toFixed(5)}</td>
                        <td>
                          [{g.lo.toFixed(5)}, {g.hi.toFixed(5)}]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="chart-card">
                <div className="card-heading">
                  <h3>Paired comparisons vs {result.spec.values[0]}</h3>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Level</th>
                        <th>Mean difference</th>
                        <th>95% CI</th>
                        <th>Permutation p</th>
                        <th>Holm p</th>
                        <th>Paired effect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparisons.map((c) => (
                        <tr key={c.level}>
                          <td>{c.level}</td>
                          <td>{c.difference.toFixed(5)}</td>
                          <td>
                            [{c.lo.toFixed(5)}, {c.hi.toFixed(5)}]
                          </td>
                          <td>{c.p.toFixed(4)}</td>
                          <td>{c.adjustedP.toFixed(4)}</td>
                          <td>{c.effect?.toFixed(3) ?? "Undefined"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="button-row">
                  <button
                    className="button secondary"
                    onClick={() =>
                      download(
                        "aisnl-experiment.json",
                        JSON.stringify(result, null, 2),
                      )
                    }
                  >
                    <Download size={13} />
                    Experiment JSON
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      download(
                        "aisnl-replications.csv",
                        csv(
                          result.rows.map((r) => ({
                            level: r.level,
                            replicate: r.replicate,
                            seed: r.seed,
                            outcome: r.value,
                            ...r.metrics,
                          })),
                        ),
                        "text/csv",
                      )
                    }
                  >
                    <Download size={13} />
                    Replication CSV
                  </button>
                </div>
              </div>
              <div className="method-note">
                <Info size={17} />
                <p>{result.method}</p>
              </div>
              <AdvancedStatistics result={result} available={serverAvailable} />
            </>
          ) : (
            <div className="experiment-welcome">
              <div className="experiment-visual">
                <span />
                <span />
                <span />
                <TrendingUp size={44} />
              </div>
              <span className="eyebrow">A QUESTION TO START WITH</span>
              <h3>
                Do agreeable populations
                <br />
                form denser networks?
              </h3>
              <p>
                Sweep agreeableness from 0.2 to 0.8 while holding other
                conditions constant. Every point summarizes independent runs.
              </p>
              <div className="research-principle">
                <Info size={15} />
                <span>
                  The unit of inference is a simulation run. Agents within one
                  network are dependent observations.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export function Events({
  events,
  onFullJournal,
}: {
  events: Event[];
  onFullJournal: () => void;
}) {
  const [query, setQuery] = useState(""),
    [action, setAction] = useState("all"),
    [sentiment, setSentiment] = useState("all"),
    [start, setStart] = useState(0),
    [end, setEnd] = useState("");
  const rows = events
    .filter(
      (e) =>
        (action === "all" || e.action === action) &&
        (sentiment === "all" ||
          (sentiment === "positive" && e.sentiment > 0) ||
          (sentiment === "negative" && e.sentiment < 0) ||
          (sentiment === "neutral" && e.sentiment === 0)) &&
        e.tick >= start &&
        (!end || e.tick <= +end) &&
        (!query ||
          `${e.source} ${e.target} ${e.text}`
            .toLowerCase()
            .includes(query.toLowerCase())),
    )
    .slice(-500)
    .reverse();
  return (
    <div className="research-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OBSERVATION JOURNAL</span>
          <h2>Every interaction leaves a trace.</h2>
          <p>
            Inspect communication, relationship updates and documented
            interventions.
          </p>
        </div>
        <button className="button secondary" onClick={onFullJournal}>
          <RefreshCw size={14} />
          Read complete local journal
        </button>
      </div>
      <div className="event-filters">
        <input
          placeholder="Search text or agent ID…"
          aria-label="Search event log"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filter interaction type"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="all">All interactions</option>
          {[
            "cooperate",
            "argue",
            "deceive",
            "persuade",
            "gossip",
            "post",
            "observe",
            "reject",
            "intervention",
          ].map((v) => (
            <option value={v} key={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter sentiment"
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
        >
          <option value="all">All sentiment</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="neutral">Neutral</option>
        </select>
        <input
          type="number"
          aria-label="Minimum event step"
          min="0"
          value={start}
          onChange={(e) => setStart(+e.target.value)}
        />
        <input
          type="number"
          aria-label="Maximum event step"
          placeholder="Last step"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <p className="field-description">
        {events.length.toLocaleString()} events available · Showing up to 500
        matching events, newest first. Statistical-mode language uses
        action-specific templates.
      </p>
      <div className="event-ledger">
        {rows.map((e) => (
          <div className="ledger-row" key={e.id}>
            <div className="ledger-time">
              <strong>{String(e.tick).padStart(4, "0")}</strong>
              <span>#{e.id}</span>
            </div>
            <span className={"action-tag " + e.action}>{e.action}</span>
            <div className="ledger-message">
              <small>
                Agent {e.source} → {e.target}{" "}
                <span>
                  {" "}
                  · Δ {e.delta >= 0 ? "+" : ""}
                  {e.delta.toFixed(3)}
                </span>
              </small>
              <p>{e.text}</p>
              <details>
                <summary>
                  Recorded decision inputs{" "}
                  {e.cognition ? "· language model output" : ""}
                </summary>
                <pre>
                  {JSON.stringify(
                    {
                      trace: e.trace,
                      ...(e.cognition ? { cognition: e.cognition } : {}),
                    },
                    null,
                    2,
                  )}
                </pre>
              </details>
            </div>
            <span
              className={`sentiment-indicator ${e.sentiment < 0 ? "negative" : ""}`}
            >
              {e.sentiment.toFixed(2)}
            </span>
          </div>
        ))}
        {!rows.length && (
          <div className="chart-empty">
            <Activity size={26} />
            <p>
              No matching events. Advance the simulation to observe
              interactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdvancedStatistics({
  result,
  available,
}: {
  result: ExperimentResult;
  available: boolean;
}) {
  const [method, setMethod] = useState("descriptive"),
    [data, setData] = useState<any>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const run = async () => {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/statistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit: "simulation_run",
          method,
          rows: result.rows.map((r) => ({
            level: r.level,
            replicate: r.replicate,
            value: r.value,
          })),
          seed: 17,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw Error(json.detail ?? "Analysis failed.");
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="chart-card" style={{ marginTop: 20 }}>
      <div className="card-heading">
        <h3>
          <Beaker size={15} />
          Advanced statistical models
        </h3>
        <span className="tiny-tag">LOCAL SERVER</span>
      </div>
      <p className="field-description">
        {available
          ? "Run-level models with paired replications and explicit assumptions. Logistic regression requires binary run outcomes."
          : "Start the included local server to use repeated-measures ANOVA, clustered regression and additional resampling methods."}
      </p>
      <div className="button-row">
        <select
          aria-label="Advanced statistical method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {[
            { v: "descriptive", l: "Descriptive statistics" },
            { v: "anova", l: "Repeated-measures ANOVA" },
            { v: "linear", l: "Clustered linear regression" },
            { v: "logistic", l: "Clustered logistic regression" },
            { v: "correlation", l: "Correlation & clustered slope" },
            { v: "sensitivity", l: "Linear sensitivity" },
            { v: "bootstrap", l: "Paired bootstrap & permutation" },
          ].map((m) => (
            <option key={m.v} value={m.v}>
              {m.l}
            </option>
          ))}
        </select>
        <button
          className="button secondary"
          disabled={!available || pending}
          onClick={run}
        >
          {pending ? "Computing…" : "Analyze replications"}
        </button>
      </div>
      {error && (
        <p className="error-text" style={{ marginTop: 12, fontSize: 11 }}>
          {error}
        </p>
      )}
      {data && (
        <>
          <pre className="statistical-output">
            {JSON.stringify(data, null, 2)}
          </pre>
          <button
            className="text-button"
            onClick={() =>
              download(
                "aisnl-statistical-analysis.json",
                JSON.stringify(data, null, 2),
              )
            }
          >
            Export model results
            <Download size={12} />
          </button>
        </>
      )}
    </div>
  );
}
