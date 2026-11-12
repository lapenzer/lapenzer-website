import { Serialized, ExperimentResult, Event, View } from "../engine/types";
const escapeXml = (x: unknown) =>
  String(x).replace(
    /[<>&'"\x00-\x08\x0b\x0c\x0e-\x1f]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c] ?? "",
  );
export function download(
  name: string,
  content: string | Blob,
  mime = "application/json",
) {
  const url = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type: mime }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export const csv = <T extends object>(rows: T[]) => {
  if (!rows.length) return "";
  const keys = [...new Set(rows.flatMap(Object.keys))];
  const cell = (v: unknown) => {
    const text = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    const safe =
      /^[=+@\t\r]/.test(text) || /^-(?!\d)/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  return [
    keys.map(cell).join(","),
    ...rows.map((row) =>
      keys.map((k) => cell((row as Record<string, unknown>)[k])).join(","),
    ),
  ].join("\n");
};
export function graphml(s: Serialized) {
  return `<?xml version="1.0" encoding="UTF-8"?><graphml xmlns="http://graphml.graphdrawing.org/xmlns"><key id="name" for="node" attr.name="name" attr.type="string"/><key id="group" for="node" attr.name="group" attr.type="int"/><key id="opinion" for="node" attr.name="opinion" attr.type="double"/><key id="weight" for="edge" attr.name="weight" attr.type="double"/><key id="types" for="edge" attr.name="relationship_types" attr.type="string"/><key id="trust" for="edge" attr.name="trust" attr.type="double"/><graph edgedefault="${s.config.directed ? "directed" : "undirected"}">${s.agents.map((a) => `<node id="n${a.id}"><data key="name">${escapeXml(a.name)}</data><data key="group">${a.group}</data><data key="opinion">${a.opinion}</data></node>`).join("")}${s.edges.map((e) => `<edge id="e${e.id}" source="n${e.source}" target="n${e.target}"><data key="weight">${e.weight}</data><data key="types">${e.types.join(",")}</data><data key="trust">${e.trust}</data></edge>`).join("")}</graph></graphml>`;
}
export function gexf(s: Serialized) {
  return `<?xml version="1.0" encoding="UTF-8"?><gexf xmlns="http://www.gexf.net/1.3" version="1.3"><meta><creator>AISNL ${escapeXml(s.version)}</creator><description>Snapshot at simulation step ${s.tick}. Seed ${escapeXml(s.config.seed)}. Signed weights; relationships are a multilayer attribute.</description></meta><graph mode="static" defaultedgetype="${s.config.directed ? "directed" : "undirected"}"><nodes>${s.agents.map((a) => `<node id="${a.id}" label="${escapeXml(a.name)}"/>`).join("")}</nodes><edges>${s.edges.map((e) => `<edge id="${escapeXml(e.id)}" source="${e.source}" target="${e.target}" weight="${e.weight}" label="${escapeXml(e.types.join(", "))}"/>`).join("")}</edges></graph></gexf>`;
}
export function chartSvg(
  values: number[],
  color = "#5ee8b7",
  label = "Metric trajectory",
) {
  const width = 900,
    height = 320,
    min = Math.min(0, ...values),
    max = Math.max(0.001, ...values),
    points = values
      .map(
        (v, i) =>
          `${40 + (i / Math.max(1, values.length - 1)) * 820},${275 - ((v - min) / (max - min)) * 220}`,
      )
      .join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="900" height="320" fill="#101827"/><text x="40" y="27" fill="#e9eff6" font-family="sans-serif" font-size="16">${escapeXml(label)}</text><line x1="40" y1="275" x2="860" y2="275" stroke="#445168"/><polyline points="${points}" fill="none" stroke="${color}" stroke-width="2"/><text x="40" y="304" fill="#b9c6d8" font-family="sans-serif">Simulation steps (retained measurements)</text><text x="40" y="50" fill="#b9c6d8" font-family="sans-serif">${max.toFixed(3)}</text></svg>`;
}
export function printReport(
  v: View,
  experiment: ExperimentResult | null,
  events: Event[],
) {
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const m = v.metrics.at(-1)!;
  const html = `<!doctype html><html><head><title>AISNL research report</title><style>body{font:11pt Georgia,serif;color:#152035;margin:36pt;line-height:1.45}h1{font-size:24pt}h2{font-size:15pt;margin-top:24pt}table{width:100%;border-collapse:collapse;margin:12pt 0}td,th{padding:6pt;border-bottom:1px solid #ccd3dd;text-align:left}p{max-width:52em}small{color:#465369}svg{width:100%;height:auto}pre{white-space:pre-wrap;font:8pt monospace}@page{size:A4;margin:16mm}</style></head><body><small>LAPENZER SOCIAL NETWORK LABORATORY · ${escapeXml(v.config.seed)} · ${escapeXml(new Date().toISOString())}</small><h1>Social network simulation report</h1><p>Model AISNL-1.0.0. Fictional agents; psychological parameters are simulation constructs. Behavioural events and outcomes describe the model and do not establish causal claims about real populations.</p><h2>Run configuration</h2><table><tr><th>Step</th><th>Population</th><th>Relationships</th><th>Topology</th><th>Directed</th></tr><tr><td>${v.tick}</td><td>${v.totalAgents}</td><td>${v.totalEdges}</td><td>${escapeXml(v.config.topology)}</td><td>${v.config.directed}</td></tr></table><h2>Outcomes</h2><table>${Object.entries(
    m,
  )
    .map(
      ([k, val]) =>
        `<tr><td>${escapeXml(k)}</td><td>${Number(val).toFixed(5)}</td></tr>`,
    )
    .join("")}</table>${chartSvg(
    v.metrics.map((x) => x.density),
    "#178c66",
    "Network density",
  )}${chartSvg(
    v.metrics.map((x) => x.polarization),
    "#9d7ae8",
    "Opinion variance",
  )}${experiment ? `<h2>Independent replication experiment</h2><p>${escapeXml(experiment.method)}</p><p>Variable: ${escapeXml(experiment.spec.variable)}. Outcome: ${escapeXml(experiment.spec.outcome)}. Duration: ${experiment.spec.steps} steps. Replications per level: ${experiment.spec.replications}.</p><table><tr><th>Level</th><th>Mean</th><th>95% bootstrap interval</th></tr>${experiment.groups.map((g) => `<tr><td>${g.level}</td><td>${g.mean.toFixed(5)}</td><td>${g.lo.toFixed(5)} – ${g.hi.toFixed(5)}</td></tr>`).join("")}</table>` : ""}<h2>Event record</h2><p>${events.length} retained/journal events. ${v.counters.llmCalls} language-model calls. ${v.counters.inputTokens} input / ${v.counters.outputTokens} output tokens. Local model monetary cost is not estimated. Export JSON and CSV for complete parameter records.</p><h2>Methodology and limits</h2><p>Discrete time, seeded Mulberry32 random stream; bounded local partner discovery and structured memories. Each activated agent initiates at most one interaction per step. Individual outcomes within a run are dependent. Interventions and their inputs are logged. Deterministic continuation requires the saved random state and the same model version. Language-model inference is not guaranteed deterministic; saved outputs support replay. Checkpoint history and the in-memory event window are bounded; the browser journal retains subsequent events until device data is cleared. JSON exports include the available journal and checkpoints.</p><h2>Complete parameters</h2><pre>${escapeXml(JSON.stringify(v.config, null, 2))}</pre></body></html>`;
  frame.srcdoc = html;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 60000);
  };
}
