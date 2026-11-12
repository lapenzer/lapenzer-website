import { Simulation } from "./simulation";
import { Analysis } from "./types";
import { mean, Random, variance } from "./random";
export function analyze(s: Simulation): Analysis {
  const ids = [...s.agents.keys()],
    n = ids.length,
    ix = new Map(ids.map((id, i) => [id, i]));
  const out = ids.map(() => new Set<number>()),
    inc = ids.map(() => new Set<number>()),
    und = ids.map(() => new Set<number>());
  for (const e of s.edges.values()) {
    const a = ix.get(e.source)!,
      b = ix.get(e.target)!;
    out[a].add(b);
    inc[b].add(a);
    und[a].add(b);
    und[b].add(a);
    if (!s.config.directed) {
      out[b].add(a);
      inc[a].add(b);
    }
  }
  const degree = und.map((a) => a.size),
    adj = out.map((a) => [...a]),
    proj = und.map((a) => [...a]);
  const labels = ids.map((_, i) => i),
    rng = new Random("analytics-v1"),
    order = ids.map((_, i) => i);
  for (let iter = 0; iter < 12; iter++) {
    let changed = 0;
    rng.shuffle(order);
    for (const a of order) {
      if (!und[a].size) continue;
      const count = new Map<number, number>();
      for (const b of und[a])
        count.set(labels[b], (count.get(labels[b]) ?? 0) + 1);
      let best = labels[a],
        score = count.get(best) ?? 0;
      for (const [label, v] of count)
        if (v > score || (v === score && label < best)) {
          best = label;
          score = v;
        }
      if (labels[a] !== best) {
        labels[a] = best;
        changed++;
      }
    }
    if (!changed) break;
  }
  const groups = new Map<number, number>();
  for (const l of labels) groups.set(l, (groups.get(l) ?? 0) + 1);
  const remap = new Map(
    [...groups.keys()].sort((a, b) => a - b).map((k, i) => [k, i]),
  );
  let components = 0,
    largest = 0;
  const visited = new Uint8Array(n);
  for (let start = 0; start < n; start++) {
    if (visited[start]) continue;
    components++;
    let head = 0;
    const queue = [start];
    visited[start] = 1;
    while (head < queue.length) {
      const a = queue[head++];
      for (const b of und[a])
        if (!visited[b]) {
          visited[b] = 1;
          queue.push(b);
        }
    }
    largest = Math.max(largest, queue.length);
  }
  let triangleSum = 0,
    triples = 0,
    clusterSum = 0;
  const clusterIndices =
    n <= 400
      ? order
      : Array.from({ length: 400 }, (_, i) => Math.floor((i * n) / 400));
  let truncated = false;
  for (const a of clusterIndices) {
    const all = proj[a],
      neighbors = all.slice(0, 120);
    if (all.length > 120) truncated = true;
    let links = 0;
    for (let i = 0; i < neighbors.length; i++)
      for (let j = i + 1; j < neighbors.length; j++)
        if (und[neighbors[i]].has(neighbors[j])) links++;
    const possible = (neighbors.length * (neighbors.length - 1)) / 2;
    triangleSum += links;
    triples += possible;
    clusterSum += possible ? links / possible : 0;
  }
  let pagerank = Array(n).fill(n ? 1 / n : 0);
  for (let iter = 0; iter < 60; iter++) {
    const dangling = pagerank.reduce(
      (sum, v, i) => sum + (adj[i].length ? 0 : v),
      0,
    );
    const next = Array(n).fill(n ? (0.15 + 0.85 * dangling) / n : 0);
    for (let a = 0; a < n; a++)
      for (const b of adj[a]) next[b] += (0.85 * pagerank[a]) / adj[a].length;
    const err = next.reduce((sum, v, i) => sum + Math.abs(v - pagerank[i]), 0);
    pagerank = next;
    if (err < 1e-9) break;
  }
  let eig = Array(n).fill(n ? 1 / Math.sqrt(n) : 0);
  for (let iter = 0; iter < 80; iter++) {
    const next = eig.map(
      (v, i) => v + proj[i].reduce((sum, j) => sum + eig[j], 0),
    );
    const norm = Math.sqrt(next.reduce((sum, v) => sum + v * v, 0));
    if (!norm) break;
    const normalized = next.map((v) => v / norm);
    const err = normalized.reduce((sum, v, i) => sum + Math.abs(v - eig[i]), 0);
    eig = normalized;
    if (err < 1e-8) break;
  }
  const samples =
    n <= 200
      ? ids.map((_, i) => i)
      : Array.from({ length: Math.min(32, n) }, (_, i) =>
          Math.floor((i * n) / 32),
        );
  const between = Array(n).fill(0),
    closeness = Array(n).fill(0);
  let totalDistance = 0,
    reachable = 0,
    maxDistance = 0;
  for (const source of samples) {
    const stack: number[] = [],
      pred = ids.map(() => [] as number[]),
      sigma = new Float64Array(n),
      dist = new Int32Array(n).fill(-1),
      queue = [source];
    sigma[source] = 1;
    dist[source] = 0;
    let head = 0;
    while (head < queue.length) {
      const v = queue[head++];
      stack.push(v);
      for (const w of adj[v]) {
        if (dist[w] < 0) {
          queue.push(w);
          dist[w] = dist[v] + 1;
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      }
    }
    for (let i = 0; i < n; i++)
      if (dist[i] > 0) {
        reachable++;
        totalDistance += dist[i];
        maxDistance = Math.max(maxDistance, dist[i]);
        closeness[source] += 1 / dist[i];
      }
    closeness[source] /= Math.max(1, n - 1);
    const dependency = new Float64Array(n);
    while (stack.length) {
      const w = stack.pop()!;
      for (const v of pred[w])
        dependency[v] += (sigma[v] / sigma[w]) * (1 + dependency[w]);
      if (w !== source) between[w] += dependency[w];
    }
  }
  if (n > 2)
    for (let i = 0; i < n; i++)
      between[i] *= n / Math.max(1, samples.length) / ((n - 1) * (n - 2));
  // Harmonic centrality is computed for every displayed top agent using an outbound BFS.
  const top = ids
    .map((_, i) => i)
    .sort((a, b) => pagerank[b] - pagerank[a])
    .slice(0, Math.min(200, n));
  for (const source of top)
    if (!samples.includes(source)) {
      const dist = new Int32Array(n).fill(-1),
        q = [source];
      dist[source] = 0;
      let head = 0,
        sum = 0;
      while (head < q.length) {
        const v = q[head++];
        for (const w of adj[v])
          if (dist[w] < 0) {
            dist[w] = dist[v] + 1;
            q.push(w);
            sum += 1 / dist[w];
          }
      }
      closeness[source] = sum / Math.max(1, n - 1);
    }
  let m = 0,
    within = 0,
    reciprocal = 0;
  const communityDegree = new Map<number, number>();
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0,
    sumYY = 0,
    sameGroup = 0,
    weight = 0;
  for (let a = 0; a < n; a++) {
    communityDegree.set(
      labels[a],
      (communityDegree.get(labels[a]) ?? 0) + degree[a],
    );
    for (const b of und[a])
      if (a < b) {
        m++;
        if (labels[a] === labels[b]) within++;
        sumX += degree[a] + degree[b];
        sumY += degree[a] + degree[b];
        sumXY += 2 * degree[a] * degree[b];
        sumXX += degree[a] ** 2 + degree[b] ** 2;
        sumYY += degree[a] ** 2 + degree[b] ** 2;
      }
  }
  for (const e of s.edges.values()) {
    if (out[ix.get(e.target)!].has(ix.get(e.source)!)) reciprocal++;
    if (s.agents.get(e.source)!.group === s.agents.get(e.target)!.group)
      sameGroup++;
    weight += e.weight;
  }
  const modularity = m
    ? within / m -
      [...communityDegree.values()].reduce(
        (sum, d) => sum + (d / (2 * m)) ** 2,
        0,
      )
    : 0;
  const denominator = Math.sqrt(
    (2 * m * sumXX - sumX ** 2) * (2 * m * sumYY - sumY ** 2),
  );
  const sorted = [...degree].sort((a, b) => a - b),
    sumDegree = sorted.reduce((a, b) => a + b, 0);
  const gini =
    n && sumDegree
      ? (2 * sorted.reduce((sum, d, i) => sum + (i + 1) * d, 0)) /
          (n * sumDegree) -
        (n + 1) / n
      : 0;
  const sizes = new Map<number, number>();
  for (const a of s.agents.values())
    sizes.set(a.group, (sizes.get(a.group) ?? 0) + 1);
  const expectedSame = [...sizes.values()].reduce(
    (sum, count) => sum + (count / Math.max(1, n)) ** 2,
    0,
  );
  const last = s.series.at(-1)!;
  const observedSame = s.edges.size ? sameGroup / s.edges.size : 0;
  return {
    summary: {
      ...last,
      components,
      largestComponent: largest,
      clustering: clusterSum / Math.max(1, clusterIndices.length),
      transitivity: triples ? triangleSum / triples : 0,
      modularity,
      reciprocity: s.edges.size ? reciprocal / s.edges.size : 0,
      assortativity: denominator
        ? (2 * m * sumXY - sumX * sumY) / denominator
        : null,
      averagePath: reachable ? totalDistance / reachable : null,
      diameter: n <= 200 && reachable === n * (n - 1) ? maxDistance : null,
      reachableDiameter: reachable ? maxDistance : null,
      reachability:
        n > 1 ? reachable / (Math.max(1, samples.length) * (n - 1)) : 0,
      gini,
      detectedCommunities: groups.size,
      homophily: observedSame,
      segregation:
        s.edges.size && expectedSame < 1
          ? (observedSame - expectedSame) / (1 - expectedSame)
          : 0,
      meanStrength: s.edges.size ? weight / s.edges.size : 0,
      opinionMean: mean([...s.agents.values()].map((a) => a.opinion)),
      opinionSD: Math.sqrt(
        variance([...s.agents.values()].map((a) => a.opinion)),
      ),
    },
    degrees: degree,
    communitySizes: [...groups.values()].sort((a, b) => b - a),
    centrality: top.map((i) => ({
      id: ids[i],
      name: s.agents.get(ids[i])!.name,
      degree: degree[i],
      inDegree: inc[i].size,
      outDegree: out[i].size,
      pagerank: pagerank[i],
      betweenness: between[i],
      closeness: closeness[i],
      eigenvector: eig[i],
      community: remap.get(labels[i])!,
    })),
    method: {
      paths:
        n <= 200
          ? "Exact outbound BFS over all agents; means include reachable ordered pairs only."
          : "32 deterministic source BFS samples; reachable path length and diameter are estimates/lower bounds.",
      centrality:
        n <= 200
          ? "Exact unweighted Brandes betweenness; harmonic closeness, PageRank and eigenvector power iteration."
          : "Betweenness estimated from 32 source agents; harmonic closeness computed for displayed top 200 agents.",
      projection: `Clustering, label-propagation communities, modularity, eigenvector and degree inequality use the unweighted undirected projection, including negative ties. ${n > 400 || truncated ? "Clustering uses at most 400 agents and 120 neighbors per agent; approximate." : "Clustering is exact."}`,
      interpretation:
        "Group labels are initial affiliations. Detected communities use deterministic label propagation. These constructs describe this model, not validated human psychology. A disconnected graph has no finite global diameter.",
    },
  };
}
