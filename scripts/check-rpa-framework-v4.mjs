import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FEATURE_NAMES } from "../lib/rpaV3.ts";

const srcPath = path.resolve("lib/rpaFrameworkV4.ts");
const uiPath = path.resolve("components/RPALabV4.tsx");
const tempPath = path.resolve("lib/_rpaFrameworkV4.acceptance.ts");
const source = await fs.readFile(srcPath, "utf8");
await fs.writeFile(tempPath, source.replace('from "./rpaV3"', 'from "./rpaV3.ts"'));
let rpa;
try { rpa = await import(`${pathToFileURL(tempPath).href}?t=${Date.now()}`); }
finally { await fs.rm(tempPath, { force: true }); }

const expected = ["lp_o3","lp_o2","lp_o1","lp_o1_decay","lp_o1_recent","lp_dest","seen_o1","lp_o3_x_ctx3","lp_o2_x_ctx2","cos_momentum","cos_heading","abs_turn","dest_progress","cos_to_map_dest","wx_cand","revisit","backtrack","log_step"];
assert.deepEqual([...FEATURE_NAMES], expected, "rpa_v3 18-feature contract changed");

const cfg = { targetNodes: 6, userMaxNodes: 8, systemCap: 20, density: .12, direction: "bidirectional", topology: "tree", seed: 4242, ensureConnected: true, nodeWeightDistribution: "lognormal", edgeWeightDistribution: "uniform", domain: "road" };
const g1 = rpa.generateRandomGraph(cfg), g2 = rpa.generateRandomGraph(cfg);
assert.equal(g1.nodes.length, 6); assert.equal(g1.fingerprint, g2.fingerprint, "same seed must reproduce graph");
assert.ok(g1.nodes.length <= cfg.userMaxNodes && cfg.userMaxNodes <= cfg.systemCap);
for (const e of g1.edges) assert.ok(g1.edges.some((r) => r.from === e.to && r.to === e.from), "bidirectional graph missing reverse edge");
const g3 = rpa.generateRandomGraph({ ...cfg, seed: cfg.seed + 1 }); assert.notEqual(g1.fingerprint, g3.fingerprint, "fresh seed should generate fresh graph");

const edge = { ...g1.edges[0], distanceKm: 1.2, terrain: .7, movement: .4, logistics: .3, weather: .6, risk: .8, interest: .2, asset: .4 };
const node = g1.nodes.find((n) => n.id === edge.to);
const mats = rpa.dynamicMatrices(edge, node, { stress: .5 });
assert.deepEqual(mats.map((m) => m.name), ["distance","terrain","movement","logistics","weather","risk","interest","asset"]);
assert.ok(mats.every((m) => m.provenance && m.units && Number.isFinite(m.normalized) && Number.isFinite(m.coefficient)));

const distances = [1, 2, 4], p = rpa.distanceOnlyProbability(distances, .7), raw = distances.map((d) => Math.exp(-.7*d)), z = raw.reduce((a,b)=>a+b,0);
p.forEach((v,i)=>assert.ok(Math.abs(v-raw[i]/z)<1e-12, "distance-only special case broken"));
const pu = rpa.candidateUtilityProbabilities([{ betaDot:0,node:g1.nodes[0],resistance:1},{ betaDot:0,node:{...g1.nodes[1],attractionOverride:4},resistance:1 }]); assert.ok(pu[1]>pu[0], "node attractiveness does not affect probability");
assert.equal(rpa.bayesianShrinkage(0,0,.3,20), .3);

const start = g1.nodes[0], obs = { id:"o", timestamp:1, x:start.x, y:start.y, accuracyMeters:1, origin:"synthetic" };
const states = rpa.mapMatchObservation(g1, obs); assert.equal(states[0].nodeId, start.id); assert.ok(Math.abs(states.reduce((s,x)=>s+x.probability,0)-1)<1e-9);

const trajectories = rpa.syntheticTrainingSet(g1, 360, 77), destinations = rpa.pickIndependentDestinations(g1), suite = rpa.trainModelSuite(g1, trajectories, destinations, rpa.makeDomainAdapterV4("road"), 91);
assert.equal(suite.neural.status, "trained", "mandatory neural ranker did not train");
assert.equal(suite.irl.status, "trained", "MaxEnt IRL did not train");
assert.ok(Number.isFinite(suite.neural.bestValidationNll));
const history = trajectories.find((t)=>t.nodes.length>2)?.nodes.slice(0,1) ?? [start.id];
const candidates = rpa.evaluateCandidatesV4({ graph:g1, suite, history, context:{stress:.45, nowDay:999}, seed:92 });
assert.ok(candidates.length>0); assert.ok(candidates.every((c)=>c.sources.length>0));
assert.ok(Math.abs(candidates.reduce((s,c)=>s+c.probabilities.champion,0)-1)<1e-8);
assert.ok(candidates.some((c)=>c.sources.includes("irl")), "IRL provenance absent");
const post = rpa.destinationPosteriorWithUnknown(suite.conditional, history); assert.ok(post.some((x)=>x.id==="OTHER/UNKNOWN")); assert.ok(Math.abs(post.reduce((s,x)=>s+x.probability,0)-1)<1e-9);

const snap = rpa.makePredictionSnapshot({ graph:g1, suite, history, context:{stress:.45,nowDay:999}, observations:[obs], seed:93 });
assert.ok(!("observedNext" in snap), "pre-outcome snapshot leaked outcome");
if (snap.topNext) { const residual = rpa.measuredVsExpected(snap, snap.topNext); assert.ok(Number.isFinite(residual.brier)); }
const rollouts = rpa.monteCarloRollouts({graph:g1,suite,history,context:{stress:.45},samples:80,horizon:4,seed:94});
const occupancy = rpa.futureOccupancyFromRollouts(rollouts, history.length); for (const h of new Set(occupancy.map((x)=>x.horizon))) assert.ok(occupancy.filter((x)=>x.horizon===h).reduce((s,x)=>s+x.probability,0)<=1+1e-9);
const contract = rpa.createDomainContract("road"); assert.equal(contract.name,"road"); assert.ok(contract.destination_hypotheses(g1).length>0);

const ui = await fs.readFile(uiPath, "utf8");
assert.match(ui, /HIDDEN FROM RPA/); assert.doesNotMatch(ui, /Known destination<select/);
assert.match(source, /stableSoftmax/); assert.match(source, /LEGACY COMPATIBILITY/); assert.doesNotMatch(source, /Manhattan distance/i);
console.log("RPA v4 acceptance checks passed", { nodes:g1.nodes.length, edges:g1.edges.length, champion:suite.champion, neural:suite.neural.version, irl:suite.irl.version, candidates:candidates.length });
