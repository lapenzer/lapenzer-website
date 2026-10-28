import { NextResponse } from "next/server";
import { requireSession, touch } from "@/lib/rpaServerState";
import { responseMeta } from "@/lib/rpaApi";

export async function POST(request: Request) {
  const started = Date.now();
  try { const body = await request.json(), session = requireSession(String(body.session_id)); if (!session.suite) throw new Error("No trained suite."); const requested = String(body.model ?? ""); if (!(["conditional_logit", "gbm", "neural"] as string[]).includes(requested)) throw new Error("model must be conditional_logit, gbm, or neural"); const scores = session.suite.validationNll, best = Math.min(...Object.values(scores)); const score = scores[requested as keyof typeof scores]; const eligible = Number.isFinite(score) && score <= best + Number(body.tolerance ?? 1e-8); if (eligible) session.suite.champion = requested as typeof session.suite.champion; touch(session); return NextResponse.json({ promoted: eligible, champion: session.suite.champion, validation_nll: scores, reason: eligible ? "Requested challenger meets validation-NLL promotion criterion." : "Promotion rejected because the challenger does not meet the frozen validation criterion.", meta: responseMeta(session.graph, session.suite, started, session.suite.seed, ["validation-only promotion decision", "test set not used for tuning"]) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "promotion failed" }, { status: 400 }); }
}
