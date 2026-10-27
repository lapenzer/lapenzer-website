import fixture from "./fixtures/network.json";
export type Network = { start: string; destination: string; observations: string[]; edges: { source: string; target: string; weight: number }[]; historical_traces: string[][] };
export type Prediction = { route: string[]; probability: number; score: number };
export const exampleNetwork: Network = fixture;
export const nodeNames = [...new Set(fixture.edges.flatMap(e => [e.source, e.target]))].sort();
/** Direct port of the bundled UZUSKE 1.0 evaluation algorithm. */
export function predictRoutes(payload: Network, topK = 4, beamWidth = 48, maxHops = 8): Prediction[] {
  if (![topK, beamWidth, maxHops].every(n => Number.isInteger(n) && n > 0)) throw new Error("Search limits must be positive integers.");
  const graph = new Map<string, { node: string; weight: number }[]>();
  for (const edge of payload.edges) {
    if (!Number.isFinite(edge.weight) || edge.weight <= 0) throw new Error("Edge priors must be positive, finite numbers.");
    if (!graph.has(edge.source)) graph.set(edge.source, []);
    if (!graph.has(edge.target)) graph.set(edge.target, []);
    graph.get(edge.source)!.push({ node: edge.target, weight: edge.weight });
  }
  if (!graph.has(payload.start) || !graph.has(payload.destination)) throw new Error("Choose nodes present in the network.");
  const counts = new Map<string, number>();
  for (const trace of payload.historical_traces) for (let i = 1; i < trace.length; i++) { const key = `${trace[i - 1]}:${trace[i]}`; counts.set(key, (counts.get(key) ?? 0) + 1); }
  function transition(a: string, b: string): number {
    const neighbors = graph.get(a)!;
    const totalCount = neighbors.reduce((n, e) => n + (counts.get(`${a}:${e.node}`) ?? 0), 0);
    const totalWeight = neighbors.reduce((n, e) => n + e.weight, 0);
    const empirical = ((counts.get(`${a}:${b}`) ?? 0) + 1) / (totalCount + neighbors.length);
    const structural = neighbors.find(e => e.node === b)!.weight / totalWeight;
    let bonus = 1;
    for (let i = 1; i < payload.observations.length; i++) if (payload.observations[i - 1] === a && payload.observations[i] === b) bonus += .18 * Math.exp(-.55 * (payload.observations.length - i - 1));
    return Math.max(1e-12, .72 * empirical + .28 * structural) * bonus;
  }
  type Candidate = { score: number; route: string[] };
  let beam: Candidate[] = [{ score: 0, route: [payload.start] }]; const completed: Candidate[] = [];
  for (let hop = 0; hop < maxHops; hop++) {
    const expanded: Candidate[] = [];
    for (const candidate of beam) {
      const current = candidate.route[candidate.route.length - 1];
      if (current === payload.destination) { completed.push(candidate); continue; }
      for (const neighbor of graph.get(current)!) if (!candidate.route.includes(neighbor.node)) expanded.push({ score: candidate.score + Math.log(Math.max(transition(current, neighbor.node), 1e-12)), route: [...candidate.route, neighbor.node] });
    }
    if (!expanded.length) break;
    expanded.sort((a, b) => b.score - a.score); beam = expanded.slice(0, beamWidth);
  }
  completed.push(...beam.filter(c => c.route[c.route.length - 1] === payload.destination));
  if (!completed.length) throw new Error(`No route from ${payload.start} to ${payload.destination} within ${maxHops} hops. Try A to N.`);
  const best = new Map<string, Candidate>();
  for (const candidate of completed) { const key = candidate.route.join(":"); if (!best.has(key) || candidate.score > best.get(key)!.score) best.set(key, candidate); }
  const ranked = [...best.values()].sort((a, b) => b.score - a.score || (a.route.join(":") < b.route.join(":") ? 1 : -1)).slice(0, topK);
  const weights = ranked.map(c => Math.exp(c.score - ranked[0].score)); const total = weights.reduce((a, b) => a + b, 0);
  return ranked.map((c, i) => ({ ...c, probability: weights[i] / total }));
}
export const examplePredictions = predictRoutes(exampleNetwork);
export const routeColors = ["#aec0ff", "#e9c489", "#80beb9", "#b49ccc", "#b7c48e", "#ddd4c4"];
export const nodePositions: Record<string, [number, number]> = { A: [65, 225], B: [180, 80], C: [180, 215], D: [180, 355], E: [310, 65], F: [310, 195], G: [310, 335], H: [440, 75], I: [440, 180], J: [440, 280], K: [560, 340], L: [440, 405], M: [560, 140], N: [665, 225] };
export const terminalOutput = `$ python uzuske.py run examples/network.json\n\nUZUSKE 1.0.0\nInput network: network.json\nObservations: ${exampleNetwork.observations.length}\n\nCalculating candidate routes...\n\n${examplePredictions.map((p, i) => `${i + 1}   ${p.route.join(" → ").padEnd(29)} ${(p.probability * 100).toFixed(2)}%`).join("\n")}\n\nPrediction complete.\nRelative shares within the retained Top-4 routes.`;
