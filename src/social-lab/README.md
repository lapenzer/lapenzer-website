# LAPENZER Social Network Laboratory

A working research application for fictional, heterogeneous social agents. React + TypeScript + Cytoscape + Plotly; a seeded simulation in a Web Worker; an optional FastAPI research server with PostgreSQL or SQLite persistence, NetworkX, SciPy and statsmodels.

## Start locally

Requires Node 22+ and Python 3.12+. There are no paid services or API keys in the default configuration.

```bash
npm ci
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows PowerShell instead: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm run build
npm run build:engine
uvicorn src.server.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. The default database is `data/aisnl.db` and survives restarts. The API reference is at `/docs`.

During frontend development, leave the API running and use a second terminal:

```bash
npm run dev
```

Vite forwards `/api` requests to port 8000. The hosted browser edition runs without this server and keeps saves and event journals in IndexedDB on the current device. A JSON export is a portable archive.

## PostgreSQL deployment on your computer

```bash
docker compose up --build
```

This starts the app and PostgreSQL 18, persists the database in a Docker volume, and binds the app to http://127.0.0.1:8000. The example database password is for a local, isolated development installation. The server has no multiuser authentication; add authentication and access controls before exposing it beyond your computer. The public browser edition keeps simulation data on the current device.

For an existing database, set `AISNL_DATABASE_URL` to a SQLAlchemy PostgreSQL URL before launching. PostgreSQL connections use psycopg. The initial schema is created on startup; future incompatible schema changes require a migration.

## What you can do

- Create 1–100,000 fictional adult agents with 27 bounded traits, correlated distributions, opinions, goals, mood, energy, affiliations and limited memory.
- Generate Erdős–Rényi, Watts–Strogatz, Barabási–Albert, stochastic-block, geometric and fitness-biased preferential networks; use an empty graph or a custom edge list.
- Drag nodes, search names or IDs, change color and layout, add/remove agents, edit signed ties, add simultaneous relationship layers and lock relationship weights.
- Start, pause, stop, step and reset; inspect agents, remember interactions, apply logged interventions and publish an information shock through the engine API.
- Observe cooperation, conflict, persuasion, deception, gossip, posts, passive observation and rejected invitations. Decisions depend on local partners, traits, beliefs and memories. Edges and opinions change through these actions.
- Replay retained checkpoints and branch from a checkpoint or the current live state. Saved random state supports exact continuation in statistical mode.
- Inspect trajectories, clustering, modularity, components, degree distribution, PageRank, betweenness, harmonic closeness, eigenvector centrality, path length, inequality, assortativity, reciprocity and affiliation segregation. Exact and approximate methods are identified.
- Run independent replications and four parameter sweeps; compare run-level outcomes with bootstrap intervals, paired sign-flip permutation tests, standardized effects and Holm correction.
- Export JSON, agent/event/edge/metric CSV, GraphML, GEXF and an SVG density chart. Cytoscape graph PNG/SVG is available through the graph toolbar. Print or save a research report as PDF; the local server also offers a generated PDF endpoint.
- Save/load named runs, import JSON archives and overlay another saved run in Statistics.

The architecture intentionally uses **one canonical simulation kernel** in TypeScript for browser and headless jobs. The Python server runs that same bundled engine as a subprocess rather than maintaining a subtly different second simulation. Python owns scientific analysis, persistence, local model inference and background job management.

## Optional language-model agents

Statistical mode works immediately. Optional modes use an already installed, local Ollama model. This release does not require a paid model service or credentials.

Start Ollama with an installed model, then launch the server with:

```bash
# macOS/Linux
export AISNL_ENABLE_LLM=1
export OLLAMA_URL=http://127.0.0.1:11434
uvicorn src.server.main:app --host 127.0.0.1 --port 8000
```

```powershell
# Windows PowerShell
$env:AISNL_ENABLE_LLM="1"
$env:OLLAMA_URL="http://127.0.0.1:11434"
uvicorn src.server.main:app --host 127.0.0.1 --port 8000
```

For Docker, set `AISNL_ENABLE_LLM: "1"` in compose. Its Ollama URL points to the host computer; make the local service reachable from the container if needed.

Open **Cognition** in the app. Model selection is populated from the server's installed model list.

- **Statistical:** all decisions use the seeded bounded policy.
- **Hybrid:** up to two activated individuals per step use local-model action and communication; other interactions use the statistical policy. When the call budget is exhausted, routine statistical interactions continue.
- **Language-model:** activated source agents choose actions and utterances through the local model; the engine applies bounded state transitions. The run pauses if the remaining budget cannot cover the next activation set.

Local-model decisions receive only the source profile, a locally selected partner and up to eight memory entries, not the global graph. Structured output is validated against seven permitted action categories. At most two calls run concurrently. Per-run call caps, a server call cap, token usage and latency are recorded. Monetary cost is not estimated for local compute. Partner refusal and relationship transitions remain part of the bounded simulation. Recorded results support replay; regenerated LLM results need not be deterministic. An inference failure pauses execution and returns an error; no fabricated model reply is substituted.

## Research methods

Read [MODEL.md](MODEL.md) for rules, equations, metric definitions, experimental assumptions, limitations and storage bounds. All traits and interactions are simulation constructs, not diagnoses or validated human predictions.

### Full-stack API examples

All endpoints are same-origin and local by default. Examples below use JSON request bodies.

| Endpoint                            | Behaviour                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`                   | Server status, installed local models, inference counters and headless availability.                                                           |
| `PUT /api/runs/{id}`                | Save a versioned run, including its JSON state and journal.                                                                                    |
| `GET /api/runs`                     | List saved run metadata.                                                                                                                       |
| `GET /api/runs/{id}`                | Restore a saved run with complete payload.                                                                                                     |
| `DELETE /api/runs/{id}`             | Delete one named server save.                                                                                                                  |
| `POST /api/simulate`                | Headless seeded simulation or continuation of a saved state; scheduled interventions supported.                                                |
| `POST /api/analyze`                 | NetworkX analysis of a submitted full state.                                                                                                   |
| `POST /api/statistics`              | Descriptive, repeated-measures ANOVA, clustered linear/logistic regression, correlation/sensitivity and paired bootstrap/permutation analysis. |
| `POST /api/experiments`             | Queue a background replication experiment.                                                                                                     |
| `GET /api/experiments/{id}`         | Progress, request specification, error or full results.                                                                                        |
| `POST /api/experiments/{id}/cancel` | Cancel a queued or running background job.                                                                                                     |
| `POST /api/cognition`               | Optional bounded local-model action and utterance.                                                                                             |
| `POST /api/report`                  | Generate a PDF report from a state and optional experiment.                                                                                    |

