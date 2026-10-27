"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MotionIn } from "@/components/MotionIn";
import { useMedia } from "@/lib/use-media";
import { examplePredictions, nodePositions } from "@/lib/route";
export function Hero() {
  const root = useRef<HTMLElement>(null), reduced = useMedia("(prefers-reduced-motion: reduce)");
  const { scrollYProgress } = useScroll({ target: root, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const route = examplePredictions[0].route;
  return <section className="hero" ref={root}><motion.div className="hero-image" style={reduced ? undefined : { y }}><Image src="https://images.unsplash.com/photo-1757997623209-5b322a3854f0?auto=format&fit=crop&fm=jpg&q=85&w=2600" alt="Aerial view of a city road network" fill priority unoptimized sizes="100vw" /></motion.div><div className="hero-shade" /><div className="shell hero-grid"><div className="hero-caption"><span>INDEPENDENT RESEARCH & SOFTWARE</span><span>ONTARIO, CANADA <i aria-hidden="true" /></span></div><div className="hero-main"><MotionIn><p className="eyebrow">Graph algorithms / Probability / Simulation</p><h1>Route prediction<br />and network<br /><span>simulation.</span></h1></MotionIn><div className="hero-annotation"><svg viewBox="0 0 730 455" role="img" aria-label="Highest-ranked example route A to C to F to J to N">{route.slice(1).map((n, i) => <line key={n} x1={nodePositions[route[i]][0]} y1={nodePositions[route[i]][1]} x2={nodePositions[n][0]} y2={nodePositions[n][1]} stroke="#b4c4ff" strokeWidth="2" strokeDasharray="4 7" />)}{route.map(n => <g key={n}><circle cx={nodePositions[n][0]} cy={nodePositions[n][1]} r="10" fill="#b4c4ff" fillOpacity=".35" stroke="#b4c4ff" /><text x={nodePositions[n][0] + 17} y={nodePositions[n][1] + 5} fill="#fff" fontSize="15" fontFamily="monospace">{n}</text></g>)}</svg><span>01 / HIGHEST-RANKED EXAMPLE ROUTE</span></div></div><div className="hero-bottom"><p>LAPENZER develops route prediction software and mathematical models of network influence and geographic state transitions.</p><div className="btn-row"><Link className="btn btn-light" href="#technology">Explore the technology <span aria-hidden="true">↓</span></Link><Link className="btn btn-ghost" href="/contact">Discuss a project <span aria-hidden="true">↗</span></Link></div></div><div className="hero-brand" aria-hidden="true">LAPENZER<span className="brand-period">.</span></div><div className="hero-base"><span>PYTHON SOFTWARE & MATHEMATICAL RESEARCH</span><a href="#technology">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div></div></section>;
}
