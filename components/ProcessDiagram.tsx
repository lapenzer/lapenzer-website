const stages = [
  ["01", "Define", "Problem, output, data, constraints, success criteria."],
  ["02", "Model", "Mathematics, algorithms, software, or a combination."],
  ["03", "Build", "Implement the model and the tools required to operate it."],
  ["04", "Test", "Compare against historical, synthetic, or benchmark outcomes."],
  ["05", "Measure", "Record error, uncertainty, failure cases, and limitations."],
  ["06", "Publish", "Document methods, assumptions, results, code, and limits."],
] as const;

export function ProcessDiagram() {
  return (
    <ol className="process-grid" aria-label="Lapenzer technical development process">
      {stages.map(([number, title, text]) => (
        <li key={number} className="process-step">
          <span className="process-number">{number}</span>
          <h3>{title}</h3>
          <p>{text}</p>
        </li>
      ))}
    </ol>
  );
}
