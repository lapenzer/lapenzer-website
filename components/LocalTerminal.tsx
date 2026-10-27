"use client";
import { useEffect, useRef, useState } from "react";
import { useMedia } from "@/lib/use-media";
import { terminalOutput } from "@/lib/route";
export function LocalTerminal() {
  const root = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false), [length, setLength] = useState(0), [complete, setComplete] = useState(false);
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setStarted(true); observer.disconnect(); } }, { threshold: .2 });
    observer.observe(root.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!started || reduced || complete) return;
    let count = 0;
    const interval = window.setInterval(() => { count = Math.min(terminalOutput.length, count + 9); setLength(count); if (count === terminalOutput.length) window.clearInterval(interval); }, 18);
    return () => window.clearInterval(interval);
  }, [started, reduced, complete]);
  return <div className="terminal" ref={root}><div className="terminal-bar"><span><i aria-hidden="true" />LOCAL EVALUATION / UZUSKE 1.0.0</span><button type="button" onClick={() => setComplete(true)}>Show full output ↗</button></div><pre className="terminal-body" aria-hidden="true">{reduced || complete ? terminalOutput : terminalOutput.slice(0, length)}<span className="terminal-cursor">▌</span></pre><pre className="sr-only">{terminalOutput}</pre><noscript><pre className="terminal-body">{terminalOutput}</pre></noscript></div>;
}
