"use client";

import { useEffect, useRef, useState } from "react";

const stories = [
  {
    label: "Prediction",
    title: "See the next likely path.",
    text: "Route and network models compare possible paths, rank likely outcomes, and update as conditions change.",
  },
  {
    label: "Simulation",
    title: "Test thousands of possible outcomes.",
    text: "Simulation tools vary inputs, constraints, and probabilities so teams can see how a system behaves before acting on it.",
  },
  {
    label: "Data systems",
    title: "Turn raw data into usable software.",
    text: "Pipelines, interfaces, and analytical tools connect data to models and present the result in a form people can actually use.",
  },
] as const;

export function ScrollShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      const nextStage = Math.min(2, Math.floor(progress * 3));

      section.style.setProperty("--scroll-progress", progress.toFixed(4));
      section.style.setProperty("--scene-one", String(Math.max(0, 1 - progress * 3)));
      section.style.setProperty("--scene-two", String(Math.max(0, 1 - Math.abs(progress - 0.5) * 4)));
      section.style.setProperty("--scene-three", String(Math.max(0, (progress - 0.55) * 2.25)));
      setStage((current) => (current === nextStage ? current : nextStage));
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="scroll-showcase shell" data-stage={stage} aria-label="Lapenzer capabilities">
      <div className="scroll-story-copy">
        {stories.map((story, index) => (
          <article className={`scroll-story-step scroll-story-step-${index}`} key={story.label}>
            <p className="eyebrow">{story.label}</p>
            <h2>{story.title}</h2>
            <p>{story.text}</p>
          </article>
        ))}
      </div>

      <div className="scroll-visual-wrap" aria-hidden="true">
        <div className="scroll-device">
          <div className="scroll-device-topbar">
            <span>LAPENZER / SYSTEM VIEW</span>
            <span className="scroll-live-dot" />
          </div>

          <div className="scroll-scene scroll-scene-route">
            <div className="route-grid" />
            <svg viewBox="0 0 900 620" role="presentation">
              <path className="route-path route-path-muted" d="M95 500 C180 400 250 450 330 340 S510 180 610 255 S760 390 825 170" />
              <path className="route-path route-path-muted" d="M95 500 C200 520 300 470 380 510 S570 500 660 390 S760 260 825 170" />
              <path className="route-path route-path-active" d="M95 500 C170 390 270 415 340 315 S505 170 610 255 S745 320 825 170" />
              {[[95,500],[210,420],[340,315],[475,220],[610,255],[720,300],[825,170]].map(([cx, cy], index) => (
                <circle key={index} className={index === 6 ? "route-node route-node-active" : "route-node"} cx={cx} cy={cy} r={index === 6 ? 10 : 7} />
              ))}
            </svg>
            <div className="scene-caption"><span>Route ranking</span><strong>03 candidate paths</strong></div>
          </div>

          <div className="scroll-scene scroll-scene-sim">
            <div className="sim-orbit sim-orbit-1" />
            <div className="sim-orbit sim-orbit-2" />
            <div className="sim-orbit sim-orbit-3" />
            <div className="sim-core">10K<span>runs</span></div>
            <div className="sim-stat sim-stat-a"><span>P50</span><strong>0.68</strong></div>
            <div className="sim-stat sim-stat-b"><span>P90</span><strong>0.84</strong></div>
            <div className="sim-stat sim-stat-c"><span>Range</span><strong>± 0.12</strong></div>
            <div className="scene-caption"><span>Scenario simulation</span><strong>Live distribution</strong></div>
          </div>

          <div className="scroll-scene scroll-scene-data">
            <div className="data-stack">
              <div className="data-panel data-panel-a"><span>01 / INGEST</span><strong>Source data</strong><i /></div>
              <div className="data-panel data-panel-b"><span>02 / MODEL</span><strong>Processing</strong><i /></div>
              <div className="data-panel data-panel-c"><span>03 / OUTPUT</span><strong>Decision view</strong><i /></div>
            </div>
            <div className="data-pulse" />
            <div className="scene-caption"><span>Data system</span><strong>Input → model → output</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}
