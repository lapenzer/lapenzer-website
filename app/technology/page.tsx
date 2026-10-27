import type { Metadata } from "next";
import { TechnologyIndex } from "@/components/TechnologyIndex";
import { Collaboration } from "@/components/Collaboration";
export const metadata: Metadata = { title: "Technology", description: "Explore the inputs, mathematics, software, and evidence behind LAPENZER route prediction, network influence research, and conflict simulation." };
export default function Technology() { return <><section className="page-hero shell"><p className="eyebrow">Technology / 01—03</p><h1 className="display-small">Route prediction,<br /><span className="muted">network models, and simulation.</span></h1><p className="lede">Each page describes the model inputs, equations, output, and evidence. The examples demonstrate how changing an input changes the calculation.</p></section><section className="shell technology-index-page"><TechnologyIndex /></section><Collaboration /></>; }
