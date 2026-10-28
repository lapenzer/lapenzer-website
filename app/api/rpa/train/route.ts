import { NextResponse } from "next/server";
import { makeDomainAdapterV4, pickIndependentDestinations, syntheticTrainingSet, trainModelSuite } from "@/lib/rpaFrameworkV4";
import { requireSession, touch } from "@/lib/rpaServerState";
import { responseMeta } from "@/lib/rpaApi";

export async function POST(request: Request) {
  const started = Date.now();
  try {
    const body = await request.json(), session = requireSession(String(body.session_id)), trajectories = Array.isArray(body.trajectories) && body.trajectories.length ? body.trajectories : syntheticTrainingSet(session.graph, body.trajectory_count ?? 420, session.graph.seed + 7), destinations = pickIndependentDestinations(session.graph, body.destination_count ?? 5), suite = trainModelSuite(session.graph, trajectories, destinations, makeDomainAdapterV4(body.domain ?? "road"), body.seed ?? session.graph.seed + 19);
    session.trajectories = trajectories; session.suite = suite; touch(session);
    return NextResponse.json({ session_id: session.id, champion: suite.champion, validation_nll: suite.validationNll, neural: { status: suite.neural.status, version: suite.neural.version, epochs: suite.neural.epochs, seed: suite.neural.seed, hidden_size: suite.neural.hiddenSize, temperature: suite.neural.temperature, best_validation_nll: suite.neural.bestValidationNll }, gbm: { status: suite.gbm.status, version: suite.gbm.version, trees: suite.gbm.stumps.length, temperature: suite.gbm.temperature }, irl: { status: suite.irl.status, version: suite.irl.version, epochs: suite.irl.epochs, training_nll: suite.irl.trainingNll }, meta: responseMeta(session.graph, suite, started, suite.seed, ["chronological split", "training-only normalizer", "validation-only calibration"]) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "training failed" }, { status: 400 }); }
}
