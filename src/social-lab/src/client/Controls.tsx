import {
  ChevronDown,
  SlidersHorizontal,
  Shuffle,
  Network,
  Users,
  Dna,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { Config, TRAITS, Topology } from "../engine/types";
export const TOPOLOGIES: {
  value: Topology;
  label: string;
  description: string;
}[] = [
  {
    value: "block",
    label: "Stochastic block",
    description: "Dense local groups, sparse bridges.",
  },
  {
    value: "erdos",
    label: "Erdős–Rényi",
    description: "Independent, equally likely edges.",
  },
  {
    value: "smallworld",
    label: "Watts–Strogatz",
    description: "Local rings with rewired shortcuts.",
  },
  {
    value: "preferential",
    label: "Barabási–Albert",
    description: "New agents favour connected peers.",
  },
  {
    value: "geometric",
    label: "Random geometric",
    description: "Agents connect within a spatial radius.",
  },
  {
    value: "scalefree",
    label: "Fitness preferential",
    description:
      "Power-law fitness biases attachment; no guaranteed degree exponent.",
  },
  {
    value: "empty",
    label: "Empty graph",
    description: "Start with agents and build connections.",
  },
  {
    value: "custom",
    label: "Custom edge list",
    description: "Import source,target,weight rows.",
  },
];
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  description,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}) {
  return (
    <label className="slider-label" title={description}>
      <span>
        {label}
        <output>{value.toFixed(2)}</output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
export function Controls({
  config,
  setConfig,
  onGenerate,
  busy,
  dirty,
}: {
  config: Config;
  setConfig: (c: Config) => void;
  onGenerate: () => void;
  busy: boolean;
  dirty: boolean;
}) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) =>
    setConfig({ ...config, [key]: value });
  const topology = TOPOLOGIES.find((t) => t.value === config.topology)!;
  return (
    <aside className="configuration panel">
      <div className="panel-heading">
        <SlidersHorizontal size={15} />
        <h2>Configuration</h2>
        <span className="tiny-tag">SETUP</span>
      </div>
      <div className="config-scroll">
        <section className="config-section">
          <h3>
            <Users size={13} /> Population
          </h3>
          <label className="field-label">
            Number of agents
            <input
              type="number"
              min="1"
              max="100000"
              step="1"
              value={config.n}
              onChange={(e) => set("n", +e.target.value)}
            />
          </label>
          <div className="field-meta">
            <span>Fictional individuals</span>
            <span>1–100k</span>
          </div>
          <label className="field-label">
            Random seed
            <div className="input-with-button">
              <input
                value={config.seed}
                onChange={(e) => set("seed", e.target.value)}
                placeholder="Experiment seed"
              />
              <button
                title="Generate a new seed"
                aria-label="Generate random seed"
                onClick={() =>
                  set(
                    "seed",
                    `social-${crypto.getRandomValues(new Uint32Array(1))[0]}`,
                  )
                }
              >
                <Shuffle size={13} />
              </button>
            </div>
          </label>
        </section>
        <section className="config-section">
          <h3>
            <Network size={13} /> Network structure
          </h3>
          <label className="field-label">
            Topology
            <select
              value={config.topology}
              onChange={(e) => set("topology", e.target.value as Topology)}
            >
              {TOPOLOGIES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <p className="field-description">{topology.description}</p>
          {config.topology === "block" && (
            <>
              <div className="two-fields">
                <label className="field-label">
                  Affiliations
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={config.groups}
                    onChange={(e) => set("groups", +e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Within-group p
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step=".01"
                    value={config.within}
                    onChange={(e) => set("within", +e.target.value)}
                  />
                </label>
              </div>
              <Slider
                label="Between-group probability"
                value={config.between}
                max={0.3}
                step={0.001}
                onChange={(v) => set("between", v)}
              />
            </>
          )}
          {config.topology === "erdos" && (
            <Slider
              label="Edge probability"
              value={config.probability}
              max={1}
              step={0.001}
              onChange={(v) => set("probability", v)}
            />
          )}
          {["smallworld", "preferential", "scalefree"].includes(
            config.topology,
          ) && (
            <label className="field-label">
              {config.topology === "smallworld"
                ? "Initial ring degree (even)"
                : "Target mean degree"}
              <input
                type="number"
                min="0"
                max="100"
                step="2"
                value={config.degree}
                onChange={(e) => set("degree", +e.target.value)}
              />
            </label>
          )}
          {config.topology === "smallworld" && (
            <Slider
              label="Rewiring probability"
              value={config.rewire}
              onChange={(v) => set("rewire", v)}
            />
          )}
          {config.topology === "scalefree" && (
            <label className="field-label">
              Fitness power-law exponent
              <input
                type="number"
                min="2"
                max="4"
                step=".1"
                value={config.exponent}
                onChange={(e) => set("exponent", +e.target.value)}
              />
            </label>
          )}
          {config.topology === "geometric" && (
            <Slider
              label="Connection radius"
              value={config.radius}
              min={0.005}
              max={1}
              step={0.005}
              onChange={(v) => set("radius", v)}
            />
          )}
          {config.topology === "custom" && (
            <label className="field-label">
              Edges (zero-based IDs)
              <textarea
                rows={5}
                value={config.customEdges}
                placeholder={"0,1,0.5\n1,2,-0.3"}
                onChange={(e) => set("customEdges", e.target.value)}
              />
            </label>
          )}
          <label className="toggle-label">
            <span>Directed relationships</span>
            <input
              type="checkbox"
              checked={config.directed}
              onChange={(e) => set("directed", e.target.checked)}
            />
            <span className="switch" />
          </label>
        </section>
        <section className="config-section">
          <h3>
            <Dna size={13} /> Behavioural model
          </h3>
          <Slider
            label="Homophily"
            value={config.homophily}
            onChange={(v) => set("homophily", v)}
            description="Preference for similar opinions when selecting locally known partners."
          />
          <Slider
            label="Exploration"
            value={config.exploration}
            onChange={(v) => set("exploration", v)}
            description="Probability of discovering a new contact beyond existing outgoing relationships."
          />
          <Slider
            label="Activation rate"
            value={config.activation}
            onChange={(v) => set("activation", v)}
          />
          <details>
            <summary>
              Advanced parameters <ChevronDown size={12} />
            </summary>
            <Slider
              label="Conflict pressure"
              value={config.conflict}
              onChange={(v) => set("conflict", v)}
            />
            <Slider
              label="Learning rate"
              value={config.learning}
              max={0.5}
              onChange={(v) => set("learning", v)}
            />
            <Slider
              label="Relationship decay"
              value={config.decay}
              max={0.05}
              step={0.001}
              onChange={(v) => set("decay", v)}
            />
            <label className="field-label">
              Maximum initiators / step
              <input
                type="number"
                min="1"
                max="10000"
                value={config.maxInteractions}
                onChange={(e) => set("maxInteractions", +e.target.value)}
              />
            </label>
          </details>
        </section>
        <section className="config-section">
          <h3>
            <SlidersHorizontal size={13} /> Personality distributions
          </h3>
          <label className="field-label">
            Distribution
            <select
              value={config.distribution}
              onChange={(e) =>
                set("distribution", e.target.value as Config["distribution"])
              }
            >
              <option value="normal">Truncated normal</option>
              <option value="uniform">Uniform (clipped)</option>
              <option value="bimodal">Bimodal mixture</option>
            </select>
          </label>
          <Slider
            label="Trait variation (SD)"
            value={config.sd}
            max={0.5}
            onChange={(v) => set("sd", v)}
          />
          <details>
            <summary>
              Trait means & correlations <ChevronDown size={12} />
            </summary>
            <Slider
              label="Shared prosocial loading"
              value={config.correlation}
              onChange={(v) => set("correlation", v)}
            />
            <p className="field-description">
              Positive shared loading on agreeableness, empathy, honesty and
              cooperation. Negative on aggression and self-interest. Clipping
              changes achieved correlations.
            </p>
            {TRAITS.map((t, i) => (
              <Slider
                key={t}
                label={t}
                value={config.mean[i]}
                onChange={(v) => {
                  const m = [...config.mean];
                  m[i] = v;
                  set("mean", m);
                }}
              />
            ))}
          </details>
        </section>
      </div>
      <div className="config-footer">
        <button
          className="button primary full"
          onClick={onGenerate}
          disabled={busy}
        >
          <Shuffle size={14} />
          {busy ? "Building network…" : "Generate network"}
          <ArrowUpRight size={14} />
        </button>
        <p>
          <Info size={11} />
          {dirty
            ? "Changes apply to a new network."
            : "Seeded. Reproducible. API-free."}
        </p>
      </div>
    </aside>
  );
}
