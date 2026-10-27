import type { ReactNode } from "react";
export function EvidencePanel({ status, children }: { status: string; children: ReactNode }) {
  return <aside className="evidence-panel"><p className="eyebrow">Evidence & interpretation</p><span className="status"><i aria-hidden="true" />{status}</span><div>{children}</div></aside>;
}
