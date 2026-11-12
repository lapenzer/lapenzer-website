import { Random, clamp, mean, variance } from "./random";
import {
  Agent,
  Config,
  DEFAULT_CONFIG,
  Edge,
  Event,
  Intervention,
  Metrics,
  Serialized,
  TRAITS,
  VERSION,
  View,
  Relationship,
  Action,
} from "./types";
const FIRST = [
  "Alex",
  "Morgan",
  "Sam",
  "Riley",
  "Jordan",
  "Casey",
  "Taylor",
  "Avery",
  "Robin",
  "Jamie",
  "Cameron",
  "Drew",
  "Ellis",
  "Skyler",
  "Quinn",
  "Reese",
  "Rowan",
  "Finley",
  "Sage",
  "Emery",
];
const LAST = [
  "Reed",
  "Chen",
  "Patel",
  "Brooks",
  "Silva",
  "Kim",
  "Rivera",
  "Shah",
  "Park",
  "Blake",
  "Rao",
  "Diaz",
  "Bennett",
  "Ali",
  "Lee",
  "Stone",
  "Santos",
  "Okafor",
  "Roy",
  "Miller",
];
const MAX_EDGES = 600000;
const MAX_EVENTS = 20000;
const KEY = (a: number, b: number, directed: boolean) =>
  directed ? `${a}:${b}` : `${Math.min(a, b)}:${Math.max(a, b)}`;
