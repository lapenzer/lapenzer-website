import test from "node:test";
import assert from "node:assert/strict";
import { Simulation, CognitionPlan } from "../engine/simulation";
import { analyze } from "../engine/analytics";
import { experiment, validateExperiment } from "../engine/experiments";
import { DEFAULT_CONFIG, Topology, TRAITS } from "../engine/types";
import { csv, graphml, gexf } from "../client/exports";

test("100 unique fictional agents have heterogeneous bounded traits", () => {
  const s = new Simulation();
  assert.equal(s.agents.size, 100);
  assert.equal(new Set([...s.agents.values()].map((a) => a.name)).size, 100);
  for (const a of s.agents.values()) {
    assert.equal(a.traits.length, TRAITS.length);
    assert.ok(a.traits.every((x) => x >= 0 && x <= 1));
    assert.ok(a.age >= 18);
  }
  assert.ok(new Set([...s.agents.values()].map((a) => a.traits[3])).size > 70);
});
test("identical seeds, initial graphs, interactions and states are deterministic", () => {
  const a = new Simulation({ seed: "replication-test" }),
    b = new Simulation({ seed: "replication-test" });
  for (let i = 0; i < 25; i++) {
    a.step();
    b.step();
  }
  assert.deepEqual(a.serialize(), b.serialize());
  assert.ok(a.events.length > 100);
});
test("saving and restoring preserves exact statistical continuation", () => {
  const a = new Simulation({ seed: "restore" });
  for (let i = 0; i < 14; i++) a.step();
  const b = Simulation.load(JSON.parse(JSON.stringify(a.serialize())));
  for (let i = 0; i < 12; i++) {
    a.step();
    b.step();
  }
  assert.deepEqual(a.serialize(), b.serialize());
});
test("all topology generators produce valid sparse simple graphs", () => {
  for (const topology of [
    "block",
    "erdos",
    "smallworld",
    "preferential",
    "geometric",
    "scalefree",
    "empty",
  ] as Topology[]) {
    const s = new Simulation({ n: 80, topology });
    for (const e of s.edges.values()) {
      assert.notEqual(e.source, e.target);
      assert.ok(s.agents.has(e.source) && s.agents.has(e.target));
      assert.ok(s.adj.get(e.source)!.has(e.target));
      assert.ok(s.adj.get(e.target)!.has(e.source));
    }
    assert.equal(
      new Set([...s.edges.values()].map((e) => e.id)).size,
      s.edges.size,
    );
  }
});
test("Erdős–Rényi boundary cases and directed densities", () => {
  const empty = new Simulation({ n: 10, topology: "erdos", probability: 0 }),
    complete = new Simulation({ n: 10, topology: "erdos", probability: 1 }),
    directed = new Simulation({
      n: 10,
      topology: "erdos",
      probability: 1,
      directed: true,
    });
  assert.equal(empty.edges.size, 0);
  assert.equal(complete.edges.size, 45);
  assert.equal(directed.edges.size, 90);
  assert.equal(complete.series[0].density, 1);
  assert.equal(directed.series[0].density, 1);
});
test("ring lattice initial degree is correct with no rewiring", () => {
  const s = new Simulation({
    n: 20,
    topology: "smallworld",
    degree: 6,
    rewire: 0,
  });
  assert.equal(s.edges.size, 60);
  assert.ok([...s.adj.values()].every((n) => n.size === 6));
});
test("manual edits, layers and locked relationships are recorded and respected", () => {
  const s = new Simulation({ n: 8, topology: "empty" });
  s.intervene({
    kind: "edge",
    agent: 0,
    target: 1,
    value: 0.5,
    edgeType: "family",
    locked: true,
  });
  s.intervene({ kind: "edge", agent: 0, target: 1, edgeType: "friendship" });
  assert.equal(s.edges.size, 1);
  const edge = [...s.edges.values()][0];
  assert.ok(edge.types.includes("family") && edge.types.includes("friendship"));
  for (let i = 0; i < 50; i++) s.step();
  assert.equal(edge.weight, 0.5);
  s.intervene({ kind: "remove", agent: 1 });
  assert.ok(
    ![...s.edges.values()].some((e) => e.source === 1 || e.target === 1),
  );
  assert.ok(s.events.some((e) => e.action === "intervention"));
});
test("distinct behaviours occur and ties both strengthen and weaken", () => {
  const s = new Simulation({
    seed: "heterogeneity",
    activation: 0.8,
    conflict: 0.45,
    exploration: 0.35,
  });
  const weights = new Map([...s.edges.values()].map((e) => [e.id, e.weight]));
  for (let i = 0; i < 50; i++) s.step();
  const actions = new Set(s.events.map((e) => e.action));
  for (const action of [
    "cooperate",
    "argue",
    "deceive",
    "persuade",
    "gossip",
    "reject",
  ] as const)
    assert.ok(actions.has(action), action);
  assert.ok(
    [...s.edges.values()].some(
      (e) => weights.has(e.id) && e.weight > weights.get(e.id)!,
    ),
  );
  assert.ok(
    [...s.edges.values()].some(
      (e) => weights.has(e.id) && e.weight < weights.get(e.id)!,
    ),
  );
  assert.ok(s.counters.formed > 0);
  for (const a of s.agents.values()) assert.ok(a.memory.length <= 16);
});
test("checkpoint views do not mutate the live engine or RNG state", () => {
  const s = new Simulation();
  s.step();
  const initial = s.serialize();
  const v = s.view(0);
  assert.equal(v.tick, 0);
  assert.deepEqual(s.serialize(), initial);
});
test("compact checkpoints retain the event contents needed by older memories", () => {
  const s = new Simulation({ n: 25 });
  for (let i = 0; i < 500; i++)
    s.record(0, 1, "observe", 0, "Recorded observation " + i, 0, {
      policy: "fixture",
    });
  s.agents.get(2)!.memory = [1];
  s.checkpoint(true);
  const state = s.checkpoints.get(0)!;
  assert.ok(state.events.some((e) => e.id === 1));
  const restored = Simulation.load(state);
  for (let i = 0; i < 10; i++) {
    s.step();
    restored.step();
    assert.deepEqual(s.lastBatch, restored.lastBatch);
  }
  assert.deepEqual([...s.agents.values()], [...restored.agents.values()]);
  assert.equal(s.rng.state, restored.rng.state);
});
test("disconnected graph metrics are finite and global diameter undefined", () => {
  const s = new Simulation({ n: 4, topology: "empty" });
  s.addEdge(0, 1);
  const a = analyze(s);
  assert.equal(a.summary.components, 3);
  assert.equal(a.summary.diameter, null);
  assert.equal(a.summary.averagePath, 1);
  assert.equal(a.summary.reachability, 1 / 6);
  assert.equal(a.summary.clustering, 0);
  assert.ok(a.centrality.every((a) => Number.isFinite(a.pagerank)));
});
test("triangle metrics and undirected centralities agree with known values", () => {
  const s = new Simulation({ n: 3, topology: "erdos", probability: 1 });
  const a = analyze(s);
  assert.equal(a.summary.clustering, 1);
  assert.equal(a.summary.transitivity, 1);
  assert.equal(a.summary.diameter, 1);
  assert.equal(a.summary.reciprocity, 1);
  for (const node of a.centrality) {
    assert.ok(Math.abs(node.pagerank - 1 / 3) < 1e-8);
    assert.equal(node.betweenness, 0);
    assert.equal(node.closeness, 1);
  }
});
test("directed path uses outbound harmonic closeness and normalized betweenness", () => {
  const s = new Simulation({ n: 3, topology: "empty", directed: true });
  s.addEdge(0, 1);
  s.addEdge(1, 2);
  const a = analyze(s);
  assert.equal(a.summary.reciprocity, 0);
  assert.equal(a.summary.averagePath, 4 / 3);
  assert.equal(a.summary.diameter, null);
  const center = a.centrality.find((a) => a.id === 1)!;
  assert.equal(center.betweenness, 0.5);
  assert.equal(a.centrality.find((a) => a.id === 0)!.closeness, 0.75);
});
test("corrupt states, dense large populations and invalid interventions are rejected", () => {
  assert.throws(
    () => new Simulation({ n: 100000, topology: "erdos", probability: 0.3 }),
  );
  assert.throws(() => new Simulation({ n: 0 }));
  const s = new Simulation(),
    d = s.serialize();
  d.agents[0].traits[1] = NaN;
  assert.throws(() => Simulation.load(d));
  assert.throws(() => s.intervene({ kind: "edge", agent: 0, target: 0 }));
});
test("10,000-agent sparse simulations bound rendering and maintain sparse edges", () => {
  const s = new Simulation({
    n: 10000,
    topology: "erdos",
    probability: 0.0004,
    maxInteractions: 300,
  });
  s.step();
  const v = s.view();
  assert.equal(v.agents.length, 650);
  assert.equal(v.sampled, true);
  assert.ok(s.edges.size < 30000);
  assert.ok(s.lastBatch.length <= 300);
});
test("local LLM plans determine the actual action and recorded transition", () => {
  const s = new Simulation({
    n: 2,
    topology: "erdos",
    probability: 1,
    activation: 1,
  });
  for (const a of s.agents.values()) {
    a.traits[14] = 0;
    a.traits[2] = 1;
    a.mood = 1;
  }
  const plans = new Map<number, CognitionPlan>([
    [
      0,
      {
        target: 1,
        action: "argue",
        text: "I disagree with that decision.",
        cognition: {
          model: "test-local",
          inputTokens: 20,
          outputTokens: 8,
          latencyMs: 1,
          response: "recorded",
        },
      },
    ],
  ]);
  for (let i = 0; i < 10; i++) {
    s.step(plans);
    if (s.events.some((e) => e.cognition)) break;
  }
  const event = s.events.find((e) => e.cognition)!;
  assert.ok(event);
  assert.equal(event.action, "argue");
  assert.equal(event.text, "I disagree with that decision.");
  assert.ok(event.delta < 0);
});
test("paired replication experiments produce reproducible run-level statistics", async () => {
  const config = { ...structuredClone(DEFAULT_CONFIG), n: 15 },
    spec = {
      variable: "agreeableness" as const,
      values: [0.2, 0.8],
      replications: 3,
      steps: 5,
      outcome: "density" as const,
      seed: "exp-unit",
    };
  const a = await experiment(
      config,
      spec,
      () => {},
      () => false,
    ),
    b = await experiment(
      config,
      spec,
      () => {},
      () => false,
    );
  assert.deepEqual(a, b);
  assert.equal(a.rows.length, 6);
  assert.equal(a.groups[0].n, 3);
  assert.equal(a.rows[0].seed, a.rows[3].seed);
  assert.ok(a.comparisons.every((c) => c.p > 0 && c.adjustedP >= c.p));
  assert.throws(() => validateExperiment({ ...spec, replications: 1 }, config));
});
test("network export formats preserve XML characters and CSV blocks formulas", () => {
  const s = new Simulation({ n: 3 });
  s.agents.get(0)!.name = "A & <B>";
  assert.ok(graphml(s.serialize()).includes("A &amp; &lt;B&gt;"));
  assert.ok(gexf(s.serialize()).includes("A &amp; &lt;B&gt;"));
  assert.ok(csv([{ name: "=SUM(A1)", x: -0.5 }]).includes("'=SUM(A1)"));
});
