import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Beaker,
  Network as NetworkIcon,
  FileDown,
  ScrollText,
  Save,
  FolderOpen,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Maximize,
  Plus,
  Minus,
  Search,
  GitBranch,
  Link2,
  UserPlus,
  UserMinus,
  X,
  Download,
  ArrowUpRight,
  Check,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Settings2,
  PanelLeftClose,
  Square,
  Workflow,
  BookOpen,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import {
  Config,
  DEFAULT_CONFIG,
  View,
  Intervention,
  Analysis,
  ExperimentSpec,
  ExperimentResult,
  Event,
  TRAITS,
  Serialized,
  Relationship,
} from "../engine/types";
import { Controls } from "./Controls";
import { Inspector, Inspected } from "./Inspector";
import { Network, GraphHandle, COLORS } from "./Network";
import { Events, Experiments, Statistics } from "./Research";
import { useEngine } from "./workerClient";
import {
  SavedRun,
  saveRun,
  listRuns,
  deleteRun,
  journal,
  readJournal,
} from "./storage";
import { csv, download, graphml, gexf, chartSvg, printReport } from "./exports";
const tabs = [
  { id: "network", label: "Network", icon: NetworkIcon },
  { id: "statistics", label: "Statistics", icon: Activity },
  { id: "experiments", label: "Experiments", icon: Beaker },
  { id: "events", label: "Events", icon: ScrollText },
  { id: "export", label: "Data & exports", icon: FileDown },
];
const fmt = (v: number) =>
  v.toLocaleString(undefined, { maximumFractionDigits: 2 });
