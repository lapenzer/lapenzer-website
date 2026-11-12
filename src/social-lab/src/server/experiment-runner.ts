/** One canonical simulation kernel for both browser workers and server jobs. */
import { Simulation } from "../engine/simulation";
import { experiment } from "../engine/experiments";
let input = "";
for await (const chunk of process.stdin) input += chunk;
try {
  const request = JSON.parse(input);
  if (request.kind === "simulate") {
    const sim = request.state
      ? Simulation.load(request.state)
      : new Simulation(request.config);
    const steps = Number(request.steps ?? 1);
    if (!Number.isInteger(steps) || steps < 0 || steps > 10000)
      throw Error("Steps must be 0–10,000.");
    if (sim.agents.size * steps > 50000000)
      throw Error("Headless budget: 50 million agent-steps per job.");
    for (let tick = 0; tick < steps; tick++) {
      for (const intervention of request.interventions ?? [])
        if (intervention.tick === sim.tick) sim.intervene(intervention.value);
      sim.step();
      sim.checkpoints.clear();
    }
    process.stdout.write(
      JSON.stringify({ type: "complete", result: sim.serialize() }) + "\n",
    );
  } else {
    const result = await experiment(
      new Simulation(request.config).config,
      request.spec,
      (done, total) =>
        process.stdout.write(
          JSON.stringify({ type: "progress", done, total }) + "\n",
        ),
      () => false,
    );
    process.stdout.write(JSON.stringify({ type: "complete", result }) + "\n");
  }
} catch (error) {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
