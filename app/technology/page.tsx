import type { Metadata } from "next";
import { TechnologyIndex } from "@/components/TechnologyIndex";
import { Collaboration } from "@/components/Collaboration";
export const metadata: Metadata = { title: "Technology", description: "Explore the inputs, mathematics, software, and evidence behind LAPENZER route prediction, network influence research, and conflict simulation." };
export default function Technology() { return <><section className="page-hero shell"><p className="eyebrow">Technology / 01—03</p><h1 className="display-small">Three questions.<br /><span className="muted">One inspectable approach.</span></h1><p className="lede">Follow the inputs, calculation, output, and evidence for each research area. Begin with a plain-language explanation, then open the mathematics and try a bounded example.</p></section><section className="shell technology-index-page"><TechnologyIndex /></section><Collaboration /></>; }
