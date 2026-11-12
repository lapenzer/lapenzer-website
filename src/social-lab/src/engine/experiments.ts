import { Simulation } from "./simulation";
import {
  Config,
  ExperimentResult,
  ExperimentSpec,
  RunResult,
  VERSION,
} from "./types";
import { mean, variance, quantile, Random } from "./random";
export function validateExperiment(spec: ExperimentSpec, c: Config) {
  if (
    spec.values.length < 2 ||
    spec.values.length > 8 ||
    spec.values.some((v) => !Number.isFinite(v) || v < 0 || v > 1)
  )
    throw Error("Choose 2–8 parameter levels between 0 and 1.");
  if (new Set(spec.values).size !== spec.values.length)
    throw Error("Parameter levels must be unique.");
  if (
    !Number.isInteger(spec.replications) ||
    spec.replications < 3 ||
    spec.replications > 100
  )
    throw Error("Use 3–100 independent seed replications.");
  if (!Number.isInteger(spec.steps) || spec.steps < 1 || spec.steps > 2000)
    throw Error("Duration must be 1–2,000 steps.");
  if (c.n > 2000)
    throw Error("Interactive experiments are limited to 2,000 agents per run.");
  if (c.n * spec.steps * spec.replications * spec.values.length > 50000000)
    throw Error(
      "Experiment exceeds the 50 million agent-step interactive budget. Reduce population, steps, levels or replications.",
    );
}
export async function experiment(
  c: Config,
  spec: ExperimentSpec,
  progress: (completed: number, total: number) => void,
  cancel: () => boolean,
): Promise<ExperimentResult> {
  validateExperiment(spec, c);
  const rows: RunResult[] = [];
  let done = 0;
  const total = spec.replications * spec.values.length;
  for (const level of spec.values)
    for (let replicate = 0; replicate < spec.replications; replicate++) {
      if (cancel()) throw Error("Experiment cancelled.");
      const seed = `${spec.seed}/replication/${replicate}`,
        config = structuredClone({ ...c, seed, mode: "statistical" as const });
      if (spec.variable === "agreeableness") config.mean[3] = level;
      else if (spec.variable === "aggression") config.mean[13] = level;
      else config[spec.variable] = level;
      const sim = new Simulation(config);
      sim.retainHistory = false;
      sim.checkpoints.clear();
      for (let tick = 0; tick < spec.steps; tick++) {
        sim.step();
        if (tick % 25 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (cancel()) throw Error("Experiment cancelled.");
        }
      }
      const metrics = sim.series.at(-1)!;
      rows.push({
        level,
        replicate,
        seed,
        value: metrics[spec.outcome],
        metrics,
      });
      progress(++done, total);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  return summarize(c, spec, rows);
}
export function summarize(
  config: Config,
  spec: ExperimentSpec,
  rows: RunResult[],
): ExperimentResult {
  const rng = new Random(spec.seed + "/bootstrap"),
    B = 2000;
  const interval = (values: number[]) => {
    const boot = Array.from({ length: B }, () =>
      mean(Array.from({ length: values.length }, () => rng.pick(values))),
    ).sort((a, b) => a - b);
    return [quantile(boot, 0.025), quantile(boot, 0.975)];
  };
  const groups = spec.values.map((level) => {
    const values = rows.filter((r) => r.level === level).map((r) => r.value),
      [lo, hi] = interval(values);
    return {
      level,
      mean: mean(values),
      sd: Math.sqrt(variance(values, true)),
      lo,
      hi,
      n: values.length,
    };
  });
  const baseline = rows.filter((r) => r.level === spec.values[0]);
  const comparisons = spec.values.slice(1).map((level) => {
    const matched = rows
      .filter((r) => r.level === level)
      .sort((a, b) => a.replicate - b.replicate);
    const diffs = matched.map(
        (r) =>
          r.value - baseline.find((b) => b.replicate === r.replicate)!.value,
      ),
      difference = mean(diffs),
      [lo, hi] = interval(diffs);
    let extreme = 0;
    for (let p = 0; p < 4999; p++) {
      const nullMean = mean(diffs.map((v) => v * (rng.next() < 0.5 ? -1 : 1)));
      if (Math.abs(nullMean) >= Math.abs(difference) - 1e-14) extreme++;
    }
    const p = (extreme + 1) / 5000,
      sd = Math.sqrt(variance(diffs, true));
    return {
      level,
      difference,
      lo,
      hi,
      p,
      adjustedP: p,
      effect: sd ? difference / sd : null,
    };
  });
  const sorted = [...comparisons].sort((a, b) => a.p - b.p);
  let prior = 0;
  sorted.forEach((c, i) => {
    c.adjustedP = Math.min(1, Math.max(prior, c.p * (sorted.length - i)));
    prior = c.adjustedP;
  });
  return {
    spec: structuredClone(spec),
    config: structuredClone(config),
    rows,
    groups,
    comparisons,
    version: VERSION,
    method:
      "Unit of inference: independent simulation run. Common seed strings pair replication indices across levels; treatment changes may diverge the random stream. 2,000 percentile bootstrap resamples of runs (or paired run differences), 4,999 paired sign-flip permutations, Holm correction across comparisons with the first level. Effect is paired standardized mean difference. Descriptive model evidence; no causal claims about real people. Confidence intervals are unadjusted and exploratory. Very few runs give unstable intervals.",
  };
}
