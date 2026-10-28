import { NextResponse } from "next/server";
import { destinationPosteriorWithUnknown } from "@/lib/rpaFrameworkV4";
import { requireSession } from "@/lib/rpaServerState";
import { responseMeta } from "@/lib/rpaApi";

export async function POST(request: Request) {
  const started = Date.now();
  try { const body = await request.json(), session = requireSession(String(body.session_id)); if (!session.suite) throw new Error("Train first."); const posterior = destinationPosteriorWithUnknown(session.suite.conditional, session.history, Number(body.unknown_prior ?? 0.08)); return NextResponse.json({ posterior, meta: responseMeta(session.graph, session.suite, started, session.graph.seed, ["unknown destination posterior", "OTHER/UNKNOWN retained"]) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "destination prediction failed" }, { status: 400 }); }
}
