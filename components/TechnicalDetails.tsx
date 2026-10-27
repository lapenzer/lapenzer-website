import type { ReactNode } from "react";
export function TechnicalDetails({ title = "Inspect the mathematics", children }: { title?: string; children: ReactNode }) {
  return <details className="technical-details"><summary>{title}<span aria-hidden="true">＋</span></summary><div className="technical-content">{children}</div></details>;
}
