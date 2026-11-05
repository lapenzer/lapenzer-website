import type { Metadata } from "next";
import { TechnologyIndex } from "@/components/TechnologyIndex";
import { Collaboration } from "@/components/Collaboration";
export const metadata: Metadata = { title: "Technology", description: "Explore LAPENZER route prediction, network models, simulation research and the proposed Agent Fabric architecture." };
export default function Technology() { return <><section className="page-hero shell"><p className="eyebrow">Technology / 01—04</p><h1 className="display-small">Network models,<br /><span className="muted">simulation and agent systems.</span></h1><p className="lede">Each page describes the model inputs, equations, output, and evidence. The examples demonstrate how changing an input changes the calculation.</p></section><section className="shell technology-index-page"><TechnologyIndex /></section><Collaboration /></>; }
