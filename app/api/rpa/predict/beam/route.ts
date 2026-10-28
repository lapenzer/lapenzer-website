import { NextResponse } from "next/server";
import { futureOccupancyFromRollouts, makePredictionSnapshot, monteCarloRollouts } from "@/lib/rpaFrameworkV4";
import { requireSession } from "@/lib/rpaServerState";
import { responseMeta } from "@/lib/rpaApi";

export async function POST(request: Request) {
  const started = Date.now();
  try { const body = await request.json(), session = requireSession(String(body.session_id)); if (!session.suite) throw new Error("Train first."); const context = { stress: Number(body.stress ?? 0.45), nowDay: Number(body.now_day ?? 999) }, snapshot = makePredictionSnapshot({ graph: session.graph, suite: session.suite, history: session.history, context, observations: session.observations, seed: Number(body.seed ?? session.graph.seed + 4000) }), rollouts = monteCarloRollouts({ graph: session.graph, suite: session.suite, history: session.history, context, samples: Number(body.samples ?? 250), horizon: Number(body.horizon ?? 5), seed: Number(body.seed ?? session.graph.seed + 5000) }), occupancy = futureOccupancyFromRollouts(rollouts, session.history.length); return NextResponse.json({ beam: snapshot.beam, retained_raw_mass: snapshot.beam.reduce((s, b) => s + Math.exp(b.logProbability), 0), future_occupancy: occupancy, eta: snapshot.beam.map((b) => ({ nodes: b.nodes, p10: b.etaMinutes[0], p50: b.etaMinutes[1], p90: b.etaMinutes[2] })), meta: responseMeta(session.graph, session.suite, started, snapshot.randomSeed, ["diversity-aware beam", "Monte Carlo occupancy", "displayed beam weights are conditional within retained beam"]) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "beam prediction failed" }, { status: 400 }); }
}