Headless simulation:

```json
{
  "config": { "n": 100, "seed": "demo-42", "topology": "block" },
  "steps": 100,
  "interventions": [
    { "tick": 30, "value": { "kind": "shock", "value": 0.6 } },
    { "tick": 50, "value": { "kind": "remove", "agent": 7 } }
  ]
}
```

To continue, replace `config` with `state` containing a prior response. Scheduled intervention ticks are absolute simulation ticks. Population limits: 100,000 agents, 600,000 ties, 50 million agent-steps per headless request, five-minute request timeout. Interactive sweeps are limited to 2,000 agents per run and 50 million agent-steps per experiment.

Background experiment:

```json
{
  "config": { "n": 100, "seed": "baseline", "topology": "block" },
  "spec": {
    "variable": "agreeableness",
    "values": [0.2, 0.5, 0.8],
    "replications": 10,
    "steps": 60,
    "outcome": "density",
    "seed": "study-1"
  }
}
```

Statistics requests explicitly declare `"unit":"simulation_run"`. Each `rows` record has numeric `level`, `replicate`, `value`. Levels sharing a replication index are paired. Repeated-measures ANOVA requires a complete balanced design. Logistic regression requires a binary run-level outcome. Clustered regression treats replication indices as independent clusters. Few replication clusters make inference unstable.

## Verify

```bash
npm test
npm run build:engine
python -m pytest -q src/server/tests
npm run build
```

The tests exercise seed determinism, exact save/resume, topology boundaries, signed multilayer edits and locks, behaviour diversity, checkpoint immutability, directed/disconnected metric fixtures, 10,000-agent sparse rendering bounds, LLM action transition handling, replicated statistics, exports, durable SQL roundtrips, headless jobs and PDF generation. Live Ollama inference and a live PostgreSQL server require those services and were not part of the default test run. Docker configuration is supplied; test it on a machine with Docker available.

## Source layout

```
src/
  client/       React dashboard, Cytoscape canvas, Plotly charts, IndexedDB, exports
  engine/       Serializable states, seeded randomness, simulation, analytics, experiments
  server/       FastAPI API, SQL persistence, scientific analysis, bundled engine runner
  tests/        Model and export tests
```

The hosted build's source-download archive is generated at packaging time. A fresh local checkout does not need to generate that archive to run the app.
