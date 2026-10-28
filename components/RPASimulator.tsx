"use client";

import { useMemo, useState } from "react";
import styles from "./RPASimulator.module.css";

type DomainKey = "road" | "terrain" | "marine" | "air";
type NodeId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

type NodeDef = {
  id: NodeId;
  x: number;
  y: number;
  popularity: number;
};

type EdgeDef = {
  id: string;
  from: NodeId;
  to: NodeId;
  distance: number;
  history: number;
  terrain: number;
  traffic: number;
  risk: number;
};

type Candidate = {
  nodes: NodeId[];
  edgeIds: string[];
  distance: number;
  resistance: number;
  contextPenalty: number;
  history: number;
  progress: number;
  nodeFrequency: number;
  stochastic: number;
  resistanceSignal: number;
  distanceSignal: number;
  tier1: number;
  logit: number;
  probability: number;
};

type Feedback = {
  expected: NodeId[];
  observed: NodeId[];
  overlap: number;
  resistanceError: number;
  surprise: number;
  observedProbability: number;
  updatedEdges: number;
};

const NODES: NodeDef[] = [
  { id: "A", x: 70, y: 220, popularity: 0.72 },
  { id: "B", x: 190, y: 105, popularity: 0.61 },
  { id: "C", x: 190, y: 330, popularity: 0.68 },
  { id: "D", x: 330, y: 80, popularity: 0.58 },
  { id: "E", x: 340, y: 220, popularity: 0.82 },
  { id: "F", x: 330, y: 360, popularity: 0.55 },
  { id: "G", x: 505, y: 125, popularity: 0.74 },
  { id: "H", x: 505, y: 320, popularity: 0.66 },
  { id: "I", x: 675, y: 220, popularity: 0.9 },
];

const EDGES: EdgeDef[] = [
  { id: "A-B", from: "A", to: "B", distance: 1.3, history: 0.68, terrain: 0.2, traffic: 0.7, risk: 0.2 },
  { id: "A-C", from: "A", to: "C", distance: 1.4, history: 0.76, terrain: 0.35, traffic: 0.35, risk: 0.18 },
  { id: "B-D", from: "B", to: "D", distance: 1.25, history: 0.62, terrain: 0.25, traffic: 0.55, risk: 0.28 },
  { id: "B-E", from: "B", to: "E", distance: 1.42, history: 0.84, terrain: 0.18, traffic: 0.78, risk: 0.15 },
  { id: "B-C", from: "B", to: "C", distance: 1.7, history: 0.43, terrain: 0.48, traffic: 0.2, risk: 0.35 },
  { id: "C-D", from: "C", to: "D", distance: 2.05, history: 0.37, terrain: 0.62, traffic: 0.18, risk: 0.45 },
  { id: "C-E", from: "C", to: "E", distance: 1.34, history: 0.79, terrain: 0.3, traffic: 0.4, risk: 0.2 },
  { id: "C-F", from: "C", to: "F", distance: 1.3, history: 0.71, terrain: 0.68, traffic: 0.15, risk: 0.42 },
  { id: "D-E", from: "D", to: "E", distance: 1.45, history: 0.58, terrain: 0.3, traffic: 0.36, risk: 0.22 },
  { id: "D-G", from: "D", to: "G", distance: 1.5, history: 0.73, terrain: 0.24, traffic: 0.63, risk: 0.18 },
  { id: "E-G", from: "E", to: "G", distance: 1.48, history: 0.81, terrain: 0.22, traffic: 0.7, risk: 0.16 },
  { id: "E-H", from: "E", to: "H", distance: 1.52, history: 0.69, terrain: 0.44, traffic: 0.32, risk: 0.3 },
  { id: "F-E", from: "F", to: "E", distance: 1.46, history: 0.51, terrain: 0.55, traffic: 0.2, risk: 0.36 },
  { id: "F-H", from: "F", to: "H", distance: 1.45, history: 0.77, terrain: 0.72, traffic: 0.1, risk: 0.46 },
  { id: "G-H", from: "G", to: "H", distance: 1.78, history: 0.46, terrain: 0.4, traffic: 0.28, risk: 0.32 },
  { id: "G-I", from: "G", to: "I", distance: 1.58, history: 0.86, terrain: 0.15, traffic: 0.62, risk: 0.12 },
  { id: "H-I", from: "H", to: "I", distance: 1.6, history: 0.8, terrain: 0.5, traffic: 0.22, risk: 0.34 },
];

