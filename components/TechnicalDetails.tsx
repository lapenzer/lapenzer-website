import type { ReactNode } from "react";
export function TechnicalDetails({ title = "Inspect the mathematics", children, open = false }: { title?: string; children: ReactNode; open?: boolean }) {
  return <details className="technical-details" open={open}><summary>{title}<span aria-hidden="true">＋</span></summary><div className="technical-content">{children}</div></details>;
}
