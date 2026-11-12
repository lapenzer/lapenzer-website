/// <reference lib="webworker" />
import { Simulation, CognitionPlan } from "./simulation";
import { analyze } from "./analytics";
import { experiment } from "./experiments";
import { VERSION } from "./types";
let sim: Simulation | undefined,
  cancelled = false,
  experimentBusy = false;
let queue = Promise.resolve();
const send = (id: number, type: string, data: unknown) =>
  postMessage({ id, type, data });
async function planCognition() {
  const plans = new Map<number, CognitionPlan>();
  if (!sim || sim.config.mode === "statistical") return plans;
  const s = sim,
    available = s.config.llmBudget - s.counters.llmCalls,
    active = Math.min(
      s.agents.size,
      Math.ceil(s.agents.size * s.config.activation),
      s.config.maxInteractions,
    ),
    wanted = s.config.mode === "llm" ? active : Math.min(2, active);
  if (s.config.mode === "llm" && available < wanted)
    throw Error(
      "Language-model call budget reached. Increase the budget or switch to statistical mode.",
    );
  if (available <= 0) return plans;
  if (!s.config.llmModel)
    throw Error("Select an installed local language model.");
  const ids = [...s.agents.keys()],
    sources = s.rng.shuffle([...ids]).slice(0, Math.min(wanted, available));
  const jobs = sources
    .map((source) => {
      const a = s.agents.get(source)!,
        neighbors = [...s.adj.get(source)!];
      const candidates = neighbors.length
        ? neighbors
        : ids.filter((id) => id !== source);
      if (!candidates.length) return null;
      const target = s.rng.pick(candidates),
        b = s.agents.get(target)!;
      return { a, b };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  for (let offset = 0; offset < jobs.length; offset += 2) {
    const results = await Promise.all(
      jobs.slice(offset, offset + 2).map(async ({ a, b }) => {
        const res = await fetch("/api/cognition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: s.config.llmModel,
            agent: a,
            partner: { id: b.id, name: b.name, opinion: b.opinion },
            memories: s.events.filter((e) => a.memory.includes(e.id)).slice(-8),
            mode: s.config.mode,
          }),
        });
        if (!res.ok) {
          let reason = "Local language-model inference failed.";
          try {
            reason = (await res.json()).detail ?? reason;
          } catch {}
          throw Error(reason);
        }
        const data = await res.json();
        return {
          id: a.id,
          plan: {
            target: b.id,
            action: data.action,
            text: data.text,
            cognition: data.cognition,
          } as CognitionPlan,
        };
      }),
    );
    for (const { id, plan } of results) {
      plans.set(id, plan);
      s.counters.llmCalls++;
      s.counters.inputTokens += plan.cognition.inputTokens;
      s.counters.outputTokens += plan.cognition.outputTokens;
    }
  }
  return plans;
}
async function handle(m: any) {
  const { id, type, payload } = m;
  try {
    if (type === "experiment") {
      if (experimentBusy) throw Error("An experiment is already running.");
      experimentBusy = true;
      cancelled = false;
      try {
        send(
          id,
          "experiment",
          await experiment(
            payload.config,
            payload.spec,
            (done, total) => send(id, "progress", { done, total }),
            () => cancelled,
          ),
        );
      } finally {
        experimentBusy = false;
      }
      return;
    }
    if (type === "init") {
      sim = new Simulation(payload);
      send(id, "view", sim.view());
      return;
    }
    if (type === "load") {
      sim = Simulation.load(payload.state ?? payload);
      if (Array.isArray(payload.checkpoints)) {
        sim.checkpoints.clear();
        const max =
          sim.agents.size > 20000
            ? 1
            : sim.agents.size > 5000
              ? 4
              : sim.agents.size > 1000
                ? 12
                : 80;
        for (const [tick, state] of [...payload.checkpoints]
          .sort((a, b) => a[0] - b[0])
          .slice(-(max - 1 || 1))) {
          if (
            Number.isSafeInteger(tick) &&
            state?.version === VERSION &&
            state.tick === tick &&
            state.agents?.length <= 100000
          )
            sim.checkpoints.set(tick, state);
        }
        sim.checkpoints.set(sim.tick, sim.serialize(true));
        while (sim.checkpoints.size > max)
          sim.checkpoints.delete(sim.checkpoints.keys().next().value!);
      }
      send(id, "view", sim.view());
      return;
    }
    if (!sim) throw Error("Initialize the simulation first.");
    if (type === "step") {
      for (
        let i = 0;
        i < Math.max(1, Math.min(100, payload?.count ?? 1));
        i++
      ) {
        const plans = await planCognition();
        sim.step(plans);
        send(id, "eventBatch", sim.lastBatch);
      }
      send(id, "view", sim.view());
    } else if (type === "view") send(id, "view", sim.view(payload?.tick));
    else if (type === "inspect")
      send(id, "inspect", sim.inspect(payload.agent, payload.tick));
    else if (type === "intervene") {
      sim.intervene(payload);
      send(id, "eventBatch", sim.lastBatch);
      send(id, "view", sim.view());
    } else if (type === "analyze") {
      const d =
        payload?.tick !== undefined && payload.tick !== sim.tick
          ? Simulation.load(sim.checkpoints.get(payload.tick)!)
          : sim;
      send(id, "analysis", analyze(d));
    } else if (type === "serialize")
      send(id, "serialized", {
        state: sim.serialize(),
        checkpoints: [...sim.checkpoints.entries()],
        exportedAt: new Date().toISOString(),
      });
    else if (type === "branch") {
      const d =
        payload.tick === sim.tick
          ? sim.serialize(true)
          : sim.checkpoints.get(payload.tick);
      if (!d) throw Error("Select a retained checkpoint.");
      sim = Simulation.load(d);
      sim.lineage = {
        parent: payload.parent ?? "current-run",
        branchTick: payload.tick,
      };
      sim.record(
        -1,
        -1,
        "intervention",
        0,
        `Branched at step ${payload.tick}.`,
        0,
        { policy: "researcher-branch" },
      );
      sim.checkpoint(true);
      send(id, "view", sim.view());
    } else if (type === "mode") {
      if (
        !["statistical", "hybrid", "llm"].includes(payload.mode) ||
        !Number.isInteger(payload.budget) ||
        payload.budget < 1 ||
        payload.budget > 10000
      )
        throw Error("Invalid cognition settings.");
      sim.config.mode = payload.mode;
      sim.config.llmModel = String(payload.model).slice(0, 200);
      sim.config.llmBudget = payload.budget;
      sim.record(
        -1,
        -1,
        "intervention",
        0,
        `Set cognition mode to ${payload.mode}.`,
        0,
        { policy: "researcher-intervention", mode: payload.mode },
      );
      sim.checkpoint(true);
      send(id, "view", sim.view());
    } else throw Error("Unsupported worker command.");
  } catch (err) {
    send(id, "error", err instanceof Error ? err.message : String(err));
  }
}
self.onmessage = ({ data: m }) => {
  if (m.type === "cancel") {
    cancelled = true;
    return;
  }
  queue = queue.then(() => handle(m));
};
