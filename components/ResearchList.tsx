import Link from "next/link";
import { research } from "@/lib/research";
export function ResearchList() { return <div className="research-list">{research.map((paper, i) => <Link href={`/research/${paper.slug}`} key={paper.slug} className="research-row"><span className="index-number">0{i + 1}</span><div><p className="eyebrow">{paper.category} / {paper.date}</p><h3>{paper.title}</h3><p>{paper.description}</p></div><div className="research-side"><span className="status"><i />{paper.status}</span><span aria-hidden="true">↗</span></div></Link>)}</div>; }
