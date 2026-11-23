"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  generateHiddenTruth,
  generateRandomGraph,
  makeDomainAdapterV4,
  makePredictionSnapshot,
  mapMatchObservation,
  measuredVsExpected,
  nodeAttractiveness,
  pickIndependentDestinations,
  syntheticTrainingSet,
  trainModelSuite,
  type CandidateV4,
  type GraphGenerationConfig,
  type GraphTopology,
  type ModelSuite,
  type Observation,
  type ResidualRecord,
  type RpaGraph,
  type StoredPrediction,
} from "@/lib/rpaFrameworkV4";
import styles from "./RPADashboard.module.css";

type Tab = "Network" | "Statistics" | "Experiments" | "Events" | "Data & exports";
type Settings = { nodes: number; density: number; seed: number; topology: GraphTopology };
type Run = { history: string[]; observations: Observation[]; snapshots: StoredPrediction[]; residuals: ResidualRecord[]; complete: boolean };
type Saved = { id: string; title: string; savedAt: string; settings: Settings; run: Run };
const STORAGE_KEY = "lapenzer-rpa-dashboard-runs-v1";
const initialSettings: Settings = { nodes: 20, density: 0.24, seed: 271828, topology: "connected" };
const emptyRun = (): Run => ({ history: [], observations: [], snapshots: [], residuals: [], complete: false });
const tabs: Tab[] = ["Network", "Statistics", "Experiments", "Events", "Data & exports"];
const topologyChoices: GraphTopology[] = ["connected", "grid", "small-world", "geometric", "erdos-renyi", "scale-free", "tree", "dag", "layered"];
const accents = ["#60dfc9", "#82c4ff", "#ab9af5", "#f3b966"];

function graphConfig(settings: Settings): GraphGenerationConfig {
  return { targetNodes: settings.nodes, userMaxNodes: 40, systemCap: 80, density: settings.density, topology: settings.topology, direction: "bidirectional", seed: settings.seed, ensureConnected: true, nodeWeightDistribution: "lognormal", edgeWeightDistribution: "uniform", domain: "road" };
}

function graphPositions(graph: RpaGraph): Map<string, [number, number]> {
  const minX = Math.min(...graph.nodes.map(node => node.x));
  const maxX = Math.max(...graph.nodes.map(node => node.x));
  const minY = Math.min(...graph.nodes.map(node => node.y));
  const maxY = Math.max(...graph.nodes.map(node => node.y));
  return new Map(graph.nodes.map(node => [node.id, [
    54 + (node.x - minX) / Math.max(1e-9, maxX - minX) * 872,
    42 + (node.y - minY) / Math.max(1e-9, maxY - minY) * 486
  ] as [number, number]]));
}

function observationFor(graph: RpaGraph, nodeId: string, index: number): Observation {
  const node = graph.nodes.find(candidate => candidate.id === nodeId);
  if (!node) throw new Error("The observed node was not found in the graph.");
  return { id: "synthetic-observation-" + index + "-" + nodeId, timestamp: 1000000 + index * 1000, x: node.x, y: node.y, accuracyMeters: 4, origin: "synthetic" };
}

function format(value: number | undefined | null, digits = 2): string {
  return value != null && Number.isFinite(value) ? value.toFixed(digits) : "—";
}
function percentage(value: number | undefined | null): string {
  return value != null && Number.isFinite(value) ? (value * 100).toFixed(1) + "%" : "—";
}
function miniTrend(values: number[], color: string) {
  if (values.length < 2) return <span className={styles.noTrend}>Awaiting observations</span>;
  const min = Math.min(...values), max = Math.max(...values);
  const coords = values.map((value, i) => (i * 100 / (values.length - 1)).toFixed(1) + "," + (31 - (value - min) / Math.max(1e-9, max - min) * 25).toFixed(1)).join(" ");
  return <svg viewBox="0 0 100 38" aria-hidden="true" preserveAspectRatio="none"><polyline fill="none" stroke={color} strokeWidth="1.7" vectorEffect="non-scaling-stroke" points={coords} /></svg>;
}

