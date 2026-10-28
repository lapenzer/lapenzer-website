import type { ModelSuite, Observation, ResidualRecord, RpaGraph, StoredPrediction } from "./rpaFrameworkV4";
import type { NodeId, Trajectory } from "./rpaV3";

export interface RpaServerSession {
  id: string;
  graph: RpaGraph;
  suite: ModelSuite | null;
  observations: Observation[];
  history: NodeId[];
  predictions: StoredPrediction[];
  outcomes: NodeId[];
  residuals: ResidualRecord[];
  trajectories: Trajectory[];
  createdAt: string;
  updatedAt: string;
}

const globalState = globalThis as typeof globalThis & { __lapenzerRpaSessions?: Map<string, RpaServerSession> };
export const rpaSessions = globalState.__lapenzerRpaSessions ?? new Map<string, RpaServerSession>();
if (!globalState.__lapenzerRpaSessions) globalState.__lapenzerRpaSessions = rpaSessions;

export function makeSessionId(seed: number): string { return `rpa-${seed}-${Date.now().toString(36)}`; }
export function requireSession(id: string): RpaServerSession {
  const session = rpaSessions.get(id); if (!session) throw new Error(`Unknown or expired RPA session: ${id}`); return session;
}
export function touch(session: RpaServerSession) { session.updatedAt = new Date().toISOString(); rpaSessions.set(session.id, session); }
