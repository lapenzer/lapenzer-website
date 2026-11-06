import type { Metadata } from "next";
import Link from "next/link";
import { TechnologyPage } from "@/components/TechnologyPage";
import { TechnicalDetails } from "@/components/TechnicalDetails";
import { EvidencePanel } from "@/components/EvidencePanel";

export const metadata: Metadata = {
  title: "LAPENZER Agent Fabric architecture",
  description: "LAPENZER Agent Fabric architecture for AI agent interoperability, orchestration, route prediction, event forecasting, network analysis, simulation and Decision Support.",
};

export default function AgentFabric() {
  return (
    <TechnologyPage
      number="04"
      title="An interoperability layer for AI agents."
      subtitle="LAPENZER Agent Fabric"
      description="A modular architecture for coordinating AI agents and independently versioned predictive algorithms across software, cloud, simulation, edge and physical environments."
      status="Proposed reference architecture / implementation blueprint"
      sections={[
        {
          id: "overview",
          label: "Platform overview",
          content: (
            <>
              <h2>One control plane. Distributed execution.</h2>
              <p>Agent Fabric separates coordination from execution. A central control plane manages agent identity, capability discovery, task orchestration, policy, approvals and durable state. Distributed runtimes perform work close to the software or hardware environment they control.</p>
              <p>The platform is designed to support different AI models, programming languages, agent frameworks, cloud providers and hardware manufacturers through versioned contracts and replaceable adapters. It separates control-plane decisions from worker execution, and keeps algorithm services, decision records and environment-specific connectors independently deployable.</p>
              <p>The architecture has three operating boundaries: a trusted control plane that authenticates and authorizes work; isolated execution runtimes that interact with software or devices; and governed analytical services that return versioned outputs with provenance and uncertainty. Data and actions cross these boundaries only through declared contracts.</p>
              <EvidencePanel status="Proposed architecture">
                <p>This page describes a target design and implementation plan. It does not claim that the platform, connectors, certifications or operational capabilities have already been implemented or validated.</p>
              </EvidencePanel>
            </>
          ),
        },
        {
          id: "layers",
          label: "Architecture layers",
          content: (
            <>
              <h2>Six layers with cross-cutting controls.</h2>
              <ol className="architecture-steps">
                <li><strong>Experience</strong><span>Web console, APIs, SDKs, CLI, task monitoring and Decision Support workspaces.</span></li>
                <li><strong>Control plane</strong><span>Agent and capability registries, orchestrator, scheduler, policy, approvals, model gateway and durable state.</span></li>
                <li><strong>Interoperability</strong><span>MCP, A2A, REST/OpenAPI, gRPC, event messaging and device protocol adapters.</span></li>
                <li><strong>Distributed execution</strong><span>Software, simulation, cloud, edge and robotics runtimes.</span></li>
                <li><strong>Algorithm and intelligence services</strong><span>Route prediction, event forecasting, network influence analysis and conflict-state simulation, each independently versioned.</span></li>
                <li><strong>Connected environments</strong><span>Browsers, desktops, business applications, databases, games, robots, sensors and industrial systems.</span></li>
              </ol>
              <p>Security, governance, observability, data management and resilience apply across every layer. Algorithms are independent services with their own schemas, versions, evaluation records and deployment status. The orchestrator coordinates work but is not itself dependent on a particular language model or provider.</p>
              <p>Information flows in both directions: runtimes publish observations, status and artifacts; the control plane dispatches authorized tasks; analytical services return findings and uncertainty; and Decision Support packages evidence and options for human review. The connected environment never receives unrestricted authority merely because an agent is registered.</p>
              <TechnicalDetails title="Architecture flow" open>
                <pre>{`Users and external systems
          |
Experience: Console / API / SDK / CLI
          |
Control plane: Identity + Registry + Orchestrator
          |              |               |
      Policy        Model gateway    Durable state
          |
Interoperability: MCP / A2A / REST / gRPC / Events
          |
Execution: Software / Simulation / Cloud / Edge / Robotics
          |
Algorithm services: Route / Event / Network / Conflict simulation
          |
Decision Support: Evidence / Analysis / Options / Human review
          |
Environments: Apps / Browsers / Games / Data / Devices

Cross-cutting: Security, governance, audit, observability`}</pre>
              </TechnicalDetails>
            </>
          ),
        },
        {
          id: "algorithm-layer",
          label: "Algorithm and intelligence layer",
          content: (
            <>
              <h2>Keep LAPENZER algorithms independent, reusable and measurable.</h2>
              <p>The algorithm layer exposes domain-specific analytical capabilities through versioned APIs. Agent Fabric can invoke them, but the algorithms do not become agents and their mathematical logic does not belong inside the orchestration engine.</p>
              <TechnicalDetails title="Algorithm service architecture" open>
                <pre>{`Orchestrator / Decision Support / External Applications
                         |
                Algorithm API Gateway
                         |
            Algorithm and Model Registry
                         |
       +-----------------+------------------+
       |                 |                  |
 Route Prediction  Event Forecasting  Network Analysis
       |                 |                  |
       +---------- Shared analytical services --------+
                  Graphs / Evidence / Features
                  Calibration / Evaluation
                  Simulation / Provenance
                         |
                  Versioned results
                         |
                  Decision Support`}</pre>
              </TechnicalDetails>
              <h3>1. Route Prediction Algorithm (RPA / UZUSKE)</h3>
              <p><strong>Core LAPENZER predictive capability.</strong> The service models movement over dynamic directed graphs and returns ranked candidate transitions or routes, destination probabilities, uncertainty and ETA ranges.</p>
              <ul>
                <li>Dynamic graph construction, graph/state estimation and map matching.</li>
                <li>Generalized resistance matrices covering distance, terrain, movement, logistics, weather, risk, interest and asset factors.</li>
                <li>First-, second- and third-order Markov transition statistics, recency weighting and Bayesian destination inference.</li>
                <li>Candidate generation, contextual 18-feature ranking and domain adapters for road, terrain, marine and air.</li>
                <li>Calibration, conformal prediction, entropy, beam-search forecasting and ETA quantile simulation.</li>
                <li>Chronological evaluation, leakage controls, candidate coverage, abstention and feedback/drift monitoring.</li>
              </ul>
              <p><strong>Maturity:</strong> Working Python/TypeScript prototype and website-integrated numerical implementation documented. UZUSKE 1.0 demonstrated a working next-node prediction. Broader RPA v3/v4 work includes expanded training, evaluation and API features. This is not a claim of production reliability, live-data performance or domain qualification.</p>
              <p><Link className="text-link" href="/technology/route-prediction">Review the route prediction research and implementation ↗</Link></p>
              <h3>2. Event Forecasting and Bayesian Cascade Model</h3>
              <p>A separate forecasting prototype combines logistic probability estimation, Bayesian evidence updates, reliability-weighted OSINT inputs, market-implied signals, hazard modelling, consequence graphs, Monte Carlo propagation, calibration and expected-value analysis. The associated 2026 research paper describes a 16-equation framework; a prototype was previously reported as tested with six tests.</p>
              <p><strong>Maturity:</strong> Prototype/research. Prospective forecast performance, calibration, event-resolution tracking and continuous production operation require verification. Polymarket prices are evidence inputs, not ground truth.</p>
              <p><strong>Product boundary:</strong> The separate Quantified Systems forecasting application currently implements market-signal ingestion, user forecast submission/history, community aggregation and AI-generated decision briefs. That application should not be represented as proof that the Bayesian cascade prototype is integrated or independently generating forecasts.</p>
              <h3>3. Aggregate Network Influence Analysis</h3>
              <p>A theoretical framework for aggregate network-level analysis using dynamic weighted graphs, reliability-weighted evidence, historical baselines, temporal changes, probabilistic network exposure, uncertainty-aware ensembles and abstention. It is not an individual-level classification system.</p>
              <p><strong>Maturity:</strong> Research framework with a synthetic website demonstration. No empirical accuracy, causal validity or operational predictive performance is claimed. Keep it non-operational until validated and governed.</p>
              <p><Link className="text-link" href="/technology/network-influence">Review the network influence research ↗</Link></p>
              <h3>4. Networked Conflict-State Simulation</h3>
              <p>A graph-based, multi-state Markov and Monte Carlo simulation framework for exploring conditional state transitions, neighbouring effects, cascade uncertainty and scenario outcomes. A synthetic hybrid demonstrator also includes Lanchester-style continuous attrition dynamics.</p>
              <p><strong>Maturity:</strong> Runnable seeded synthetic demonstrator and theoretical preprint. No empirical performance or operational validity is claimed.</p>
              <p><Link className="text-link" href="/technology/conflict-simulation">Review the conflict-state simulation framework ↗</Link></p>
              <h3>Shared services, not duplicated algorithms</h3>
              <p>Graph and spatiotemporal data contracts, evidence provenance, feature engineering, model registry, time-aware evaluation, calibration, uncertainty, Monte Carlo execution, optimization, drift monitoring and reproducible run records should be shared infrastructure. Dijkstra, A*, Bayesian inference, logistic regression, Markov models and Monte Carlo remain methods inside their domain services, not separate product modules.</p>
              <EvidencePanel status="Maturity is explicitly differentiated">
                <p>Working prototype, research framework and proposed platform capability are different statuses. The architecture preserves those distinctions and does not promote synthetic demonstrations or paper-level methods into validated operational products.</p>
              </EvidencePanel>
            </>
          ),
        },
        {
          id: "decision-support",
          label: "Decision Support",
          content: (
            <>
              <h2>Turn evidence and analysis into traceable decision products.</h2>
              <p>Decision Support is a first-class subsystem alongside orchestration. It receives evidence and analytical outputs from agents, external systems, datasets, sensors and human operators. It helps people assess a situation, compare options, explore scenarios and document the basis for a decision.</p>
              <ol className="architecture-steps">
                <li><strong>Evidence ingestion</strong><span>Collect information with source identity, timestamps, context and provenance.</span></li>
                <li><strong>Validation and normalization</strong><span>Check schemas, completeness, freshness, consistency and quality.</span></li>
                <li><strong>Evidence fusion</strong><span>Correlate observations while preserving source-level traceability.</span></li>
                <li><strong>Analytical engine</strong><span>Run approved statistical, mathematical, optimization and AI methods.</span></li>
                <li><strong>Scenario analysis</strong><span>Explore alternative assumptions, conditions and possible outcomes.</span></li>
                <li><strong>Option comparison</strong><span>Compare feasible alternatives against explicit objectives and criteria.</span></li>
                <li><strong>Risk and uncertainty</strong><span>Assess sensitivity, robustness, evidence gaps, model disagreement and limitations.</span></li>
                <li><strong>Explainability and review</strong><span>Show the evidence and assumptions behind findings for human assessment.</span></li>
                <li><strong>Decision record</strong><span>Preserve the question, evidence snapshot, options, rationale, approvals and subsequent outcome.</span></li>
              </ol>
              <TechnicalDetails title="Decision Support processing flow" open>
                <pre>{`Sources -> Ingestion -> Validation -> Evidence fusion
       -> Analytical models <-> Scenario analysis
       -> Option generation and comparison
       -> Risk / sensitivity / uncertainty
       -> Explainability and provenance
       -> Human review and authorization
       -> Decision record and outcome feedback`}</pre>
              </TechnicalDetails>
              <h3>Methods and capabilities</h3>
              <ul>
                <li>Multi-criteria decision analysis (MCDA).</li>
                <li>Bayesian inference and probabilistic reasoning.</li>
                <li>Statistical analysis and forecasting.</li>
                <li>Optimization and resource allocation.</li>
                <li>Scenario modelling and simulation.</li>
                <li>Risk, sensitivity and robustness analysis.</li>
                <li>Evidence reliability assessment and contradiction detection.</li>
                <li>Post-decision performance evaluation.</li>
              </ul>
              <p>Every decision product must distinguish observed facts, derived findings, assumptions, model outputs and recommendations. A recommendation is not an established fact. Confidence values must be defined and validated for the specific use case; an AI model&apos;s self-reported confidence is not enough.</p>
              <p>Decision Support advises and explains. Consequential decision authority remains with the designated human decision-maker unless a separately authorized automated process has explicitly been configured.</p>
            </>
          ),
        },
        {
          id: "agents",
          label: "Agent contract",
          content: (
            <>
              <h2>Give every agent a common, versioned contract.</h2>
              <p>Native agents publish a machine-readable identity, version, runtime, capabilities, input and output schemas, dependencies, health status and requested permissions. Third-party agents use adapters to translate their native interfaces into the platform contract.</p>
              <p>A capability declaration describes what an agent can do. It does not grant permission. The policy engine independently authorizes each operation in context.</p>
              <TechnicalDetails title="Illustrative agent manifest">
                <pre>{`{
  "agent_id": "minecraft-builder",
  "version": "1.0.0",
  "runtime": "simulation",
  "capabilities": [
    "world.inspect",
    "structure.plan",
    "block.place",
    "build.verify"
  ],
  "permissions_requested": [
    "world.read",
    "world.write"
  ],
  "execution_limits": {
    "max_execution_time_seconds": 300,
    "human_approval_required": false
  }
}`}</pre>
                <p>Production manifests require formal versioned schemas, signed identity metadata, dependency declarations, policy references and explicit input/output validation.</p>
              </TechnicalDetails>
            </>
          ),
        },
        {
          id: "interoperability",
          label: "Interoperability",
          content: (
            <>
              <h2>Use adapters and established standards.</h2>
              <ul>
                <li><strong>MCP:</strong> model-to-tool, resource and prompt integration.</li>
                <li><strong>A2A:</strong> discovery and task collaboration between independent agents.</li>
                <li><strong>REST / OpenAPI:</strong> conventional application and partner APIs.</li>
                <li><strong>gRPC / Protobuf:</strong> typed service-to-service communication.</li>
                <li><strong>WebSockets / SSE:</strong> live and streamed updates.</li>
                <li><strong>MQTT:</strong> lightweight IoT messaging.</li>
                <li><strong>ROS 2 / DDS:</strong> robotics middleware and distributed robotics communication.</li>
                <li><strong>OPC UA:</strong> industrial interoperability and information modelling.</li>
              </ul>
              <p>These standards address different integration problems. Each connector must declare supported versions, authentication, capabilities, limits, error handling and conformance tests. The core orchestrator must not contain environment-specific integration logic.</p>
            </>
          ),
        },
        {
          id: "runtimes",
          label: "Execution runtimes",
          content: (
            <>
              <h2>Run agents where the work takes place.</h2>
              <ul>
                <li><strong>Software runtime:</strong> browser, desktop, business applications, development tools and databases.</li>
                <li><strong>Simulation runtime:</strong> games, Minecraft, digital twins, virtual testbeds and physics simulations.</li>
                <li><strong>Cloud runtime:</strong> scalable workers, parallel workloads and inference.</li>
                <li><strong>Edge runtime:</strong> local execution near devices, with event buffering and intermittent-connectivity support.</li>
                <li><strong>Robotics runtime:</strong> ROS 2 and device-specific adapters for bounded physical command execution.</li>
              </ul>
              <p>Each runtime implements registration, capability declaration, authenticated task reception, execution, status reporting, event publication, artifact exchange, cancellation, error handling and health reporting.</p>
              <p>A shared orchestration contract does not make a simulated action safe to transfer directly to physical equipment. Physical environments require device-specific validation and independent safety controls.</p>
            </>
          ),
        },
        {
          id: "security",
          label: "Security and governance",
          content: (
            <>
              <h2>Make authorization part of every execution path.</h2>
              <ul>
                <li>OIDC/OAuth 2.0 and workload identities where appropriate.</li>
                <li>RBAC, ABAC and capability-scoped permissions.</li>
                <li>OPA or a replaceable policy evaluation interface.</li>
                <li>Short-lived credentials, secrets management and key rotation.</li>
                <li>Tenant isolation, network segmentation and egress controls.</li>
                <li>OCI containers and stronger sandboxing for untrusted workloads.</li>
                <li>Signed artifacts, software bills of materials and dependency verification.</li>
                <li>Append-only, tamper-evident audit records.</li>
              </ul>
              <p>AI agents must not bypass native hardware safety controllers. Emergency-stop functions and safety interlocks remain independent of the AI runtime. High-consequence actions require appropriate authorization and controlled testing.</p>
            </>
          ),
        },
        {
          id: "data",
          label: "Data and infrastructure",
          content: (
            <>
              <h2>Keep persistence durable and replaceable.</h2>
              <ul>
                <li><strong>PostgreSQL:</strong> primary relational records and task state.</li>
                <li><strong>NATS JetStream:</strong> durable messaging and event delivery.</li>
                <li><strong>Redis:</strong> cache and ephemeral coordination.</li>
                <li><strong>S3-compatible storage:</strong> artifacts and evidence objects.</li>
                <li><strong>PostGIS:</strong> optional geospatial data.</li>
                <li><strong>pgvector:</strong> optional vector retrieval.</li>
                <li><strong>OpenTelemetry:</strong> correlated traces, metrics and logs.</li>
              </ul>
              <p>Use transactional outbox processing, idempotent consumers, durable queues and explicit state transitions. Separate tenant, identity, agent, capability, task, execution, approval, event, artifact, evidence and decision records. Define retention, deletion, backup and data residency by deployment profile.</p>
            </>
          ),
        },
        {
          id: "deployment",
          label: "Deployment profiles",
          content: (
            <>
              <h2>One architecture across different operating environments.</h2>
              <ol className="architecture-steps">
                <li><strong>Shared cloud SaaS</strong><span>Multi-tenant services, tenant-isolated workloads and region-aware data placement.</span></li>
                <li><strong>Dedicated customer environment</strong><span>Dedicated services, customer-controlled keys, networks and model endpoints.</span></li>
                <li><strong>On-premises or disconnected</strong><span>Local registry, orchestrator, policy, state, audit and optional local inference; no mandatory external connection.</span></li>
                <li><strong>Edge deployment</strong><span>Lightweight runtimes, local validation, event buffering and controlled synchronization.</span></li>
              </ol>
              <p>Disconnected deployments must retain local identity, authorization and audit capabilities. Policy freshness, credential expiry, revocation limits and synchronization conflicts must be explicitly designed.</p>
            </>
          ),
        },
        {
          id: "roadmap",
          label: "Implementation roadmap",
          content: (
            <>
              <h2>Build and verify in stages.</h2>
              <ol className="architecture-steps">
                <li><strong>Core foundation</strong><span>Identity, registry, capability schemas, task API and durable state. Verify a test agent can register, execute and report a verifiable result.</span></li>
                <li><strong>Interoperability</strong><span>MCP, A2A, REST adapters and connector SDK. Verify independent agents exchange tasks and outputs.</span></li>
                <li><strong>Multi-agent workflows</strong><span>Delegation, parallel execution, shared state and recovery. Test failure and retry behaviour.</span></li>
                <li><strong>Software environments</strong><span>Browser, desktop and game adapters. Verify controlled interaction and acceptance criteria.</span></li>
                <li><strong>Decision Support</strong><span>Evidence ingestion, analytical runs, option comparison, uncertainty, human review and decision records.</span></li>
                <li><strong>Edge and physical systems</strong><span>Edge runtime, ROS 2 and device adapters. Pass device-specific safety tests.</span></li>
                <li><strong>Enterprise deployment</strong><span>SaaS, dedicated, on-premises and disconnected profiles. Pass deployment and recovery tests.</span></li>
              </ol>
              <p>Start with a modular monolith for the control plane and separately deployable workers. Split services only when scale, security isolation, release cadence or operational ownership justifies it.</p>
            </>
          ),
        },
        {
          id: "acceptance",
          label: "Acceptance criteria",
          content: (
            <>
              <h2>Require evidence before claiming readiness.</h2>
              <ul>
                <li>Switch model providers without changing orchestration contracts.</li>
                <li>Run compatible agents on different hosts.</li>
                <li>Connect independently implemented MCP and A2A agents.</li>
                <li>Add a connector without modifying the core.</li>
                <li>Recover interrupted tasks without corrupting committed state.</li>
                <li>Reject unauthorized operations and expired credentials.</li>
                <li>Demonstrate tenant isolation and reconstruct task authorization and execution from audit records.</li>
                <li>Reproduce a decision analysis from its evidence snapshot, model version and parameters.</li>
                <li>Demonstrate that AI execution cannot bypass independent hardware safety controls.</li>
                <li>Deploy and recover the platform in every supported deployment profile.</li>
              </ul>
              <p>Certification, predictive performance, security assurance and operational suitability must be established through separate documented testing. They are not implied by this architecture.</p>
            </>
          ),
        },
        {
          id: "api",
          label: "API and developer platform",
          content: (
            <>
              <h2>Expose every major platform capability through versioned interfaces.</h2>
              <p>The public API is the stable boundary between the control plane, customer applications, developer tools and independently deployed services. Use OpenAPI for HTTP contracts and gRPC with Protobuf for typed internal service communication where streaming or strict schemas are useful. Version APIs explicitly and maintain backward-compatibility rules.</p>
              <ul>
                <li><strong>Agent API:</strong> register, update, discover, inspect and deactivate agents.</li>
                <li><strong>Capability API:</strong> publish capability manifests, retrieve schemas and validate requested operations.</li>
                <li><strong>Task and workflow APIs:</strong> submit, inspect, cancel, pause, resume, delegate and coordinate work.</li>
                <li><strong>Execution API:</strong> start and monitor runtime jobs, retrieve status and stream execution events.</li>
                <li><strong>Connector API:</strong> install, configure, test, upgrade, disable and revoke integrations.</li>
                <li><strong>Policy API:</strong> evaluate authorization requests and retrieve policy decision metadata.</li>
                <li><strong>Artifact and event APIs:</strong> exchange signed artifacts and publish or subscribe to durable events.</li>
                <li><strong>Decision API:</strong> create decision questions, initiate analyses, compare options, request review and preserve decisions.</li>
              </ul>
              <TechnicalDetails title="Illustrative API surface">
                <pre>{`POST   /v1/agents
GET    /v1/agents/{agent_id}/capabilities
POST   /v1/tasks
GET    /v1/tasks/{task_id}
POST   /v1/tasks/{task_id}/cancel
POST   /v1/workflows
POST   /v1/connectors
POST   /v1/policies/evaluate
POST   /v1/decisions
POST   /v1/decisions/{decision_id}/analyses
POST   /v1/decisions/{decision_id}/review
GET    /v1/executions/{execution_id}/events`}</pre>
              </TechnicalDetails>
              <p>Developer deliverables should include Python and TypeScript SDKs, a command-line interface, an agent development kit, connector development kit and runtime development kit. A third party should be able to add an agent or connector without modifying the orchestration core.</p>
            </>
          ),
        },
        {
          id: "connectors",
          label: "Connector lifecycle",
          content: (
            <>
              <h2>Make integrations independently installable and replaceable.</h2>
              <p>Every connector is a versioned package that translates a target system's native interface into the platform's common agent, capability, event and artifact contracts. Connector-specific logic stays outside the orchestrator.</p>
              <p>A connector manifest records its identity, owner, version, target system, protocol, capabilities, input/output schemas, authentication method, requested permissions, network destinations, resource limits, data handling, dependencies, compatibility, health checks and security provenance.</p>
              <TechnicalDetails title="Connector lifecycle" open>
                <pre>{`Package
  -> Validate manifest, schemas, signatures and dependencies
  -> Register connector and declared capabilities
  -> Review requested permissions and network access
  -> Deploy in an isolated runtime
  -> Run conformance and health tests
  -> Monitor errors, latency, resource use and policy decisions
  -> Upgrade, disable or revoke`}</pre>
              </TechnicalDetails>
              <p>Connector failure must not corrupt task state. Retries must be bounded and idempotent where possible. Revocation must prevent new work and define how in-flight tasks are safely cancelled or completed.</p>
            </>
          ),
        },
        {
          id: "operations",
          label: "Observability and operations",
          content: (
            <>
              <h2>Make every task traceable from request to verified result.</h2>
              <p>Use correlated distributed traces, structured logs and metrics across the control plane, connectors, algorithm services and execution runtimes. A task identifier and trace identifier should follow work across service boundaries.</p>
              <ul>
                <li>Task acceptance, completion, latency, retries and failure rates.</li>
                <li>Agent availability, health and capability changes.</li>
                <li>Queue depth, scheduling delay and worker utilization.</li>
                <li>Model-provider latency, errors, token use and fallback behaviour.</li>
                <li>Connector health, protocol errors and conformance status.</li>
                <li>Authorization denials, approval delays and policy changes.</li>
                <li>Decision analysis execution, evidence freshness and model versions.</li>
                <li>Audit pipeline integrity, storage health and recovery status.</li>
              </ul>
              <p>Redact secrets and sensitive payloads from telemetry by default. Retention, access and data residency are deployment-specific. Define service-level objectives only after representative workload measurement.</p>
            </>
          ),
        },
        {
          id: "workflow-example",
          label: "Example workflow",
          content: (
            <>
              <h2>Coordinate agents in a virtual environment.</h2>
              <p>For example, a user asks an agent team to build and verify a structure in a Minecraft world. The same orchestration contract can coordinate planning, execution and verification agents while the simulation adapter handles game-specific actions.</p>
              <ol className="architecture-steps">
                <li><strong>Submit objective</strong><span>The console or API creates a task with scope and acceptance criteria.</span></li>
                <li><strong>Discover capabilities</strong><span>The registry identifies agents that can inspect, plan, build and verify.</span></li>
                <li><strong>Authorize</strong><span>The policy engine evaluates identities, requested permissions and environment boundaries.</span></li>
                <li><strong>Plan and delegate</strong><span>The orchestrator creates a workflow and assigns bounded tasks.</span></li>
                <li><strong>Execute</strong><span>The simulation runtime invokes the game connector to carry out approved actions.</span></li>
                <li><strong>Verify</strong><span>An independent agent inspects the resulting world state against acceptance criteria.</span></li>
                <li><strong>Recover or complete</strong><span>Failed steps are retried, corrected or escalated; verified artifacts and task records are retained.</span></li>
              </ol>
              <p>A robotics workflow uses the same high-level orchestration pattern but requires a separate device adapter, device-specific validation and independent hardware safety controls. A simulated action is never assumed safe for physical execution.</p>
            </>
          ),
        },
        {
          id: "technology-stack",
          label: "Technology choices",
          content: (
            <>
              <h2>Choose replaceable technologies around stable contracts.</h2>
              <p>The following stack is a practical starting point, not a fixed dependency or a claim that these components are already deployed.</p>
              <ul>
                <li><strong>Web console:</strong> React and TypeScript.</li>
                <li><strong>Control-plane API:</strong> Python and FastAPI.</li>
                <li><strong>Specialized gateways:</strong> Go or Rust when profiling justifies them.</li>
                <li><strong>Contracts:</strong> OpenAPI, JSON Schema, Protobuf and AsyncAPI where appropriate.</li>
                <li><strong>Primary data:</strong> PostgreSQL, with PostGIS for geospatial workloads.</li>
                <li><strong>Durable messaging:</strong> NATS JetStream; Redis for cache and ephemeral coordination.</li>
                <li><strong>Artifacts:</strong> S3-compatible object storage.</li>
                <li><strong>Policy:</strong> Open Policy Agent behind a replaceable policy interface.</li>
                <li><strong>Observability:</strong> OpenTelemetry-compatible traces, metrics and logs.</li>
                <li><strong>Packaging:</strong> OCI containers; Kubernetes only where deployment scale requires it.</li>
              </ul>
              <p>Begin with a modular monolith for the control plane, strict internal module boundaries and separately deployable workers. Split services when measured scale, security isolation, independent release cadence or operational ownership makes that separation worthwhile. This avoids premature microservice complexity.</p>
            </>
          ),
        },
        {
          id: "nexus",
          label: "Relationship to NEXUS",
          content: (
            <>
              <h2>Two products. An integration, not a dependency.</h2>
              <p>Agent Fabric remains a standalone product with its own APIs, SDKs, deployment profiles and licensing model. LAPENZER NEXUS may use Agent Fabric to coordinate evidence collection, research, analysis and verification agents. The integration uses published APIs and capability contracts; neither product requires the other to operate.</p>
            </>
          ),
        },
      ]}
    >
      <div className="article-copy">
        <p>The complete architecture blueprint includes the system context, module responsibilities, Decision Support design, agent contract, orchestration workflow, interoperability standards, security model, data architecture, deployment profiles, API families, connector lifecycle, implementation roadmap and acceptance criteria.</p>
        <p><Link className="text-link" href="/architecture/lapenzer-agent-fabric-blueprint.md">Read or download the complete architecture blueprint ↗</Link></p>
        <p><Link className="text-link" href="/technology">Explore all LAPENZER technology ↗</Link></p>
      </div>
    </TechnologyPage>
  );
}
