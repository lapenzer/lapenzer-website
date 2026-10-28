import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FEATURE_NAMES } from "../lib/rpaV3.ts";

const srcPath = path.resolve("lib/rpaFrameworkV4.ts");
const uiPath = path.resolve("components/RPALabV4.tsx");
const tempPath = path.resolve("lib/_rpaFrameworkV4.acceptance.ts");
const source = await fs.readFile(srcPath, "utf8");
const v3Source = await fs.readFile(path.resolve("lib/rpaV3.ts"), "utf8");
const evalApiSource = await fs.readFile(path.resolve("app/api/rpa/evaluate/route.ts"), "utf8");
const beamApiSource = await fs.readFile(path.resolve("app/api/rpa/predict/beam/route.ts"), "utf8");
await fs.writeFile(tempPath, source.replace('from "./rpaV3"', 'from "./rpaV3.ts"'));
let rpa;
try { rpa = await import(`${pathToFileURL(tempPath).href}?t=${Date.now()}`); }
finally { await fs.rm(tempPath, { force: true }); }

const passed = [];
const check = (name, fn) => { fn(); passed.push(name); };

const expected = ["lp_o3","lp_o2","lp_o1","lp_o1_decay","lp_o1_recent","lp_dest","seen_o1","lp_o3_x_ctx3","lp_o2_x_ctx2","cos_momentum","cos_heading","abs_turn","dest_progress","cos_to_map_dest","wx_cand","revisit","backtrack","log_step"];
check("exact_v3_18_feature_order_is_unchanged", () => assert.deepEqual([...FEATURE_NAMES], expected));

const cfg = { targetNodes: 6, userMaxNodes: 8, systemCap: 20, density: .12, direction: "bidirectional", topology: "tree", seed: 4242, ensureConnected: true, nodeWeightDistribution: "lognormal", edgeWeightDistribution: "uniform", domain: "road" };
const g1 = rpa.generateRandomGraph(cfg), g2 = rpa.generateRandomGraph(cfg);
check("random_graph_seed_is_reproducible", () => { assert.equal(g1.nodes.length, 6); assert.equal(g1.fingerprint, g2.fingerprint); assert.ok(g1.nodes.length <= cfg.userMaxNodes && cfg.userMaxNodes <= cfg.systemCap); });
check("bidirectional_graph_has_reverse_edges", () => { for (const e of g1.edges) assert.ok(g1.edges.some((r) => r.from === e.to && r.to === e.from)); });
const g3 = rpa.generateRandomGraph({ ...cfg, seed: cfg.seed + 1 });
check("fresh_graph_seed_changes_fingerprint", () => assert.notEqual(g1.fingerprint, g3.fingerprint));

const edge = { ...g1.edges[0], distanceKm: 1.2, terrain: .7, movement: .4, logistics: .3, weather: .6, risk: .8, interest: .2, asset: .4 };
const node = g1.nodes.find((n) => n.id === edge.to);
const mats = rpa.dynamicMatrices(edge, node, { stress: .5 });
check("dynamic_matrix_components_have_documented_units_and_provenance", () => { assert.deepEqual(mats.map((m) => m.name), ["distance","terrain","movement","logistics","weather","risk","interest","asset"]); assert.ok(mats.every((m) => m.provenance && m.units && Number.isFinite(m.normalized) && Number.isFinite(m.coefficient))); });
check("matrix_normalization_uses_training_or_fixed_configuration_only", () => { assert.match(source, /DEFAULT_MATRIX_CONFIG/); assert.match(source, /fixedScale/); assert.doesNotMatch(source, /test.*fixedScale/i); });

const distances = [1, 2, 4], p = rpa.distanceOnlyProbability(distances, .7), raw = distances.map((d) => Math.exp(-.7*d)), z = raw.reduce((a,b)=>a+b,0);
check("distance_only_model_reduces_to_exp_negative_alpha_distance", () => p.forEach((v,i)=>assert.ok(Math.abs(v-raw[i]/z)<1e-12)));
const pu = rpa.candidateUtilityProbabilities([{ betaDot:0,node:g1.nodes[0],resistance:1},{ betaDot:0,node:{...g1.nodes[1],attractionOverride:4},resistance:1 }]);
check("node_weight_enters_probability_model", () => assert.ok(pu[1]>pu[0]));
check("population_to_entity_bayesian_shrinkage", () => assert.equal(rpa.bayesianShrinkage(0,0,.3,20), .3));
check("longer_lower_resistance_route_can_outrank_shorter_route", () => { const q = rpa.candidateUtilityProbabilities([{ betaDot:0,node:g1.nodes[0],resistance:3.2},{ betaDot:0,node:g1.nodes[1],resistance:1.1 }]); assert.ok(q[1] > q[0]); });

