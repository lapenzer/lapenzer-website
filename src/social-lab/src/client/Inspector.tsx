import { useState } from "react";
import {
  UserRound,
  X,
  Target,
  Brain,
  MessageSquare,
  GitBranch,
  ChevronDown,
  ArrowUpRight,
  LockKeyhole,
} from "lucide-react";
import { Agent, Edge, Event, TRAITS, Intervention } from "../engine/types";
import { COLORS } from "./Network";
import { Slider } from "./Controls";
export interface Inspected {
  agent: Agent;
  relationships: (Edge & { name?: string })[];
  events: Event[];
}
export function Inspector({
  data,
  onIntervene,
  onClose,
  locked,
}: {
  data: Inspected | null;
  onIntervene: (i: Intervention) => void;
  onClose: () => void;
  locked: boolean;
}) {
  const [tab, setTab] = useState("profile"),
    [trait, setTrait] = useState(3),
    [value, setValue] = useState(0.7);
  if (!data)
    return (
      <aside className="inspector panel">
        <div className="panel-heading">
          <UserRound size={15} />
          <h2>Agent inspector</h2>
        </div>
        <div className="empty-inspector">
          <span className="empty-orbit">
            <UserRound size={30} />
          </span>
          <h3>Meet the population</h3>
          <p>
            Select a node or search for an agent to explore their personality,
            memories and relationships.
          </p>
          <span className="tiny-tag">EVERY AGENT IS FICTIONAL</span>
        </div>
      </aside>
    );
  const a = data.agent;
  return (
    <aside className="inspector panel">
      <div className="panel-heading">
        <UserRound size={15} />
        <h2>Agent inspector</h2>
        <button
          className="icon-button"
          aria-label="Close agent inspector"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>
      <div className="inspector-scroll">
        <div className="agent-identity">
          <div
            className="avatar"
            style={{
              color: COLORS[a.group % COLORS.length],
              background: COLORS[a.group % COLORS.length] + "15",
            }}
          >
            {a.name
              .split(" ")
              .slice(0, 2)
              .map((x) => x[0])
              .join("")}
          </div>
          <div>
            <span className="eyebrow">
              AGENT {String(a.id).padStart(3, "0")}
            </span>
            <h3>{a.name}</h3>
            <p>
              {a.age} years · Affiliation {a.group + 1}
            </p>
          </div>
        </div>
        <div className="agent-status">
          <span
            className="status-dot"
            style={{ background: a.mood < -0.2 ? "#f17f9c" : "#62dfbc" }}
          />
          {a.mood < -0.25
            ? "Frustrated"
            : a.mood > 0.25
              ? "Content"
              : "Emotionally neutral"}
          <span className="muted">
            {a.mood >= 0 ? "+" : ""}
            {a.mood.toFixed(2)}
          </span>
        </div>
        <div className="inspector-tabs">
          {[
            { v: "profile", i: Brain, l: "Profile" },
            { v: "memory", i: MessageSquare, l: "Memory" },
            { v: "ties", i: GitBranch, l: "Ties" },
          ].map((t) => (
            <button
              className={tab === t.v ? "active" : ""}
              key={t.v}
              onClick={() => setTab(t.v)}
            >
              <t.i size={12} />
              {t.l}
            </button>
          ))}
        </div>
        {tab === "profile" && (
          <>
            <div className="inspector-section">
              <h4>
                Big Five personality <span>0–1</span>
              </h4>
              {TRAITS.slice(0, 5).map((t, i) => (
                <div className="trait-row" key={t}>
                  <div>
                    <span>{t}</span>
                    <b>{a.traits[i].toFixed(2)}</b>
                  </div>
                  <div className="trait-track">
                    <i
                      style={{
                        width: `${a.traits[i] * 100}%`,
                        background: i === 3 ? "#62dfbc" : "#8d9cc9",
                      }}
                    />
                  </div>
                </div>
              ))}
              <details className="extra-traits">
                <summary>
                  Additional traits <ChevronDown size={12} />
                </summary>
                {TRAITS.slice(5).map((t, i) => (
                  <div key={t} className="attribute-line">
                    <span>{t}</span>
                    <b>{a.traits[i + 5].toFixed(2)}</b>
                  </div>
                ))}
              </details>
            </div>
            <div className="inspector-section">
              <h4>
                <Target size={12} /> Current goals
              </h4>
              {a.goals.map((g) => (
                <p className="goal" key={g}>
                  <span /> {g}
                </p>
              ))}
            </div>
            <div className="inspector-section">
              <h4>Opinion & awareness</h4>
              <div className="opinion-scale">
                <span>−1</span>
                <div>
                  <i style={{ left: `${(a.opinion + 1) * 50}%` }} />
                </div>
                <span>+1</span>
              </div>
              <div className="attribute-line">
                <span>Current opinion</span>
                <b>{a.opinion.toFixed(3)}</b>
              </div>
              <div className="attribute-line">
                <span>Information exposure</span>
                <b>{a.informed ? "Exposed" : "Unexposed"}</b>
              </div>
              <div className="attribute-line">
                <span>Energy</span>
                <b>{Math.round(a.energy * 100)}%</b>
              </div>
            </div>
          </>
        )}
        {tab === "memory" && (
          <div className="inspector-section">
            <h4>
              Bounded social memory <span>{a.memory.length} entries</span>
            </h4>
            <p className="field-description">
              Memory IDs reference recorded events. Older events are forgotten
              according to capacity and cognitive ability.
            </p>
            {data.events
              .filter((e) => a.memory.includes(e.id))
              .reverse()
              .map((e) => (
                <div className="memory-card" key={e.id}>
                  <div>
                    <span className={"action-tag " + e.action}>{e.action}</span>
                    <span>Step {e.tick}</span>
                  </div>
                  <p>{e.text}</p>
                  <details>
                    <summary>Decision inputs</summary>
                    <pre>{JSON.stringify(e.trace, null, 2)}</pre>
                  </details>
                </div>
              ))}
            {!a.memory.length && (
              <p className="empty-text">No interactions remembered yet.</p>
            )}
          </div>
        )}
        {tab === "ties" && (
          <div className="inspector-section">
            <h4>
              Relationships <span>{data.relationships.length}</span>
            </h4>
            {data.relationships
              .sort((a, b) => b.weight - a.weight)
              .map((e) => (
                <div className="tie-row" key={e.id}>
                  <span
                    className="tie-dot"
                    style={{ background: e.weight < 0 ? "#f17f9c" : "#62dfbc" }}
                  />
                  <div>
                    <b>{e.name}</b>
                    <span>{e.types.join(" · ")}</span>
                  </div>
                  <strong
                    style={{ color: e.weight < 0 ? "#f17f9c" : "#62dfbc" }}
                  >
                    {e.weight >= 0 ? "+" : ""}
                    {e.weight.toFixed(2)}
                  </strong>
                  {e.locked && <LockKeyhole size={11} />}
                </div>
              ))}
            {!data.relationships.length && (
              <p className="empty-text">This agent has no relationships yet.</p>
            )}
          </div>
        )}
        <details className="intervention-box">
          <summary>
            Research intervention <ArrowUpRight size={13} />
          </summary>
          <p className="field-description">
            Changes take effect immediately and are recorded in the event log.
          </p>
          <label className="field-label">
            Attribute
            <select value={trait} onChange={(e) => setTrait(+e.target.value)}>
              <option value={-1}>Opinion (−1 to +1)</option>
              <option value={-2}>Affiliation (1–20)</option>
              {TRAITS.map((t, i) => (
                <option key={t} value={i}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          {trait === -2 ? (
            <label className="field-label">
              Affiliation
              <input
                type="number"
                min="1"
                max="20"
                value={Math.round(value)}
                onChange={(e) => setValue(+e.target.value)}
              />
            </label>
          ) : (
            <Slider
              label="Intervention value"
              value={value}
              min={trait === -1 ? -1 : 0}
              onChange={setValue}
            />
          )}
          <button
            className="button secondary full"
            disabled={locked}
            onClick={() =>
              onIntervene(
                trait === -2
                  ? {
                      kind: "group",
                      agent: a.id,
                      value: Math.max(0, Math.round(value) - 1),
                    }
                  : trait === -1
                    ? { kind: "opinion", agent: a.id, value }
                    : { kind: "trait", agent: a.id, trait, value },
              )
            }
          >
            Apply & record
          </button>
        </details>
        <p className="simulation-note">
          Traits are simulation constructs, not psychological diagnoses.
        </p>
      </div>
    </aside>
  );
}
