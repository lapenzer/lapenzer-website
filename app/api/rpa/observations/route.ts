import { NextResponse } from "next/server";
import { mapMatchObservation, type Observation } from "@/lib/rpaFrameworkV4";
import { requireSession, touch } from "@/lib/rpaServerState";
import { responseMeta } from "@/lib/rpaApi";

export async function POST(request: Request) {
  const started = Date.now();
  try {
    const body = await request.json(), session = requireSession(String(body.session_id)), observation = body.observation as Observation;
    if (!observation || !Number.isFinite(observation.timestamp)) throw new Error("A timestamped observation is required.");
    const previous = session.observations.at(-1), states = mapMatchObservation(session.graph, observation, previous);
    session.observations.push(observation); if (states[0]) session.history.push(states[0].nodeId); touch(session);
    return NextResponse.json({ session_id: session.id, state_hypotheses: states, history: session.history, meta: responseMeta(session.graph, session.suite, started, session.graph.seed, ["observation store append", "map matcher received no future observation"]) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "observation rejected" }, { status: 400 }); }
}