function exportFile(filename: string, text: string, mime = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const element = document.createElement("a");
  element.href = url;
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  element.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function RPADashboard() {
  const [draft, setDraft] = useState<Settings>(initialSettings);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [graph, setGraph] = useState<RpaGraph>(() => generateRandomGraph(graphConfig(initialSettings)));
  const [suite, setSuite] = useState<ModelSuite | null>(null);
  const [run, setRun] = useState<Run>(() => emptyRun());
  const runRef = useRef<Run>(emptyRun());
  const truthRef = useRef<{ destination: string; path: string[] } | null>(null);
  const [running, setRunning] = useState(false);
  const [training, setTraining] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<Tab>("Network");
  const [showSetup, setShowSetup] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [notice, setNotice] = useState("Generate a graph, then train and start the RPA simulation.");
  const [savedRuns, setSavedRuns] = useState<Saved[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [focusedStep, setFocusedStep] = useState<number | null>(null);

  const saveRunState = useCallback((next: Run) => {
    runRef.current = next;
    setRun(next);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const entries = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(entries)) setSavedRuns(entries.slice(0, 8));
      } catch { setSavedRuns([]); }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const resetRun = useCallback(() => {
    saveRunState(emptyRun());
    truthRef.current = null;
    setRunning(false);
    setFocusedStep(null);
  }, [saveRunState]);

  const regenerate = () => {
    resetRun();
    const next = generateRandomGraph(graphConfig(draft));
    setSettings(draft);
    setGraph(next);
    setSuite(null);
    setSelectedNode(null);
    setNotice("New deterministic graph ready. Train RPA to calculate probabilities.");
    setTab("Network");
  };

  const beginSimulation = useCallback((trained: ModelSuite) => {
    const firstId = graph.nodes[0]?.id;
    if (!firstId) throw new Error("The graph has no starting state.");
    const truth = generateHiddenTruth(graph, firstId, settings.seed + 2003);
    truthRef.current = truth;
    const observation = observationFor(graph, firstId, 0);
    const state = mapMatchObservation(graph, observation);
    const snapshot = makePredictionSnapshot({
      graph, suite: trained, history: [firstId], observations: [observation], stateHypotheses: state,
      context: { stress: 0.45, nowDay: 999 }, seed: settings.seed + 3001
    });
    saveRunState({ history: [firstId], observations: [observation], snapshots: [snapshot], residuals: [], complete: truth.path.length <= 1 });
    setFocusedStep(null);
    setRunning(truth.path.length > 1);
    setSelectedNode(firstId);
    setNotice("RPA trained on synthetic trajectories. Predictions are recorded before each outcome is revealed.");
  }, [graph, settings.seed, saveRunState]);

  const start = () => {
    if (training) return;
    resetRun();
    setTraining(true);
    setNotice("Training conditional-logit, GBM and neural RPA models on synthetic trajectories...");
    window.setTimeout(() => {
      try {
        const trajectories = syntheticTrainingSet(graph, Math.max(360, graph.nodes.length * 32), graph.seed + 7);
        const destinations = pickIndependentDestinations(graph, Math.min(6, Math.max(3, Math.ceil(graph.nodes.length / 4))));
        const nextSuite = trainModelSuite(graph, trajectories, destinations, makeDomainAdapterV4("road"), graph.seed + 19);
        setSuite(nextSuite);
        beginSimulation(nextSuite);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Model training failed.");
      } finally {
        setTraining(false);
      }
    }, 25);
  };

  const advance = useCallback(() => {
    const existing = runRef.current;
    const truth = truthRef.current;
    if (!truth || !suite || existing.complete || !existing.history.length) {
      setRunning(false);
      return;
    }
    const index = existing.history.length;
    if (index >= truth.path.length) {
      saveRunState({ ...existing, complete: true });
      setRunning(false);
      return;
    }
    const observedNext = truth.path[index];
    const previous = existing.snapshots[existing.snapshots.length - 1];
    const nextHistory = [...existing.history, observedNext];
    const nextObservation = observationFor(graph, observedNext, index);
    const observations = [...existing.observations, nextObservation];
    const residuals = previous ? [...existing.residuals, measuredVsExpected(previous, observedNext)] : existing.residuals;
    const complete = index >= truth.path.length - 1;
    const nextSnapshots = [...existing.snapshots];
    if (!complete) {
      const state = mapMatchObservation(graph, nextObservation, existing.observations[existing.observations.length - 1]);
      nextSnapshots.push(makePredictionSnapshot({
        graph, suite, history: nextHistory, observations, stateHypotheses: state,
        context: { stress: 0.45, nowDay: 999 + index * 0.001 }, seed: settings.seed + 3001 + index
      }));
    }
    saveRunState({ history: nextHistory, observations, snapshots: nextSnapshots, residuals, complete });
    if (complete) { setRunning(false); setNotice("Run complete. Actual outcomes can now be compared with stored predictions."); }
  }, [graph, suite, settings.seed, saveRunState]);

  useEffect(() => {
    if (!running || training) return;
    const id = window.setInterval(advance, 1250 / speed);
    return () => window.clearInterval(id);
  }, [running, training, speed, advance]);

  const latestIndex = focusedStep == null ? run.snapshots.length - 1 : Math.min(focusedStep, run.snapshots.length - 1);
  const latest = latestIndex >= 0 ? run.snapshots[latestIndex] : undefined;
  const currentId = run.history.length ? run.history[Math.min(latestIndex >= 0 ? latestIndex : run.history.length - 1, run.history.length - 1)] : graph.nodes[0]?.id;
  const positions = useMemo(() => graphPositions(graph), [graph]);
  const selected = graph.nodes.find(node => node.id === selectedNode) ?? graph.nodes.find(node => node.id === currentId);
  const selectedCandidate: CandidateV4 | undefined = latest?.candidates.find(candidate => candidate.node === selected?.id);
  const lastResidual = run.residuals[run.residuals.length - 1];
  const meanBrier = run.residuals.length ? run.residuals.reduce((sum, item) => sum + item.brier, 0) / run.residuals.length : undefined;
  const activeModel = suite?.champion ?? latest?.candidates[0]?.champion;
  const nll = suite && activeModel && activeModel !== "analytical" ? suite.validationNll[activeModel] : undefined;
  const highlightedEdges = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 1; i < run.history.length; i++) ids.add(run.history[i - 1] + ">" + run.history[i]);
    return ids;
  }, [run.history]);

  const saveRun = () => {
    const saved: Saved = {
      id: String(Date.now()), title: "RPA simulation " + new Date().toLocaleString(),
      savedAt: new Date().toISOString(), settings, run
    };
    const next = [saved, ...savedRuns].slice(0, 8);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedRuns(next);
      setNotice("Simulation saved in this browser.");
    } catch {
      setNotice("Local storage is unavailable. Use JSON export instead.");
    }
  };

  const restore = (saved: Saved) => {
    resetRun();
    setSettings(saved.settings);
    setDraft(saved.settings);
    const restoredGraph = generateRandomGraph(graphConfig(saved.settings));
    setGraph(restoredGraph);
    setSuite(null);
    saveRunState(saved.run);
    setShowSaved(false);
    setFocusedStep(null);
    setSelectedNode(saved.run.history[saved.run.history.length - 1] ?? restoredGraph.nodes[0]?.id);
    setNotice("Saved run loaded for inspection. Start a new simulation to retrain the model.");
    setTab("Network");
  };

  const exportRun = () => exportFile("lapenzer-rpa-synthetic-run.json", JSON.stringify({
    source: "LAPENZER RPA V4 research laboratory", synthetic: true,
    interpretation: "Experimental model shares on a generated graph. Neither calibrated probability nor operational accuracy is claimed.",
    settings, graph, training: suite ? { champion: suite.champion, validationNll: suite.validationNll, featureSchemaVersion: suite.featureSchemaVersion, seed: suite.seed } : null,
    observations: run.observations, history: run.history, predictions: run.snapshots, residuals: run.residuals
  }, null, 2));

  const metrics = [
    { title: "Graph nodes", value: String(graph.nodes.length), sub: "synthetic states", color: accents[0], trend: [] as number[] },
    { title: "Relationships", value: String(graph.edges.length), sub: "directed edges", color: accents[2], trend: [] as number[] },
    { title: "Feasible actions", value: String(latest?.candidates.length ?? 0), sub: "current prediction", color: accents[1], trend: run.snapshots.map(item => item.candidates.length) },
    { title: "Confidence", value: percentage(latest?.confidence), sub: "model output, uncalibrated", color: accents[3], trend: run.snapshots.map(item => item.confidence) },
    { title: "Mean Brier", value: format(meanBrier, 3), sub: "revealed outcomes", color: accents[0], trend: run.residuals.map(item => item.brier) },
  ];

  const bars = latest?.candidates.slice().sort((a, b) => b.probabilities.champion - a.probabilities.champion) ?? [];

  return <div className={styles.lab}>
    <div className={styles.toolbar}>
      <div className={styles.tabs} role="tablist" aria-label="RPA laboratory views">
        {tabs.map(item => <button type="button" key={item} role="tab" aria-selected={tab === item} className={tab === item ? styles.activeTab : ""} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      <div className={styles.topActions}>
        <button type="button" onClick={() => setShowSaved(value => !value)} aria-expanded={showSaved}>Saved runs ({savedRuns.length})</button>
        <button type="button" className={styles.save} onClick={saveRun}>Save simulation</button>
      </div>
    </div>
    {showSaved && <section className={styles.savedPanel} aria-label="Saved simulations">
      <strong>Saved simulations</strong>
      {savedRuns.length === 0 ? <p>No saved simulations in this browser.</p> : savedRuns.map(item => <button key={item.id} type="button" onClick={() => restore(item)}><span>{item.title}</span><small>{item.run.snapshots.length} predictions · {item.settings.nodes} nodes</small></button>)}
      <button type="button" onClick={() => setShowSaved(false)}>Close</button>
    </section>}
    <div className={styles.heading}>
      <div><p className={styles.eyebrow}>LABORATORY / RPA INTELLIGENCE / WORKSPACE 01</p><div className={styles.titleLine}><h1>Route Prediction Laboratory</h1><span className={styles.runningFlag}><i />{training ? "TRAINING" : running ? "SIMULATION RUNNING" : run.complete ? "RUN COMPLETE" : "READY"}</span></div><p>Graph-constrained predictions generated by LAPENZER&apos;s RPA V4 mathematical engine.</p></div>
      <div className={styles.headingActions}><button type="button" onClick={() => setShowSetup(value => !value)}>{showSetup ? "Hide setup" : "Show setup"}</button><Link href="/technology/route-prediction/simulator">Advanced RPA workspace ↗</Link></div>
    </div>
    <div className={styles.metrics}>
      {metrics.map(item => <div key={item.title} className={styles.metric}><div className={styles.metricHead}>{item.title}<i style={{ background: item.color }} /></div><div className={styles.metricMiddle}><strong>{item.value}</strong>{miniTrend(item.trend, item.color)}</div><small>{item.sub}</small></div>)}
    </div>
    <div className={styles.workspace} style={{ gridTemplateColumns: showSetup ? undefined : "minmax(0,1fr) 278px" }}>
      {showSetup && <aside className={styles.configPanel}>
        <header className={styles.panelHead}><strong>Configuration</strong><span>SETUP</span></header>
        <div className={styles.configBody}>
          <p className={styles.sectionName}>Population & topology</p>
          <label>Number of graph nodes <input type="number" min={8} max={40} value={draft.nodes} onChange={event => setDraft(value => ({ ...value, nodes: Math.max(8, Math.min(40, Number(event.target.value) || 8)) }))} /></label>
          <label>Random seed <input type="number" value={draft.seed} onChange={event => setDraft(value => ({ ...value, seed: Number(event.target.value) || 0 }))} /></label>
          <label>Network topology <select value={draft.topology} onChange={event => setDraft(value => ({ ...value, topology: event.target.value as GraphTopology }))}>{topologyChoices.map(option => <option key={option} value={option}>{option.replaceAll("-", " ")}</option>)}</select></label>
          <label>Edge density <span>{draft.density.toFixed(2)}</span><input type="range" min={0.08} max={0.5} step={0.01} value={draft.density} onChange={event => setDraft(value => ({ ...value, density: Number(event.target.value) }))} /></label>
          <div className={styles.separator} />
          <p className={styles.sectionName}>Mathematical engine</p>
          <dl className={styles.configFacts}><div><dt>Model</dt><dd>{activeModel?.replaceAll("_", " ") ?? "Not trained"}</dd></div><div><dt>Feature schema</dt><dd>18 + V4 context</dd></div><div><dt>Validation NLL</dt><dd>{format(nll, 4)}</dd></div><div><dt>Domain</dt><dd>Road / synthetic</dd></div></dl>
          <button className={styles.generate} type="button" onClick={regenerate} disabled={training}>Generate network ↗</button>
          <p className={styles.privacy}>Seeded, reproducible graph. No external location data or tracking.</p>
        </div>
      </aside>}
      <section className={styles.center}>
        {tab === "Network" && <>
          <div className={styles.panelHead}><strong>Graph prediction network</strong><span>LIVE MATHEMATICS</span><span className={styles.panelHeadEnd}>Colour by quadrant · {graph.source}</span></div>
          <div className={styles.networkCanvas}>
            <div className={styles.canvasTop}><span>RPA V4 / {graph.graphId}</span><span>{latest ? "Snapshot " + (latestIndex + 1) + " / " + run.snapshots.length : "No prediction recorded"}</span></div>
            <svg viewBox="0 0 980 572" role="img" aria-label="Interactive weighted directed graph showing observed movements, feasible successors and mathematical predictions" preserveAspectRatio="xMidYMid meet">
              <defs><pattern id="rpa-dot-grid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".75" fill="#2a3b57" opacity=".65" /></pattern></defs>
              <rect width="980" height="572" fill="url(#rpa-dot-grid)" />
              {graph.edges.map(edge => {
                const from = positions.get(edge.from), to = positions.get(edge.to);
                if (!from || !to) return null;
                const traversed = highlightedEdges.has(edge.from + ">" + edge.to);
                const candidate = latest?.candidates.find(item => item.edge.id === edge.id);
                return <line key={edge.id} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
                  stroke={traversed ? "#f3c878" : candidate ? "#67e0d4" : "#455b79"}
                  opacity={traversed ? 0.95 : candidate ? 0.92 : 0.26}
                  strokeWidth={traversed ? 3.5 : candidate ? 1.4 + 5 * candidate.probabilities.champion : 1}
                  strokeLinecap="round" />;
              })}
              {graph.nodes.map(node => {
                const p = positions.get(node.id);
                if (!p) return null;
                const quadrant = (p[0] > 490 ? 1 : 0) + (p[1] > 286 ? 2 : 0);
                const selectedNow = selected?.id === node.id;
                const current = currentId === node.id;
                const candidate = latest?.candidates.find(entry => entry.node === node.id);
                return <g key={node.id} role="button" tabIndex={0} aria-label={"Inspect node " + node.id} className={styles.node}
                    onClick={() => setSelectedNode(node.id)}
                    onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedNode(node.id); } }}>
                  {selectedNow && <circle cx={p[0]} cy={p[1]} r={19} fill="none" stroke="#f1f5ff" strokeOpacity=".6" strokeWidth="1" />}
                  <circle cx={p[0]} cy={p[1]} r={current ? 10 : candidate ? 8.7 : 6.6} fill={paletteFor(quadrant)} stroke={current ? "#ffffff" : "#0b1525"} strokeWidth={current ? 2 : 1} />
                  <title>{node.id}: attraction {nodeAttractiveness(node).toFixed(3)}</title>
                  {selectedNow || current || candidate ? <text x={p[0] + 12} y={p[1] - 10} fill="#e7edf9" fontSize="12">{node.id}</text> : null}
                </g>;
              })}
            </svg>
            <div className={styles.mapLegend}>{accents.map((color, i) => <span key={color}><i style={{ background: color }} />Zone {i + 1}</span>)}<span><i style={{ background: "#f3c878" }} />Observed trajectory</span></div>
          </div>
          <div className={styles.stream}>
            <div className={styles.streamHead}><strong>Prediction stream</strong><span>{run.snapshots.length} snapshots · {run.residuals.length} evaluated outcomes</span></div>
            {run.snapshots.length === 0 ? <p className={styles.empty}>Start the simulation to record a prediction before the next movement is revealed.</p> : run.snapshots.slice(-4).reverse().map((snapshot, index) => {
              const position = run.snapshots.length - index - 1;
              return <button type="button" className={latestIndex === position ? styles.streamActive : ""} key={snapshot.id} onClick={() => { setFocusedStep(position); setSelectedNode(snapshot.topNext); }}>
                <span>{String(position).padStart(3, "0")}</span><b>{snapshot.abstain ? "abstain" : "predict"}</b><span>{run.history[position]} → {snapshot.topNext ?? "unknown"}</span><em>{percentage(snapshot.confidence)}</em>
              </button>;
            })}
          </div>
        </>}
        {tab === "Statistics" && <div className={styles.contentView}><h2>Observed model performance</h2><p>All measures below are computed from recorded synthetic predictions and revealed outcomes.</p>
          <div className={styles.statGrid}>{[["Recorded predictions", String(run.snapshots.length)], ["Evaluated outcomes", String(run.residuals.length)], ["Mean Brier score", format(meanBrier, 4)], ["Validation NLL", format(nll, 4)], ["Mean prediction confidence", percentage(run.snapshots.length ? run.snapshots.reduce((sum, item) => sum + item.confidence, 0) / run.snapshots.length : null)], ["Abstentions", String(run.snapshots.filter(item => item.abstain).length)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <h3>Prediction confidence over time</h3>{run.snapshots.length > 1 ? <div className={styles.chart}>{miniTrend(run.snapshots.map(item => item.confidence), accents[0])}</div> : <p>Run the simulation to generate a confidence series.</p>}
          <h3>Outcome Brier scores</h3>{run.residuals.length > 0 ? <div className={styles.chart}>{miniTrend(run.residuals.map(item => item.brier), accents[3])}</div> : <p>Outcome statistics appear after at least one movement.</p>}
        </div>}
        {tab === "Experiments" && <div className={styles.contentView}><h2>Controlled synthetic experiment</h2><p>Adjust node count, topology, edge density or seed, generate a new graph, then run RPA again. The existing mathematical engine trains chronological conditional-logit, gradient boosting and neural models, with a held-out validation split.</p><div className={styles.experimentGrid}><div><span>Active topology</span><strong>{settings.topology}</strong></div><div><span>Generated graph</span><strong>{graph.nodes.length} nodes / {graph.edges.length} edges</strong></div><div><span>Training status</span><strong>{suite ? "Trained" : "Not trained"}</strong></div><div><span>Selected champion</span><strong>{suite?.champion.replaceAll("_", " ") ?? "—"}</strong></div></div><button className={styles.generate} type="button" disabled={training} onClick={() => { regenerate(); setTab("Network"); }}>Regenerate with setup parameters</button><button className={styles.secondaryAction} type="button" disabled={training} onClick={() => { setTab("Network"); start(); }}>Train and simulate</button><p>Comparing runs requires identical evaluation definitions. Validation NLL on synthetic trajectories is not proof of real-world forecast accuracy.</p></div>}
        {tab === "Events" && <div className={styles.contentView}><h2>Prediction and observation ledger</h2><p>Forecast snapshots are stored before their corresponding outcomes. Select an entry to inspect the mathematical output.</p>{run.snapshots.length === 0 ? <p>No snapshots recorded.</p> : run.snapshots.map((snapshot, i) => <button key={snapshot.id} className={styles.ledgerRow} type="button" onClick={() => { setFocusedStep(i); setSelectedNode(snapshot.topNext); setTab("Network"); }}><span>STEP {String(i).padStart(3, "0")}</span><strong>{run.history[i]} → {snapshot.topNext || "—"}</strong><span>confidence {percentage(snapshot.confidence)}</span><span>{run.residuals[i] ? "Brier " + format(run.residuals[i].brier, 3) : "Outcome pending"}</span></button>)}</div>}
        {tab === "Data & exports" && <div className={styles.contentView}><h2>Reproducible simulation data</h2><p>Export the generated graph, prediction snapshots, training metadata and post-outcome evaluation. The hidden future is never included in the pre-outcome model input.</p><button type="button" className={styles.generate} onClick={exportRun}>Export JSON dataset ↓</button><button type="button" className={styles.secondaryAction} onClick={() => exportFile("lapenzer-rpa-graph.json", JSON.stringify(graph, null, 2))}>Export graph JSON ↓</button><div className={styles.jsonSummary}><span>Graph fingerprint</span><code>{graph.fingerprint}</code><span>Model schema</span><code>{suite?.featureSchemaVersion ?? "Not trained"}</code><span>Source</span><code>seeded synthetic graph and trajectories</code><span>Calibration</span><code>Not qualified for operational decisions</code></div></div>}
      </section>
      <aside className={styles.inspector}>
        <header className={styles.panelHead}><strong>Node inspector</strong><span>MATHEMATICS</span></header>
        <div className={styles.inspectorBody}>
          <div className={styles.profile}><div className={styles.avatar}>{selected?.id.slice(0, 2) ?? "—"}</div><div><small>SELECTED STATE</small><strong>{selected?.id ?? "Select node"}</strong><p>Graph node · road domain</p></div></div>
          <div className={styles.infoLine}><span>Node attraction</span><b>{selected ? format(nodeAttractiveness(selected), 3) : "—"}</b></div>
          <div className={styles.infoLine}><span>Candidate probability</span><b>{percentage(selectedCandidate?.probabilities.champion)}</b></div>
          <div className={styles.infoLine}><span>Generalized resistance</span><b>{format(selectedCandidate?.resistance, 3)}</b></div>
          <div className={styles.infoLine}><span>Selected model</span><b>{activeModel?.replaceAll("_", " ") ?? "—"}</b></div>
          <h3>Next movement distribution</h3>
          {bars.length === 0 ? <p className={styles.empty}>Train and start to calculate feasible next actions.</p> : bars.slice(0, 7).map(candidate => <button key={candidate.edge.id} type="button" className={styles.probabilityRow} onClick={() => setSelectedNode(candidate.node)}><div><span>{candidate.node}</span><strong>{percentage(candidate.probabilities.champion)}</strong></div><div className={styles.track}><i style={{ width: (candidate.probabilities.champion * 100) + "%" }} /></div></button>)}
          <h3>Destination hypotheses</h3>
          {latest ? latest.destinationPosterior.slice(0, 5).map(item => <div key={item.id} className={styles.posterior}><span>{item.id}</span><b>{percentage(item.probability)}</b></div>) : <p className={styles.empty}>No destination posterior yet.</p>}
          <h3>Prediction diagnostics</h3>
          <div className={styles.infoLine}><span>Entropy</span><b>{format(latest?.entropy, 3)}</b></div>
          <div className={styles.infoLine}><span>Abstention</span><b>{latest ? latest.abstain ? "Yes" : "No" : "—"}</b></div>
          <div className={styles.infoLine}><span>Last Brier</span><b>{format(lastResidual?.brier, 3)}</b></div>
          {selectedCandidate && <details className={styles.mathDetails}><summary>Inspect feature contributions</summary><p>Original RPA V3 features and contextual resistance matrices.</p>{Object.entries(selectedCandidate.featureV3Map).slice(0, 18).map(([name, value]) => <div className={styles.infoLine} key={name}><span>{name}</span><b>{format(value, 3)}</b></div>)}{selectedCandidate.matrices.map(item => <div className={styles.infoLine} key={item.name}><span>{item.name} (normalized)</span><b>{format(item.normalized, 3)}</b></div>)}</details>}
        </div>
      </aside>
    </div>
    <div className={styles.playback}>
      <div className={styles.playButtons}><button type="button" className={styles.play} onClick={() => { if (run.history.length === 0 || run.complete) start(); else setRunning(state => !state); }} disabled={training}>{training ? "Training…" : running ? "Ⅱ Pause" : run.complete || !run.history.length ? "▶ Start" : "▶ Resume"}</button><button type="button" onClick={() => { setRunning(false); advance(); }} disabled={training || !suite || run.complete || !run.history.length}>Step →</button><button type="button" onClick={resetRun} disabled={training}>Reset ↺</button></div>
      <div className={styles.playbackStep}><small>SIMULATION STEP</small><strong>{String(Math.max(0, run.history.length - 1)).padStart(5, "0")}</strong></div>
      <div className={styles.timeline}><span>{run.history.length ? run.history.join(" → ") : "No observations yet"}</span><div><i style={{ width: run.complete ? "100%" : Math.min(95, run.history.length * 8) + "%" }} /></div></div>
      <label className={styles.speed}>Speed <input type="range" min={0.5} max={3} step={0.5} value={speed} onChange={event => setSpeed(Number(event.target.value))} /><b>{speed}×</b></label>
    </div>
    <div className={styles.disclosure}><span role="status">{notice}</span><span>Research demonstration · Synthetic training data · Forecast shares and ETA are not operationally calibrated.</span></div>
  </div>;
}

function paletteFor(index: number) {
  return accents[index] ?? accents[0];
}