const DOMAINS: Record<DomainKey, {
  name: string;
  context: string;
  labels: Record<NodeId, string>;
  weights: { distance: number; terrain: number; traffic: number; risk: number };
}> = {
  road: {
    name: "Road vehicle",
    context: "congestion / closures",
    labels: { A: "Depot", B: "North jct.", C: "South jct.", D: "Bypass", E: "Central", F: "Industrial", G: "East jct.", H: "Riverside", I: "Terminal" },
    weights: { distance: 1, terrain: 0.25, traffic: 1.15, risk: 0.45 },
  },
  terrain: {
    name: "Open terrain",
    context: "terrain / weather",
    labels: { A: "Trailhead", B: "North ridge", C: "South slope", D: "High pass", E: "Valley", F: "Ravine", G: "East ridge", H: "Low pass", I: "Shelter" },
    weights: { distance: 0.8, terrain: 1.35, traffic: 0.05, risk: 0.85 },
  },
  marine: {
    name: "Marine",
    context: "current / sea state",
    labels: { A: "Harbour", B: "North buoy", C: "South buoy", D: "Deep channel", E: "Mid-channel", F: "Shoal edge", G: "Pilot point", H: "Anchorage", I: "Port" },
    weights: { distance: 0.9, terrain: 1.05, traffic: 0.25, risk: 1.05 },
  },
  air: {
    name: "Aircraft",
    context: "weather / restrictions",
    labels: { A: "Departure", B: "Fix N1", C: "Fix S1", D: "Fix N2", E: "Merge", F: "Fix S2", G: "Arrival N", H: "Arrival S", I: "Destination" },
    weights: { distance: 1.1, terrain: 0.15, traffic: 0.55, risk: 1.15 },
  },
};

const TIER1_WEIGHTS = {
  resistance: 0.22,
  history: 0.2,
  shortest: 0.16,
  progress: 0.14,
  frequency: 0.12,
  stochastic: 0.16,
};

function initialHistory(): Record<string, number> {
  return Object.fromEntries(EDGES.map((edge) => [edge.id, edge.history]));
}

function nodeById(id: NodeId): NodeDef {
  return NODES.find((node) => node.id === id) ?? NODES[0];
}

function edgeByNodes(from: NodeId, to: NodeId): EdgeDef | undefined {
  return EDGES.find((edge) => edge.from === from && edge.to === to);
}

function enumeratePaths(start: NodeId, destination: NodeId, maxNodes = 8): NodeId[][] {
  const results: NodeId[][] = [];
  const walk = (current: NodeId, path: NodeId[]) => {
    if (results.length >= 160 || path.length > maxNodes) return;
    if (current === destination) {
      results.push(path);
      return;
    }
    for (const edge of EDGES) {
      if (edge.from !== current || path.includes(edge.to)) continue;
      walk(edge.to, [...path, edge.to]);
    }
  };
  walk(start, [start]);
  return results;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, min: number, max: number): number {
  if (Math.abs(max - min) < 1e-9) return 1;
  return clamp((value - min) / (max - min));
}