const copy = <T>(v: T): T => structuredClone(v);
export interface CognitionPlan {
  target: number;
  action: Action;
  text: string;
  cognition: NonNullable<Event["cognition"]>;
}
export class Simulation {
  config: Config;
  rng: Random;
  agents: Map<number, Agent> = new Map();
  edges: Map<string, Edge> = new Map();
  adj: Map<number, Set<number>> = new Map();
  tick = 0;
  events: Event[] = [];
  series: Metrics[] = [];
  checkpoints: Map<number, Serialized> = new Map();
  counters: Serialized["counters"] = {
    nextEvent: 1,
    cooperate: 0,
    conflict: 0,
    interactions: 0,
    formed: 0,
    dissolved: 0,
    closure: 0,
    llmCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    prunedEvents: 0,
  };
  lineage: Serialized["lineage"] = { parent: null, branchTick: null };
  lastBatch: Event[] = [];
  retainHistory = true;
  constructor(config: Partial<Config> = {}) {
    this.config = copy({
      ...DEFAULT_CONFIG,
      ...config,
      mean: config.mean ?? DEFAULT_CONFIG.mean,
    });
    this.validate();
    this.rng = new Random(this.config.seed);
    for (let i = 0; i < this.config.n; i++) this.createAgent(i);
    this.generate();
    this.measure();
    this.checkpoint(true);
  }
  validate() {
    const c = this.config;
    if (!Number.isSafeInteger(c.n) || c.n < 1 || c.n > 100000)
      throw Error("Choose an integer population from 1 to 100,000.");
    for (const k of [
      "probability",
      "rewire",
      "within",
      "between",
      "activation",
      "exploration",
      "homophily",
      "learning",
      "decay",
      "conflict",
      "sd",
      "correlation",
    ] as const)
      if (!Number.isFinite(c[k]) || c[k] < 0 || c[k] > 1)
        throw Error(`Invalid ${k}. Expected a value between 0 and 1.`);
    if (!Number.isInteger(c.groups) || c.groups < 1 || c.groups > 20)
      throw Error("Use 1–20 initial groups.");
    if (c.degree < 0 || c.degree > 100 || !Number.isFinite(c.degree))
      throw Error("Expected degree must be between 0 and 100.");
    if (
      c.mean.length !== TRAITS.length ||
      c.mean.some((v) => !Number.isFinite(v) || v < 0 || v > 1)
    )
      throw Error("Invalid trait distribution.");
    if (
      !["normal", "uniform", "bimodal"].includes(c.distribution) ||
      !["statistical", "hybrid", "llm"].includes(c.mode)
    )
      throw Error("Unsupported simulation mode or distribution.");
    if (
      !Number.isFinite(c.radius) ||
      c.radius <= 0 ||
      c.radius > 1.5 ||
      !Number.isFinite(c.exponent) ||
      c.exponent < 2 ||
      c.exponent > 4
    )
      throw Error("Invalid geometric radius or power-law exponent.");
    if (
      !Number.isInteger(c.maxInteractions) ||
      c.maxInteractions < 1 ||
      c.maxInteractions > 10000
    )
      throw Error("Interaction budget must be 1–10,000.");
    const n = c.n,
      p =
        c.topology === "erdos"
          ? c.probability
          : c.topology === "block"
            ? c.within / c.groups + c.between * (1 - 1 / c.groups)
            : c.topology === "geometric"
              ? Math.min(1, Math.PI * c.radius * c.radius)
              : 0;
    if ((n * (n - 1) * p) / (c.directed ? 1 : 2) > MAX_EDGES)
      throw Error(
        "This topology would exceed 600,000 edges. Lower connection probability or radius for a sparse large-population run.",
      );
  }
  createAgent(id: number) {
    const r = this.rng,
      c = this.config,
      z = r.normal();
    const traits = c.mean.map((m, i) => {
      const load =
        ([3, 7, 8, 21].includes(i)
          ? 1
          : [9, 10, 13, 22, 24].includes(i)
            ? -1
            : 0) * c.correlation;
      let noise =
        c.distribution === "uniform"
          ? (r.next() - 0.5) * Math.sqrt(12)
          : c.distribution === "bimodal"
            ? (r.next() < 0.5 ? -0.9 : 0.9) + r.normal() * 0.45
            : r.normal();
      return clamp(m + c.sd * (load * z + Math.sqrt(1 - load * load) * noise));
    });
    const group = id % c.groups;
    const agent: Agent = {
      id,
      name: `${FIRST[id % FIRST.length]} ${LAST[Math.floor(id / FIRST.length) % LAST.length]}${id >= 400 ? " " + (Math.floor(id / 400) + 1) : ""}`,
      age: 18 + r.int(60),
      group,
      traits,
      opinion: clamp(
        (group / Math.max(1, c.groups - 1) - 0.5) * 1.1 + r.normal() * 0.3,
        -1,
        1,
      ),
      mood: r.normal() * 0.15,
      energy: 0.5 + r.next() * 0.5,
      informed: false,
      goals: [
        traits[2] > 0.55 ? "Build connections" : "Find belonging",
        traits[22] > 0.55 ? "Gain influence" : "Build trust",
      ],
      memory: [],
      x: r.next(),
      y: r.next(),
    };
    this.agents.set(id, agent);
    this.adj.set(id, new Set());
    return agent;
  }
  addEdge(
    a: number,
    b: number,
    weight = 0.2,
    types: Relationship[] = ["acquaintance"],
    locked = false,
  ) {
    if (a === b || !this.agents.has(a) || !this.agents.has(b)) return undefined;
    const id = KEY(a, b, this.config.directed);
    const old = this.edges.get(id);
    if (old) return old;
    if (this.edges.size >= MAX_EDGES) return undefined;
    const edge: Edge = {
      id,
      source: a,
      target: b,
      weight: clamp(weight, -1, 1),
      trust: clamp(0.5 + weight * 0.3),
      types: [...types],
      locked,
      created: this.tick,
      updated: this.tick,
    };
    edge.trust = clamp(
      0.25 +
        (this.agents.get(a)!.traits[20] + this.agents.get(b)!.traits[20]) *
          0.25 +
        weight * 0.2,
    );
    this.edges.set(id, edge);
    this.adj.get(a)!.add(b);
    if (!this.config.directed) this.adj.get(b)!.add(a);
    return edge;
  }
  removeEdge(e: Edge) {
    this.edges.delete(e.id);
    this.adj.get(e.source)?.delete(e.target);
    if (!this.config.directed) this.adj.get(e.target)?.delete(e.source);
  }
  generate() {
    const c = this.config,
      n = c.n,
      r = this.rng;
    if (c.topology === "empty") return;
    const edge = (a: number, b: number) =>
      this.addEdge(
        a,
        b,
        0.08 + r.next() * 0.35,
        r.next() < 0.14 ? ["professional", "acquaintance"] : ["acquaintance"],
      );
    const randomBlock = (
      sources: number[],
      targets: number[],
      p: number,
      same: boolean,
    ) => {
      if (p <= 0) return;
      const log = Math.log1p(-Math.min(p, 1 - 1e-12));
      for (const a of sources) {
        let j = 0;
        while (j < targets.length) {
          if (p < 1)
            j += Math.floor(Math.log(Math.max(1e-12, 1 - r.next())) / log);
          if (j >= targets.length) break;
          const b = targets[j++];
          if (a !== b && (c.directed || !same || a < b)) edge(a, b);
        }
      }
    };
    const ids = [...this.agents.keys()];
    if (c.topology === "erdos") {
      randomBlock(ids, ids, c.probability, true);
    } else if (c.topology === "block") {
      const groups = Array.from({ length: c.groups }, (_, g) =>
        ids.filter((i) => i % c.groups === g),
      );
      for (let a = 0; a < c.groups; a++)
        for (let b = c.directed ? 0 : a; b < c.groups; b++)
          randomBlock(
            groups[a],
            groups[b],
            a === b ? c.within : c.between,
            a === b,
          );
    } else if (c.topology === "smallworld") {
      const k = Math.min(Math.floor(c.degree / 2), Math.floor((n - 1) / 2));
      for (let a = 0; a < n; a++)
        for (let j = 1; j <= k; j++) {
          let b = (a + j) % n;
          if (r.next() < c.rewire) {
            for (let tries = 0; tries < 20; tries++) {
              const candidate = r.int(n);
              if (
                candidate !== a &&
                !this.edges.has(KEY(a, candidate, c.directed))
              ) {
                b = candidate;
                break;
              }
            }
          }
          edge(a, b);
        }
    } else if (c.topology === "preferential" || c.topology === "scalefree") {
      const m = Math.max(1, Math.min(Math.round(c.degree / 2), n - 1)),
        urn: number[] = [];
      const fitness = ids.map(() =>
        c.topology === "scalefree"
          ? Math.pow(Math.max(1e-8, 1 - r.next()), -1 / (c.exponent - 1))
          : 1,
      );
      for (let a = 0; a < n; a++) {
        const chosen = new Set<number>();
        for (let t = 0; t < Math.min(m, a); t++) {
          let b = urn.length ? r.pick(urn) : r.int(Math.max(1, a));
          for (let tries = 0; tries < 30 && (chosen.has(b) || b === a); tries++)
            b = r.int(a);
          if (chosen.has(b) || b === a) continue;
          chosen.add(b);
          edge(a, b);
          const f = Math.min(12, Math.ceil(fitness[b]));
          for (let k = 0; k < f; k++) urn.push(b);
          urn.push(a);
        }
        urn.push(a);
      }
    } else if (c.topology === "geometric") {
      const cells = new Map<string, number[]>(),
        size = c.radius;
      for (const a of this.agents.values()) {
        const x = Math.floor(a.x / size),
          y = Math.floor(a.y / size);
        for (let dx = -1; dx <= 1; dx++)
          for (let dy = -1; dy <= 1; dy++)
            for (const id of cells.get(`${x + dx}:${y + dy}`) ?? []) {
              const b = this.agents.get(id)!;
              if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 < size ** 2) {
                edge(a.id, b.id);
                if (c.directed) edge(b.id, a.id);
              }
            }
        const key = `${x}:${y}`;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key)!.push(a.id);
      }
    } else if (c.topology === "custom") {
      for (const [index, line] of c.customEdges.trim().split("\n").entries()) {
        if (!line.trim()) continue;
        const values = line.split(",").map(Number),
          [a, b, w] = values;
        if (
          values.length < 2 ||
          !Number.isInteger(a) ||
          !Number.isInteger(b) ||
          !this.agents.has(a) ||
          !this.agents.has(b) ||
          a === b ||
          (w !== undefined && (!Number.isFinite(w) || w < -1 || w > 1))
        )
          throw Error(
            `Invalid custom edge on line ${index + 1}. Use source,target,weight.`,
          );
        this.addEdge(a, b, w ?? 0.3);
      }
    } else throw Error("Unknown network topology.");
  }
  record(
    source: number,
    target: number,
    action: Action,
    sentiment: number,
    text: string,
    delta: number,
    trace: Event["trace"],
  ) {
    const e: Event = {
      id: this.counters.nextEvent++,
      tick: this.tick,
      source,
      target,
      action,
      sentiment,
      text,
      delta,
      trace,
    };
    this.events.push(e);
    this.lastBatch.push(e);
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(0, this.events.length - MAX_EVENTS);
      this.counters.prunedEvents =
        this.counters.nextEvent - 1 - this.events.length;
    }
    return e;
  }
  step(plans?: Map<number, CognitionPlan>) {
    this.lastBatch = [];
    this.tick++;
    const ids = [...this.agents.keys()],
      r = this.rng,
      c = this.config;
    if (!ids.length) {
      this.measure();
      this.checkpoint();
      return;
    }
    const active = Math.min(
      c.maxInteractions,
      Math.ceil(ids.length * c.activation),
    );
    const used = new Set<number>();
    let attempts = 0;
    const plannedIds = [...(plans?.keys() ?? [])];
    let plannedIndex = 0;
    while (
      used.size < Math.min(ids.length, active) &&
      attempts < active * 4 + 10
    ) {
      attempts++;
      const a = this.agents.get(
        plannedIndex < plannedIds.length
          ? plannedIds[plannedIndex++]
          : r.pick(ids),
      )!;
      if (used.has(a.id)) continue;
      used.add(a.id);
      const plan = plans?.get(a.id);
      const t = a.traits;
      if (!plan && r.next() > 0.3 + 0.6 * t[2] + 0.1 * a.energy - 0.2 * t[14])
        continue;
      const neighbors = [...this.adj.get(a.id)!];
      let target: number | undefined;
      const explore =
        r.next() <
          clamp(
            c.exploration *
              (0.4 +
                t[15] +
                0.3 * t[0] +
                0.25 * t[12] +
                0.2 * t[11] -
                0.3 * t[25]),
          ) || !neighbors.length;
      if (plan) target = plan.target;
      else if (explore) {
        target = r.pick(ids);
      } else {
        const candidates = Array.from(
          { length: Math.min(5, neighbors.length) },
          () => r.pick(neighbors),
        );
        target = candidates.sort(
          (x, y) => this.partnerUtility(a, y) - this.partnerUtility(a, x),
        )[0];
      }
      if (target === a.id || target === undefined || !this.agents.has(target))
        continue;
      const b = this.agents.get(target)!;
      const id = KEY(a.id, b.id, c.directed);
      let e = this.edges.get(id);
      const similarity = 1 - Math.abs(a.opinion - b.opinion) / 2;
      const sameGroup = a.group === b.group ? 1 : 0;
      const reject =
        r.next() <
        clamp(
          0.04 +
            0.24 * b.traits[14] -
            0.12 * b.traits[2] -
            0.1 * similarity +
            0.18 * Math.max(0, -b.mood),
        );
      if (reject) {
        this.record(
          a.id,
          b.id,
          "reject",
          -0.2,
          `${b.name.split(" ")[0]} declines the invitation.`,
          0,
          {
            policy: "bounded-local-v1",
            similarity,
            exploration: explore,
            socialAnxiety: b.traits[14],
          },
        );
        a.mood = clamp(a.mood - 0.025, -1, 1);
        continue;
      }
      let action: Action = "cooperate";
      const distance = Math.abs(a.opinion - b.opinion),
        anger = (t[13] + b.traits[13]) / 2;
      const deception =
        (1 - t[8]) *
        (0.1 + 0.3 * t[10] + 0.2 * t[24] + 0.1 * t[9]) *
        (1 - 0.3 * t[1]);
      const conflict = clamp(
        c.conflict *
          (0.1 + anger + distance * 0.5 + 0.3 * t[22] + 0.2 * t[4]) *
          (1 - 0.4 * t[3] - 0.25 * t[7]),
      );
      const draw = r.next();
      if (draw < deception * 0.3) action = "deceive";
      else if (draw < deception * 0.3 + conflict) action = "argue";
      else if (distance > 0.35 && r.next() < 0.2 + 0.4 * t[18])
        action = "persuade";
      else if (a.memory.length && r.next() < 0.12 + 0.12 * t[2])
        action = "gossip";
      else if (r.next() < 0.04 + 0.08 * t[17] + 0.05 * t[9]) action = "post";
      else if (r.next() > 0.25 + 0.5 * t[21] + 0.2 * t[7]) action = "observe";
      if (plan) action = plan.action;
      let delta =
        0.025 + (0.05 * (t[3] + b.traits[3])) / 2 + 0.025 * similarity;
      let sentiment = 0.6;
      let text = "";
      const name = b.name.split(" ")[0];
      const influence =
        c.learning *
        (0.25 + t[18]) *
        (0.2 + b.traits[19]) *
        (0.3 + b.traits[20]) *
        (0.5 + b.traits[0]) *
        (e?.trust ?? 0.4);
      if (action === "argue") {
        sentiment = -0.65;
        delta = -0.035 - 0.11 * anger - 0.025 * distance;
        text = r.pick([
          `I disagree, ${name}. That argument does not hold up.`,
          `That is a terrible take, ${name}.`,
          `You keep missing the point. I am done with this argument.`,
        ]);
        b.opinion = clamp(
          b.opinion + Math.sign(b.opinion - a.opinion) * c.learning * 0.08,
          -1,
          1,
        );
        a.mood = clamp(a.mood - 0.08, -1, 1);
        b.mood = clamp(b.mood - 0.1, -1, 1);
        this.counters.conflict++;
      } else if (action === "deceive") {
        const caught = r.next() < 0.15 + 0.45 * b.traits[5];
        sentiment = caught ? -0.85 : 0.15;
        delta = caught ? -0.22 : 0.01;
        text = caught
          ? `${name} notices a contradiction in the story.`
          : `I heard the opposite. Trust me on this one.`;
        if (caught && e) e.trust = clamp(e.trust - 0.2);
        if (!caught) {
          b.opinion = clamp(
            b.opinion + (a.opinion - b.opinion) * influence * 1.2,
            -1,
            1,
          );
          b.informed = a.informed || b.informed;
        }
        this.counters.conflict += caught ? 1 : 0;
      } else if (action === "persuade") {
        text = `I see it differently, ${name}. Here is why I think we should reconsider.`;
        b.opinion = clamp(
          b.opinion + (a.opinion - b.opinion) * influence,
          -1,
          1,
        );
        delta *= 0.7;
        sentiment = 0.25;
      } else if (action === "gossip") {
        const memoryId = r.pick(a.memory),
          memory = this.events.findLast((v) => v.id === memoryId);
        text = memory
          ? `Did you hear about ${this.agents.get(memory.source)?.name ?? "someone in our circle"}? I am not sure we have the full story.`
          : `There is a story going around our circle. I am not sure it is true.`;
        sentiment = t[8] > 0.5 ? 0.2 : -0.2;
        delta = t[8] > 0.5 ? 0.025 : -0.02;
        if (a.informed) b.informed = true;
      } else if (action === "post") {
        text = `My current view is ${a.opinion > 0.15 ? "in favour of" : a.opinion < -0.15 ? "against" : "undecided on"} the proposal. What do people in our circle think?`;
        sentiment = 0.1;
        delta = 0.01;
        for (const neighbor of neighbors.slice(0, 12)) {
          const observer = this.agents.get(neighbor)!;
          if (a.informed) observer.informed = true;
          observer.opinion = clamp(
            observer.opinion +
              (a.opinion - observer.opinion) * c.learning * 0.015,
            -1,
            1,
          );
        }
      } else if (action === "observe") {
        text = `${a.name.split(" ")[0]} listens and holds back a response.`;
        delta = 0.005;
        sentiment = 0;
      } else {
        this.counters.cooperate++;
        text = r.pick([
          `Let us work together on this, ${name}.`,
          `I appreciate you showing up. I can help with that.`,
          `We do not agree on everything, but I will keep my word.`,
        ]);
        b.opinion = clamp(
          b.opinion + (a.opinion - b.opinion) * influence * 0.35,
          -1,
          1,
        );
        a.mood = clamp(a.mood + 0.045, -1, 1);
        b.mood = clamp(b.mood + 0.035, -1, 1);
        if (a.informed) b.informed = true;
      }
      this.counters.interactions++;
      const trace: Event["trace"] = {
        policy: "bounded-local-v1",
        similarity,
        sameGroup,
        exploration: explore,
        agreeableness: t[3],
        aggression: t[13],
        honesty: t[8],
        opinionDistance: distance,
        acceptance: true,
      };
      if (!e) {
        const formation = clamp(
          0.1 +
            0.42 * similarity * c.homophily +
            0.22 * t[2] +
            0.12 * sameGroup * t[26],
        );
        if (r.next() < formation) {
          const common = neighbors.some((x) => this.adj.get(b.id)?.has(x));
          e = this.addEdge(a.id, b.id, delta > 0 ? 0.1 : -0.1);
          if (e) {
            this.counters.formed++;
            if (common) this.counters.closure++;
          }
        }
      }
      if (e && !e.locked) {
        e.weight = clamp(e.weight + delta, -1, 1);
        e.trust = clamp(e.trust + delta * 0.4);
        e.updated = this.tick;
        e.types = [
          e.weight > 0.4
            ? "friendship"
            : e.weight < -0.25
              ? "rivalry"
              : "acquaintance",
          ...e.types.filter(
            (v) => !["friendship", "rivalry", "acquaintance"].includes(v),
          ),
        ];
        if (e.trust > 0.72 && !e.types.includes("trust")) e.types.push("trust");
        if (
          e.weight < -0.75 ||
          (Math.abs(e.weight) < 0.015 && r.next() < 0.2)
        ) {
          this.removeEdge(e);
          this.counters.dissolved++;
        }
      }
      if (["cooperate", "persuade", "observe"].includes(action)) {
        const known = [...this.adj.get(b.id)!]
          .slice(0, 8)
          .map((id) => this.agents.get(id)!.opinion);
        if (known.length)
          b.opinion = clamp(
            b.opinion +
              (mean(known) - b.opinion) * c.learning * 0.02 * b.traits[16],
            -1,
            1,
          );
        if (r.next() < b.traits[23] * 0.03)
          b.opinion = clamp(b.opinion + r.normal() * 0.03, -1, 1);
      }
      if (plan) {
        text = plan.text;
        trace.policy = "local-llm-action-bounded-transition-v1";
        trace.model = plan.cognition.model;
      }
      const event = this.record(
        a.id,
        b.id,
        action,
        sentiment,
        text,
        delta,
        trace,
      );
      if (plan) event.cognition = plan.cognition;
      a.memory.push(event.id);
      b.memory.push(event.id);
      for (const person of [a, b]) {
        const capacity = 4 + Math.round(person.traits[5] * 12);
        if (person.memory.length > capacity)
          person.memory.splice(0, person.memory.length - capacity);
        person.energy = clamp(person.energy - 0.025);
      }
    }
    for (const e of this.edges.values()) {
      if (e.locked) continue;
      e.weight *= 1 - c.decay;
      if (Math.abs(e.weight) < 0.015 && this.tick - e.updated > 10) {
        this.removeEdge(e);
        this.counters.dissolved++;
      }
    }
    for (const a of this.agents.values()) {
      a.mood *= 0.95 + 0.035 * (1 - a.traits[6]);
      a.energy = clamp(a.energy + 0.008 + 0.008 * a.traits[1]);
      if (a.memory.length && r.next() < 0.004 * (1 - a.traits[5]))
        a.memory.shift();
    }
    this.measure();
    this.checkpoint();
  }
  partnerUtility(a: Agent, id: number) {
    const b = this.agents.get(id)!;
    return (
      this.config.homophily * (1 - Math.abs(a.opinion - b.opinion) / 2) +
      0.2 * (a.group === b.group ? a.traits[26] : 0) +
      0.2 *
        (this.edges.get(KEY(a.id, b.id, this.config.directed))?.trust ?? 0.5)
    );
  }
  measure() {
    const agents = [...this.agents.values()],
      n = agents.length,
      m = this.edges.size;
    const incident = new Set<number>();
    let trust = 0;
    for (const e of this.edges.values()) {
      incident.add(e.source);
      incident.add(e.target);
      trust += e.trust;
    }
    const metrics: Metrics = {
      tick: this.tick,
      nodes: n,
      edges: m,
      density: n > 1 ? m / ((this.config.directed ? 1 : 0.5) * n * (n - 1)) : 0,
      averageDegree: n ? (m * (this.config.directed ? 1 : 2)) / n : 0,
      isolation: n ? (n - incident.size) / n : 0,
      polarization: variance(agents.map((a) => a.opinion)),
      meanTrust: m ? trust / m : 0,
      cooperation: this.counters.interactions
        ? this.counters.cooperate / this.counters.interactions
        : 0,
      conflict: this.counters.interactions
        ? this.counters.conflict / this.counters.interactions
        : 0,
      informed: n ? agents.filter((a) => a.informed).length / n : 0,
      formed: this.counters.formed,
      dissolved: this.counters.dissolved,
      closure: this.counters.formed
        ? this.counters.closure / this.counters.formed
        : 0,
      meanMood: mean(agents.map((a) => a.mood)),
      communities: new Set(agents.map((a) => a.group)).size,
    };
    if (this.series.at(-1)?.tick === this.tick)
      this.series[this.series.length - 1] = metrics;
    else this.series.push(metrics);
    if (this.series.length > 10000)
      this.series.splice(0, this.series.length - 10000);
    return metrics;
  }
  intervene(i: Intervention) {
    this.lastBatch = [];
    const a = i.agent !== undefined ? this.agents.get(i.agent) : undefined;
    let message = "";
    if (i.kind === "trait") {
      if (
        !a ||
        i.trait === undefined ||
        i.trait < 0 ||
        i.trait >= TRAITS.length ||
        i.value === undefined
      )
        throw Error("Select an agent and a valid trait.");
      a.traits[i.trait] = clamp(i.value);
      message = `Set ${a.name}'s ${TRAITS[i.trait]} to ${a.traits[i.trait].toFixed(2)}.`;
    } else if (i.kind === "opinion") {
      if (!a || i.value === undefined) throw Error("Select an agent.");
      a.opinion = clamp(i.value, -1, 1);
      message = `Changed ${a.name}'s opinion to ${a.opinion.toFixed(2)}.`;
    } else if (i.kind === "group") {
      if (!a || !Number.isInteger(i.value) || i.value! < 0 || i.value! > 19)
        throw Error("Select an agent and a group from 0 to 19.");
      a.group = i.value!;
      message = `Moved ${a.name} to group ${a.group + 1}.`;
    } else if (i.kind === "remove") {
      if (!a) throw Error("Select an agent.");
      for (const e of this.edges.values())
        if (e.source === a.id || e.target === a.id) this.removeEdge(e);
      this.agents.delete(a.id);
      this.adj.delete(a.id);
      message = `Removed ${a.name} and all incident relationships.`;
    } else if (i.kind === "add") {
      if (this.agents.size >= 100000) throw Error("Population limit reached.");
      const id =
        Math.max(
          -1,
          ...(this.agents.size < 50000
            ? [...this.agents.keys()]
            : [...this.agents.keys()].slice(-1)),
        ) + 1;
      const agent = this.createAgent(id);
      message = `Added ${agent.name}.`;
    } else if (i.kind === "shock") {
      if (i.value === undefined) throw Error("Enter a shock strength.");
      for (const agent of this.agents.values()) {
        agent.mood = clamp(agent.mood - Math.abs(i.value) * 0.25, -1, 1);
        if (this.rng.next() < 0.15) {
          agent.informed = true;
          agent.opinion = clamp(
            agent.opinion + i.value * (0.2 + 0.8 * agent.traits[19]),
            -1,
            1,
          );
        }
      }
      message = `Published information shock, strength ${i.value.toFixed(2)}; 15% expected direct exposure.`;
    } else if (i.kind === "edge") {
      if (
        !a ||
        i.target === undefined ||
        a.id === i.target ||
        !this.agents.has(i.target)
      )
        throw Error("Choose two different valid agents.");
      const key = KEY(a.id, i.target, this.config.directed),
        old = this.edges.get(key);
      if (i.remove) {
        if (old) this.removeEdge(old);
        message = `Removed relationship ${key}.`;
      } else {
        const edge = old ?? this.addEdge(a.id, i.target, i.value ?? 0.3);
        if (!edge) throw Error("Edge capacity reached.");
        if (i.value !== undefined) edge.weight = clamp(i.value, -1, 1);
        if (i.edgeType && !edge.types.includes(i.edgeType))
          edge.types.push(i.edgeType);
        if (i.locked !== undefined) edge.locked = i.locked;
        message = `Updated relationship ${key} (${edge.types.join(", ")}), weight ${edge.weight.toFixed(2)}${edge.locked ? ", locked" : ""}.`;
      }
    }
    this.record(i.agent ?? -1, i.target ?? -1, "intervention", 0, message, 0, {
      policy: "researcher-intervention",
      kind: i.kind,
      value: i.value ?? 0,
      trait: i.trait ?? -1,
    });
    this.measure();
    this.checkpoint(true);
  }
  serialize(compact = false): Serialized {
    const remembered = new Set<number>();
    if (compact)
      for (const a of this.agents.values())
        for (const id of a.memory) remembered.add(id);
    const events = compact
      ? this.events.filter(
          (e) => e.id >= this.counters.nextEvent - 300 || remembered.has(e.id),
        )
      : this.events;
    return copy({
      version: VERSION,
      config: this.config,
      rng: this.rng.state,
      tick: this.tick,
      agents: [...this.agents.values()],
      edges: [...this.edges.values()],
      events,
      metrics: compact ? this.series.slice(-300) : this.series,
      counters: {
        ...this.counters,
        prunedEvents: Math.max(
          this.counters.prunedEvents,
          this.counters.nextEvent - 1 - events.length,
        ),
      },
      lineage: this.lineage,
    });
  }
  static load(data: Serialized) {
    if (data.version !== VERSION) throw Error("Unsupported model version.");
    if (
      !Array.isArray(data.agents) ||
      !Array.isArray(data.edges) ||
      data.agents.length > 100000 ||
      data.edges.length > MAX_EDGES
    )
      throw Error("Invalid population or graph in file.");
    const s = new Simulation({ ...data.config, n: 1, topology: "empty" });
    s.config = copy(data.config);
    s.validate();
    s.rng.state = data.rng >>> 0;
    s.tick = data.tick;
    s.agents.clear();
    s.adj.clear();
    const seen = new Set<number>();
    for (const a of data.agents) {
      if (
        !Number.isSafeInteger(a.id) ||
        seen.has(a.id) ||
        typeof a.name !== "string" ||
        a.traits.length !== TRAITS.length ||
        a.traits.some((t) => !Number.isFinite(t) || t < 0 || t > 1) ||
        !Number.isFinite(a.opinion) ||
        !Number.isFinite(a.x) ||
        !Number.isFinite(a.y)
      )
        throw Error("Invalid agent data.");
      seen.add(a.id);
      s.agents.set(a.id, copy(a));
      s.adj.set(a.id, new Set());
    }
    for (const e of data.edges) {
      if (
        !Number.isFinite(e.weight) ||
        Math.abs(e.weight) > 1 ||
        e.source === e.target ||
        !s.agents.has(e.source) ||
        !s.agents.has(e.target) ||
        !Array.isArray(e.types)
      )
        throw Error("Invalid edge data.");
      const key = KEY(e.source, e.target, s.config.directed);
      if (s.edges.has(key)) throw Error("Duplicate edge in file.");
      s.addEdge(e.source, e.target, e.weight, e.types, e.locked);
      Object.assign(s.edges.get(key)!, copy(e), { id: key });
    }
    if (
      !Number.isInteger(s.tick) ||
      s.tick < 0 ||
      !data.counters ||
      !Array.isArray(data.events) ||
      !Array.isArray(data.metrics)
    )
      throw Error("Invalid simulation state.");
    s.events = copy(data.events.slice(-MAX_EVENTS));
    s.series = copy(data.metrics);
    s.counters = copy(data.counters);
    s.lineage = copy(data.lineage);
    s.checkpoints.clear();
    s.checkpoint(true);
    return s;
  }
  checkpoint(force = false) {
    if (!this.retainHistory) return;
    const n = this.agents.size,
      interval = n > 5000 ? 20 : 1,
      limit = n > 20000 ? 1 : n > 5000 ? 4 : n > 1000 ? 12 : 80;
    if (!force && this.tick % interval !== 0) return;
    const saved = this.serialize(true);
    this.checkpoints.set(this.tick, saved);
    while (this.checkpoints.size > limit)
      this.checkpoints.delete(this.checkpoints.keys().next().value!);
  }
  view(at?: number): View {
    if (at !== undefined && at !== this.tick) {
      const checkpoint = this.checkpoints.get(at);
      if (!checkpoint)
        throw Error(
          "That checkpoint is no longer retained. Save or export runs to keep longer histories.",
        );
      const past = Simulation.load(checkpoint);
      const v = past.view();
      v.checkpoints = [...this.checkpoints.keys()].sort((a, b) => a - b);
      return v;
    }
    const ids = [...this.agents.keys()];
    const limit = 650;
    let sample =
      ids.length <= limit
        ? ids
        : Array.from(
            { length: limit },
            (_, j) => ids[Math.floor((j * ids.length) / limit)],
          );
    const selected = new Set(sample);
    if (ids.length > limit) {
      selected.clear();
      let index = 0;
      const stride = Math.max(1, Math.floor(this.edges.size / 160));
      for (const e of this.edges.values()) {
        if (index++ % stride !== 0) continue;
        selected.add(e.source);
        selected.add(e.target);
        if (selected.size >= 320) break;
      }
      for (const id of sample) {
        if (selected.size >= limit) break;
        selected.add(id);
      }
      for (const id of ids) {
        if (selected.size >= limit) break;
        selected.add(id);
      }
      sample = [...selected];
    }
    return {
      tick: this.tick,
      config: copy(this.config),
      agents: sample.map((id) => ({
        ...copy(this.agents.get(id)!),
        degree: this.adj.get(id)?.size ?? 0,
      })),
      edges: [...this.edges.values()]
        .filter((e) => selected.has(e.source) && selected.has(e.target))
        .map(copy),
      metrics: this.series.slice(-1000),
      events: this.events.slice(-100),
      totalAgents: ids.length,
      totalEdges: this.edges.size,
      sampled: ids.length > limit,
      checkpoints: [...this.checkpoints.keys()].sort((a, b) => a - b),
      counters: copy(this.counters),
      lineage: copy(this.lineage),
    };
  }
  inspect(
    id: number,
    at?: number,
  ): {
    agent: Agent;
    relationships: (Edge & { name?: string })[];
    events: Event[];
  } | null {
    if (at !== undefined && at !== this.tick) {
      const d = this.checkpoints.get(at);
      if (!d) return null;
      return Simulation.load(d).inspect(id);
    }
    const a = this.agents.get(id);
    if (!a) return null;
    const relationships = [...this.edges.values()]
      .filter((e) => e.source === id || e.target === id)
      .map((e) => ({
        ...copy(e),
        name: this.agents.get(e.source === id ? e.target : e.source)?.name,
      }));
    return {
      agent: copy(a),
      relationships,
      events: this.events
        .filter((e) => e.source === id || e.target === id)
        .slice(-30),
    };
  }
}
