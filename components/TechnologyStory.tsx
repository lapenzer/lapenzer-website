"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { GraphScene, InfluenceScene, ConflictScene } from "@/components/GraphScene";
import { examplePredictions } from "@/lib/route";
import { scenario } from "@/lib/conflict";
import { useMedia } from "@/lib/use-media";
const routeSteps = [
  ["Represent the network.", "A directed graph describes what connects to what. Positive edge weights express structural preference. This example has 14 nodes and 29 edges."],
  ["Read the movement history.", "Historical traces count transitions. Recent observations A → C → F → J add a decaying bonus; they do not force every route to follow that prefix."],
  ["Score each transition.", "Blend smoothed historical frequencies (72%) with normalized edge priors (28%), then apply the recency bonus."],
  ["Expand feasible candidates.", "A bounded beam search keeps promising loop-free paths. The evaluation defaults retain a beam of 48 and search at most 8 hops."],
  ["Compare the alternatives.", "Sum log transition scores along each path and normalize over the retained Top-K. The shares describe that returned candidate set."],
  ["Keep uncertainty visible.", "A → C → F → J → N ranks first in the bundled example at 36.2938%. The other ranked routes remain visible for comparison."],
];
const influenceSteps = [
  ["Start with aggregate units.", "A changing graph connects communities, regions, narratives, and events. The unit of analysis remains aggregate."],
  ["Weigh the observations.", "Source reliability changes each report’s contribution. A weakly supported observation should carry less weight."],
  ["Find change from baseline.", "Compare current indicators with historical means and variation. First and second differences describe change and acceleration."],
  ["Represent network exposure.", "Weighted relationships connect local and neighboring conditions. Exposure encodes a statistical dependence that requires empirical evaluation."],
  ["Compare component forecasts.", "A weighted average combines local, temporal, and network forecasts. Entropy measures uncertainty; differences between forecasts measure disagreement."],
  ["Leave room to abstain.", "Return the aggregate forecast, contributing variables, and alternative explanations for human review. Inadequate evidence produces an explicit abstention."],
];
const conflictSteps = [
  ["Define a system state.", "Synthetic regions begin in states labeled stable, pressured, contested, or control changed. The transition calculation uses the states of connected regions."],
  ["Condition the next step.", "Context and neighboring states shift a region’s transition probabilities. Markov dependence is on the represented current state."],
  ["Normalize transition scores.", "Softmax converts transition scores into nonnegative probabilities that sum to one. Each region can have several possible next states."],
  ["Connect continuous strength.", "The hybrid extension uses simplified Lanchester dynamics to produce strength ratios and attrition features, then feeds them into the state model."],
  ["Sample possible futures.", "Monte Carlo simulation repeatedly samples uncertain parameters and state trajectories. The diagram shows the most frequent state at each region."],
  ["Inspect the distribution.", "Read conditional outcomes and sensitivity to assumptions. The papers present strategic scenario theory with no empirical predictive accuracy claim."],
];
const storyData = {
  route: { number: "01", title: "Rank routes through a graph.", subtitle: "Route prediction", status: "Local evaluation build", href: "/technology/route-prediction", steps: routeSteps, meta: "14 NODES / 29 DIRECTED EDGES" },
  influence: { number: "02", title: "Calculate network influence.", subtitle: "Network influence dynamics", status: "Research framework", href: "/technology/network-influence", steps: influenceSteps, meta: "AGGREGATE UNITS / SYNTHETIC EXAMPLE" },
  conflict: { number: "03", title: "Simulate geographic states.", subtitle: "Conflict-state simulation", status: "Research framework", href: "/technology/conflict-simulation", steps: conflictSteps, meta: "SYNTHETIC GEOGRAPHY / SCENARIO RESEARCH" },
};
const futures = scenario();
export function StageNavigation({ labels, current, onSelect }: { labels: string[]; current: number; onSelect: (n: number) => void }) {
  return <nav className="stage-navigation" aria-label="Explanation stages">{labels.map((label, i) => <button key={label} type="button" aria-label={`Stage ${i + 1}: ${label}`} aria-current={current === i ? "step" : undefined} onClick={() => onSelect(i)}><span>0{i + 1}</span><i aria-hidden="true" /></button>)}</nav>;
}
export function TechnologyStory({ kind }: { kind: keyof typeof storyData }) {
  const data = storyData[kind], root = useRef<HTMLElement>(null), [stage, setStage] = useState(0), [manuallySelected, setManuallySelected] = useState(false);
  const reduced = useMedia("(prefers-reduced-motion: reduce)"), compact = useMedia("(max-width: 900px)");
  useEffect(() => {
    if (reduced || compact || !root.current) return;
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) setStage(Number((entry.target as HTMLElement).dataset.index)); }, { rootMargin: "-32% 0px -42% 0px", threshold: 0 });
    root.current.querySelectorAll("[data-index]").forEach(el => observer.observe(el)); return () => observer.disconnect();
  }, [reduced, compact]);
  const active = reduced || (compact && !manuallySelected) ? 5 : stage;
  function select(index: number) { setManuallySelected(true); setStage(index); if (!compact && !reduced) document.getElementById(`${kind}-step-${index}`)?.scrollIntoView({ block: "center", behavior: "smooth" }); }
  return <section ref={root} className={`technology-story story-${kind}`} data-reduced={reduced} aria-labelledby={`${kind}-title`}><div className="shell"><div className="story-heading"><p className="eyebrow">{data.number} / {data.subtitle}</p><h2 id={`${kind}-title`}>{data.title}</h2><div><span className="status"><i />{data.status}</span><a className="story-skip" href={`${data.href}#technical-explanation`}>Skip to the technical explanation ↗</a></div></div><div className="story-layout"><div className="story-visual"><div className="scene-meta"><span>{data.meta}</span><span>STEP 0{active + 1} / 06</span></div>{kind === "route" ? <GraphScene stage={active} /> : kind === "influence" ? <InfluenceScene stage={active} /> : <ConflictScene distributions={futures.distributions[Math.min(12, active * 2)]} />}<div className="scene-result">{kind === "route" ? <><span>01 / {examplePredictions[0].route.join(" → ")}</span><strong>{active >= 4 ? `${(examplePredictions[0].probability * 100).toFixed(4)}%` : "Calculating route scores"}</strong></> : kind === "influence" ? <><span>Observation → baseline → exposure → review</span><strong>{active === 5 ? "Result withheld: insufficient evidence." : "Reliability-weighted observations"}</strong></> : <><span>Current state → transition probabilities → sampled states</span><strong>Distribution at t + {Math.min(12, active * 2)}</strong></>}</div><StageNavigation labels={data.steps.map(s => s[0])} current={active} onSelect={select} /></div><div className="story-steps">{data.steps.map(([title, text], i) => <article data-index={i} id={`${kind}-step-${i}`} key={title} className={`story-step ${active === i ? "active" : ""}`}><span className="step-number">0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}<Link className="text-link story-full-link" href={data.href}>Explore {data.subtitle.toLowerCase()} <span aria-hidden="true">↗</span></Link></div></div></div></section>;
}
