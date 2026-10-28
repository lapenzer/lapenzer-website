"use client";
import { useMemo, useState } from "react";
import styles from "./RPASimulator.module.css";
import { FEATURE_NAMES, SYNTHETIC_GRAPH, adaptModelWithObservedTrajectory, beamSearch, generateSyntheticTrajectories, makeDomainAdapter, predictNext, trainRpaModel, type NodeId, type RpaModel } from "@/lib/rpaV3";

type DomainKey = "road" | "terrain" | "marine" | "air";
type RequestMode = "unknown" | "known";

const LABELS: Record<DomainKey, Record<string, string>> = {
  road: { A: "Depot", B: "North jct.", C: "South jct.", D: "Bypass", E: "Central", F: "Industrial", G: "East hub", H: "Riverside", I: "Terminal" },
  terrain: { A: "Trailhead", B: "North ridge", C: "South slope", D: "High pass", E: "Valley", F: "Ravine", G: "East ridge", H: "Low pass", I: "Shelter" },
  marine: { A: "Harbour", B: "North buoy", C: "South buoy", D: "Deep channel", E: "Mid-channel", F: "Shoal edge", G: "Pilot point", H: "Anchorage", I: "Port" },
  air: { A: "Departure", B: "Fix N1", C: "Fix S1", D: "Fix N2", E: "Merge", F: "Fix S2", G: "Arrival N", H: "Arrival S", I: "Destination" },
};
const DOMAIN_NAMES: Record<DomainKey, string> = { road: "Road vehicle", terrain: "Open terrain", marine: "Marine", air: "Aircraft" };
const DESTINATIONS = ["G", "H", "I"];
const NODE_POS: Record<string, [number, number]> = { A: [70, 220], B: [190, 105], C: [190, 330], D: [330, 80], E: [340, 220], F: [330, 360], G: [505, 125], H: [505, 320], I: [675, 220] };
const fmt = (value: number | undefined, digits = 3) => value == null || !Number.isFinite(value) ? "—" : value.toFixed(digits);
const pct = (value: number | undefined, digits = 1) => value == null || !Number.isFinite(value) ? "—" : `${(value * 100).toFixed(digits)}%`;
const pathText = (path: NodeId[], domain: DomainKey) => path.map((node) => LABELS[domain][node] ?? node).join(" → ");