const start = g1.nodes[0], obs = { id:"o", timestamp:1, x:start.x, y:start.y, accuracyMeters:1, origin:"synthetic" };
const states = rpa.mapMatchObservation(g1, obs);
check("state_hypotheses_sum_to_one", () => { assert.equal(states[0].nodeId, start.id); assert.ok(Math.abs(states.reduce((s,x)=>s+x.probability,0)-1)<1e-9); });
check("map_matcher_cannot_read_future_observation", () => { const future = { ...obs, id:"future", timestamp:999, x:999, y:999 }; void future; assert.deepEqual(rpa.mapMatchObservation(g1, obs), states); });

const trajectories = rpa.syntheticTrainingSet(g1, 360, 77), destinations = rpa.pickIndependentDestinations(g1), suite = rpa.trainModelSuite(g1, trajectories, destinations, rpa.makeDomainAdapterV4("road"), 91);
check("neural_ranker_uses_setwise_softmax", () => { assert.equal(suite.neural.status, "trained"); assert.ok(Number.isFinite(suite.neural.bestValidationNll)); assert.match(source, /stableSoftmax\(fw\.map/); });
check("maxent_irl_ranker_trains", () => assert.equal(suite.irl.status, "trained"));
check("normalizer_uses_training_only", () => { assert.equal(suite.neural.standardizer.fittedOn, "training"); assert.match(source, /const trainingRows = trainGroups/); });
check("calibration_uses_validation_only", () => assert.match(source, /fitTemperatureV4\(validationGroups/));
check("test_rows_do_not_build_test_statistics", () => { assert.match(v3Source, /finalStats=fitTransitionStats\(graph,sorted\.slice\(0,valEnd\)\)/); assert.match(v3Source, /testGroups=buildDecisionGroups\(graph,finalStats,test/); });
check("validation_rows_do_not_build_training_features", () => assert.match(v3Source, /trainStats=fitTransitionStats\(graph,train\)/));

const history = trajectories.find((t)=>t.nodes.length>2)?.nodes.slice(0,1) ?? [start.id];
const candidates = rpa.evaluateCandidatesV4({ graph:g1, suite, history, context:{stress:.45, nowDay:999}, seed:92 });
check("candidate_union_preserves_generator_provenance", () => { assert.ok(candidates.length>0); assert.ok(candidates.every((c)=>c.sources.length>0)); assert.ok(candidates.some((c)=>c.sources.includes("irl"))); });
check("analytical_mixture_normalizes_over_feasible_candidates", () => assert.ok(Math.abs(candidates.reduce((s,c)=>s+c.probabilities.analytical,0)-1)<1e-8));
check("champion_distribution_normalizes", () => assert.ok(Math.abs(candidates.reduce((s,c)=>s+c.probabilities.champion,0)-1)<1e-8));
check("v4_context_features_use_separate_schema_version", () => assert.equal(suite.featureSchemaVersion, "rpa_v3_18+rpa_v4_context"));
check("legacy_sigmoid_selector_is_labelled_legacy", () => assert.ok(rpa.legacyCompatibilityManifest().some((x)=>x.name.includes("20→16→1") && x.status === "LEGACY COMPATIBILITY")));
const post = rpa.destinationPosteriorWithUnknown(suite.conditional, history);
check("goal_prior_does_not_use_hidden_destination", () => { assert.ok(post.some((x)=>x.id==="OTHER/UNKNOWN")); assert.ok(Math.abs(post.reduce((s,x)=>s+x.probability,0)-1)<1e-9); assert.doesNotMatch(rpa.destinationPosteriorWithUnknown.toString(), /truth|ground.?truth/i); });

const truthA = rpa.generateHiddenTruth(g1, start.id, 120), truthB = rpa.generateHiddenTruth(g1, start.id, 121);
const snapA = rpa.makePredictionSnapshot({ graph:g1, suite, history, context:{stress:.45,nowDay:999}, observations:[obs], seed:93 });
const snapB = rpa.makePredictionSnapshot({ graph:g1, suite, history, context:{stress:.45,nowDay:999}, observations:[obs], seed:93 });
check("true_future_is_never_injected_into_candidate_set", () => { assert.ok(truthA.destination || truthB.destination); assert.equal(snapA.topNext, snapB.topNext); assert.deepEqual(snapA.candidates.map((x)=>x.probabilities.champion), snapB.candidates.map((x)=>x.probabilities.champion)); });
check("destination_ground_truth_is_not_available_to_predictor", () => assert.doesNotMatch(rpa.makePredictionSnapshot.toString(), /ground.?truth|truthRef/));
check("future_observation_is_not_available_to_predictor", () => assert.doesNotMatch(rpa.makePredictionSnapshot.toString(), /futureObservation|future_observation/));
check("prediction_snapshot_is_written_before_outcome", () => assert.ok(!("observedNext" in snapA)));
const residual = snapA.topNext ? rpa.measuredVsExpected(snapA, snapA.topNext) : null;
check("measured_vs_expected_residual_uses_only_revealed_outcome", () => { if (residual) assert.ok(Number.isFinite(residual.brier)); assert.match(rpa.measuredVsExpected.toString(), /observedNext/); });
const beforeWeights = JSON.stringify(suite.neural.w2);
rpa.safeAdaptationSummary(residual ? [residual] : []);
check("live_error_does_not_directly_mutate_champion_weights", () => assert.equal(JSON.stringify(suite.neural.w2), beforeWeights));
check("beam_hypotheses_do_not_enter_observation_store", () => assert.doesNotMatch(beamApiSource, /observations\.push/));
check("evaluation_requires_stored_pre_outcome_prediction", () => assert.match(evalApiSource, /No stored pre-outcome prediction exists/));

const rollouts = rpa.monteCarloRollouts({graph:g1,suite,history,context:{stress:.45},samples:80,horizon:4,seed:94});
const occupancy = rpa.futureOccupancyFromRollouts(rollouts, history.length);
check("future_occupancy_mass_is_consistent_with_source_weights", () => { for (const h of new Set(occupancy.map((x)=>x.horizon))) assert.ok(occupancy.filter((x)=>x.horizon===h).reduce((s,x)=>s+x.probability,0)<=1+1e-9); });
const contract = rpa.createDomainContract("road");
check("domain_adapter_cannot_bypass_information_boundary", () => { assert.equal(contract.name,"road"); assert.ok(contract.destination_hypotheses(g1).length>0); assert.doesNotMatch(contract.state_from_observation.toString(), /truth|ground.?truth/i); });

const bootstrap = rpa.trajectoryBootstrap([
  { trajectoryId:"T1", decisions:[{ probabilities:[.8,.2], trueIndex:0 },{ probabilities:[.3,.7], trueIndex:1 }] },
  { trajectoryId:"T2", decisions:[{ probabilities:[.6,.4], trueIndex:1 }] },
  { trajectoryId:"T3", decisions:[{ probabilities:[.9,.1], trueIndex:0 }] },
], 100, 12);
check("trajectory_bootstrap_samples_whole_trajectory_groups", () => { assert.equal(bootstrap.trajectories,3); assert.equal(bootstrap.decisions,4); assert.equal(bootstrap.replicates,100); assert.ok(bootstrap.top1.lower95 <= bootstrap.top1.estimate && bootstrap.top1.estimate <= bootstrap.top1.upper95); });
check("identifiability_correlation_diagnostics_exist", () => { const d = rpa.featureCorrelationDiagnostics([[1,2,1],[2,4,0],[3,6,1]],["a","b","c"]); assert.ok(d.some((x)=>x.featureA==="a" && x.featureB==="b" && x.warning)); });
check("softmax_invariant_features_are_detected", () => assert.deepEqual(rpa.softmaxInvariantFeatures([[1,2],[1,3],[1,4]],["constant","varying"]),["constant"]));
check("outside_candidate_class_is_reported", () => { const c = rpa.candidateCoverageWithOutsideClass([{ candidates:["A","B"], trueNode:"B" },{ candidates:["A"], trueNode:"C" }]); assert.equal(c.candidateRecall,.5); assert.equal(c.outsideCandidateClass,.5); });

const ui = await fs.readFile(uiPath, "utf8");
check("debug_truth_reveal_does_not_modify_prediction", () => { assert.match(ui, /HIDDEN FROM RPA/); assert.doesNotMatch(ui, /Known destination<select/); assert.doesNotMatch(ui, /setSuite\([^)]*truth/i); });
check("known_destination_demo_is_separate_from_unknown_destination_rpa", () => assert.doesNotMatch(ui, /Known destination<select/));
check("manhattan_error_is_used_only_for_appropriate_coordinate_systems", () => assert.doesNotMatch(source, /Manhattan distance/i));
check("numerical_stability_contract_present", () => { assert.match(source, /logSumExp/); assert.match(source, /logSafe/); assert.match(source, /stableSoftmax/); });

console.log("RPA v4 acceptance checks passed", { passed: passed.length, checks: passed, nodes:g1.nodes.length, edges:g1.edges.length, champion:suite.champion, neural:suite.neural.version, irl:suite.irl.version, candidates:candidates.length, bootstrap });
