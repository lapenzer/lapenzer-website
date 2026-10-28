import { NextResponse } from "next/server";
import { measuredVsExpected, safeAdaptationSummary } from "@/lib/rpaFrameworkV4";
import { requireSession, touch } from "@/lib/rpaServerState";
import { responseMeta } from "@/lib/rpaApi";

export async function POST(request: Request) {
  const started = Date.now();
  try { const body = await request.json(), session = requireSession(String(body.session_id)), prediction = session.predictions.find((p) => p.id === body.prediction_id) ?? session.predictions.at(-1); if (!prediction) throw new Error("No stored pre-outcome prediction exists."); const observedNext = String(body.observed_next), residual = measuredVsExpected(prediction, observedNext, body.measurements); session.outcomes.push(observedNext); session.residuals.push(residual); touch(session); const monitoring = safeAdaptationSummary(session.residuals); return NextResponse.json({ residual, monitoring, safe_updates: ["transition counts", "recency counters", "node visit counts", "duration observations", "monitoring statistics"], forbidden_immediate_updates: ["conditional-logit weights", "GBM weights", "neural weights", "temperature", "conformal threshold"], meta: responseMeta(session.graph, session.suite, started, prediction.randomSeed, ["outcome revealed after prediction", "Class-A updates only"]) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "evaluation failed" }, { status: 400 }); }
}