export function RPASimulatorV3() {
  const [domain, setDomain] = useState<DomainKey>("road");
  const [requestMode, setRequestMode] = useState<RequestMode>("unknown");
  const [destination, setDestination] = useState<NodeId>("I");
  const [stress, setStress] = useState(0.45);
  const [abstainThreshold, setAbstainThreshold] = useState(0.35);
  const [closeHighRisk, setCloseHighRisk] = useState(false);
  const [history, setHistory] = useState<NodeId[]>(["A"]);
  const [adapted, setAdapted] = useState<RpaModel | null>(null);
  const [lastAdapted, setLastAdapted] = useState<NodeId[] | null>(null);

  const baseModel = useMemo(
    () => trainRpaModel(SYNTHETIC_GRAPH, generateSyntheticTrajectories(360, 7), DESTINATIONS, makeDomainAdapter(domain)),
    [domain],
  );
  const model = adapted ?? baseModel;
  const closedEdges = useMemo(
    () => closeHighRisk ? new Set(SYNTHETIC_GRAPH.edges.filter((edge) => (edge.risk ?? 0) >= 0.45).map((edge) => edge.id)) : new Set<string>(),
    [closeHighRisk],
  );
  const ctx = useMemo(() => ({ stress, closedEdges, nowDay: 125 }), [stress, closedEdges]);
  const suppliedDestination = requestMode === "known" ? destination : undefined;
  const prediction = useMemo(() => predictNext(model, history, ctx, suppliedDestination), [model, history, ctx, suppliedDestination]);
  const beams = useMemo(() => beamSearch(model, history, ctx, suppliedDestination, 3, 5), [model, history, ctx, suppliedDestination]);
  const top = prediction.candidates[0];
  const normalizedEntropy = prediction.candidates.length > 1 ? prediction.entropy / Math.log(prediction.candidates.length) : 0;
  const abstains = !top || prediction.confidence < abstainThreshold || normalizedEntropy > 0.92;
  const posterior = [...prediction.destinationPosterior.probs.entries()].sort((a, b) => b[1] - a[1]);

  const changeDomain = (next: DomainKey) => {
    setDomain(next);
    setAdapted(null);
    setHistory(["A"]);
    setLastAdapted(null);
  };

  const completeAndAdapt = () => {
    if (history.length < 2) return;
    setAdapted(adaptModelWithObservedTrajectory(model, { id: `interactive-${Date.now()}`, nodes: history, day: 126, origin: "synthetic" }));
    setLastAdapted(history);
    setHistory(["A"]);
  };

  const reset = () => {
    setAdapted(null);
    setHistory(["A"]);
    setLastAdapted(null);
    setStress(0.45);
    setCloseHighRisk(false);
  };

  return (
    <div className={styles.shell}>
      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>RPA v3 · specification-aligned simulation</p>
          <h1>Generate → Select → Observe → Adapt</h1>
          <p className={styles.lead}>This version follows the RPA v3 design: leak-free forward training, backed-off transition statistics, the documented 18-feature candidate vector, sequential Bayesian destination inference, calibrated listwise ranking, conformal prediction sets, cold-start logic and multi-step beam forecasting.</p>
        </div>
        <div className={styles.statusCard}>
          <span>Model state</span>
          <strong>{model.mode === "model" ? "Trained conditional-logit model" : "Cold-start prior"}</strong>
          <p>Data origin: synthetic. Model: {model.version}. Real-world results are reported separately from this benchmark.</p>
        </div>
      </section>

      <section className={styles.controls} aria-label="RPA v3 controls">
        <label>Domain adapter<select value={domain} onChange={(event) => changeDomain(event.target.value as DomainKey)}>{Object.keys(DOMAIN_NAMES).map((key) => <option key={key} value={key}>{DOMAIN_NAMES[key as DomainKey]}</option>)}</select></label>
        <label>Request mode<select value={requestMode} onChange={(event) => setRequestMode(event.target.value as RequestMode)}><option value="unknown">Forecast unknown destination</option><option value="known">Forecast known destination</option></select></label>
        <label>Known destination<select value={destination} disabled={requestMode !== "known"} onChange={(event) => setDestination(event.target.value)}>{DESTINATIONS.map((item) => <option key={item} value={item}>{LABELS[domain][item]}</option>)}</select></label>
        <label className={styles.rangeControl}><span><span>Environmental stress</span><strong>{Math.round(stress * 100)}%</strong></span><input type="range" min="0" max="1" step="0.05" value={stress} onChange={(event) => setStress(Number(event.target.value))} /><small>Feeds candidate-specific context, not a group-constant feature.</small></label>
        <label className={styles.rangeControl}><span><span>Abstain below</span><strong>{Math.round(abstainThreshold * 100)}%</strong></span><input type="range" min="0.15" max="0.70" step="0.01" value={abstainThreshold} onChange={(event) => setAbstainThreshold(Number(event.target.value))} /><small>Low confidence or high entropy returns insufficient evidence.</small></label>
        <label><span>Feasibility mask</span><select value={closeHighRisk ? "closed" : "open"} onChange={(event) => setCloseHighRisk(event.target.value === "closed")}><option value="open">All graph links available</option><option value="closed">Mask high-risk links</option></select></label>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.mapPanel}>
          <div className={styles.panelHeader}>
            <div><p className={styles.kicker}>Current observation prefix</p><h2>{pathText(history, domain)}</h2></div>
            <div className={styles.headerActions}><button type="button" onClick={completeAndAdapt} disabled={history.length < 2}>Complete & adapt</button><button type="button" className={styles.secondaryButton} onClick={reset}>Reset</button></div>
          </div>
          <div className={styles.graphWrap}>
            <svg viewBox="0 0 760 440" role="img" aria-label="RPA v3 synthetic directed network">
              <defs><marker id="arrow-v3" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" className={styles.arrowHead} /></marker></defs>
              {SYNTHETIC_GRAPH.edges.map((edge) => { const from = NODE_POS[edge.from], to = NODE_POS[edge.to], masked = closedEdges.has(edge.id); return <line key={edge.id} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className={styles.baseEdge} markerEnd="url(#arrow-v3)" style={masked ? { opacity: 0.035, strokeDasharray: "5 8" } : undefined} />; })}
              {[...beams].reverse().map((beam) => <polyline key={beam.nodes.join("-")} points={beam.nodes.map((node) => NODE_POS[node].join(",")).join(" ")} className={styles.candidatePath} style={{ opacity: 0.14 + beam.conditionalWeight * 1.5, strokeWidth: 3 + beam.conditionalWeight * 10 }} />)}
              {SYNTHETIC_GRAPH.nodes.map((node) => { const position = NODE_POS[node.id]; return <g key={node.id}><circle cx={position[0]} cy={position[1]} r="18" className={history.includes(node.id) || DESTINATIONS.includes(node.id) ? styles.endpointNode : styles.node} /><text x={position[0]} y={position[1] + 4} textAnchor="middle" className={styles.nodeId}>{node.id}</text><text x={position[0]} y={position[1] + 34} textAnchor="middle" className={styles.nodeLabel}>{LABELS[domain][node.id]}</text></g>; })}
            </svg>
          </div>
          <div className={styles.legend}><span><i className={styles.legendRoute} /> Beam alternatives, path-size corrected</span><span>Beam 5 · horizon 3</span><span>{closeHighRisk ? `${closedEdges.size} masked links` : "No hard masks active"}</span></div>
        </div>

        <aside className={styles.outputPanel}>
          <div className={styles.panelHeader}><div><p className={styles.kicker}>Calibrated next-node output</p><h2>{abstains ? "Insufficient evidence" : "Prediction available"}</h2></div></div>
          <div className={styles.metricGrid}><div><span>Top probability</span><strong>{pct(prediction.confidence)}</strong></div><div><span>Normalized entropy</span><strong>{fmt(normalizedEntropy, 2)}</strong></div><div><span>Conformal set</span><strong>{prediction.conformalSet.length ? prediction.conformalSet.join(", ") : "—"}</strong></div><div><span>Temperature</span><strong>{fmt(model.ranker?.temperature, 2)}</strong></div></div>
          {top && <div className={styles.selectedRoute}><span>Top next movement</span><strong>{LABELS[domain][history[history.length - 1]]} → {LABELS[domain][top.node]}</strong><small>{abstains ? "The model is withholding a committed prediction under the selected uncertainty rule." : `Mode: ${prediction.mode}; candidate probabilities sum to one within this decision set.`}</small></div>}
          <div className={styles.signalList}><h3>Next-node distribution</h3>{prediction.candidates.map((candidate) => <div className={styles.signalRow} key={candidate.node}><span>{LABELS[domain][candidate.node]}</span><div><i style={{ width: `${(candidate.probability ?? 0) * 100}%` }} /></div><strong>{pct(candidate.probability, 1)}</strong></div>)}</div>
        </aside>
      </section>

      <section className={styles.candidatesSection}>
        <div className={styles.panelHeader}><div><p className={styles.kicker}>Observe</p><h2>Advance the observed trajectory</h2><p>Select the movement that actually occurred. The system predicts again from the longer observed prefix. Complete & adapt updates transition statistics only; selector replacement remains a separately validated operation.</p></div></div>
        <div className={styles.candidateCards}>{prediction.candidates.map((candidate, index) => <article key={candidate.node} className={index === 0 ? styles.topCandidate : undefined}><div className={styles.candidateRank}><span>#{index + 1}</span><strong>{pct(candidate.probability)}</strong></div><h3>{LABELS[domain][history[history.length - 1]]} → {LABELS[domain][candidate.node]}</h3><dl><div><dt>lp o3</dt><dd>{fmt(candidate.featureMap.lp_o3)}</dd></div><div><dt>recent</dt><dd>{fmt(candidate.featureMap.lp_o1_recent)}</dd></div><div><dt>dest progress</dt><dd>{fmt(candidate.featureMap.dest_progress)}</dd></div><div><dt>context</dt><dd>{fmt(candidate.featureMap.wx_cand)}</dd></div></dl><button type="button" onClick={() => setHistory((current) => [...current, candidate.node])}>Observe this move</button></article>)}</div>
        {lastAdapted && <p className={styles.feedbackNote}>Adapted transition statistics with completed observed trajectory: {pathText(lastAdapted, domain)}. Ranker weights were not silently replaced.</p>}
      </section>

      <section className={styles.feedbackPanel}>
        <div><p className={styles.kicker}>Destination inference</p><h2>Sequential Bayesian posterior</h2><p>The end state is inferred from the observed prefix unless the request mode explicitly supplies a destination.</p></div>
        <div className={styles.metricGrid}>{posterior.map(([item, probability]) => <div key={item}><span>{LABELS[domain][item]}</span><strong>{pct(probability)}</strong></div>)}</div>
        <p className={styles.feedbackNote}>Destination entropy: {fmt(prediction.destinationPosterior.entropy, 3)}. Hypothetical beam branches do not update the live posterior as if they were new observations.</p>
      </section>

      <section className={styles.candidatesSection}>
        <div className={styles.panelHeader}><div><p className={styles.kicker}>Multi-step forecast</p><h2>Calibrated beam with ETA quantiles</h2><p>Displayed weights are conditional within the retained beam after route-overlap correction; they are not presented as total probability mass over every possible future.</p></div></div>
        <div className={styles.candidateCards}>{beams.map((beam, index) => <article key={beam.nodes.join("-")} className={index === 0 ? styles.topCandidate : undefined}><div className={styles.candidateRank}><span>#{index + 1}</span><strong>{pct(beam.conditionalWeight)}</strong></div><h3>{pathText(beam.nodes.slice(history.length - 1), domain)}</h3><dl><div><dt>Raw sequence p</dt><dd>{fmt(beam.probability, 4)}</dd></div><div><dt>ETA P10</dt><dd>{fmt(beam.etaMinutes[0], 1)} min</dd></div><div><dt>ETA P50</dt><dd>{fmt(beam.etaMinutes[1], 1)} min</dd></div><div><dt>ETA P90</dt><dd>{fmt(beam.etaMinutes[2], 1)} min</dd></div></dl></article>)}</div>
      </section>

      <section className={styles.feedbackPanel}>
        <div><p className={styles.kicker}>Leak-free evaluation</p><h2>Forward-time held-out results</h2><p>Training, validation and test are separated by whole synthetic trajectories. Ranker training uses blocked forward chaining; temperature and conformal calibration use validation only.</p></div>
        <div className={styles.metricGrid}><div><span>Held-out Top-1</span><strong>{pct(model.test?.top1)}</strong></div><div><span>95% trajectory bootstrap</span><strong>{model.test ? `${pct(model.test.ci95[0])}–${pct(model.test.ci95[1])}` : "—"}</strong></div><div><span>Test NLL</span><strong>{fmt(model.test?.nll)}</strong></div><div><span>Test Brier</span><strong>{fmt(model.test?.brier)}</strong></div><div><span>ECE</span><strong>{fmt(model.test?.ece)}</strong></div><div><span>Candidate coverage</span><strong>{pct(model.test?.candidateCoverage)}</strong></div><div><span>Decision events</span><strong>{model.test?.sampleSize ?? "—"}</strong></div><div><span>Held-out trajectories</span><strong>{model.test?.trajectoryCount ?? "—"}</strong></div></div>
        <p className={styles.feedbackNote}>These are synthetic benchmark results generated in this browser model. They do not transfer to road, marine, aircraft or other real-world deployment accuracy.</p>
      </section>

      {top && <section className={styles.methodPanel}><div><p className={styles.kicker}>Exact candidate vector</p><h2>18 documented features</h2></div><ol>{FEATURE_NAMES.map((name, index) => <li key={name}><strong>{name}</strong><span>{fmt(top.features[index], 5)}</span></li>)}</ol></section>}
    </div>
  );
}