function hashSignal(path: NodeId[], iteration: number): number {
  const text = `${path.join("")}-${iteration}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 0.3 + (Math.abs(hash) % 700) / 1000;
}

function softmax(logits: number[], temperature: number): number[] {
  if (!logits.length) return [];
  const max = Math.max(...logits);
  const exps = logits.map((value) => Math.exp((value - max) / temperature));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

function pathEdges(path: NodeId[]): EdgeDef[] {
  const edges: EdgeDef[] = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = edgeByNodes(path[index], path[index + 1]);
    if (edge) edges.push(edge);
  }
  return edges;
}

function buildCandidates(
  domain: DomainKey,
  start: NodeId,
  destination: NodeId,
  stress: number,
  histories: Record<string, number>,
  iteration: number,
): Candidate[] {
  const config = DOMAINS[domain];
  const raw = enumeratePaths(start, destination).map((nodes) => {
    const edges = pathEdges(nodes);
    const distance = edges.reduce((sum, edge) => sum + edge.distance, 0);
    const contextPenalty = edges.reduce(
      (sum, edge) => sum + config.weights.terrain * edge.terrain + config.weights.traffic * edge.traffic + config.weights.risk * edge.risk,
      0,
    );
    const resistance = config.weights.distance * distance + stress * 1.8 * contextPenalty;
    const history = edges.length
      ? Math.exp(edges.reduce((sum, edge) => sum + Math.log(Math.max(histories[edge.id] ?? edge.history, 0.02)), 0) / edges.length)
      : 0;
    const direct = Math.hypot(nodeById(destination).x - nodeById(start).x, nodeById(destination).y - nodeById(start).y);
    const drawn = edges.reduce((sum, edge) => {
      const from = nodeById(edge.from);
      const to = nodeById(edge.to);
      return sum + Math.hypot(to.x - from.x, to.y - from.y);
    }, 0);
    const progress = drawn > 0 ? clamp(direct / drawn) : 0;
    const nodeFrequency = nodes.length > 1
      ? nodes.slice(1).reduce((sum, id) => sum + nodeById(id).popularity, 0) / (nodes.length - 1)
      : 0;
    return {
      nodes,
      edgeIds: edges.map((edge) => edge.id),
      distance,
      resistance,
      contextPenalty,
      history,
      progress,
      nodeFrequency,
      stochastic: hashSignal(nodes, iteration),
    };
  });

  const resistanceValues = raw.map((candidate) => candidate.resistance);
  const distanceValues = raw.map((candidate) => candidate.distance);
  const minResistance = Math.min(...resistanceValues);
  const maxResistance = Math.max(...resistanceValues);
  const minDistance = Math.min(...distanceValues);
  const maxDistance = Math.max(...distanceValues);

  const enriched = raw.map((candidate) => {
    const resistanceSignal = 1 - normalize(candidate.resistance, minResistance, maxResistance);
    const distanceSignal = 1 - normalize(candidate.distance, minDistance, maxDistance);
    const tier1 =
      TIER1_WEIGHTS.resistance * resistanceSignal +
      TIER1_WEIGHTS.history * candidate.history +
      TIER1_WEIGHTS.shortest * distanceSignal +
      TIER1_WEIGHTS.progress * candidate.progress +
      TIER1_WEIGHTS.frequency * candidate.nodeFrequency +
      TIER1_WEIGHTS.stochastic * candidate.stochastic;
    const contextNorm = maxResistance > 0 ? candidate.contextPenalty / maxResistance : 0;
    const logit =
      2.15 * tier1 +
      0.9 * candidate.history +
      0.65 * candidate.progress +
      0.45 * candidate.nodeFrequency -
      0.5 * contextNorm +
      0.55 * candidate.history * candidate.progress;
    return { ...candidate, resistanceSignal, distanceSignal, tier1, logit, probability: 0 };
  });

  const probabilities = softmax(enriched.map((candidate) => candidate.logit), 0.72 + stress * 0.22);
  return enriched
    .map((candidate, index) => ({ ...candidate, probability: probabilities[index] ?? 0 }))
    .sort((a, b) => b.probability - a.probability);
}

function edgeOverlap(a: NodeId[], b: NodeId[]): number {
  const edgeSet = (path: NodeId[]) => new Set(path.slice(0, -1).map((node, index) => `${node}-${path[index + 1]}`));
  const setA = edgeSet(a);
  const setB = edgeSet(b);
  const union = new Set([...setA, ...setB]);
  if (!union.size) return 1;
  let intersection = 0;
  setA.forEach((edge) => {
    if (setB.has(edge)) intersection += 1;
  });
  return intersection / union.size;
}

function entropy(candidates: Candidate[]): number {
  if (candidates.length <= 1) return 0;
  const h = -candidates.reduce((sum, candidate) => {
    const p = Math.max(candidate.probability, 1e-12);
    return sum + p * Math.log(p);
  }, 0);
  return h / Math.log(candidates.length);
}

function pathText(path: NodeId[], domain: DomainKey): string {
  return path.map((id) => DOMAINS[domain].labels[id]).join(" → ");
}

export function RPASimulator() {
  const [domain, setDomain] = useState<DomainKey>("road");
  const [start, setStart] = useState<NodeId>("A");
  const [destination, setDestination] = useState<NodeId>("I");
  const [stress, setStress] = useState(0.45);
  const [abstainThreshold, setAbstainThreshold] = useState(0.3);
  const [learningRate, setLearningRate] = useState(0.18);
  const [histories, setHistories] = useState<Record<string, number>>(initialHistory);
  const [iteration, setIteration] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const candidates = useMemo(
    () => buildCandidates(domain, start, destination, stress, histories, iteration),
    [domain, start, destination, stress, histories, iteration],
  );
  const top = candidates[0];
  const shown = candidates.slice(0, 4);
  const confidence = top?.probability ?? 0;
  const normalizedEntropy = entropy(candidates);
  const abstains = candidates.length === 0 || confidence < abstainThreshold;
  const activeNode = top ? top.nodes[Math.min(stepIndex, top.nodes.length - 1)] : start;
  const activePosition = nodeById(activeNode);

  const changeDomain = (value: DomainKey) => {
    setDomain(value);
    setStepIndex(0);
    setFeedback(null);
  };

  const observe = (candidate: Candidate) => {
    if (!top) return;
    const overlap = edgeOverlap(top.nodes, candidate.nodes);
    const resistanceError = candidate.resistance > 0
      ? Math.abs(top.resistance - candidate.resistance) / candidate.resistance
      : 0;
    const origins = new Set(candidate.edgeIds.map((id) => id.split("-")[0]));
    setFeedback({
      expected: top.nodes,
      observed: candidate.nodes,
      overlap,
      resistanceError,
      surprise: -Math.log(Math.max(candidate.probability, 1e-9)),
      observedProbability: candidate.probability,
      updatedEdges: candidate.edgeIds.length,
    });
    setHistories((current) => {
      const next = { ...current };
      EDGES.forEach((edge) => {
        const value = current[edge.id] ?? edge.history;
        if (candidate.edgeIds.includes(edge.id)) {
          next[edge.id] = clamp(value + learningRate * (1 - value), 0.02, 0.98);
        } else if (origins.has(edge.from)) {
          next[edge.id] = clamp(value * (1 - learningRate * 0.22), 0.02, 0.98);
        }
      });
      return next;
    });
    setIteration((value) => value + 1);
    setStepIndex(0);
  };

  const reset = () => {
    setHistories(initialHistory());
    setIteration(0);
    setStepIndex(0);
    setFeedback(null);
    setStress(0.45);
  };

  return (
    <div className={styles.shell}>
      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>RPA simulation · synthetic data</p>
          <h1>Generate → Select → Observe → Adapt</h1>
          <p className={styles.lead}>
            This browser simulation implements the structure described in the RPA documents: a domain adapter defines costs,
            Tier 1 generates and scores feasible routes, Tier 2 ranks them, uncertainty is reported, and an observed route updates
            transition history for the next prediction.
          </p>
        </div>
        <div className={styles.statusCard}>
          <span>Evidence status</span>
          <strong>Demonstration only</strong>
          <p>No live tracking, trained production model, or real-world accuracy claim.</p>
        </div>
      </section>

      <section className={styles.controls} aria-label="Simulation controls">
        <label>
          Domain adapter
          <select value={domain} onChange={(event) => changeDomain(event.target.value as DomainKey)}>
            {Object.entries(DOMAINS).map(([key, config]) => <option key={key} value={key}>{config.name}</option>)}
          </select>
        </label>
        <label>
          Start
          <select value={start} onChange={(event) => { setStart(event.target.value as NodeId); setStepIndex(0); setFeedback(null); }}>
            {NODES.map((node) => <option key={node.id} value={node.id}>{DOMAINS[domain].labels[node.id]}</option>)}
          </select>
        </label>
        <label>
          Destination
          <select value={destination} onChange={(event) => { setDestination(event.target.value as NodeId); setStepIndex(0); setFeedback(null); }}>
            {NODES.map((node) => <option key={node.id} value={node.id}>{DOMAINS[domain].labels[node.id]}</option>)}
          </select>
        </label>
        <label className={styles.rangeControl}>
          <span><span>Environmental stress</span><strong>{Math.round(stress * 100)}%</strong></span>
          <input type="range" min="0" max="1" step="0.05" value={stress} onChange={(event) => setStress(Number(event.target.value))} />
          <small>Amplifies {DOMAINS[domain].context} resistance.</small>
        </label>
        <label className={styles.rangeControl}>
          <span><span>Abstain below</span><strong>{Math.round(abstainThreshold * 100)}%</strong></span>
          <input type="range" min="0.15" max="0.6" step="0.01" value={abstainThreshold} onChange={(event) => setAbstainThreshold(Number(event.target.value))} />
          <small>The predictor can return insufficient evidence.</small>
        </label>
        <label className={styles.rangeControl}>
          <span><span>Feedback rate</span><strong>{Math.round(learningRate * 100)}%</strong></span>
          <input type="range" min="0.05" max="0.4" step="0.01" value={learningRate} onChange={(event) => setLearningRate(Number(event.target.value))} />
          <small>Controls how strongly one observed route changes transition history.</small>
        </label>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.mapPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.kicker}>Network state</p>
              <h2>{DOMAINS[domain].name} synthetic graph</h2>
            </div>
            <div className={styles.headerActions}>
              <button type="button" onClick={() => setStepIndex((value) => top ? (value + 1) % top.nodes.length : 0)} disabled={!top}>Advance object</button>
              <button type="button" className={styles.secondaryButton} onClick={reset}>Reset</button>
            </div>
          </div>
          <div className={styles.graphWrap}>
            <svg viewBox="0 0 760 440" role="img" aria-label="Synthetic directed network with ranked route candidates">
              <defs>
                <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <path d="M0,0 L7,3.5 L0,7 Z" className={styles.arrowHead} />
                </marker>
              </defs>
              {EDGES.map((edge) => {
                const from = nodeById(edge.from);
                const to = nodeById(edge.to);
                return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} className={styles.baseEdge} markerEnd="url(#arrow)" />;
              })}
              {[...shown].reverse().map((candidate, reverseIndex) => {
                const rank = shown.length - reverseIndex;
                const points = candidate.nodes.map((id) => `${nodeById(id).x},${nodeById(id).y}`).join(" ");
                return <polyline key={candidate.nodes.join("-")} points={points} className={styles.candidatePath} style={{ opacity: 0.18 + candidate.probability * 1.8, strokeWidth: rank === 1 ? 9 : 3 + candidate.probability * 8 }} />;
              })}
              {NODES.map((node) => (
                <g key={node.id}>
                  <circle cx={node.x} cy={node.y} r="18" className={node.id === start || node.id === destination ? styles.endpointNode : styles.node} />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" className={styles.nodeId}>{node.id}</text>
                  <text x={node.x} y={node.y + 34} textAnchor="middle" className={styles.nodeLabel}>{DOMAINS[domain].labels[node.id]}</text>
                </g>
              ))}
              {top && <circle cx={activePosition.x} cy={activePosition.y} r="9" className={styles.activeObject} />}
            </svg>
          </div>
          <div className={styles.legend}>
            <span><i className={styles.legendRoute} /> Ranked candidate routes</span>
            <span><i className={styles.legendObject} /> Predicted object position</span>
            <span>Iteration {iteration}</span>
          </div>
        </div>

        <aside className={styles.outputPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.kicker}>Prediction</p>
              <h2>{abstains ? "Insufficient evidence" : "Route selected"}</h2>
            </div>
          </div>
          {!top ? (
            <div className={styles.emptyState}>No feasible path exists for this start and destination in the synthetic graph.</div>
          ) : (
            <>
              <div className={styles.metricGrid}>
                <div><span>Top probability</span><strong>{(confidence * 100).toFixed(1)}%</strong></div>
                <div><span>Normalized entropy</span><strong>{normalizedEntropy.toFixed(2)}</strong></div>
                <div><span>Candidates</span><strong>{candidates.length}</strong></div>
                <div><span>Generalized resistance</span><strong>{top.resistance.toFixed(2)}</strong></div>
              </div>
              <div className={styles.selectedRoute}>
                <span>Highest-ranked route</span>
                <strong>{pathText(top.nodes, domain)}</strong>
                <small>{abstains ? `Confidence is below the ${(abstainThreshold * 100).toFixed(0)}% abstention threshold.` : "Output accepted by the current abstention rule."}</small>
              </div>
              <div className={styles.signalList}>
                <h3>Tier 1 signals</h3>
                {[
                  ["Minimum resistance", top.resistanceSignal],
                  ["Markov / history", top.history],
                  ["Shortest path", top.distanceSignal],
                  ["Destination progress", top.progress],
                  ["Node frequency", top.nodeFrequency],
                  ["Stochastic proposal", top.stochastic],
                ].map(([label, value]) => (
                  <div key={label as string} className={styles.signalRow}>
                    <span>{label as string}</span>
                    <div><i style={{ width: `${Number(value) * 100}%` }} /></div>
                    <strong>{Number(value).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </section>

      <section className={styles.candidatesSection}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.kicker}>Observe</p>
            <h2>Choose what actually happened</h2>
            <p>Feeding a measured route back into the simulation updates transition priors. The next prediction is recomputed from the revised history.</p>
          </div>
        </div>
        <div className={styles.candidateCards}>
          {shown.map((candidate, index) => (
            <article key={candidate.nodes.join("-")} className={index === 0 ? styles.topCandidate : undefined}>
              <div className={styles.candidateRank}><span>#{index + 1}</span><strong>{(candidate.probability * 100).toFixed(1)}%</strong></div>
              <h3>{pathText(candidate.nodes, domain)}</h3>
              <dl>
                <div><dt>Distance</dt><dd>{candidate.distance.toFixed(2)}</dd></div>
                <div><dt>Resistance</dt><dd>{candidate.resistance.toFixed(2)}</dd></div>
                <div><dt>Tier 1</dt><dd>{candidate.tier1.toFixed(2)}</dd></div>
                <div><dt>History</dt><dd>{candidate.history.toFixed(2)}</dd></div>
              </dl>
              <button type="button" onClick={() => observe(candidate)}>Use as observed route</button>
            </article>
          ))}
        </div>
      </section>

      {feedback && (
        <section className={styles.feedbackPanel}>
          <div>
            <p className={styles.kicker}>Measured vs expected</p>
            <h2>Feedback from iteration {iteration}</h2>
            <p><strong>Expected:</strong> {pathText(feedback.expected, domain)}</p>
            <p><strong>Observed:</strong> {pathText(feedback.observed, domain)}</p>
          </div>
          <div className={styles.metricGrid}>
            <div><span>Route overlap</span><strong>{(feedback.overlap * 100).toFixed(0)}%</strong></div>
            <div><span>Resistance error</span><strong>{(feedback.resistanceError * 100).toFixed(1)}%</strong></div>
            <div><span>Observed probability</span><strong>{(feedback.observedProbability * 100).toFixed(1)}%</strong></div>
            <div><span>Surprise −ln(p)</span><strong>{feedback.surprise.toFixed(2)}</strong></div>
          </div>
          <p className={styles.feedbackNote}>{feedback.updatedEdges} observed transitions were strengthened; competing outgoing transitions were slightly reduced. This is a controlled demonstration of the adaptive feedback loop, not online training of a deployed neural model.</p>
        </section>
      )}

      <section className={styles.methodPanel}>
        <div>
          <p className={styles.kicker}>What the simulation implements</p>
          <h2>Architecture mapping</h2>
        </div>
        <ol>
          <li><strong>Domain adapter</strong><span>Changes the relative importance of distance, terrain, traffic/current, and risk.</span></li>
          <li><strong>Candidate generation</strong><span>Enumerates feasible loop-free routes through the synthetic directed graph.</span></li>
          <li><strong>Tier 1 scoring</strong><span>Combines minimum resistance, Markov history, shortest-path evidence, destination progress, node frequency, and a reproducible stochastic signal.</span></li>
          <li><strong>Tier 2 selection</strong><span>Applies a nonlinear selector and softmax to produce a distribution across candidates.</span></li>
          <li><strong>Uncertainty</strong><span>Reports confidence and normalized entropy and can abstain below the selected threshold.</span></li>
          <li><strong>Adaptive feedback</strong><span>Compares expected and measured routes, then adjusts transition history for the next iteration.</span></li>
        </ol>
      </section>
    </div>
  );
}
