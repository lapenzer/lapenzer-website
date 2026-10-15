export function NetworkDiagram() {
  return (
    <div className="network-diagram" aria-label="Illustrative route-ranking network diagram">
      <svg viewBox="0 0 760 330" role="img" aria-labelledby="networkTitle networkDesc">
        <title id="networkTitle">Candidate route network</title>
        <desc id="networkDesc">A network of nodes connected by candidate routes, with one ranked route emphasized.</desc>
        <g className="network-lines">
          <path d="M75 165 L210 80 L350 120 L500 65 L685 125" />
          <path d="M75 165 L210 245 L350 205 L500 260 L685 125" />
          <path d="M210 80 L210 245" />
          <path d="M350 120 L350 205" />
          <path d="M500 65 L500 260" />
          <path d="M350 120 L500 260" />
        </g>
        <path className="ranked-route" d="M75 165 L210 80 L350 120 L500 65 L685 125" />
        {[
          [75, 165, "A"], [210, 80, "B"], [210, 245, "C"], [350, 120, "D"],
          [350, 205, "E"], [500, 65, "F"], [500, 260, "G"], [685, 125, "H"],
        ].map(([x, y, label]) => (
          <g key={String(label)}>
            <circle cx={Number(x)} cy={Number(y)} r="16" className="network-node" />
            <text x={Number(x)} y={Number(y) + 5} textAnchor="middle" className="network-label">{label}</text>
          </g>
        ))}
      </svg>
      <div className="diagram-legend">
        <span><i className="legend-line active" /> ranked candidate</span>
        <span><i className="legend-line" /> alternative connection</span>
      </div>
    </div>
  );
}
