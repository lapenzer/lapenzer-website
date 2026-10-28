import type { ModelSuite, RpaGraph } from "./rpaFrameworkV4";

export function responseMeta(graph: RpaGraph, suite: ModelSuite | null, started: number, seed: number, provenance: string[]) {
  return {
    model_version: suite ? (suite.champion === "neural" ? suite.neural.version : suite.champion === "gbm" ? suite.gbm.version : suite.conditional.version) : "untrained",
    feature_schema_version: suite?.featureSchemaVersion ?? "rpa_v3_18+rpa_v4_context",
    graph_version: graph.graphVersion,
    context_timestamp: new Date().toISOString(),
    data_timestamp: graph.provider?.timestamp ?? graph.generatedAt,
    random_seed: seed,
    latency_ms: Date.now() - started,
    provenance,
  };
}