function Spark({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values),
    range = Math.max(0.001, Math.max(...values) - min);
  return (
    <svg viewBox="0 0 92 30" width="92" height="30" aria-hidden="true">
      <polyline
        points={values
          .map(
            (v, i) =>
              `${(i / Math.max(1, values.length - 1)) * 90},${26 - ((v - min) / range) * 22}`,
          )
          .join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  );
}
export default function App() {
  const [config, setConfig] = useState<Config>(structuredClone(DEFAULT_CONFIG)),
    [view, setView] = useState<View | null>(null),
    [tab, setTab] = useState("network"),
    [running, setRunning] = useState(false),
    [busy, setBusy] = useState(false),
    [speed, setSpeed] = useState(3),
    [selected, setSelected] = useState<number | null>(7),
    [inspected, setInspected] = useState<Inspected | null>(null),
    [colorBy, setColorBy] = useState("group"),
    [search, setSearch] = useState(""),
    [strength, setStrength] = useState(0),
    [connect, setConnect] = useState(false),
    [connectSource, setConnectSource] = useState<number | null>(null),
    [dialog, setDialog] = useState<string | null>(null),
    [runs, setRuns] = useState<SavedRun[]>([]),
    [runId, setRunId] = useState(() => crypto.randomUUID()),
    [name, setName] = useState("Untitled experiment"),
    [toast, setToast] = useState<{ message: string; error?: boolean } | null>(
      null,
    ),
    [analysis, setAnalysis] = useState<Analysis | null>(null),
    [analyzing, setAnalyzing] = useState(false),
    [experiment, setExperiment] = useState<ExperimentResult | null>(null),
    [experimentRunning, setExperimentRunning] = useState(false),
    [progress, setProgress] = useState<{ done: number; total: number } | null>(
      null,
    ),
    [replay, setReplay] = useState<number | null>(null),
    [latest, setLatest] = useState(0),
    [fullEvents, setFullEvents] = useState<Event[] | null>(null),
    [comparison, setComparison] = useState<View["metrics"] | null>(null),
    [light, setLight] = useState(false),
    [hideConfig, setHideConfig] = useState(false),
    [server, setServer] = useState<{ available: boolean; models: string[] }>({
      available: false,
      models: [],
    }),
    [edgeSource, setEdgeSource] = useState(0),
    [edgeTarget, setEdgeTarget] = useState(1),
    [edgeWeight, setEdgeWeight] = useState(0.3),
    [edgeType, setEdgeType] = useState<Relationship>("friendship"),
    [edgeLock, setEdgeLock] = useState(false),
    [llmModel, setLlmModel] = useState(""),
    [llmBudget, setLlmBudget] = useState(50);
  const graph = useRef<GraphHandle>(null),
    runRef = useRef(runId),
    fileInput = useRef<HTMLInputElement>(null),
    currentView = useRef(view),
    saving = useRef(false),
    pendingJournal = useRef(Promise.resolve());
  runRef.current = runId;
  currentView.current = view;
  const notify = useCallback(
    (message: string, error = false) => setToast({ message, error }),
    [],
  );
  const engine = useEngine((events) => {
    const run = runRef.current;
    pendingJournal.current = pendingJournal.current
      .then(() => journal(run, events))
      .catch(() =>
        notify(
          "Event journal could not be saved on this device. Export JSON before closing.",
          true,
        ),
      );
    setFullEvents(null);
  });
  const experimentEngine = useEngine();
  const accept = (v: View) => {
    setView(v);
    setLatest(v.tick);
    setReplay(null);
    setAnalysis(null);
  };
  const safe = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      setRunning(false);
      notify(e instanceof Error ? e.message : String(e), true);
    }
  };
  useEffect(() => {
    safe(async () => {
      const all = await listRuns();
      setRuns(all.filter((r) => r.id !== "autosave"));
      const auto = all.find((r) => r.id === "autosave");
      if (auto) {
        const v = await engine.request("load", auto.data);
        setView(v);
        setLatest(v.tick);
        setConfig(v.config);
        setName(auto.name);
        setExperiment(auto.data.experiment ?? null);
        setRunId(auto.data.journalRun ?? crypto.randomUUID());
        notify(`Restored ${auto.name} at step ${v.tick}.`);
      } else setView(await engine.request("init", DEFAULT_CONFIG));
    });
    fetch("/api/health")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        setServer({ available: true, models: d.models ?? [] });
        if (d.models?.[0]) setLlmModel(d.models[0]);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    let live = true,
      timer: ReturnType<typeof setTimeout>;
    const next = async () => {
      try {
        const v = await engine.request("step", { count: 1 });
        setView(v);
        setLatest(v.tick);
        setAnalysis(null);
        if (live) {
          timer = setTimeout(next, Math.max(45, 1000 / speed));
        }
      } catch (e) {
        if (live) {
          setRunning(false);
          notify((e as Error).message, true);
        }
      }
    };
    if (running) timer = setTimeout(next, 30);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [running, speed]);
  useEffect(() => {
    if (selected === null || !view) {
      setInspected(null);
      return;
    }
    let active = true;
    engine
      .request("inspect", { agent: selected, tick: replay ?? undefined })
      .then((d) => {
        if (active) setInspected(d);
      })
      .catch((e) => notify(e.message, true));
    return () => {
      active = false;
    };
  }, [selected, view, replay, runId]);
  useEffect(() => {
    if (
      !view ||
      replay !== null ||
      (running && view.tick % 25 !== 0) ||
      saving.current
    )
      return;
    const timer = setTimeout(() => {
      if (saving.current) return;
      saving.current = true;
      safe(async () => {
        const data = await engine.request("serialize");
        data.journalRun = runRef.current;
        data.experiment = experiment;
        await saveRun({
          id: "autosave",
          name,
          savedAt: new Date().toISOString(),
          tick: data.state.tick,
          n: data.state.agents.length,
          seed: data.state.config.seed,
          data,
        });
      }).finally(() => (saving.current = false));
    }, 700);
    return () => clearTimeout(timer);
  }, [view, running, runId, experiment]);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
  }, [light]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDialog(null);
        setConnect(false);
        return;
      }
      if (
        e.code === "Space" &&
        !["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(
          (e.target as HTMLElement).tagName,
        ) &&
        replay === null &&
        !busy
      ) {
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [replay, busy]);
  const getExport = async () => {
    await pendingJournal.current;
    const data = await engine.request("serialize");
    const all = await readJournal(runRef.current);
    const map = new Map<number, Event>();
    for (const e of data.state.events) map.set(e.id, e);
    for (const e of all) {
      const { run, ...event } = e;
      map.set(e.id, event);
    }
    data.journal = [...map.values()].sort((a, b) => a.id - b.id);
    data.journalRun = runRef.current;
    data.experiment = experiment;
    data.analysis = analysis;
    return data;
  };
  const saveCurrent = async (show = true) => {
    const data = await getExport();
    const run: SavedRun = {
      id: runRef.current,
      name,
      savedAt: new Date().toISOString(),
      tick: data.state.tick,
      n: data.state.agents.length,
      seed: data.state.config.seed,
      data,
    };
    await saveRun(run);
    if (server.available) {
      const res = await fetch("/api/runs/" + run.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(run),
      });
      if (!res.ok)
        throw Error("Device save succeeded, but server save failed.");
    }
    setRuns((await listRuns()).filter((r) => r.id !== "autosave"));
    if (show)
      notify("Simulation saved with parameters, events and checkpoints.");
  };
  const generate = () =>
    safe(async () => {
      setRunning(false);
      setBusy(true);
      try {
        if (view && view.tick > 0) await saveCurrent(false);
        const v = await engine.request("init", {
          ...config,
          mode: "statistical",
        });
        setConfig(v.config);
        setSelected(config.n > 7 ? 7 : 0);
        setRunId(crypto.randomUUID());
        accept(v);
        setFullEvents(null);
        setConnect(false);
        notify(`Created ${v.totalAgents.toLocaleString()} fictional agents.`);
      } finally {
        setBusy(false);
      }
    });
  const advance = () =>
    safe(async () => {
      if (replay !== null) return;
      setBusy(true);
      try {
        accept(await engine.request("step", { count: 1 }));
      } finally {
        setBusy(false);
      }
    });
  const intervene = (i: Intervention) =>
    safe(async () => {
      setRunning(false);
      if (replay !== null)
        throw Error("Branch this checkpoint before applying an intervention.");
      accept(await engine.request("intervene", i));
      notify("Intervention applied and recorded.");
    });
  const select = (id: number) => {
    if (connect) {
      if (connectSource === null) {
        setConnectSource(id);
        notify("Select a second agent to edit their relationship.");
      } else if (id !== connectSource) {
        setEdgeSource(connectSource);
        setEdgeTarget(id);
        setDialog("edge");
        setConnect(false);
        setConnectSource(null);
      }
    }
    setSelected(id);
  };
  const analyze = () =>
    safe(async () => {
      setAnalyzing(true);
      try {
        setAnalysis(
          await engine.request("analyze", { tick: replay ?? undefined }),
        );
      } finally {
        setAnalyzing(false);
      }
    });
  const runExperiment = (spec: ExperimentSpec) =>
    safe(async () => {
      setRunning(false);
      setExperimentRunning(true);
      setProgress(null);
      try {
        setExperiment(
          await experimentEngine.request(
            "experiment",
            { config: view!.config, spec },
            setProgress,
          ),
        );
        notify(
          "Experiment complete. Results use independent run replications.",
        );
      } finally {
        setExperimentRunning(false);
      }
    });
  const loadRun = (r: SavedRun) =>
    safe(async () => {
      setRunning(false);
      accept(await engine.request("load", r.data));
      setRunId(r.data.journalRun ?? r.id);
      setConfig(r.data.state.config);
      setName(r.name);
      setExperiment(r.data.experiment ?? null);
      setSelected(0);
      setDialog(null);
      if (r.data.journal?.length)
        await journal(r.data.journalRun ?? r.id, r.data.journal);
      notify(`Loaded ${r.name}.`);
    });
  const replayAt = (index: number) =>
    safe(async () => {
      setRunning(false);
      const tick = view!.checkpoints[index];
      setView(await engine.request("view", { tick }));
      setReplay(tick === latest ? null : tick);
      setAnalysis(null);
    });
  const branch = () =>
    safe(async () => {
      setRunning(false);
      if (view) await saveCurrent(false);
      const v = await engine.request("branch", {
        tick: view!.tick,
        parent: runRef.current,
      });
      setRunId(crypto.randomUUID());
      setName(name + " · branch");
      accept(v);
      notify(`Created a branch at step ${v.tick}. The parent run is saved.`);
    });
  const exportData = (type: string) =>
    safe(async () => {
      if (type === "png") {
        const data = graph.current?.png();
        if (!data)
          throw Error("Open the Network tab to export the rendered graph.");
        const a = document.createElement("a");
        a.href = data;
        a.download = "aisnl-network.png";
        a.click();
        return;
      }
      if (type === "svg") {
        const data = graph.current?.svg();
        if (!data)
          throw Error("Open the Network tab to export the rendered graph.");
        download("aisnl-network.svg", data, "image/svg+xml");
        return;
      }
      if (type === "chart") {
        download(
          "aisnl-density.svg",
          chartSvg(
            view!.metrics.map((m) => m.density),
            "#62dfbc",
            "Network density by recorded step",
          ),
          "image/svg+xml",
        );
        return;
      }
      const data = await getExport(),
        s: Serialized = data.state;
      if (type === "json")
        download(
          "aisnl-" + s.config.seed.replace(/[^a-z0-9-]/gi, "_") + ".json",
          JSON.stringify(data),
        );
      else if (type === "events")
        download(
          "aisnl-events.csv",
          csv(
            data.journal.map((e: Event) => ({
              ...e,
              trace: JSON.stringify(e.trace),
            })),
          ),
          "text/csv",
        );
      else if (type === "agents")
        download(
          "aisnl-agents.csv",
          csv(
            s.agents.map((a) => ({
              id: a.id,
              name: a.name,
              age: a.age,
              affiliation: a.group,
              opinion: a.opinion,
              mood: a.mood,
              energy: a.energy,
              informed: a.informed,
              ...Object.fromEntries(TRAITS.map((t, i) => [t, a.traits[i]])),
            })),
          ),
          "text/csv",
        );
      else if (type === "edges")
        download(
          "aisnl-edges.csv",
          csv(s.edges.map((e) => ({ ...e, types: e.types.join("|") }))),
          "text/csv",
        );
      else if (type === "metrics")
        download("aisnl-metrics.csv", csv(s.metrics), "text/csv");
      else if (type === "graphml")
        download("aisnl-network.graphml", graphml(s), "application/xml");
      else if (type === "gexf")
        download("aisnl-network.gexf", gexf(s), "application/xml");
      else if (type === "report") {
        if (server.available) {
          const res = await fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ state: s, experiment }),
          });
          if (!res.ok) throw Error("PDF generation failed.");
          download(
            "aisnl-research-report.pdf",
            await res.blob(),
            "application/pdf",
          );
        } else printReport(view!, experiment, data.journal);
      }
    });
  const importFile = async (file: File) =>
    safe(async () => {
      if (file.size > 200 * 1024 * 1024)
        throw Error(
          "Import limit is 200 MB. Use the local server for larger archives.",
        );
      const data = JSON.parse(await file.text());
      const s = data.state ?? data;
      const imported = await engine.request("load", data);
      setRunning(false);
      accept(imported);
      setConfig(s.config);
      setExperiment(data.experiment ?? null);
      const id = crypto.randomUUID();
      setRunId(id);
      setName("Imported " + s.config.seed);
      if (data.journal) await journal(id, data.journal);
      setDialog(null);
      notify("Imported run. Random state and available checkpoints restored.");
    });
  if (!view)
    return (
      <div className="loading-screen">
        <Workflow size={38} />
        <h1>LAPENZER Social Network Laboratory</h1>
        <p>Initializing the simulation worker…</p>
        {toast && <p className="error-text">{toast.message}</p>}
      </div>
    );
  const m = view.metrics.at(-1)!,
    dirty = JSON.stringify(config) !== JSON.stringify(view.config),
    isReplay = replay !== null,
    checkpoints = view.checkpoints;
  const events = fullEvents ?? view.events;
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" target="_top" aria-label="LAPENZER home">
          <span className="brand-mark">
            <Workflow size={23} />
          </span>
          <div>
            <strong>
              LAPENZER<span> / </span>
            </strong>
            <span>Social Network Laboratory</span>
          </div>
          <span className="version-label">v1.0</span>
        </a>
        <div className="header-meta">
          <span className="workspace-badge">
            <span /> LAPENZER RESEARCH
          </span>
          <button
            className="icon-button"
            title="Methodology and help"
            aria-label="Open methodology and help"
            onClick={() => setDialog("help")}
          >
            <BookOpen size={17} />
          </button>
          <button
            className="icon-button"
            aria-label={light ? "Use dark theme" : "Use light theme"}
            onClick={() => setLight(!light)}
          >
            {light ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <span className="user-initials">LP</span>
        </div>
      </header>
      <div className="workspace-bar">
        <nav aria-label="Research workspace">
          {tabs.map((t) => (
            <button
              className={tab === t.id ? "active" : ""}
              key={t.id}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={15} />
              {t.label}
              {t.id === "events" && view.counters.nextEvent > 1 && (
                <span className="nav-count">
                  {Math.min(999, view.counters.nextEvent - 1)}
                  {view.counters.nextEvent > 1000 ? "+" : ""}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="button-row">
          <button
            className="button ghost"
            onClick={() =>
              safe(async () => {
                setRunning(false);
                setRuns((await listRuns()).filter((r) => r.id !== "autosave"));
                setDialog("runs");
              })
            }
          >
            <FolderOpen size={14} />
            Saved runs
          </button>
          <button
            className="button secondary save-button"
            onClick={() => safe(() => saveCurrent())}
          >
            <Save size={14} />
            Save simulation
          </button>
        </div>
      </div>
      <main className={tab === "network" ? "network-main" : "full-main"}>
        {tab === "network" ? (
          <>
            <div className="workspace-title">
              <div>
                <span className="breadcrumb">
                  LABORATORY <ChevronRight size={10} /> WORKSPACE 01
                </span>
                <div className="title-row">
                  <input
                    aria-label="Simulation name"
                    className="run-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <span className={"mode-tag " + (running ? "running" : "")}>
                    <span />
                    {running
                      ? "SIMULATION RUNNING"
                      : isReplay
                        ? "CHECKPOINT REPLAY"
                        : view.config.mode === "hybrid"
                          ? "HYBRID COGNITION"
                          : view.config.mode === "llm"
                            ? "LOCAL MODEL ENGINE"
                            : "STATISTICAL ENGINE"}
                  </span>
                </div>
                <p>
                  Explore how individual behaviour shapes a connected world.
                </p>
              </div>
              <div className="workspace-actions">
                <button
                  className="button ghost"
                  onClick={() => setHideConfig(!hideConfig)}
                >
                  <PanelLeftClose size={15} />
                  {hideConfig ? "Show setup" : "Hide setup"}
                </button>
                <button
                  className="button ghost"
                  disabled={isReplay || running}
                  onClick={() => setDialog("shock")}
                >
                  <Activity size={14} />
                  Information shock
                </button>
                <button
                  className="button ghost"
                  onClick={() => {
                    setRunning(false);
                    setDialog("cognition");
                  }}
                >
                  <Settings2 size={14} />
                  Cognition
                </button>
              </div>
            </div>
            <div className="kpi-row">
              {[
                {
                  label: "Population",
                  value: fmt(m.nodes),
                  key: "nodes",
                  color: "#62dfbc",
                  unit: "fictional agents",
                },
                {
                  label: "Relationships",
                  value: fmt(m.edges),
                  key: "edges",
                  color: "#9d8bf2",
                  unit: `${view.config.directed ? "directed" : "undirected"} ties`,
                },
                {
                  label: "Mean degree",
                  value: m.averageDegree.toFixed(2),
                  key: "averageDegree",
                  color: "#6cb8f0",
                  unit: "connections per agent",
                },
                {
                  label: "Opinion variance",
                  value: m.polarization.toFixed(3),
                  key: "polarization",
                  color: "#f7b76b",
                  unit: "polarization measure",
                },
                {
                  label: "Cooperation",
                  value: (m.cooperation * 100).toFixed(1) + "%",
                  key: "cooperation",
                  color: "#62dfbc",
                  unit: m.tick
                    ? "cumulative interactions"
                    : "awaiting interactions",
                },
              ].map((k) => (
                <div className="kpi" key={k.key}>
                  <span className="kpi-label">
                    {k.label}
                    <i style={{ background: k.color }} />
                  </span>
                  <div>
                    <strong>{k.value}</strong>
                    <Spark
                      color={k.color}
                      values={view.metrics
                        .slice(-35)
                        .map((v) => (v as any)[k.key])}
                    />
                  </div>
                  <small>{k.unit}</small>
                </div>
              ))}
            </div>
            <div
              className={`laboratory-grid ${hideConfig ? "hide-config" : ""}`}
            >
              {!hideConfig && (
                <Controls
                  config={config}
                  setConfig={setConfig}
                  onGenerate={generate}
                  busy={busy}
                  dirty={dirty}
                />
              )}
              <div className="canvas-stack">
                <section className="graph-panel panel">
                  <div className="graph-toolbar">
                    <div className="graph-title">
                      <NetworkIcon size={15} />
                      <h2>Social network</h2>
                      <span className="tiny-tag">
                        {view.sampled ? "SAMPLED" : "LIVE VIEW"}
                      </span>
                    </div>
                    <div className="graph-controls">
                      <label>
                        Color by{" "}
                        <select
                          aria-label="Node color"
                          value={colorBy}
                          onChange={(e) => setColorBy(e.target.value)}
                        >
                          <option value="group">Affiliation</option>
                          <option value="opinion">Opinion</option>
                          <option value="mood">Mood</option>
                          <option value="agreeableness">Agreeableness</option>
                        </select>
                      </label>
                      <button
                        className="icon-button"
                        title="Fit network"
                        aria-label="Fit network to canvas"
                        onClick={() => graph.current?.fit()}
                      >
                        <Maximize size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="canvas-tools">
                    <div className="graph-search">
                      <Search size={13} />
                      <input
                        aria-label="Find agent in graph"
                        placeholder="Find an agent…"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          const id = Number(e.target.value);
                          if (
                            e.target.value.trim() &&
                            Number.isInteger(id) &&
                            id >= 0
                          )
                            setSelected(id);
                        }}
                      />
                      {search && (
                        <button
                          className="icon-button"
                          onClick={() => setSearch("")}
                          aria-label="Clear agent search"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <select
                      aria-label="Network layout"
                      onChange={(e) => graph.current?.layout(e.target.value)}
                      defaultValue="affiliation"
                    >
                      <option value="affiliation">Affiliation layout</option>
                      <option value="force">Force layout</option>
                      <option value="circle">Circle layout</option>
                      <option value="concentric">Centrality layout</option>
                    </select>
                  </div>
                  <Network
                    key={runId}
                    ref={graph}
                    view={view}
                    selected={selected}
                    onSelect={select}
                    colorBy={colorBy}
                    search={search}
                    minStrength={strength}
                    connect={connect}
                  />
                  {connect && (
                    <div className="canvas-hint">
                      <Link2 size={13} />
                      {connectSource === null
                        ? "Select the first agent."
                        : "Select the second agent."}
                      <button
                        onClick={() => {
                          setConnect(false);
                          setConnectSource(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {isReplay && (
                    <div className="canvas-hint replay-hint">
                      Viewing step {view.tick}
                      <button
                        onClick={() =>
                          safe(async () => {
                            setView(await engine.request("view"));
                            setReplay(null);
                          })
                        }
                      >
                        Return live
                      </button>
                    </div>
                  )}
                  <div className="canvas-bottom">
                    <div className="graph-legend">
                      {colorBy === "group" ? (
                        Array.from(
                          { length: Math.min(view.config.groups, 5) },
                          (_, i) => (
                            <span key={i}>
                              <i style={{ background: COLORS[i] }} />
                              Group {i + 1}
                            </span>
                          ),
                        )
                      ) : colorBy === "opinion" ? (
                        <>
                          <span>
                            <i style={{ background: "#9d8bf2" }} />
                            Against
                          </span>
                          <span>
                            <i style={{ background: "#62dfbc" }} />
                            Neutral
                          </span>
                          <span>
                            <i style={{ background: "#f7b76b" }} />
                            In favour
                          </span>
                        </>
                      ) : (
                        <span>
                          {colorBy === "mood"
                            ? "Pink: frustrated · mint: content"
                            : "Brighter mint: more agreeable"}
                        </span>
                      )}
                    </div>
                    <div className="zoom-tools">
                      <button
                        aria-label="Zoom out"
                        onClick={() => graph.current?.zoom(0.8)}
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        aria-label="Zoom in"
                        onClick={() => graph.current?.zoom(1.25)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="graph-editbar">
                    <button
                      className={connect ? "active" : ""}
                      disabled={isReplay || running}
                      onClick={() => {
                        setEdgeSource(selected ?? 0);
                        setEdgeTarget(selected === 0 ? 1 : 0);
                        setDialog("edge");
                      }}
                    >
                      <Link2 size={12} />
                      Edit relationship
                    </button>
                    <button
                      title="Select two nodes to connect"
                      disabled={isReplay || running}
                      onClick={() => {
                        setConnect(!connect);
                        setConnectSource(null);
                      }}
                    >
                      <Link2 size={11} />
                      {connect ? "Cancel link" : "Link nodes"}
                    </button>
                    <button
                      disabled={isReplay || running}
                      onClick={() => intervene({ kind: "add" })}
                    >
                      <UserPlus size={12} />
                      Add agent
                    </button>
                    <button
                      disabled={isReplay || running || selected === null}
                      onClick={() => {
                        intervene({ kind: "remove", agent: selected! });
                        setSelected(null);
                      }}
                    >
                      <UserMinus size={12} />
                      Remove
                    </button>
                    <button
                      onClick={() => exportData("png")}
                      title="Download the rendered network as PNG"
                    >
                      <Download size={11} />
                      PNG
                    </button>
                    <button
                      onClick={() => exportData("svg")}
                      title="Download the rendered network as SVG"
                    >
                      SVG
                    </button>
                    <label title="Hide weak ties">
                      Min |weight|
                      <input
                        type="range"
                        aria-label="Minimum displayed edge strength"
                        min="0"
                        max="1"
                        step=".05"
                        value={strength}
                        onChange={(e) => setStrength(+e.target.value)}
                      />
                      <output>{strength.toFixed(2)}</output>
                    </label>
                  </div>
                </section>
                <section className="activity-panel panel">
                  <div className="activity-heading">
                    <h2>
                      <Activity size={13} />
                      {running && <span className="live-dot" />}Interaction
                      stream
                    </h2>
                    <button onClick={() => setTab("events")}>
                      Open journal <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <div className="activity-list">
                    {view.events
                      .slice(-3)
                      .reverse()
                      .map((e) => (
                        <div className="activity-row" key={e.id}>
                          <span className="event-step">
                            {String(e.tick).padStart(3, "0")}
                          </span>
                          <span className={"action-tag " + e.action}>
                            {e.action}
                          </span>
                          <p>{e.text}</p>
                          <span className={e.delta < 0 ? "red" : "green"}>
                            {e.delta >= 0 ? "+" : ""}
                            {e.delta.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    {!view.events.length && (
                      <div className="activity-empty">
                        <span className="live-dot" />
                        <p>
                          The network is ready. Start the simulation to observe
                          social interactions.
                        </p>
                        <span className="keycap">SPACE</span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
              <Inspector
                data={inspected}
                onIntervene={intervene}
                onClose={() => setSelected(null)}
                locked={isReplay || running}
              />
            </div>
            <div className="simulation-bar panel">
              <div className="transport">
                <button
                  className="play-button"
                  aria-label={running ? "Pause simulation" : "Start simulation"}
                  title={running ? "Pause" : "Start"}
                  disabled={busy || isReplay}
                  onClick={() => setRunning(!running)}
                >
                  {running ? (
                    <Pause size={17} fill="currentColor" />
                  ) : (
                    <Play size={17} fill="currentColor" />
                  )}
                </button>
                <button
                  className="icon-button"
                  aria-label="Advance one simulation step"
                  title="Single step"
                  disabled={running || busy || isReplay}
                  onClick={advance}
                >
                  <SkipForward size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Stop simulation"
                  title="Stop"
                  onClick={() => setRunning(false)}
                >
                  <Square size={13} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Reset to seeded initial network"
                  title="Reset seeded network"
                  disabled={busy}
                  onClick={() => {
                    setConfig(view.config);
                    safe(async () => {
                      setRunning(false);
                      if (view.tick) await saveCurrent(false);
                      accept(await engine.request("init", view.config));
                      setRunId(crypto.randomUUID());
                      setSelected(0);
                    });
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              </div>
              <div className="step-readout">
                <span>SIMULATION STEP</span>
                <strong>{String(view.tick).padStart(5, "0")}</strong>
              </div>
              <div className="timeline">
                <div>
                  <span>
                    {isReplay ? "Checkpoint replay" : "Retained checkpoints"}
                  </span>
                  <span>
                    {checkpoints[0] ?? 0} – {checkpoints.at(-1) ?? 0}
                  </span>
                </div>
                <input
                  aria-label="Replay saved simulation step"
                  type="range"
                  min="0"
                  max={Math.max(0, checkpoints.length - 1)}
                  step="1"
                  value={Math.max(0, checkpoints.indexOf(view.tick))}
                  onChange={(e) => replayAt(+e.target.value)}
                  disabled={running || checkpoints.length < 2}
                />
              </div>
              <button
                className="button ghost branch-button"
                onClick={branch}
                disabled={running || busy}
              >
                <GitBranch size={14} />
                Branch
              </button>
              <div className="speed-control">
                <span>Speed</span>
                <input
                  aria-label="Simulation speed"
                  type="range"
                  min="1"
                  max="10"
                  value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                />
                <b>{speed}×</b>
              </div>
            </div>
          </>
        ) : tab === "statistics" ? (
          <Statistics
            view={view}
            analysis={analysis}
            onAnalyze={analyze}
            busy={analyzing}
            comparison={comparison}
          />
        ) : tab === "experiments" ? (
          <Experiments
            config={view.config}
            result={experiment}
            onRun={runExperiment}
            onCancel={() => experimentEngine.cancel()}
            progress={progress}
            running={experimentRunning}
            serverAvailable={server.available}
          />
        ) : tab === "events" ? (
          <Events
            events={events}
            onFullJournal={() =>
              safe(async () => {
                await pendingJournal.current;
                const data = await getExport();
                setFullEvents(data.journal);
                notify(
                  `Loaded ${data.journal.length.toLocaleString()} journal events.`,
                );
              })
            }
          />
        ) : (
          <div className="research-page">
            <div className="page-heading">
              <div>
                <span className="eyebrow">REPRODUCIBILITY & DATA</span>
                <h2>Take the evidence with you.</h2>
                <p>
                  Export the current live state, full available journal, and
                  reproducible parameters.
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() => fileInput.current?.click()}
              >
                <FolderOpen size={14} />
                Import simulation JSON
              </button>
            </div>
            <div className="export-grid">
              {[
                {
                  type: "json",
                  title: "Complete simulation",
                  ext: "JSON",
                  desc: "Agent states, RNG state, network, journal, parameters, checkpoints and experiment results.",
                },
                {
                  type: "agents",
                  title: "Agent dataset",
                  ext: "CSV",
                  desc: "All fictional identities, traits, beliefs and current emotional states.",
                },
                {
                  type: "events",
                  title: "Interaction journal",
                  ext: "CSV",
                  desc: "Timestamped decisions, communication, sentiment and recorded policy inputs.",
                },
                {
                  type: "edges",
                  title: "Relationship dataset",
                  ext: "CSV",
                  desc: "Directed or undirected signed ties, multilayer relationship types and trust.",
                },
                {
                  type: "metrics",
                  title: "Measurement series",
                  ext: "CSV",
                  desc: "Full retained network and behavioural measurements by simulation step.",
                },
                {
                  type: "graphml",
                  title: "GraphML network",
                  ext: "GRAPHML",
                  desc: "Network snapshot with weights, trust, opinions and relationship attributes.",
                },
                {
                  type: "gexf",
                  title: "GEXF network",
                  ext: "GEXF",
                  desc: "Network snapshot for independent analysis in Gephi and other graph tools.",
                },
                {
                  type: "chart",
                  title: "Density trajectory",
                  ext: "SVG",
                  desc: "A vector chart of the currently retained density measurements.",
                },
                {
                  type: "report",
                  title: "Research report",
                  ext: "PDF / PRINT",
                  desc: "Configuration, methods, trajectories and experimental intervals in a printable report.",
                },
              ].map((e) => (
                <button
                  className="export-card"
                  key={e.type}
                  onClick={() => exportData(e.type)}
                >
                  <span className="export-icon">
                    <FileDown size={21} />
                  </span>
                  <span className="tiny-tag">{e.ext}</span>
                  <h3>{e.title}</h3>
                  <p>{e.desc}</p>
                  <span className="export-link">
                    {e.type === "report"
                      ? "Open print report"
                      : "Download export"}
                    <ArrowUpRight size={13} />
                  </span>
                </button>
              ))}
            </div>
            <div className="method-note">
              <Info size={17} />
              <div>
                <b>Source code & local server</b>
                <p>
                  The hosted app runs its statistical engine in a separate
                  browser worker and saves named runs and journals on this
                  device. The included FastAPI server adds SQL persistence
                  (PostgreSQL or SQLite), NetworkX analysis, SciPy/statsmodels
                  methods, optional local-model inference, and an experiment job
                  API.
                </p>
                <a
                  className="button secondary"
                  href="/social-lab/lapenzer-social-lab-source.zip"
                  download
                >
                  <Download size={14} />
                  Download runnable full-stack source
                </a>
              </div>
            </div>
            <div className="method-note">
              <Info size={17} />
              <div>
                <b>Research limits</b>
                <p>
                  These are synthetic social processes. Trait labels are model
                  parameters. Seeded statistical simulations reproduce with the
                  same version and initial state. Language-model generation can
                  vary; recorded outputs can be replayed. Browser history is
                  bounded to 80 recent checkpoints for small populations, with
                  fewer and less frequent checkpoints for large runs. Use JSON
                  exports and named saves for durable archives.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="status-bar">
        <span>
          <i className={running ? "green-dot" : ""} />
          {running
            ? "Engine active"
            : isReplay
              ? "Replay paused"
              : "Engine ready"}
          <span className="status-divider">/</span>
          {view.totalAgents.toLocaleString()} agents ·{" "}
          {view.totalEdges.toLocaleString()} ties
          {view.sampled && ` · rendering ${view.agents.length} agents`}
        </span>
        <span>
          Seed: <code>{view.config.seed}</code>
          <span className="status-divider">/</span>
          {server.available ? "LOCAL SERVER CONNECTED" : "BROWSER WORKER"}
          <span className="status-divider">/</span>AISNL 1.0.0
        </span>
      </footer>
      {toast && (
        <div
          role={toast.error ? "alert" : "status"}
          className={"toast " + (toast.error ? "error" : "")}
        >
          {toast.error ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importFile(f);
          e.target.value = "";
        }}
      />
      {dialog && (
        <div className="modal-backdrop" onClick={() => setDialog(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={
              dialog === "runs"
                ? "Saved simulations"
                : dialog === "edge"
                  ? "Edit relationship"
                  : dialog === "help"
                    ? "Research methodology"
                    : dialog === "shock"
                      ? "Information shock"
                      : "Cognition settings"
            }
            className={"modal " + (dialog === "help" ? "modal-wide" : "")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <h2>
                {dialog === "runs"
                  ? "Saved simulations"
                  : dialog === "edge"
                    ? "Edit relationship"
                    : dialog === "help"
                      ? "Inside the laboratory"
                      : dialog === "shock"
                        ? "Publish an information shock"
                        : "Agent cognition"}
              </h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </div>
            {dialog === "runs" ? (
              <>
                <p className="field-description">
                  Named runs are saved on this device
                  {server.available
                    ? " and synchronized to the local server"
                    : ""}
                  . Autosave restores your latest working state.
                </p>
                <div className="saved-run-list">
                  {runs
                    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
                    .map((r) => (
                      <div className="saved-run" key={r.id}>
                        <div>
                          <h3>{r.name}</h3>
                          <p>
                            {r.n} agents · step {r.tick} ·{" "}
                            {new Date(r.savedAt).toLocaleString()}
                          </p>
                          <small>Seed: {r.seed}</small>
                        </div>
                        <div>
                          <button
                            className="button secondary"
                            onClick={() => loadRun(r)}
                          >
                            Load
                          </button>
                          <button
                            className="text-button"
                            onClick={() => {
                              setComparison(r.data.state.metrics);
                              setTab("statistics");
                              setDialog(null);
                            }}
                          >
                            Compare
                          </button>
                          <button
                            className="icon-button"
                            title="Delete saved run"
                            aria-label={"Delete " + r.name}
                            onClick={() =>
                              safe(async () => {
                                await deleteRun(r.id);
                                setRuns(
                                  (await listRuns()).filter(
                                    (r) => r.id !== "autosave",
                                  ),
                                );
                              })
                            }
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {!runs.length && (
                    <p className="empty-text">
                      No named saves yet. Use Save simulation to keep a run.
                    </p>
                  )}
                </div>
                <button
                  className="button secondary full"
                  onClick={() => fileInput.current?.click()}
                >
                  <FolderOpen size={14} />
                  Import an exported simulation
                </button>
              </>
            ) : dialog === "edge" ? (
              <>
                <p className="field-description">
                  Edit a signed, weighted relationship. Multiple relationship
                  types can coexist. Locked ties retain their weights during
                  simulation.
                </p>
                <div className="two-fields">
                  <label className="field-label">
                    Source agent ID
                    <input
                      type="number"
                      min="0"
                      value={edgeSource}
                      onChange={(e) => setEdgeSource(+e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    Target agent ID
                    <input
                      type="number"
                      min="0"
                      value={edgeTarget}
                      onChange={(e) => setEdgeTarget(+e.target.value)}
                    />
                  </label>
                </div>
                <label className="field-label">
                  Relationship type
                  <select
                    value={edgeType}
                    onChange={(e) =>
                      setEdgeType(e.target.value as Relationship)
                    }
                  >
                    {[
                      "friendship",
                      "acquaintance",
                      "rivalry",
                      "romantic",
                      "professional",
                      "family",
                      "influence",
                      "trust",
                      "group",
                    ].map((v) => (
                      <option value={v} key={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="slider-label">
                  <span>
                    Relationship strength
                    <output>{edgeWeight.toFixed(2)}</output>
                  </span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step=".01"
                    value={edgeWeight}
                    onChange={(e) => setEdgeWeight(+e.target.value)}
                  />
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={edgeLock}
                    onChange={(e) => setEdgeLock(e.target.checked)}
                  />
                  Lock relationship weight
                </label>
                <div className="button-row">
                  <button
                    className="button primary"
                    onClick={() => {
                      intervene({
                        kind: "edge",
                        agent: edgeSource,
                        target: edgeTarget,
                        value: edgeWeight,
                        edgeType,
                        locked: edgeLock,
                      });
                      setDialog(null);
                    }}
                  >
                    Apply & record
                  </button>
                  <button
                    className="button danger"
                    onClick={() => {
                      intervene({
                        kind: "edge",
                        agent: edgeSource,
                        target: edgeTarget,
                        remove: true,
                      });
                      setDialog(null);
                    }}
                  >
                    Delete relationship
                  </button>
                </div>
              </>
            ) : dialog === "shock" ? (
              <>
                <p className="field-description">
                  Expose an expected 15% of the population to new information.
                  Beliefs shift with individual suggestibility; subsequent local
                  interactions can spread exposure. The intervention is
                  recorded.
                </p>
                <label className="slider-label">
                  <span>
                    Opinion shock strength
                    <output>{edgeWeight.toFixed(2)}</output>
                  </span>
                  <input
                    aria-label="Information shock strength"
                    type="range"
                    min="-1"
                    max="1"
                    step=".05"
                    value={edgeWeight}
                    onChange={(e) => setEdgeWeight(+e.target.value)}
                  />
                </label>
                <button
                  className="button primary full"
                  onClick={() => {
                    intervene({ kind: "shock", value: edgeWeight });
                    setDialog(null);
                  }}
                >
                  Apply & record shock
                </button>
              </>
            ) : dialog === "cognition" ? (
              <>
                <p className="field-description">
                  Statistical cognition runs with no paid services. Hybrid and
                  language-model modes require the included local server and an
                  installed Ollama model.
                </p>
                <label className="field-label">
                  Mode
                  <select
                    value={config.mode}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        mode: e.target.value as Config["mode"],
                      })
                    }
                  >
                    <option value="statistical">
                      A · Statistical behaviour
                    </option>
                    <option value="hybrid" disabled={!server.models.length}>
                      C · Hybrid (local model)
                    </option>
                    <option value="llm" disabled={!server.models.length}>
                      B · Language-model decisions (local model)
                    </option>
                  </select>
                </label>
                {config.mode !== "statistical" && (
                  <>
                    <label className="field-label">
                      Local model
                      <select
                        value={llmModel}
                        onChange={(e) => setLlmModel(e.target.value)}
                      >
                        {server.models.map((model) => (
                          <option key={model}>{model}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field-label">
                      Maximum model calls per run
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={llmBudget}
                        onChange={(e) => setLlmBudget(+e.target.value)}
                      />
                    </label>
                  </>
                )}
                <div className="method-note compact">
                  <Info size={15} />
                  <p>
                    {server.models.length
                      ? "Local model outputs and token counts are recorded. Inference uses a concurrency limit of two; no external account is used."
                      : "No local model server detected. Statistical cognition is fully available. See the runnable source README to start the optional server."}
                  </p>
                </div>
                <button
                  className="button primary full"
                  onClick={() =>
                    safe(async () => {
                      accept(
                        await engine.request("mode", {
                          mode: config.mode,
                          model: llmModel,
                          budget: llmBudget,
                        }),
                      );
                      setDialog(null);
                      notify("Cognition settings recorded.");
                    })
                  }
                >
                  Apply cognition settings
                </button>
              </>
            ) : (
              <>
                <p className="help-intro">
                  A small set of individual rules. A network of emergent
                  consequences.
                </p>
                <div className="help-grid">
                  <article>
                    <span>01 / INDIVIDUALS</span>
                    <h3>Distinct, imperfect agents</h3>
                    <p>
                      27 traits, a continuous opinion, mood, energy, affiliation
                      and bounded social memory. Correlated trait distributions
                      generate heterogeneous populations. All identities are
                      fictional and adult.
                    </p>
                  </article>
                  <article>
                    <span>02 / INTERACTIONS</span>
                    <h3>Local, bounded decisions</h3>
                    <p>
                      Agents observe outgoing neighbors or discover a random
                      contact. Similarity, trust, anxiety, honesty and
                      aggression affect partner choice and action. They can
                      cooperate, deceive, argue, persuade, post, gossip or
                      withdraw.
                    </p>
                  </article>
                  <article>
                    <span>03 / EVOLUTION</span>
                    <h3>Relationships remember</h3>
                    <p>
                      Positive and negative interactions update signed tie
                      strengths and trust. Opinions change through persuasion or
                      become more extreme during conflict. Ties decay, form or
                      dissolve. Initial affiliations and detected communities
                      are distinct concepts.
                    </p>
                  </article>
                  <article>
                    <span>04 / EVIDENCE</span>
                    <h3>Reproduce and inspect</h3>
                    <p>
                      Seeded random state, checkpoint replay, logged
                      interventions and independent replication experiments make
                      results inspectable. LLM outputs are recorded, with no
                      hidden reasoning required.
                    </p>
                  </article>
                </div>
                <div className="method-note">
                  <Info size={17} />
                  <p>
                    Large populations use sparse adjacency structures, capped
                    interaction budgets, sampled rendering (650 agents) and
                    bounded checkpoints. Expensive metrics disclose exact or
                    sampled methods. These models are research constructs; they
                    are not validated predictors of real people. This release
                    includes parameter sweeps, bootstrap intervals and
                    permutation tests. The full-stack server adds ANOVA,
                    regression and sensitivity summaries.
                  </p>
                </div>
                <a
                  href="/social-lab/lapenzer-social-lab-source.zip"
                  download
                  className="button secondary"
                >
                  <Download size={14} />
                  Download source & methodology
                </a>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
