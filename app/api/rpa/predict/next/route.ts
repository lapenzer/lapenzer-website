import { NextResponse } from "next/server";
import { makePredictionSnapshot } from "@/lib/rpaFrameworkV4";
import { requireSession, touch } from "@/lib/rpaServerState";
import { responseMeta } from "@/lib/rpaApi";

export async function POST(request: Request) {
  const started = Date.now();
  try {
    const body = await request.json(), session = requireSession(String(body.session_id)); if (!session.suite) throw new Error("Train a model suite first."); if (!session.history.length) throw new Error("Append at least one observation first.");
    const snapshot = makePredictionSnapshot({ graph: session.graph, suite: session.suite, history: [...session.history], context: { stress: Number(body.stress ?? 0.45), nowDay: Number(body.now_day ?? 999) }, observations: [...session.observations], seed: Number(body.seed ?? session.graph.seed + session.predictions.length) });
    session.predictions.push(snapshot); touch(session);
    return NextResponse.json({ session_id: session.id, prediction_id: snapshot.id, current_state_hypotheses: snapshot.currentState, candidates: snapshot.candidates, destination_posterior: snapshot.destinationPosterior, confidence: snapshot.confidence, entropy: snapshot.entropy, conformal_set: snapshot.conformalSet, abstain: snapshot.abstain, meta: responseMeta(session.graph, session.suite, started, snapshot.randomSeed, ["prediction snapshot written before outcome", ...snapshot.provenance]) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "prediction failed" }, { status: 400 }); }
}
