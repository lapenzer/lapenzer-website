import type {Metadata} from "next";
import Link from "next/link";
import {SocialNetworkLaboratory} from "@/components/SocialNetworkLaboratory";
export const metadata:Metadata={title:"Laboratory",description:"Explore the LAPENZER Social Network Laboratory and route prediction simulator."};
export default function Laboratory(){return <><section className="page-hero shell"><p className="eyebrow">Laboratory / research demonstrations</p><h1 className="display-small">Interactive models.<br/><span className="muted">A separate place to experiment.</span></h1><p className="lede">Explore the original synthetic Social Network Laboratory. The company homepage remains focused on software and solutions.</p><p><Link href="/technology/route-prediction/simulator" className="text-link">Open route prediction simulator ↗</Link></p></section><SocialNetworkLaboratory/></>}
