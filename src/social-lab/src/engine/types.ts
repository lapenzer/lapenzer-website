export const VERSION = "AISNL-1.0.0";
export const TRAITS = [
  "Openness",
  "Conscientiousness",
  "Extraversion",
  "Agreeableness",
  "Neuroticism",
  "Cognitive ability",
  "Emotional stability",
  "Empathy",
  "Honesty",
  "Narcissism",
  "Machiavellianism",
  "Impulsiveness",
  "Risk tolerance",
  "Aggression",
  "Social anxiety",
  "Curiosity",
  "Conformity",
  "Approval seeking",
  "Persuasiveness",
  "Suggestibility",
  "Trust propensity",
  "Cooperativeness",
  "Competitiveness",
  "Irrationality",
  "Self-interest",
  "Loyalty",
  "In-group preference",
] as const;
export type Topology =
  | "block"
  | "erdos"
  | "smallworld"
  | "preferential"
  | "geometric"
  | "scalefree"
  | "empty"
  | "custom";
export type Relationship =
  | "friendship"
  | "acquaintance"
  | "rivalry"
  | "romantic"
  | "professional"
  | "family"
  | "influence"
  | "trust"
  | "group";
export type Action =
  | "cooperate"
  | "argue"
  | "persuade"
  | "deceive"
  | "gossip"
  | "observe"
  | "reject"
  | "connect"
  | "disconnect"
  | "intervention"
  | "post";
export interface Config {
  n: number;
  seed: string;
  topology: Topology;
  directed: boolean;
  groups: number;
  degree: number;
  probability: number;
  rewire: number;
  within: number;
  between: number;
  radius: number;
  exponent: number;
  activation: number;
  exploration: number;
  homophily: number;
  learning: number;
  decay: number;
  conflict: number;
  mean: number[];
  sd: number;
  correlation: number;
  distribution: "normal" | "uniform" | "bimodal";
  mode: "statistical" | "hybrid" | "llm";
  llmModel: string;
  llmBudget: number;
  maxInteractions: number;
  customEdges: string;
}
export const DEFAULT_CONFIG: Config = {
  n: 100,
  seed: "social-2048",
  topology: "block",
  directed: false,
  groups: 4,
  degree: 6,
  probability: 0.055,
  rewire: 0.18,
  within: 0.22,
  between: 0.012,
  radius: 0.15,
  exponent: 2.5,
  activation: 0.22,
  exploration: 0.12,
  homophily: 0.6,
  learning: 0.12,
  decay: 0.004,
  conflict: 0.25,
  mean: TRAITS.map(() => 0.5),
  sd: 0.21,
  correlation: 0.35,
  distribution: "normal",
  mode: "statistical",
  llmModel: "",
  llmBudget: 50,
  maxInteractions: 2500,
  customEdges: "",
};
export interface Agent {
  id: number;
  name: string;
  age: number;
  group: number;
  traits: number[];
  opinion: number;
  mood: number;
  energy: number;
  informed: boolean;
  goals: string[];
  memory: number[];
  x: number;
  y: number;
}
export interface Edge {
  id: string;
  source: number;
  target: number;
  weight: number;
  trust: number;
  types: Relationship[];
  locked: boolean;
  created: number;
  updated: number;
}
export interface Event {
  id: number;
  tick: number;
  source: number;
  target: number;
  action: Action;
  sentiment: number;
  text: string;
  delta: number;
  trace: { policy: string; [key: string]: number | string | boolean };
  cognition?: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    response: string;
  };
}
export interface Metrics {
  tick: number;
  nodes: number;
  edges: number;
  density: number;
  averageDegree: number;
  isolation: number;
  polarization: number;
  meanTrust: number;
  cooperation: number;
  conflict: number;
  informed: number;
  formed: number;
  dissolved: number;
  closure: number;
  meanMood: number;
  communities: number;
}
export interface Serialized {
  version: string;
  config: Config;
  rng: number;
  tick: number;
  agents: Agent[];
  edges: Edge[];
  events: Event[];
  metrics: Metrics[];
  counters: {
    nextEvent: number;
    cooperate: number;
    conflict: number;
    interactions: number;
    formed: number;
    dissolved: number;
    closure: number;
    llmCalls: number;
    inputTokens: number;
    outputTokens: number;
    prunedEvents: number;
  };
  lineage: { parent: string | null; branchTick: number | null };
}
export interface View {
  tick: number;
  config: Config;
  agents: (Agent & { degree: number })[];
  edges: Edge[];
  metrics: Metrics[];
  events: Event[];
  totalAgents: number;
  totalEdges: number;
  sampled: boolean;
  checkpoints: number[];
  counters: Serialized["counters"];
  lineage: Serialized["lineage"];
}
export interface Analysis {
  summary: Record<string, number | null>;
  degrees: number[];
  communitySizes: number[];
  centrality: {
    id: number;
    name: string;
    degree: number;
    inDegree: number;
    outDegree: number;
    pagerank: number;
    betweenness: number;
    closeness: number;
    eigenvector: number;
    community: number;
  }[];
  method: {
    paths: string;
    centrality: string;
    projection: string;
    interpretation: string;
  };
}
export type Intervention = {
  kind: "opinion" | "trait" | "remove" | "add" | "edge" | "shock" | "group";
  agent?: number;
  trait?: number;
  value?: number;
  target?: number;
  edgeType?: Relationship;
  locked?: boolean;
  remove?: boolean;
};
export interface ExperimentSpec {
  variable: "agreeableness" | "aggression" | "homophily" | "exploration";
  values: number[];
  replications: number;
  steps: number;
  outcome:
    "density" | "polarization" | "isolation" | "cooperation" | "meanTrust";
  seed: string;
}
export interface RunResult {
  level: number;
  replicate: number;
  seed: string;
  value: number;
  metrics: Metrics;
}
export interface ExperimentResult {
  spec: ExperimentSpec;
  config: Config;
  rows: RunResult[];
  groups: {
    level: number;
    mean: number;
    sd: number;
    lo: number;
    hi: number;
    n: number;
  }[];
  comparisons: {
    level: number;
    difference: number;
    lo: number;
    hi: number;
    p: number;
    adjustedP: number;
    effect: number | null;
  }[];
  method: string;
  version: string;
}
